import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';

export default function Disclaimer() {
  const insets = useSafeAreaInsets();

  return (
    <>
      <Stack.Screen options={{ 
        headerShown: true,
        title: 'Disclaimer',
        headerStyle: { backgroundColor: '#fff' },
        headerShadowVisible: false,
      }} />
      <ScrollView 
        style={[styles.container, { paddingTop: insets.top }]}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Disclaimer</Text>
        <Text style={styles.date}>Effective Date: April 8th, 2025</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. No Professional Advice</Text>
          <Text style={styles.text}>
            The information provided by SmartSlot is for general informational purposes only. While we aim to provide useful data to assist with rental management, the App:
          </Text>
          <Text style={styles.bullet}>• Does not offer financial, legal, tax, or accounting advice.</Text>
          <Text style={styles.bullet}>• Should not be relied upon as the sole source for business decisions.</Text>
          <Text style={styles.text}>
            You should consult with qualified professionals for any financial or legal matters.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Data Accuracy</Text>
          <Text style={styles.text}>
            We strive to ensure that the data presented in the App is accurate and up-to-date. However:
          </Text>
          <Text style={styles.bullet}>• The App depends on user-provided input.</Text>
          <Text style={styles.bullet}>• We make no guarantees regarding the accuracy, completeness, or reliability of the information displayed.</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. Limitation of Liability</Text>
          <Text style={styles.text}>
            To the fullest extent permitted by law, SmartSlot and its creators will not be liable for:
          </Text>
          <Text style={styles.bullet}>• Any errors or omissions in the App's content</Text>
          <Text style={styles.bullet}>• Any losses, damages, or liabilities arising from your use of or reliance on the App</Text>
          <Text style={styles.bullet}>• Business losses, data loss, or indirect damages of any kind</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Us</Text>
          <Text style={styles.text}>
            For any questions regarding this Disclaimer, contact us at:
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