import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { UserPermissions } from '@/lib/firebase/firestore';

interface UserPermissionsSectionProps {
  permissions: UserPermissions;
  onUpdatePermissions: (permissions: UserPermissions) => void;
  onRemoveUser: () => void;
  isOwner: boolean;
  loading: boolean;
  email: string;
  isPendingInvite?: boolean;
}

export function UserPermissionsSection({
  permissions,
  onUpdatePermissions,
  onRemoveUser,
  isOwner,
  loading,
  email,
  isPendingInvite = false,
}: UserPermissionsSectionProps) {
  if (isOwner) {
    return (
      <View style={styles.ownerMessage}>
        <Text style={styles.ownerMessageText}>
          Organization owner has full access to all features and permissions cannot be modified.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>
        {isPendingInvite ? 'Invite Permissions' : 'User Permissions'}
      </Text>

      <View style={styles.permissionGroup}>
        <Text style={styles.permissionGroupTitle}>Analytics</Text>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>View Earnings</Text>
          <Switch
            value={permissions.analytics.viewEarnings}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                analytics: { ...permissions.analytics, viewEarnings: value },
              });
            }}
          />
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>View Unpaid Amount</Text>
          <Switch
            value={permissions.analytics.viewUnpaidAmount}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                analytics: { ...permissions.analytics, viewUnpaidAmount: value },
              });
            }}
          />
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>View Agent Payments</Text>
          <Switch
            value={permissions.analytics.viewAgentPayments}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                analytics: { ...permissions.analytics, viewAgentPayments: value },
              });
            }}
          />
        </View>
      </View>

      <View style={styles.permissionGroup}>
        <Text style={styles.permissionGroupTitle}>Bookings</Text>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Create Bookings</Text>
          <Switch
            value={permissions.bookings.create}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                bookings: { ...permissions.bookings, create: value },
              });
            }}
          />
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Create for Others</Text>
          <Switch
            value={permissions.bookings.createForOthers}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                bookings: { ...permissions.bookings, createForOthers: value },
              });
            }}
          />
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Edit Own Bookings</Text>
          <Switch
            value={permissions.bookings.edit}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                bookings: { ...permissions.bookings, edit: value },
              });
            }}
          />
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Edit Others' Bookings</Text>
          <Switch
            value={permissions.bookings.editOthers}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                bookings: { ...permissions.bookings, editOthers: value },
              });
            }}
          />
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Delete Own Bookings</Text>
          <Switch
            value={permissions.bookings.delete}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                bookings: { ...permissions.bookings, delete: value },
              });
            }}
          />
        </View>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Delete Others' Bookings</Text>
          <Switch
            value={permissions.bookings.deleteOthers}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                bookings: { ...permissions.bookings, deleteOthers: value },
              });
            }}
          />
        </View>
      </View>

      <View style={styles.permissionGroup}>
        <Text style={styles.permissionGroupTitle}>User Management</Text>
        <View style={styles.permissionItem}>
          <Text style={styles.permissionLabel}>Manage Users</Text>
          <Switch
            value={permissions.users.manage}
            onValueChange={(value) => {
              onUpdatePermissions({
                ...permissions,
                users: { ...permissions.users, manage: value },
              });
            }}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={onRemoveUser}
        >
          <Trash2 size={20} color="white" />
          <Text style={styles.buttonText}>
            {isPendingInvite ? 'Decline Invite' : 'Remove User'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.saveButton, loading && styles.disabledButton]}
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