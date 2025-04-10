import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  ScrollView,
  Modal,
  Alert,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Mail, Lock, Check, X } from 'lucide-react-native';
import { signUp } from '@/lib/firebase/auth';
import { validateEmail, validatePassword } from '../../lib/validation';
import { StyledIcon } from '@/components/StyledIcon';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [legalAgreement, setLegalAgreement] = useState(false);
  const [legalModalVisible, setLegalModalVisible] = useState(false);

  const handleRegister = async () => {
    try {
      setError('');
      setLoading(true);

      // Validate inputs
      if (!email || !password || !username) {
        setError('Please fill in all fields');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (!validatePassword(password)) {
        setError('Password must be at least 6 characters long');
        return;
      }

      if (username.length < 3) {
        setError('Username must be at least 3 characters long');
        return;
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Username can only contain letters, numbers, and underscores');
        return;
      }

      if (!legalAgreement) {
        setError('Please accept the legal agreements to continue');
        return;
      }

      await signUp(email, password, username);
      Alert.alert(
        'Registration Successful',
        'Please check your email to verify your account.',
        [{ text: 'OK', onPress: () => router.replace('/auth/login') }]
      );
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const LegalModal = () => (
    <Modal
      visible={legalModalVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setLegalModalVisible(false)}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={() => setLegalModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Legal Agreements</Text>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setLegalModalVisible(false)}
            >
              <StyledIcon name="X" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <TouchableOpacity 
              style={styles.modalSection}
              onPress={() => {
                setLegalModalVisible(false);
                router.push('/legal/terms');
              }}
            >
              <View style={styles.modalSectionHeader}>
                <Text style={styles.modalSectionTitle}>Terms of Service</Text>
                <StyledIcon name="ChevronRight" size={20} color="#666" />
              </View>
              <Text style={styles.modalSectionDescription}>
                Read our terms of service to understand the rules and guidelines for using our platform.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalSection}
              onPress={() => {
                setLegalModalVisible(false);
                router.push('/legal/privacy');
              }}
            >
              <View style={styles.modalSectionHeader}>
                <Text style={styles.modalSectionTitle}>Privacy Policy</Text>
                <StyledIcon name="ChevronRight" size={20} color="#666" />
              </View>
              <Text style={styles.modalSectionDescription}>
                Learn how we collect, use, and protect your personal information.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalSection}
              onPress={() => {
                setLegalModalVisible(false);
                router.push('/legal/disclaimer');
              }}
            >
              <View style={styles.modalSectionHeader}>
                <Text style={styles.modalSectionTitle}>Disclaimer</Text>
                <StyledIcon name="ChevronRight" size={20} color="#666" />
              </View>
              <Text style={styles.modalSectionDescription}>
                Understand the limitations and disclaimers related to our services.
              </Text>
            </TouchableOpacity>

            <Text style={styles.modalNote}>
              By checking the box, you confirm that you have read and agree to our Terms of Service, 
              Privacy Policy, and Disclaimer. You acknowledge that your personal information will be 
              processed as described in our Privacy Policy.
            </Text>
          </ScrollView>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=800' }}
            style={styles.headerImage}
          />
          <View style={styles.overlay} />
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
        </View>

        <View style={styles.form}>
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <StyledIcon name="User" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={[styles.inputContainer, styles.spacingTop]}>
            <View style={styles.inputWrapper}>
              <StyledIcon name="Mail" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={[styles.inputContainer, styles.spacingTop]}>
            <View style={styles.inputWrapper}>
              <StyledIcon name="Lock" size={20} color="#666" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          <TouchableOpacity 
            style={styles.legalContainer}
            onPress={() => setLegalAgreement(!legalAgreement)}
          >
            <View style={[styles.checkbox, legalAgreement && styles.checkboxChecked]}>
              {legalAgreement && <StyledIcon name="Check" size={16} color="white" />}
            </View>
            <Text style={styles.legalText}>
              I agree to the{' '}
              <Text 
                style={styles.legalLink}
                onPress={() => setLegalModalVisible(true)}
              >
                Terms of Service and Privacy Policy
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Create Account</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account?</Text>
            <Link href="/auth/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Login</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>

      <LegalModal />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
  },
  header: {
    height: 240,
    justifyContent: 'flex-end',
    padding: 20,
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  form: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  inputContainer: {
    width: '100%',
  },
  spacingTop: {
    marginTop: 16,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  inputIcon: {
    padding: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  legalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 24,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
  },
  legalText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
  },
  legalLink: {
    color: '#007AFF',
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 8,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  footerLink: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    marginBottom: 20,
  },
  modalSection: {
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingVertical: 16,
  },
  modalSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  modalSectionDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  modalNote: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginTop: 24,
    marginBottom: 16,
    fontStyle: 'italic',
  },
});