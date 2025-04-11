import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Users, Clock } from 'lucide-react-native';
import type { UserPermissions } from '@/lib/firebase/firestore';

interface User {
  id: string;
  email: string;
  username: string;
  isOwner: boolean;
}

interface PendingInvite {
  id: string;
  email: string;
  status: 'pending';
  invitedAt: string;
  type: 'email' | 'user';
  username?: string;
  permissions?: UserPermissions;
}

interface UserListProps {
  users: User[];
  pendingInvites: PendingInvite[];
  selectedUser: string | null;
  currentUserId: string;
  onSelectUser: (userId: string) => void;
}

export function UserList({
  users,
  pendingInvites,
  selectedUser,
  currentUserId,
  onSelectUser,
}: UserListProps) {
  return (
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
            onPress={() => onSelectUser(user.id)}
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

        {pendingInvites.map(invite => (
          <TouchableOpacity
            key={invite.id}
            style={[
              styles.userCard,
              selectedUser === invite.id && styles.selectedUserCard
            ]}
            onPress={() => onSelectUser(invite.id)}
          >
            <View style={[
              styles.userIcon,
              selectedUser === invite.id && styles.selectedUserIcon
            ]}>
              <Clock size={24} color={selectedUser === invite.id ? 'white' : '#666'} />
            </View>
            <View style={styles.userInfo}>
              <Text style={[
                styles.userEmail,
                selectedUser === invite.id && styles.selectedUserEmail
              ]}>
                {invite.username ? `@${invite.username}` : invite.email}
              </Text>
              {invite.username && (
                <Text style={{
                  fontSize: 14,
                  color: selectedUser === invite.id ? 'rgba(255, 255, 255, 0.8)' : '#666',
                  marginTop: 2,
                }}>
                  {invite.email}
                </Text>
              )}
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>Pending</Text>
              </View>
              <Text style={[
                styles.invitedAt,
                selectedUser === invite.id && { color: 'rgba(255, 255, 255, 0.7)' }
              ]}>
                Invited {new Date(invite.invitedAt).toLocaleDateString()}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
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
  pendingBadge: {
    backgroundColor: '#FFB800',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  pendingBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  invitedAt: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
}); 