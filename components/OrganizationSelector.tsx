import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Building2, ChevronRight, Plus, CreditCard as Edit2, Check, X as XIcon, LogOut } from 'lucide-react-native';
import { Organization } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { 
  subscribeToPendingInvites, 
  acceptOrganizationInvite, 
  declineOrganizationInvite,
  quitOrganization,
  syncUserOrganizations 
} from '@/lib/firebase/firestore';

interface OrganizationSelectorProps {
  visible: boolean;
  onClose: () => void;
  organizations: Organization[];
  selectedOrg: Organization | null;
  onSelectOrg: (org: Organization) => void;
  onCreateOrg: () => void;
  onEditOrg: (org: Organization) => void;
}

interface PendingInvite {
  organizationId: string;
  organizationName: string;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}

export function OrganizationSelector({
  visible,
  onClose,
  organizations,
  selectedOrg,
  onSelectOrg,
  onCreateOrg,
  onEditOrg,
}: OrganizationSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orgToLeave, setOrgToLeave] = useState<Organization | null>(null);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const unsubscribe = subscribeToPendingInvites(userId, (invites) => {
      setPendingInvites(invites.filter(invite => invite.status === 'pending'));
    });

    return () => unsubscribe();
  }, []);

  const handleAcceptInvite = async (organizationId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      await acceptOrganizationInvite(organizationId, userId);
    } catch (err: any) {
      setError(err.message || 'Failed to accept invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineInvite = async (organizationId: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setLoading(true);
    setError(null);

    try {
      await declineOrganizationInvite(organizationId, userId);
    } catch (err: any) {
      setError(err.message || 'Failed to decline invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveOrganization = async (org: Organization) => {
    console.log('🚀 Starting leave organization process:', { orgId: org.id, orgName: org.name });
    
    // Check if this is the only organization the user owns
    const userId = auth.currentUser?.uid;
    if (org.ownerId === userId) {
      const ownedOrgs = organizations.filter(o => o.ownerId === userId);
      if (ownedOrgs.length <= 1) {
        setError("You cannot disband your only organization. Create another organization first.");
        return;
      }
    }
    
    setOrgToLeave(org);
  };

  const confirmLeaveOrganization = async () => {
    if (!orgToLeave) return;
    
    const userId = auth.currentUser?.uid;
    console.log('✅ User confirmed leaving organization:', orgToLeave.name);
    
    if (!userId) {
      console.error('❌ No user ID found');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      console.log('📤 Calling quitOrganization...');
      await quitOrganization(orgToLeave.id, userId);
      console.log('✅ Successfully quit organization');
      
      console.log('Current organizations:', organizations);
      console.log('Selected organization:', selectedOrg);
      
      if (selectedOrg?.id === orgToLeave.id) {
        console.log('⚠️ User is leaving currently selected organization');
        const remainingOrgs = organizations.filter(o => o.id !== orgToLeave.id);
        console.log('Remaining organizations:', remainingOrgs);
        
        if (remainingOrgs.length > 0) {
          console.log('🔄 Selecting new organization:', remainingOrgs[0]);
          onSelectOrg(remainingOrgs[0]);
        } else {
          console.log('⚠️ No remaining organizations');
        }
      }

      console.log('🔄 Syncing user organizations...');
      await syncUserOrganizations(userId);
      console.log('✅ User organizations synced');
      
      if (organizations.length <= 1) {
        console.log('⚠️ No organizations left, closing modal');
        onClose();
      }
    } catch (err: any) {
      console.error('❌ Error leaving organization:', err);
      setError(err.message || 'Failed to leave organization');
    } finally {
      setLoading(false);
      setOrgToLeave(null);
      console.log('🏁 Finished leave organization process');
    }
  };

  const cancelLeaveOrganization = () => {
    console.log('❌ User cancelled leaving organization');
    setOrgToLeave(null);
  };

  const filteredOrgs = organizations.filter(org =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
      >
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Organizations</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Pending Invitations</Text>
              {pendingInvites.length > 0 ? (
                <ScrollView style={styles.inviteList}>
                  {pendingInvites.map(invite => (
                    <View key={invite.organizationId} style={styles.inviteItem}>
                      <View style={styles.inviteInfo}>
                        <Building2 size={20} color="#666" />
                        <View style={styles.inviteDetails}>
                          <Text style={styles.orgName}>{invite.organizationName}</Text>
                          <Text style={styles.inviteText}>
                            Invited {new Date(invite.invitedAt).toLocaleDateString()}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.inviteActions}>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.acceptButton]}
                          onPress={() => handleAcceptInvite(invite.organizationId)}
                          disabled={loading}
                        >
                          <Check size={16} color="white" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.actionButton, styles.declineButton]}
                          onPress={() => handleDeclineInvite(invite.organizationId)}
                          disabled={loading}
                        >
                          <XIcon size={16} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateText}>No pending invitations</Text>
                </View>
              )}
            </View>

            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Your Organizations</Text>
              <ScrollView style={styles.orgList}>
                {filteredOrgs.map(org => (
                  <View key={org.id} style={styles.orgItemContainer}>
                    <TouchableOpacity
                      style={[
                        styles.orgItem,
                        selectedOrg?.id === org.id && styles.selectedOrgItem
                      ]}
                      onPress={() => {
                        onSelectOrg(org);
                        onClose();
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
                    <TouchableOpacity
                      style={styles.leaveButton}
                      onPress={() => handleLeaveOrganization(org)}
                    >
                      <LogOut size={16} color="white" />
                    </TouchableOpacity>
                  </View>
                ))}

                {filteredOrgs.length === 0 && (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyStateText}>No organizations found</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Leave Organization Confirmation Modal */}
      <Modal
        visible={!!orgToLeave}
        transparent
        animationType="fade"
        onRequestClose={cancelLeaveOrganization}
      >
        <TouchableOpacity 
          style={styles.confirmationOverlay}
          activeOpacity={1}
          onPress={cancelLeaveOrganization}
        >
          <TouchableOpacity 
            activeOpacity={1} 
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.confirmationContent}>
              <Text style={styles.confirmationTitle}>
                {orgToLeave?.ownerId === auth.currentUser?.uid ? 'Disband Organization' : 'Leave Organization'}
              </Text>
              <Text style={styles.confirmationText}>
                {orgToLeave?.ownerId === auth.currentUser?.uid 
                  ? `Are you sure you want to disband ${orgToLeave?.name}? This will delete the organization and all its data.`
                  : `Are you sure you want to leave ${orgToLeave?.name}?`
                }
              </Text>
              
              {error && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.confirmationButtons}>
                <TouchableOpacity
                  style={[styles.confirmationButton, styles.cancelButton]}
                  onPress={cancelLeaveOrganization}
                  disabled={loading}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.confirmationButton, 
                    orgToLeave?.ownerId === auth.currentUser?.uid 
                      ? styles.disbandButton 
                      : styles.leaveButton
                  ]}
                  onPress={confirmLeaveOrganization}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <View style={styles.buttonContent}>
                      <LogOut size={16} color="white" style={styles.buttonIcon} />
                      <Text style={styles.leaveButtonText}>
                        {orgToLeave?.ownerId === auth.currentUser?.uid ? 'Disband' : 'Leave'}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
  },
  inviteList: {
    maxHeight: 200,
  },
  inviteItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  inviteInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  inviteDetails: {
    flex: 1,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 2,
  },
  inviteText: {
    fontSize: 12,
    color: '#666',
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
  },
  acceptButton: {
    backgroundColor: '#34C759',
  },
  declineButton: {
    backgroundColor: '#FF3B30',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 20,
    marginVertical: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  orgList: {
    maxHeight: 300,
  },
  orgItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  orgItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  selectedOrgItem: {
    backgroundColor: '#007AFF',
  },
  orgItemText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
  },
  selectedOrgItemText: {
    color: 'white',
  },
  leaveButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    width: 32,
    height: 32,
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#666',
    fontSize: 14,
    fontStyle: 'italic',
  },
  confirmationOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  confirmationText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    textAlign: 'center',
  },
  confirmationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  disbandButton: {
    backgroundColor: '#FF3B30',
  },
  leaveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
});