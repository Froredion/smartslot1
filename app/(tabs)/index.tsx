import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl, TouchableOpacity, Modal, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { subscribeToAssets, subscribeToBookings, subscribeToAnalytics, subscribeToActivityLogs, subscribeToUserProfile, subscribeToOrganizations } from '../../lib/firebase/firestore';
import type { Asset, Booking, Analytics, ActivityLog, UserProfile, Organization } from '../../lib/firebase/firestore';
import { auth } from '../../lib/firebase/config';
import { UserAccessModal } from '../../components/UserAccessModal';
import { OrganizationModal } from '../../components/OrganizationModal';
import { Users, Building2, Plus, ChevronDown, ChevronRight } from 'lucide-react-native';
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

  useEffect(() => {
    if (!auth.currentUser) {
      console.log('Dashboard - No authenticated user');
      return;
    }

    let unsubscribeAssets: (() => void) | undefined;
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeAnalytics: (() => void) | undefined;
    let unsubscribeActivityLogs: (() => void) | undefined;
    let unsubscribeProfile: (() => void) | undefined;
    let unsubscribeOrganizations: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        console.log('Dashboard - Setting up initial subscriptions');
        
        // Subscribe to user profile
        unsubscribeProfile = subscribeToUserProfile(auth.currentUser.uid, (profile) => {
          console.log('Dashboard - User Profile Update:', {
            isOwner: profile?.isOwner,
            email: profile?.email
          });
          setUserProfile(profile);
        });

        // Subscribe to organizations
        unsubscribeOrganizations = subscribeToOrganizations(auth.currentUser.uid, (orgs) => {
          console.log('Dashboard - Organizations Update:', {
            count: orgs.length,
            orgIds: orgs.map(org => org.id)
          });
          setOrganizations(orgs);
          
          // If no organization is selected, select the first one
          if (!selectedOrg && orgs.length > 0) {
            console.log('Dashboard - Auto-selecting first organization:', orgs[0].id);
            setSelectedOrg(orgs[0]);
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
      console.log('Dashboard - Cleaning up subscriptions');
      unsubscribeAssets?.();
      unsubscribeBookings?.();
      unsubscribeAnalytics?.();
      unsubscribeActivityLogs?.();
      unsubscribeProfile?.();
      unsubscribeOrganizations?.();
    };
  }, []);

  // Subscribe to organization-specific data when selected org changes
  useEffect(() => {
    if (!selectedOrg) {
      console.log('Dashboard - No organization selected');
      return;
    }

    console.log('Dashboard - Setting up org-specific subscriptions for:', selectedOrg.id);

    let unsubscribeAssets: (() => void) | undefined;
    let unsubscribeBookings: (() => void) | undefined;
    let unsubscribeAnalytics: (() => void) | undefined;
    let unsubscribeActivityLogs: (() => void) | undefined;

    const setupOrgSubscriptions = async () => {
      try {
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
      console.log('Dashboard - Cleaning up org-specific subscriptions');
      unsubscribeAssets?.();
      unsubscribeBookings?.();
      unsubscribeAnalytics?.();
      unsubscribeActivityLogs?.();
    };
  }, [selectedOrg]);

  const activeAssets = assets.filter(asset => asset.status === 'Available');
  const todayBookings = bookings.filter(booking => {
    const bookingDate = booking.date instanceof Date ? booking.date : booking.date.toDate();
    return format(bookingDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  });

  // Debug log before analytics render
  console.log('Dashboard - Pre-render Analytics Check:', {
    hasAnalytics: !!analytics,
    analyticsData: analytics,
    isUserProfileLoaded: !!userProfile,
    isUserOwner: userProfile?.isOwner,
    shouldShowAnalytics: userProfile?.isOwner,
    selectedOrgId: selectedOrg?.id
  });

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
        <View>
          <Text style={styles.title}>Welcome Back!</Text>
          <Text style={styles.subtitle}>{auth.currentUser?.email}</Text>
          {selectedOrg && (
            <TouchableOpacity 
              style={styles.organizationButton} 
              onPress={() => setShowOrgSelector(true)}
            >
              <Building2 size={16} color="#007AFF" />
              <Text style={styles.organizationText}>{selectedOrg.name}</Text>
              <ChevronDown size={16} color="#007AFF" />
            </TouchableOpacity>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.createOrgButton}
            onPress={() => setShowOrgModal(true)}
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
      />
      
      <OrganizationModal
        visible={showOrgModal}
        onClose={() => setShowOrgModal(false)}
        organization={selectedOrg}
      />

      <Modal
        visible={showOrgSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowOrgSelector(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOrgSelector(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Organization</Text>
              <TouchableOpacity onPress={() => setShowOrgSelector(false)}>
                <ChevronDown size={24} color="#666" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.orgList}>
              {organizations.map(org => (
                <TouchableOpacity
                  key={org.id}
                  style={[
                    styles.orgItem,
                    selectedOrg?.id === org.id && styles.selectedOrgItem
                  ]}
                  onPress={() => {
                    setSelectedOrg(org);
                    setShowOrgSelector(false);
                  }}
                >
                  <Building2 
                    size={20} 
                    color={selectedOrg?.id === org.id ? 'white' : '#666'} 
                  />
                  <Text style={[
                    styles.orgItemText,
                    selectedOrg?.id === org.id && styles.selectedOrgItemText
                  ]}>
                    {org.name}
                  </Text>
                  {selectedOrg?.id === org.id && (
                    <ChevronRight size={20} color="white" />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  headerButtons: {
    gap: 8,
    alignItems: 'flex-end',
  },
  organizationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    alignSelf: 'flex-start',
    marginTop: 8,
    gap: 6,
  },
  organizationText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  createOrgButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E5F1FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
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
    borderRadius: 20,
    gap: 6,
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
});