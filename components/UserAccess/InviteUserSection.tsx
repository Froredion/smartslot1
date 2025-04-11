import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { UserPlus } from 'lucide-react-native';
import { inviteUserToOrganization } from '@/lib/firebase/firestore';

interface InviteUserSectionProps {
  organizationId: string;
  currentUserId: string;
  onSuccess: (message: string) => void;
  onError: (error: string) => void;
}

export function InviteUserSection({
  organizationId,
  currentUserId,
  onSuccess,
  onError,
}: InviteUserSectionProps) {
  const [inviteEmail, setInviteEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) {
      onError('Please enter an email address');
      return;
    }

    setLoading(true);

    try {
      const result = await inviteUserToOrganization(
        organizationId,
        inviteEmail.trim(),
        currentUserId
      );

      if (result.status === 'added') {
        onSuccess('User has been added to the organization');
      } else if (result.status === 'invited') {
        onSuccess('Invitation email has been sent');
      }

      setInviteEmail('');
    } catch (err: any) {
      onError(err.message || 'Failed to invite user');
    } finally {
      setLoading(false);
    }
  };

  return (
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
  disabledButton: {
    backgroundColor: '#999',
  },
}); 