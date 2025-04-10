import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { X, AlertCircle, Users, UserPlus, Trash2 } from 'lucide-react-native';
import { auth } from '@/lib/firebase/config';
import { 
  updateUserPermissions, 
  removeUserAccess,
  subscribeToUserPermissions,
  type UserPermissions 
} from '@/lib/firebase/firestore';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';

interface UserManagementModalProps {
  visible: boolean;
  onClose: () => void;
  organizationId: string;
  users: Array<{
    id: string;
    email: string;
    isOwner?: boolean;
  }>;
}

export function UserManagementModal({
  visible,
  onClose,
  organizationId,
  users,
}: UserManagementModalProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [userPermissions, setUserPermissions] = useState<UserPermissions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (selectedUser && organizationId) {
      unsubscribe = subscribeToUserPermissions(
        organizationId,
        selectedUser,
        (permissions) => {
          setUserPermissions(permissions);
        }
      );
    }

    return () => {
      unsubscribe?.();
    };
  }, [selectedUser, organizationId]);

  const handleUpdatePermissions = async () => {
    if (!selectedUser || !userPermissions) return;

    setLoading(true);
    setError(null);

    try {
      await updateUserPermissions(organizationId, selectedUser, userPermissions);
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
      await removeUserAccess(organizationId, selectedUser);
      setSelectedUser(null);
      setShowDeleteConfirmation(false);
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
            <Text style={styles.title}>Manage Users</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.userList}>
            <Text style={styles.sectionTitle}>Organization Members</Text>
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
                  <Users size={24} color={selectedUser === user.id ? 'white' : '#666'} />
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

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {selectedUser && userPermissions && selectedUserData && !selectedUserData.isOwner && (
            <ScrollView style={styles.permissionsContainer}>
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
            </ScrollView>
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
              <Users size={48} color="#666" />
              <Text style={styles.noSelectionText}>
                Select a user to manage their permissions
              </Text>
            </View>
          )}
        </View>

        <DeleteConfirmationModal
          visible={showDeleteConfirmation}
          onClose={() => setShowDeleteConfirmation(false)}
          onConfirm={handleRemoveUser}
          title="Remove User"
          message={`Are you sure you want to remove ${selectedUserData?.email} from the organization? This action cannot be undone.`}
        />
      </View>
    </Modal>
  );
}

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
  userList: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
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
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    margin: 20,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  permissionsContainer: {
    padding: 20,
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
    padding: 20,
    backgroundColor: '#f8f9fa',
    margin: 20,
    borderRadius: 12,
  },
  ownerMessageText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  noSelection: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSelectionText: {
    color: '#666',
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
});