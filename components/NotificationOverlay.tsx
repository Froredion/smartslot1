import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Platform } from 'react-native';
import { Check, AlertCircle } from 'lucide-react-native';
import { createPortal } from 'react-dom';

interface NotificationOverlayProps {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
  onHide: () => void;
  duration?: number;
}

export function NotificationOverlay({
  message,
  type,
  visible,
  onHide,
  duration = 3000,
}: NotificationOverlayProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (visible) {
      // Show notification with slide-in animation
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after duration
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: -100,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => onHide());
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [visible, duration, onHide]);

  if (!visible) return null;

  const isSuccess = type === 'success';
  const Icon = isSuccess ? Check : AlertCircle;

  const NotificationContent = (
    <View style={[styles.root, Platform.select({ web: styles.rootWeb })]}>
      <Animated.View
        style={[
          styles.container,
          Platform.select({ web: styles.containerWeb }),
          {
            opacity,
            transform: [{ translateY }],
          },
        ]}
      >
        <View
          style={[
            styles.notification,
            Platform.select({ web: styles.notificationWeb }),
            isSuccess ? styles.successNotification : styles.errorNotification,
          ]}
        >
          <Icon
            size={24}
            color={isSuccess ? '#10B981' : '#EF4444'}
            style={styles.icon}
          />
          <Text style={styles.message}>{message}</Text>
        </View>
      </Animated.View>
    </View>
  );

  // Use portal for web to ensure the notification appears above modals
  if (Platform.OS === 'web') {
    return createPortal(
      NotificationContent,
      // @ts-ignore - document is available in web
      document.body
    );
  }

  return NotificationContent;
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none',
    zIndex: 100,
  },
  rootWeb: {
    position: 'fixed',
    // @ts-ignore - these are web-only styles
    isolation: 'isolate',
  },
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  containerWeb: {
    // @ts-ignore - these are web-only styles
    position: 'fixed',
    isolation: 'isolate',
  },
  notification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 40,
    marginHorizontal: 16,
    minWidth: 280,
    maxWidth: Dimensions.get('window').width - 32,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 24,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  notificationWeb: {
    // @ts-ignore - these are web-only styles
    boxShadow: '0 8px 16px rgba(0, 0, 0, 0.5)',
  },
  successNotification: {
    backgroundColor: '#ECFDF5',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  errorNotification: {
    backgroundColor: '#FEF2F2',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  icon: {
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
}); 