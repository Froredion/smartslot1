import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function Privacy() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Privacy Policy',
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
      }} />
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Privacy Policy</Text>
        <Text style={styles.date}>Effective Date: April 8th, 2025</Text>

        <Text style={styles.intro}>
          We value your privacy and are committed to protecting your personal information. 
          This Privacy Policy outlines how we collect, use, and protect your information 
          when you use our app.
        </Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Information We Collect</Text>
          <Text style={styles.text}>We collect the following types of information:</Text>
          <Text style={styles.bullet}>
            • Personal Information: such as your name, email address, and authentication 
            credentials via Firebase Authentication.
          </Text>
          <Text style={styles.bullet}>
            • Property Data: including occupancy status, revenue, and other relevant 
            property details you input into the App.
          </Text>
          <Text style={styles.bullet}>
            • Usage Data: including how you interact with the App, feature usage, and 
            technical data such as device type and operating system.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. How We Use Your Information</Text>
          <Text style={styles.text}>We use your information to:</Text>
          <Text style={styles.bullet}>• Provide and maintain the App's services and features</Text>
          <Text style={styles.bullet}>• Improve functionality and user experience</Text>
          <Text style={styles.bullet}>• Respond to customer inquiries and support requests</Text>
          <Text style={styles.bullet}>
            • Monitor usage patterns to ensure the App's performance and security
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Data Security</Text>
          <Text style={styles.text}>
            We take reasonable steps to protect your information using industry-standard 
            security practices, including:
          </Text>
          <Text style={styles.bullet}>• Encrypted database storage via Firebase Firestore</Text>
          <Text style={styles.bullet}>• Secure user authentication via Firebase Authentication</Text>
          <Text style={styles.bullet}>• Access controls and audit logging</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.text}>
            If you have any questions about this Privacy Policy, you may contact us at:
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