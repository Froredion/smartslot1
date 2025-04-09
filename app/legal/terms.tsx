import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

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
        <Text style={styles.date}>Effective Date: April 8th, 2025</Text>

        <Text style={styles.intro}>
          Welcome to SmartSlot! These Terms of Use ("Terms") govern your access to and 
          use of our application, services, and features ("App"). By using the App, 
          you agree to comply with and be bound by these Terms.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Eligibility</Text>
          <Text style={styles.text}>
            Our App is available to users of all ages, including minors. If you are under 
            the age of 18, you may use the App only with the consent of a parent or legal 
            guardian who also agrees to be bound by these Terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.text}>
            SmartSlot is a rental management tool designed to help property and business owners:
          </Text>
          <Text style={styles.bullet}>• Track property occupancy on a daily basis</Text>
          <Text style={styles.bullet}>• Monitor revenue generated per property</Text>
          <Text style={styles.text}>
            The App is for informational and organizational purposes only and does not 
            constitute financial, legal, or professional advice.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
          <Text style={styles.text}>By using the App, you agree that:</Text>
          <Text style={styles.bullet}>• All information you provide is accurate and complete.</Text>
          <Text style={styles.bullet}>
            • You will not use the App for any unlawful, harmful, or malicious purposes.
          </Text>
          <Text style={styles.bullet}>
            • You are solely responsible for any decisions made based on the data shown in the App.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          <Text style={styles.text}>
            If you have questions about these Terms, please contact us at:
          </Text>
          <Text style={styles.contact}>Email: ericksontalaue@gmail.com</Text>
          <Text style={styles.contact}>Company: SmartSlot</Text>
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