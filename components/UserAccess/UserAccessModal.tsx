import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { 
  updateUserPermissions, 
  quitOrganization, 
  subscribeToAllOrganizationInvites, 
  subscribeToUserPermissions,
  UserPermissions
} from '@/lib/firebase/firestore';
import { DeleteConfirmationModal } from '../DeleteConfirmationModal';
import { NotificationOverlay } from '../NotificationOverlay';
import { InviteUserSection } from './InviteUserSection';
import { UserList } from './UserList';
import { UserPermissionsSection } from './UserPermissionsSection';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface User {
  id: string;
  email: string;
  username: string;
  isOwner: boolean;
}

interface UserAccessModalProps {
  visible: boolean;
  onClose: () => void;
  users: User[];
  currentUserId: string;
  organizationId: string;
}

interface PendingInvite {
  id: string;
  email: string;
  status: 'pending';
  invitedAt: Date;
  type: 'email' | 'user';
  username?: string;
  permissions?: UserPermissions;
}

export function UserAccessModal({
  visible,
  onClose,
  users,
  currentUserId,
  organizationId,
}: UserAccessModalProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
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

  // Find selected user data and invite
  const selectedUserData = users.find(user => user.id === selectedUser);
  const selectedInvite = pendingInvites.find(invite => invite.id === selectedUser);

  useEffect(() => {
    if (!visible) {
      setSelectedUser(null);
      setError(null);
      setSuccessMessage('');
    }
  }, [visible]);

  useEffect(() => {
    if (visible && organizationId) {
      const unsubscribe = subscribeToAllOrganizationInvites(organizationId, (invites: PendingInvite[]) => {
        setPendingInvites(invites);
      });

      return () => unsubscribe();
    }
  }, [visible, organizationId]);

  // Load permissions when a user is selected
  useEffect(() => {
    if (selectedUser) {
      if (selectedInvite && selectedInvite.permissions) {
        // If it's a pending invite with permissions, use those
        setPermissions(selectedInvite.permissions);
      } else if (selectedUserData && !selectedUserData.isOwner) {
        // If it's a regular user (not owner), load their permissions
        const unsubscribe = subscribeToUserPermissions(
          organizationId,
          selectedUser,
          (userPermissions: UserPermissions) => {
            setPermissions(userPermissions);
          }
        );
        
        return () => unsubscribe();
      }
    }
  }, [selectedUser, organizationId, selectedUserData, selectedInvite]);

  const handleUpdatePermissions = async () => {
    if (!selectedUser) return;

    setLoading(true);
    setError(null);

    try {
      // Check if the selected user is a pending invite
      const isPendingInvite = pendingInvites.some(invite => invite.id === selectedUser);
      
      if (isPendingInvite) {
        // For pending invites, we need to update the permissions in the invite document
        await updateUserPermissions(organizationId, selectedUser, permissions, true);
        setSuccessMessage('Invite permissions successfully updated');
      } else {
        // For existing users, update permissions as before
        await updateUserPermissions(organizationId, selectedUser, permissions);
        setSuccessMessage('User permissions successfully updated');
      }
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
      // Check if the selected user is a pending invite
      const isPendingInvite = pendingInvites.some(invite => invite.id === selectedUser);
      
      if (isPendingInvite) {
        // For pending invites, we need to update the status to 'declined'
        const pendingInviteRef = doc(db, 'pending_invites', selectedUser);
        const pendingInviteDoc = await getDoc(pendingInviteRef);
        
        if (!pendingInviteDoc.exists()) {
          throw new Error('Pending invite not found');
        }
        
        const invites = pendingInviteDoc.data().invites || [];
        const updatedInvites = invites.map((invite: any) => {
          if (invite.organizationId === organizationId && invite.status === 'pending') {
            return {
              ...invite,
              status: 'declined'
            };
          }
          return invite;
        });
        
        await updateDoc(pendingInviteRef, {
          invites: updatedInvites,
          updatedAt: serverTimestamp()
        });
        
        setSelectedUser(null);
        setShowDeleteConfirmation(false);
        setSuccessMessage('Invite declined successfully');
      } else {
        // For existing users, remove them as before
        await quitOrganization(organizationId, selectedUser);
        setSelectedUser(null);
        setShowDeleteConfirmation(false);
        setSuccessMessage('User removed successfully');
      }
    } catch (err: any) {
      console.error('Error removing user:', err);
      setError(err.message || 'Failed to remove user');
    } finally {
      setLoading(false);
    }
  };

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
          <TouchableOpacity 
            style={styles.content}
            activeOpacity={1}
            onPress={e => e.stopPropagation()}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Manage Access</Text>
              <TouchableOpacity onPress={onClose}>
                <X size={24} color="#666" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollContent} showsVerticalScrollIndicator={true}>
              <InviteUserSection
                organizationId={organizationId}
                currentUserId={currentUserId}
                onSuccess={setSuccessMessage}
                onError={setError}
              />

              <UserList
                users={users}
                pendingInvites={pendingInvites}
                selectedUser={selectedUser}
                currentUserId={currentUserId}
                onSelectUser={setSelectedUser}
              />

              {selectedUser && (selectedUserData || selectedInvite) && (
                <UserPermissionsSection
                  permissions={permissions}
                  onUpdatePermissions={setPermissions}
                  onRemoveUser={() => setShowDeleteConfirmation(true)}
                  isOwner={selectedUserData?.isOwner || false}
                  loading={loading}
                  email={selectedUserData?.email || selectedInvite?.email || ''}
                  isPendingInvite={Boolean(selectedInvite)}
                />
              )}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <NotificationOverlay
        message={error || successMessage}
        type={error ? 'error' : 'success'}
        visible={Boolean(error || successMessage)}
        onHide={() => {
          setError(null);
          setSuccessMessage('');
        }}
      />

      <DeleteConfirmationModal
        visible={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleRemoveUser}
        title={selectedInvite ? "Decline Invite" : "Remove User"}
        message={
          selectedInvite
            ? `Are you sure you want to decline the invitation for ${selectedInvite.email}?`
            : `Are you sure you want to remove ${selectedUserData?.email} from the organization? This action cannot be undone.`
        }
      />
    </>
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
}); 