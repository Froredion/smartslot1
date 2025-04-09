import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
} from 'react-native';
import { format, parse, addMinutes } from 'date-fns';
import type { TimeSlot } from '@/lib/firebase/firestore';

interface TimeSlotSelectorProps {
  timeSlots: TimeSlot[];
  selectedTimeSlot: TimeSlot | null;
  onSelectTimeSlot: (timeSlot: TimeSlot) => void;
  bookedTimeSlots: TimeSlot[];
}

export function TimeSlotSelector({
  timeSlots,
  selectedTimeSlot,
  onSelectTimeSlot,
  bookedTimeSlots,
}: TimeSlotSelectorProps) {
  const isTimeSlotBooked = (timeSlot: TimeSlot) => {
    return bookedTimeSlots.some(
      bookedSlot =>
        bookedSlot.start === timeSlot.start && bookedSlot.end === timeSlot.end
    );
  };

  const formatTimeSlot = (timeSlot: TimeSlot) => {
    const startTime = parse(timeSlot.start, 'HH:mm', new Date());
    const endTime = parse(timeSlot.end, 'HH:mm', new Date());
    return `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {timeSlots.map((timeSlot, index) => {
        const isBooked = isTimeSlotBooked(timeSlot);
        const isSelected = selectedTimeSlot?.start === timeSlot.start && 
                         selectedTimeSlot?.end === timeSlot.end;

        return (
          <TouchableOpacity
            key={`${timeSlot.start}-${timeSlot.end}`}
            style={[
              styles.timeSlot,
              isBooked && styles.bookedTimeSlot,
              isSelected && styles.selectedTimeSlot,
            ]}
            onPress={() => !isBooked && onSelectTimeSlot(timeSlot)}
            disabled={isBooked}
          >
            <Text
              style={[
                styles.timeText,
                isBooked && styles.bookedTimeText,
                isSelected && styles.selectedTimeText,
              ]}
            >
              {formatTimeSlot(timeSlot)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    gap: 8,
  },
  timeSlot: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  bookedTimeSlot: {
    backgroundColor: '#FFE5E5',
    borderColor: '#FFE5E5',
  },
  selectedTimeSlot: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  timeText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  bookedTimeText: {
    color: '#FF3B30',
  },
  selectedTimeText: {
    color: 'white',
  },
});