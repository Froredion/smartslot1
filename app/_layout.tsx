import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { subscribeToAuthChanges } from '@/lib/firebase/auth';
import { User } from 'firebase/auth';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  useFrameworkReady();
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (initializing) setInitializing(false);
    });

    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        {!user ? (
          // Auth stack
          <Stack.Screen name="auth" options={{ gestureEnabled: false }} />
        ) : !user.emailVerified ? (
          // Email verification required
          <Stack.Screen 
            name="auth/verify-email" 
            options={{ gestureEnabled: false }} 
          />
        ) : (
          // App stack
          <>
            <Stack.Screen name="(tabs)" options={{ gestureEnabled: false }} />
            <Stack.Screen name="legal" options={{ headerShown: true }} />
            <Stack.Screen name="+not-found" options={{ title: 'Oops!' }} />
          </>
        )}
      </Stack>
    </SafeAreaProvider>
  );
}