import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native';
import { format, parse } from 'date-fns';
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

  // Sort time slots by start time
  const sortedTimeSlots = [...timeSlots].sort((a, b) => {
    const aStart = parse(a.start, 'HH:mm', new Date());
    const bStart = parse(b.start, 'HH:mm', new Date());
    return aStart.getTime() - bStart.getTime();
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.grid}>
        {sortedTimeSlots.map((timeSlot) => {
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
                numberOfLines={2}
              >
                {formatTimeSlot(timeSlot)}
              </Text>
              {isBooked && (
                <Text style={styles.bookedIndicator}>Booked</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
}

const { width } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP = 8;
const ITEMS_PER_ROW = width > 768 ? 4 : 2;
const ITEM_WIDTH = (width - (GRID_PADDING * 2) - (GRID_GAP * (ITEMS_PER_ROW - 1))) / ITEMS_PER_ROW;

const styles = StyleSheet.create({
  container: {
    maxHeight: 300,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
    padding: GRID_PADDING,
  },
  timeSlot: {
    width: ITEM_WIDTH,
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
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
    textAlign: 'center',
  },
  bookedTimeText: {
    color: '#FF3B30',
  },
  selectedTimeText: {
    color: 'white',
  },
  bookedIndicator: {
    fontSize: 12,
    color: '#FF3B30',
    marginTop: 4,
    fontWeight: '500',
  },
});