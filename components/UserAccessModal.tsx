import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Switch,
  Animated,
} from 'react-native';
import { Users, X, UserPlus, AlertCircle, Trash2, Check } from 'lucide-react-native';
import { inviteUserToOrganization, updateUserPermissions, quitOrganization } from '@/lib/firebase/firestore';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface User {
  id: string;
  email: string;
  username: string;
  isOwner: boolean;
}

interface UserPermissions {
  analytics: {
    viewEarnings: boolean;
    viewUnpaidAmount: boolean;
    viewAgentPayments: boolean;
  };
  bookings: {
    create: boolean;
    createForOthers: boolean;
    edit: boolean;
    editOthers: boolean;
    delete: boolean;
    deleteOthers: boolean;
  };
  users: {
    manage: boolean;
  };
}

interface UserAccessModalProps {
  visible: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  organizationId: string;
}

export function UserAccessModal({
  visible,
  onClose,
  users,
  currentUserId,
  organizationId,
}: UserAccessModalProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [successOpacity] = useState(new Animated.Value(0));
  const [successTimeout, setSuccessTimeout] = useState<NodeJS.Timeout | null>(null);
  const [permissions, setPermissions] = useState<UserPermissions>({
    analytics: {
      viewEarnings: false,
      viewUnpaidAmount: false,
      viewAgentPayments: false,
    },
    bookings: {
      create: true,
      createForOthers: false,
      edit: true,
      editOthers: false,
      delete: true,
      deleteOthers: false,
    },
    users: {
      manage: false,
    },
  });

  useEffect(() => {
    if (!visible) {
      setInviteEmail('');
      setSelectedUser(null);
      setError(null);
      setSuccessMessage('');
    }
  }, [visible]);

  useEffect(() => {
    return () => {
      if (successTimeout) {
        clearTimeout(successTimeout);
      }
    };
  }, []);

  const showSuccessMessage = (message: string) => {
    setSuccessMessage(message);
    
    successOpacity.setValue(1);

    if (successTimeout) {
      clearTimeout(successTimeout);
    }

    const timeout = setTimeout(() => {
      Animated.timing(successOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => setSuccessMessage(''));
    }, 3000);

    setSuccessTimeout(timeout);
  };

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage('');

    try {
      const result = await inviteUserToOrganization(
        organizationId,
        inviteEmail.trim(),
        currentUserId
      );

      if (result.status === 'added') {
        setSuccessMessage('User has been added to the organization');
      } else if (result.status === 'invited') {
        setSuccessMessage('Invitation email has been sent');
      }

      setInviteEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      await updateUserPermissions(organizationId, selectedUser, permissions);
      showSuccessMessage('User permissions successfully updated');
    } catch (err: any) {
      setError(err.message || 'Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      await quitOrganization(organizationId, selectedUser);
      setSelectedUser(null);
      setShowDeleteConfirmation(false);
      setSuccessMessage('User removed successfully');
    } catch (err: any) {
      setError(err.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

  const selectedUserData = users.find(user => user.id === selectedUser);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Manage Access</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollContent}>
            {error && (
              <View style={styles.errorContainer}>
                <AlertCircle size={20} color="#FF3B30" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {successMessage && (
              <Animated.View 
                style={[
                  styles.successContainer,
                  { opacity: successOpacity }
                ]}
              >
                <View style={styles.successContent}>
                  <Check size={20} color="#34C759" />
                  <Text style={styles.successText}>{successMessage}</Text>
                </View>
              </Animated.View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Invite New User</Text>
              <View style={styles.inviteContainer}>
                <TextInput
                  style={styles.input}
                  value={inviteEmail}
                  onChangeText={setInviteEmail}
                  placeholder="Enter username/email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.inviteButton, loading && styles.disabledButton]}
                  onPress={handleInviteUser}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <UserPlus size={20} color="white" />
                      <Text style={styles.inviteButtonText}>Send Invite</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Current Users ({users.length})</Text>
              <View style={styles.userList}>
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
                      styles.userIcon,
                      selectedUser === user.id && styles.selectedUserIcon
                    ]}>
                      <Users size={24} color={selectedUser === user.id ? 'white' : '#666'} />
                    </View>
                    <View style={styles.userInfo}>
                      <Text style={[
                        styles.userEmail,
                        selectedUser === user.id && styles.selectedUserEmail
                      ]}>
                        @{user.username} ({user.email})
                      </Text>
                      {user.isOwner && (
                        <View style={styles.ownerBadge}>
                          <Text style={styles.ownerBadgeText}>Owner</Text>
                        </View>
                      )}
                      {user.id === currentUserId && !user.isOwner && (
                        <View style={styles.currentUserBadge}>
                          <Text style={styles.currentUserBadgeText}>You</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {selectedUser && selectedUserData && !selectedUserData.isOwner && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>User Permissions</Text>
                
                <View style={styles.permissionGroup}>
                  <Text style={styles.permissionGroupTitle}>Analytics</Text>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>View Earnings</Text>
                    <Switch
                      value={permissions.analytics.viewEarnings}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          analytics: { ...permissions.analytics, viewEarnings: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>View Unpaid Amount</Text>
                    <Switch
                      value={permissions.analytics.viewUnpaidAmount}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          analytics: { ...permissions.analytics, viewUnpaidAmount: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>View Agent Payments</Text>
                    <Switch
                      value={permissions.analytics.viewAgentPayments}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          analytics: { ...permissions.analytics, viewAgentPayments: value },
                        })
                      }
                    />
                  </View>
                </View>

                <View style={styles.permissionGroup}>
                  <Text style={styles.permissionGroupTitle}>Bookings</Text>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Create Bookings</Text>
                    <Switch
                      value={permissions.bookings.create}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          bookings: { ...permissions.bookings, create: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Create for Others</Text>
                    <Switch
                      value={permissions.bookings.createForOthers}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          bookings: { ...permissions.bookings, createForOthers: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Edit Own Bookings</Text>
                    <Switch
                      value={permissions.bookings.edit}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          bookings: { ...permissions.bookings, edit: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Edit Others' Bookings</Text>
                    <Switch
                      value={permissions.bookings.editOthers}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          bookings: { ...permissions.bookings, editOthers: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Delete Own Bookings</Text>
                    <Switch
                      value={permissions.bookings.delete}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          bookings: { ...permissions.bookings, delete: value },
                        })
                      }
                    />
                  </View>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Delete Others' Bookings</Text>
                    <Switch
                      value={permissions.bookings.deleteOthers}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          bookings: { ...permissions.bookings, deleteOthers: value },
                        })
                      }
                    />
                  </View>
                </View>

                <View style={styles.permissionGroup}>
                  <Text style={styles.permissionGroupTitle}>User Management</Text>
                  <View style={styles.permissionItem}>
                    <Text style={styles.permissionLabel}>Manage Users</Text>
                    <Switch
                      value={permissions.users.manage}
                      onValueChange={(value) =>
                        setPermissions({
                          ...permissions,
                          users: { ...permissions.users, manage: value },
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
                    <Trash2 size={20} color="white" />
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
          </ScrollView>
        </View>
      </View>

      <DeleteConfirmationModal
        visible={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleRemoveUser}
        title="Remove User"
        message={`Are you sure you want to remove ${selectedUserData?.email} from the organization? This action cannot be undone.`}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    marginTop: 'auto',
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
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inviteContainer: {
    gap: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  inviteButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  successContainer: {
    backgroundColor: '#E5FFE5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  successContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    flex: 1,
  },
  userList: {
    gap: 8,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  selectedUserCard: {
    backgroundColor: '#007AFF',
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedUserIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    color: '#333',
  },
  selectedUserEmail: {
    color: 'white',
  },
  ownerBadge: {
    backgroundColor: '#ffd700',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ownerBadgeText: {
    color: '#333',
    fontSize: 12,
    fontWeight: 'bold',
  },
  currentUserBadge: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  currentUserBadgeText: {
    color: '#666',
    fontSize: 12,
  },
  permissionGroup: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  permissionGroupTitle: {
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
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
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
});