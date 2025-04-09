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

export default function VerifyEmail() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown(prev => prev - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    const checkVerification = async () => {
      if (!auth.currentUser) {
        router.replace('/auth/login');
        return;
      }

      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        router.replace('/(tabs)');
      }
    };

    const interval = setInterval(checkVerification, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleResendEmail = async () => {
    if (!auth.currentUser || countdown > 0) return;

    setLoading(true);
    setError(null);

    try {
      await resendVerificationEmail(auth.currentUser);
      setCountdown(60); // Start 60-second countdown
    } catch (err: any) {
      setError('Failed to send verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await auth.signOut();
      router.replace('/auth/login');
    } catch (err) {
      setError('Failed to sign out. Please try again.');
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
        <View style={styles.iconContainer}>
          <Mail size={48} color="#007AFF" />
        </View>

        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.description}>
          We've sent a verification email to{' '}
          <Text style={styles.emailText}>{auth.currentUser?.email}</Text>
        </Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
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

        <TouchableOpacity
          style={[styles.resendButton, countdown > 0 && styles.disabledButton]}
          onPress={handleResendEmail}
          disabled={loading || countdown > 0}
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <RefreshCw size={20} color="white" />
              <Text style={styles.resendButtonText}>
                {countdown > 0
                  ? `Resend email (${countdown}s)`
                  : 'Resend verification email'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signOutButton}
          onPress={handleSignOut}
        >
          <Text style={styles.signOutButtonText}>Sign out</Text>
          <ArrowRight size={20} color="#FF3B30" />
        </TouchableOpacity>
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
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -48,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
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
  emailText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 24,
    width: '100%',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
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
  resendButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    width: '100%',
    gap: 8,
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  resendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    padding: 12,
    gap: 8,
  },
  signOutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
});