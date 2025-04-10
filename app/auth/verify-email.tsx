import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Mail, RefreshCw, ArrowRight } from 'lucide-react-native';
import { auth } from '@/lib/firebase/config';
import { resendVerificationEmail } from '@/lib/firebase/auth';
import { StyledIcon } from '@/components/StyledIcon';

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) {
      router.replace('/auth/login');
    }
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleResendEmail = async () => {
    if (!auth.currentUser) {
      router.replace('/auth/login');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await resendVerificationEmail(auth.currentUser);
      setSuccess(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Image
          source={{ uri: 'https://images.unsplash.com/photo-1596526131083-e8c633c948d2?w=800' }}
          style={styles.headerImage}
        />
        <View style={styles.overlay} />
      </View>

      <View style={styles.content}>
        <StyledIcon name="Mail" size={48} color="#007AFF" />

        <Text style={styles.title}>Verify Your Email</Text>
        <Text style={styles.description}>
          We've sent a verification email to{' '}
          <Text style={styles.email}>{auth.currentUser?.email}</Text>
        </Text>

        {error && <Text style={styles.error}>{error}</Text>}

        {success && (
          <Text style={styles.success}>
            Verification email sent! Please check your inbox.
          </Text>
        )}

        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>Next steps:</Text>
          <Text style={styles.instructionText}>
            1. Check your email inbox
          </Text>
          <Text style={styles.instructionText}>
            2. Click the verification link in the email
          </Text>
          <Text style={styles.instructionText}>
            3. Return to this app to continue
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.button,
              (loading || countdown > 0) && styles.disabledButton,
            ]}
            onPress={handleResendEmail}
            disabled={loading || countdown > 0}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <StyledIcon name="RefreshCw" size={20} color="white" />
                <Text style={styles.buttonText}>
                  {countdown > 0
                    ? `Resend in ${countdown}s`
                    : 'Resend Verification Email'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => router.replace('/auth/login')}
          >
            <StyledIcon name="ArrowRight" size={20} color="#FF3B30" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 200,
    position: 'relative',
  },
  headerImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  email: {
    color: '#007AFF',
    fontWeight: '600',
  },
  error: {
    color: '#FF3B30',
    textAlign: 'center',
  },
  success: {
    color: '#34C759',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#F8F9FA',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  actions: {
    width: '100%',
    gap: 16,
    marginTop: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  signOutText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});