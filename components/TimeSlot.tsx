import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { format } from 'date-fns';

interface TimeSlotProps {
  time: Date;
  isBooked: boolean;
  onPress: () => void;
}

export function TimeSlot({ time, isBooked, onPress }: TimeSlotProps) {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isBooked ? styles.bookedSlot : styles.availableSlot,
      ]}
      onPress={onPress}
      disabled={isBooked}
    >
      <Text style={[styles.time, isBooked ? styles.bookedText : styles.availableText]}>
        {format(time, 'HH:mm')}
      </Text>
      <View style={[styles.statusDot, isBooked ? styles.bookedDot : styles.availableDot]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableSlot: {
    backgroundColor: '#ffffff',
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  bookedSlot: {
    backgroundColor: '#f8f8f8',
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  time: {
    fontSize: 16,
    fontWeight: '600',
  },
  availableText: {
    color: '#000000',
  },
  bookedText: {
    color: '#666666',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  availableDot: {
    backgroundColor: '#34C759',
  },
  bookedDot: {
    backgroundColor: '#FF3B30',
  },
});