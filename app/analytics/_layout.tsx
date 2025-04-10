import { Stack } from 'expo-router';

export default function AnalyticsLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen 
        name="total-earned" 
        options={{ 
          title: 'Total Earnings',
          headerTintColor: '#007AFF',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }} 
      />
      <Stack.Screen 
        name="unpaid" 
        options={{ 
          title: 'Unpaid Amount',
          headerTintColor: '#007AFF',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }} 
      />
      <Stack.Screen 
        name="agent-payments" 
        options={{ 
          title: 'Agent Payments',
          headerTintColor: '#007AFF',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }} 
      />
    </Stack>
  );
}