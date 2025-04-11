import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Platform, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { format } from 'date-fns';
import { 
  subscribeToAssets, 
  subscribeToBookings, 
  subscribeToAnalytics, 
  subscribeToActivityLogs, 
  subscribeToUserProfile,
  subscribeToOrganizations,
  subscribeToOrganizationUsers,
  type Organization,
  type UserProfile,
  type Asset,
  type Booking,
  type Analytics,
  type ActivityLog,
} from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { UserAccessModal } from '@/components/UserAccess';
import { OrganizationModal } from '@/components/OrganizationModal';
import { OrganizationSelector } from '@/components/OrganizationSelector';
import { Building2, Plus, ChevronDown, ChevronRight, CreditCard as Edit2, Users } from 'lucide-react-native';
import { router } from 'expo-router';

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [showOrgModal, setShowOrgModal] = useState(false);
  const [showOrgSelector, setShowOrgSelector] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [orgUsers, setOrgUsers] = useState<Array<{id: string; email: string; isOwner?: boolean}>>([]);

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('Dashboard - No authenticated user');
      return;
    }

    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeOrgs: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        console.log('Dashboard - Setting up initial subscriptions');
        
        unsubscribeProfile = subscribeToUserProfile(auth.currentUser!.uid, (profile) => {
          console.log('Dashboard - User Profile Update:', {
            isOwner: profile?.isOwner,
            email: profile?.email
          });
          setUserProfile(profile);
        });

        unsubscribeOrgs = subscribeToOrganizations(auth.currentUser!.uid, (orgs) => {
          console.log('Dashboard - Organizations Update:', {
            count: orgs.length,
            orgIds: orgs.map(org => org.id)
          });
          setOrganizations(orgs);
          
          // Always select the first organization if there are any
          if (orgs.length > 0) {
            // If the current selected org is not in the list, select the first one
            if (!selectedOrg || !orgs.some(org => org.id === selectedOrg.id)) {
              console.log('Dashboard - Auto-selecting first organization:', orgs[0].id);
              setSelectedOrg(orgs[0]);
            } else {
              console.log('Dashboard - Keeping current organization:', selectedOrg.id);
            }
          } else {
            console.log('Dashboard - No organizations available');
            setSelectedOrg(null);
          }
        });

        setLoading(false);
        setRefreshing(false);
      } catch (error) {
        console.error('Dashboard - Error setting up subscriptions:', error);
        setLoading(false);
        setRefreshing(false);
      }
    };

    setupSubscriptions();

    return () => {
      unsubscribeProfile?.();
      unsubscribeOrgs?.();
    };
  }, []);

  useEffect(() => {
    if (!selectedOrg?.id) {
      // If selectedOrg is null but there are organizations available, select the first one
      if (organizations.length > 0) {
        console.log('Dashboard - No organization selected, auto-selecting first one:', organizations[0].id);
        setSelectedOrg(organizations[0]);
        return;
      }
      return;
    }

    let unsubscribeUsers: (() => void) | undefined;
    let unsubscribeAssets: (() => void) | undefined;
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeAnalytics: (() => void) | undefined;
    let unsubscribeActivityLogs: (() => void) | undefined;

    const setupOrgSubscriptions = async () => {
      try {
        unsubscribeUsers = subscribeToOrganizationUsers(selectedOrg.id, (users) => {
          console.log('Dashboard - Organization Users Update:', users);
          setOrgUsers(users);
        });

        unsubscribeAssets = subscribeToAssets(selectedOrg.id, (updatedAssets) => {
          console.log('Dashboard - Assets Update:', {
            count: updatedAssets.length
          });
          setAssets(updatedAssets);
        });

        unsubscribeBookings = subscribeToBookings(selectedOrg.id, (updatedBookings) => {
          console.log('Dashboard - Bookings Update:', {
            count: updatedBookings.length
          });
          setBookings(updatedBookings);
        });

        unsubscribeAnalytics = subscribeToAnalytics(selectedOrg.id, (updatedAnalytics) => {
          console.log('Dashboard - Analytics Update:', {
            hasData: !!updatedAnalytics,
            totalEarned: updatedAnalytics?.totalEarned,
            unpaidAmount: updatedAnalytics?.unpaidAmount,
            agentPayments: updatedAnalytics?.agentPayments
          });
          setAnalytics(updatedAnalytics);
        });

        unsubscribeActivityLogs = subscribeToActivityLogs(selectedOrg.id, (updatedLogs) => {
          console.log('Dashboard - Activity Logs Update:', {
            count: updatedLogs.length
          });
          setActivityLogs(updatedLogs);
        });
      } catch (error) {
        console.error('Dashboard - Error setting up org subscriptions:', error);
      }
    };

    setupOrgSubscriptions();

    return () => {
      unsubscribeUsers?.();
      unsubscribeAssets?.();
      unsubscribeBookings?.();
      unsubscribeAnalytics?.();
      unsubscribeActivityLogs?.();
    };
  }, [selectedOrg?.id]);

  // Add a debug effect to log selectedOrg changes
  useEffect(() => {
    console.log('Dashboard - SelectedOrg changed:', selectedOrg ? {
      id: selectedOrg.id,
      name: selectedOrg.name
    } : 'null');
  }, [selectedOrg]);

  const activeAssets = assets.filter(asset => asset.status === 'Available');
  const todayBookings = bookings.filter(booking => {
    let bookingDate: Date;
    if (booking.date instanceof Date) {
      bookingDate = booking.date;
    } else if (typeof booking.date === 'object' && booking.date !== null && 'seconds' in booking.date) {
      bookingDate = new Date((booking.date as any).seconds * 1000);
    } else {
      bookingDate = new Date();
    }
    return format(bookingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  });

  // Add a debug function
  const debugRender = () => {
    console.log('Dashboard - Rendering organization buttons, selectedOrg:', selectedOrg ? {
      id: selectedOrg.id,
      name: selectedOrg.name
    } : 'null');
  };

  // Call the debug function before rendering
  debugRender();

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[
        styles.container, 
        Platform.OS !== 'web' ? { paddingTop: insets.top } : { paddingTop: 20 }
      ]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => setRefreshing(true)}
        />
      }
    >
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>@{userProfile?.username || ''} {userProfile?.username ? `(${auth.currentUser?.email})` : auth.currentUser?.email}</Text>
          <View style={styles.organizationButtons}>
            {selectedOrg ? (
              <>
                <TouchableOpacity 
                  style={styles.organizationButton} 
                  onPress={() => setShowOrgSelector(true)}
                >
                  <Building2 size={16} color="#007AFF" />
                  <Text style={styles.organizationText}>{selectedOrg.name}</Text>
                  <ChevronDown size={16} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.editOrgButton}
                  onPress={() => {
                    setEditingOrg(selectedOrg);
                    setShowOrgModal(true);
                  }}
                >
                  <Edit2 size={16} color="#007AFF" />
                  <Text style={styles.editOrgText}>Edit Organization</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.noOrgText}>No organization selected</Text>
            )}
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.createOrgButton}
            onPress={() => {
              setEditingOrg(null);
              setShowOrgModal(true);
            }}
          >
            <Plus size={20} color="#007AFF" />
            <Text style={styles.createOrgText}>New Organization</Text>
          </TouchableOpacity>
          {userProfile?.isOwner && (
            <TouchableOpacity 
              style={styles.accessButton}
              onPress={() => setShowAccessModal(true)}
            >
              <Users size={20} color="#007AFF" />
              <Text style={styles.accessButtonText}>Manage Access</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{activeAssets.length}</Text>
          <Text style={styles.statLabel}>Active Assets</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{todayBookings.length}</Text>
          <Text style={styles.statLabel}>Today's Bookings</Text>
        </View>
      </View>

      {userProfile?.isOwner && (
        <TouchableOpacity 
          style={styles.section}
          onPress={() => router.push('/analytics')}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Analytics Overview</Text>
            <ChevronRight size={20} color="#666" />
          </View>
          <View style={styles.analyticsContainer}>
            <View style={styles.analyticsCard}>
              <Text style={styles.analyticsValue}>
                {analytics?.currency || 'USD'} {analytics?.totalEarned?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.analyticsLabel}>Total Earned</Text>
            </View>
            <View style={styles.analyticsCard}>
              <Text style={[styles.analyticsValue, { color: '#FF3B30' }]}>
                {analytics?.currency || 'USD'} {analytics?.unpaidAmount?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.analyticsLabel}>Unpaid Amount</Text>
            </View>
            <View style={[styles.analyticsCard, styles.lastAnalyticsCard]}>
              <Text style={[styles.analyticsValue, { color: '#34C759' }]}>
                {analytics?.currency || 'USD'} {analytics?.agentPayments?.toLocaleString() || '0'}
              </Text>
              <Text style={styles.analyticsLabel}>Paid to Agents</Text>
            </View>
          </View>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <View style={styles.activityList}>
          {activityLogs.slice(0, 5).map((log) => (
            <View key={log.id} style={styles.activityItem}>
              <Text style={styles.activityText}>
                {log.userEmail} {log.action} {log.resourceType}: {log.details}
              </Text>
              <Text style={styles.activityTime}>
                {format(log.timestamp.toDate(), 'MMM d, h:mm a')}
              </Text>
            </View>
          ))}
          {activityLogs.length === 0 && (
            <Text style={styles.noActivityText}>No recent activity</Text>
          )}
        </View>
      </View>

      <UserAccessModal
        visible={showAccessModal}
        onClose={() => setShowAccessModal(false)}
        organizationId={selectedOrg?.id || ''}
        currentUserId={auth.currentUser?.uid || ''}
        users={orgUsers.map(user => ({...user, isOwner: user.isOwner || false}))}
      />
      
      <OrganizationModal
        visible={showOrgModal}
        onClose={() => {
          setShowOrgModal(false);
          setEditingOrg(null);
        }}
        organization={editingOrg}
      />

      <OrganizationSelector
        visible={showOrgSelector}
        onClose={() => setShowOrgSelector(false)}
        organizations={organizations}
        selectedOrg={selectedOrg}
        onSelectOrg={(org) => {
          setSelectedOrg(org);
          setShowOrgSelector(false);
        }}
        onCreateOrg={() => {
          setEditingOrg(null);
          setShowOrgModal(true);
          setShowOrgSelector(false);
        }}
        onEditOrg={(org) => {
          setEditingOrg(org);
          setShowOrgModal(true);
          setShowOrgSelector(false);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
  },
  headerLeft: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  organizationButtons: {
    flexDirection: 'column',
    gap: 8,
    marginTop: 8,
    width: '100%',
  },
  organizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  organizationText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  editOrgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    alignSelf: 'flex-start',
  },
  editOrgText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  headerButtons: {
    gap: 8,
    alignItems: 'flex-end',
  },
  createOrgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    minWidth: 160,
  },
  createOrgText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  accessButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
    minWidth: 160,
  },
  accessButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  analyticsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  analyticsCard: {
    flex: 1,
    marginRight: 12,
  },
  lastAnalyticsCard: {
    marginRight: 0,
  },
  analyticsValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  analyticsLabel: {
    fontSize: 12,
    color: '#666',
  },
  activityList: {
    backgroundColor: 'white',
  },
  activityItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activityText: {
    fontSize: 14,
    color: '#1a1a1a',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  noActivityText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  orgList: {
    padding: 20,
  },
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  selectedOrgItem: {
    backgroundColor: '#007AFF',
  },
  orgItemText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  selectedOrgItemText: {
    color: 'white',
  },
  noOrgText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 20,
  },
});