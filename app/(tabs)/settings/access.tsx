import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { AlertCircle, Plus, UserPlus, X } from 'lucide-react-native';
import { addUserAccess } from '@/lib/firebase/firestore';
import type { UserPermissions } from '@/lib/firebase/firestore';

export default function AccessManagement() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  const handleAddUser = async () => {
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await addUserAccess(auth.currentUser!.uid, email.trim(), permissions);
      setEmail('');
      // Reset permissions to defaults
      setPermissions({
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
    } catch (err: any) {
      setError(err.message || 'Failed to add user access');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Access Management',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }}
      />
      <ScrollView
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add New User</Text>
          <Text style={styles.sectionDescription}>
            Grant access to another user by entering their email address and setting their permissions.
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Enter user's email"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.permissionsContainer}>
            <Text style={styles.permissionsTitle}>Analytics Permissions</Text>
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

            <Text style={[styles.permissionsTitle, styles.sectionDivider]}>
              Booking Permissions
            </Text>
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
              <Text style={styles.permissionLabel}>Create Bookings for Others</Text>
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

            <Text style={[styles.permissionsTitle, styles.sectionDivider]}>
              User Management
            </Text>
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

          <TouchableOpacity
            style={[styles.addButton, loading && styles.disabledButton]}
            onPress={handleAddUser}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <UserPlus size={20} color="white" />
                <Text style={styles.addButtonText}>Add User Access</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
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
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  permissionsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  permissionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    color: '#007AFF',
  },
  sectionDivider: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
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
});