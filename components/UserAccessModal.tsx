import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Switch,
} from 'react-native';
import { StyledIcon } from './StyledIcon';
import { 
  updateUserPermissions,
  subscribeToUserPermissions,
  type UserPermissions,
  inviteUserToOrganization,
  quitOrganization
} from '../lib/firebase/firestore';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface User {
  id: string;
  email: string;
  isOwner?: boolean;
}

interface UserAccessModalProps {
  isVisible: boolean;
  onClose: () => void;
  organizationId: string;
  currentUserId: string;
  users: User[];
  onUserAdded?: () => void;
  onUserRemoved?: () => void;
}

export const UserAccessModal: React.FC<UserAccessModalProps> = ({ 
  isVisible, 
  onClose, 
  organizationId,
  currentUserId,
  users = [],
  onUserAdded,
  onUserRemoved 
}) => {
  const [inviteInput, setInviteInput] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (selectedUser && organizationId) {
      unsubscribe = subscribeToUserPermissions(
        organizationId,
        selectedUser,
        (permissions: UserPermissions) => {
          setUserPermissions(permissions);
        }
      );
    }

    return () => {
      unsubscribe?.();
    };
  }, [selectedUser, organizationId]);

  useEffect(() => {
    if (!isVisible) {
      setInviteInput('');
      setSelectedUser(null);
      setShowDeleteConfirmation(false);
      setError(null);
      setSuccessMessage('');
    }
  }, [isVisible]);

  const handleInviteUser = async () => {
    if (!inviteInput.trim()) {
      setError('Please enter a username or email address');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const result = await inviteUserToOrganization(
        organizationId,
        inviteInput.trim(),
        currentUserId
      );

      if (result.status === 'added') {
        setSuccessMessage('User has been added to the organization');
        if (onUserAdded) onUserAdded();
      } else if (result.status === 'invited') {
        setSuccessMessage('Invitation email has been sent');
      }

      setInviteInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleQuitOrganization = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      await quitOrganization(organizationId, selectedUser);
      setSelectedUser(null);
      setShowDeleteConfirmation(false);
      if (onUserRemoved) onUserRemoved();
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser || !userPermissions) return;

    setLoading(true);
    setError(null);

    try {
      await updateUserPermissions(organizationId, selectedUser, userPermissions);
      setSuccessMessage('Permissions updated successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find(user => user.id === selectedUser);

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Access</Text>
            <TouchableOpacity onPress={onClose}>
              <View style={styles.iconWrapper}>
                <StyledIcon name="X" size={24} color="#666" />
              </View>
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <View style={styles.errorIconWrapper}>
                <StyledIcon name="AlertCircle" size={20} color="#FF3B30" />
              </View>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {successMessage && (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          )}

          <ScrollView style={styles.form}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add New User</Text>
              
              <View style={styles.inputContainer}>
                <View style={styles.inputWrapper}>
                  <View style={styles.inputIconWrapper}>
                    <StyledIcon name="Mail" size={20} color="#666" />
                  </View>
                  <TextInput
                    style={styles.input}
                    value={inviteInput}
                    onChangeText={setInviteInput}
                    placeholder="Enter username or email"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <TouchableOpacity
                  style={[styles.addButton, loading && styles.disabledButton]}
                  onPress={handleInviteUser}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <View style={styles.buttonIconWrapper}>
                        <StyledIcon name="UserPlus" size={20} color="white" />
                      </View>
                      <Text style={styles.addButtonText}>Add User</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Users</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {users.map(user => (
                  <TouchableOpacity
                    key={user.id}
                    style={[
                      styles.userCard,
                      selectedUser === user.id && styles.selectedUserCard
                    ]}
                    onPress={() => setSelectedUser(user.id)}
                  >
                    <View style={[
                      styles.userIconWrapper,
                      selectedUser === user.id && styles.selectedUserIconWrapper
                    ]}>
                      <StyledIcon 
                        name="Users" 
                        size={24} 
                        color={selectedUser === user.id ? 'white' : '#666'} 
                      />
                    </View>
                    <Text style={[
                      styles.userEmail,
                      selectedUser === user.id && styles.selectedUserEmail
                    ]}>
                      {user.email}
                    </Text>
                    {user.isOwner && (
                      <View style={styles.ownerBadge}>
                        <Text style={styles.ownerBadgeText}>Owner</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {selectedUser && userPermissions && selectedUserData && !selectedUserData.isOwner && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Permissions</Text>
                
                <View style={styles.permissionSection}>
                  <Text style={styles.permissionSectionTitle}>Analytics Permissions</Text>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>View Earnings</Text>
                    <Switch
                      value={userPermissions.analytics.viewEarnings}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          analytics: { ...userPermissions.analytics, viewEarnings: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>View Unpaid Amount</Text>
                    <Switch
                      value={userPermissions.analytics.viewUnpaidAmount}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          analytics: { ...userPermissions.analytics, viewUnpaidAmount: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>View Agent Payments</Text>
                    <Switch
                      value={userPermissions.analytics.viewAgentPayments}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          analytics: { ...userPermissions.analytics, viewAgentPayments: value },
                        })
                      }
                    />
                  </View>
                </View>

                <View style={styles.permissionSection}>
                  <Text style={styles.permissionSectionTitle}>Booking Permissions</Text>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Create Bookings</Text>
                    <Switch
                      value={userPermissions.bookings.create}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          bookings: { ...userPermissions.bookings, create: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Create for Others</Text>
                    <Switch
                      value={userPermissions.bookings.createForOthers}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          bookings: { ...userPermissions.bookings, createForOthers: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Edit Own Bookings</Text>
                    <Switch
                      value={userPermissions.bookings.edit}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          bookings: { ...userPermissions.bookings, edit: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Edit Others' Bookings</Text>
                    <Switch
                      value={userPermissions.bookings.editOthers}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          bookings: { ...userPermissions.bookings, editOthers: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Delete Own Bookings</Text>
                    <Switch
                      value={userPermissions.bookings.delete}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          bookings: { ...userPermissions.bookings, delete: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Delete Others' Bookings</Text>
                    <Switch
                      value={userPermissions.bookings.deleteOthers}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          bookings: { ...userPermissions.bookings, deleteOthers: value },
                        })
                      }
                    />
                  </View>
                </View>

                <View style={styles.permissionSection}>
                  <Text style={styles.permissionSectionTitle}>User Management</Text>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Manage Users</Text>
                    <Switch
                      value={userPermissions.users.manage}
                      onValueChange={(value) =>
                        setUserPermissions({
                          ...userPermissions,
                          users: { ...userPermissions.users, manage: value },
                        })
                      }
                    />
                  </View>
                </View>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => setShowDeleteConfirmation(true)}
                  >
                    <StyledIcon name="Trash2" size={20} color="white" />
                    <Text style={styles.buttonText}>Remove User</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveButton, loading && styles.disabledButton]}
                    onPress={handleUpdatePermissions}
                    disabled={loading}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <Text style={styles.buttonText}>Save Permissions</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {selectedUser && selectedUserData?.isOwner && (
              <View style={styles.ownerMessage}>
                <Text style={styles.ownerMessageText}>
                  Organization owner has full access to all features and permissions cannot be modified.
                </Text>
              </View>
            )}

            {!selectedUser && (
              <View style={styles.noSelection}>
                <StyledIcon name="Users" size={48} color="#666" />
                <Text style={styles.noSelectionText}>
                  Select a user to manage their permissions
                </Text>
              </View>
            )}
          </ScrollView>
        </View>

        <DeleteConfirmationModal
          visible={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleQuitOrganization}
          title="Remove User"
          message={`Are you sure you want to remove ${selectedUserData?.email} from the organization? This action cannot be undone.`}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: 'white',
    borderRadius: 20,
    maxHeight: '90%',
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
  form: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#ef4444',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#dcfce7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#16a34a',
  },
  inputContainer: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIconWrapper: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    marginRight: 12,
    gap: 8,
  },
  selectedUserCard: {
    backgroundColor: '#007AFF',
  },
  userEmail: {
    fontSize: 14,
    color: '#333',
  },
  selectedUserEmail: {
    color: 'white',
  },
  ownerBadge: {
    backgroundColor: '#34C759',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  ownerBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  permissionSection: {
    marginBottom: 24,
  },
  permissionSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    marginBottom: 12,
  },
  permissionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  permissionLabel: {
    fontSize: 14,
    color: '#333',
    flex: 1,
    marginRight: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  removeButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  ownerMessage: {
    backgroundColor: '#E5F1FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
  },
  ownerMessageText: {
    color: '#007AFF',
    fontSize: 14,
    textAlign: 'center',
  },
  noSelection: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
  },
  noSelectionText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  iconWrapper: {
    padding: 8,
  },
  errorIconWrapper: {
    marginRight: 8,
  },
  buttonIconWrapper: {
    marginRight: 8,
  },
  userIconWrapper: {
    padding: 4,
  },
  selectedUserIconWrapper: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  noSelectionIconWrapper: {
    padding: 16,
  },
});