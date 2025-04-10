import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import React from 'react';

export default function Terms() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Terms of Use',
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
      }} />
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Terms of Use</Text>
        <Text style={styles.date}>Effective Date: April 8, 2025</Text>

        <Text style={styles.intro}>
          Welcome to SmartFolio! These Terms of Use ("Terms") govern your access to and 
          use of the SmartFolio application, services, and features (collectively, the "App"). By using the App, 
          you agree to comply with and be bound by these Terms.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Eligibility</Text>
          <Text style={styles.text}>
            SmartFolio is available to users of all ages. If you are under the age of 18, you may use the App only with the consent and supervision of a parent or legal guardian. By allowing your child to use the App, you (the parent or guardian) agree to be bound by these Terms on behalf of your child.
          </Text>
          <Text style={styles.text}>
            We do not knowingly collect sensitive personal information from users under the age of 13. If we become aware that such information has been inadvertently collected, we will take steps to delete it.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.text}>
            SmartFolio is a rental tracking tool designed to help users:
          </Text>
          <Text style={styles.bullet}>• Track daily property occupancy</Text>
          <Text style={styles.bullet}>• Monitor revenue generated per property</Text>
          <Text style={styles.text}>
            The App is intended for informational and organizational purposes only. It does not provide financial, legal, investment, or professional advice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.text}>By using the App, you agree that:</Text>
          <Text style={styles.bullet}>• All information you submit is accurate and complete</Text>
          <Text style={styles.bullet}>• You will not use the App for any unlawful, harmful, or malicious purposes</Text>
          <Text style={styles.bullet}>• You are solely responsible for your actions and decisions based on the data shown in the App</Text>
          <Text style={styles.bullet}>• You will not attempt to reverse-engineer, copy, or tamper with the App's software or security features</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Data and Privacy</Text>
          <Text style={styles.text}>
            SmartFolio may collect basic non-sensitive information such as email addresses, usernames, or usage analytics to improve your experience. No sensitive personal data (e.g., addresses, financial accounts, biometric data, etc.) is required or knowingly collected.
          </Text>
          <Text style={styles.text}>
            Please review our Privacy Policy for more information on how we handle user data.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Disclaimer of Warranties</Text>
          <Text style={styles.text}>
            SmartFolio is provided on an "as is" and "as available" basis. We do not guarantee:
          </Text>
          <Text style={styles.bullet}>• That the App will be error-free or uninterrupted</Text>
          <Text style={styles.bullet}>• That data shown is always complete, up-to-date, or accurate</Text>
          <Text style={styles.bullet}>• That using SmartFolio will lead to financial gain or successful property management</Text>
          <Text style={styles.text}>
            Use the App at your own risk.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Limitation of Liability</Text>
          <Text style={styles.text}>
            To the fullest extent allowed by law, SmartFolio, its creators, and affiliates will not be liable for any direct, indirect, incidental, special, or consequential damages resulting from:
          </Text>
          <Text style={styles.bullet}>• Your use or inability to use the App</Text>
          <Text style={styles.bullet}>• Any decisions you make based on information from the App</Text>
          <Text style={styles.bullet}>• Unauthorized access or alterations to your data</Text>
          <Text style={styles.text}>
            Even if we were advised of the possibility of such damages.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. Indemnification</Text>
          <Text style={styles.text}>
            You agree to indemnify and hold harmless SmartFolio and its team from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from your use of the App, your violation of these Terms, or your violation of any law or rights of others.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Governing Law & Dispute Resolution</Text>
          <Text style={styles.text}>
            These Terms are governed by the laws of the Philippines, without regard to conflict of law principles.
          </Text>
          <Text style={styles.text}>
            Any disputes shall be resolved through binding arbitration in the Philippines, and not in a court of law, unless otherwise required by applicable local laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Modifications</Text>
          <Text style={styles.text}>
            We may update these Terms from time to time. If we make significant changes, we will notify users through the App or via email. Continued use of the App after changes means you accept the updated Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Contact Us</Text>
          <Text style={styles.text}>
            For questions or concerns about these Terms, reach out to us at:
          </Text>
          <Text style={styles.contact}>Email: ericksontalaue@gmail.com</Text>
          <Text style={styles.contact}>Company: SmartFolio</Text>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  intro: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#007AFF',
  },
  text: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginBottom: 12,
  },
  bullet: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
    marginLeft: 16,
    marginBottom: 8,
  },
  contact: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
});