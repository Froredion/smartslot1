import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Users } from 'lucide-react-native';
import { signOut, resendVerificationEmail } from '@/lib/firebase/auth';
import { auth } from '@/lib/firebase/config';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';

export default function Settings() {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(auth.currentUser);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/login');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleResendVerification = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await resendVerificationEmail(user);
      Alert.alert(
        'Success',
        'Verification email sent! Please check your inbox.'
      );
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to send verification email. Please try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSupportPress = () => {
    Alert.alert(
      'Support Not Available',
      'We apologize, but customer support is not available at this time as we are still a growing company. Please check back later for updates.',
      [{ text: 'OK', style: 'default' }]
    );
  };

  const renderSettingItem = (title: string, subtitle?: string, onPress?: () => void) => (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      <ChevronRight size={20} color="#666" />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        {renderSettingItem('Profile', user?.email || '')}
        
        {/* Email Verification Status */}
        {user && !user.emailVerified && (
          <View style={styles.verificationContainer}>
            <Text style={styles.verificationText}>
              Your email is not verified. Please verify your email to access all features.
            </Text>
            <TouchableOpacity
              style={styles.verificationButton}
              onPress={handleResendVerification}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.verificationButtonText}>
                  Resend Verification Email
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {user && user.emailVerified && (
          <View style={styles.verificationContainer}>
            <Text style={[styles.verificationText, { color: '#34C759' }]}>
              Your email is verified ✓
            </Text>
          </View>
        )}

        {renderSettingItem('Subscription', 'Pro Plan')}
        {renderSettingItem('Billing')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Access Management</Text>
        {renderSettingItem('User Access', 'Manage user permissions', () => router.push('/settings/access'))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Preferences</Text>
        {renderSettingItem('Notifications')}
        {renderSettingItem('Auto-assignment Rules')}
        {renderSettingItem('Calendar Settings')}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Legal</Text>
        {renderSettingItem('Terms of Use', undefined, () => router.push('/legal/terms'))}
        {renderSettingItem('Privacy Policy', undefined, () => router.push('/legal/privacy'))}
        {renderSettingItem('Disclaimer', undefined, () => router.push('/legal/disclaimer'))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Support</Text>
        {renderSettingItem('Help Center', undefined, handleSupportPress)}
        {renderSettingItem('Contact Support', undefined, handleSupportPress)}
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 20,
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingTitle: {
    fontSize: 16,
    color: '#1a1a1a',
  },
  settingSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  logoutButton: {
    margin: 20,
    padding: 15,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  verificationContainer: {
    backgroundColor: '#FFF3CD',
    padding: 15,
    margin: 15,
    borderRadius: 8,
  },
  verificationText: {
    color: '#856404',
    fontSize: 14,
    marginBottom: 10,
  },
  verificationButton: {
    backgroundColor: '#007AFF',
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  verificationButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});