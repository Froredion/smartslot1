import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Platform,
} from 'react-native';
import { X, Plus, Trash2, Clock } from 'lucide-react-native';
import type { TimeSlot } from '@/lib/firebase/firestore';
import { TimePickerModal } from './TimePickerModal';

interface TimeSlotManagerModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (timeSlots: TimeSlot[]) => void;
  initialTimeSlots?: TimeSlot[];
}

export function TimeSlotManagerModal({
  visible,
  onClose,
  onSave,
  initialTimeSlots = [],
}: TimeSlotManagerModalProps) {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>(initialTimeSlots);
  const [error, setError] = useState<string | null>(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [activeTimeField, setActiveTimeField] = useState<{
    index: number;
    field: 'start' | 'end';
  } | null>(null);

  const validateTimeFormat = (time: string): boolean => {
    return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
  };

  const validateTimeSlot = (start: string, end: string): boolean => {
    if (!validateTimeFormat(start) || !validateTimeFormat(end)) {
      setError('Invalid time format. Use HH:mm (24-hour format)');
      return false;
    }

    const [startHour, startMinute] = start.split(':').map(Number);
    const [endHour, endMinute] = end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;

    if (endMinutes <= startMinutes) {
      setError('End time must be after start time');
      return false;
    }

    return true;
  };

  const addTimeSlot = () => {
    setTimeSlots([...timeSlots, { start: '09:00', end: '12:00' }]);
  };

  const removeTimeSlot = (index: number) => {
    setTimeSlots(timeSlots.filter((_, i) => i !== index));
  };

  const updateTimeSlot = (index: number, field: 'start' | 'end', value: string) => {
    const updatedSlots = [...timeSlots];
    updatedSlots[index] = {
      ...updatedSlots[index],
      [field]: value,
    };
    setTimeSlots(updatedSlots);
  };

  const handleSave = () => {
    setError(null);
    
    // Validate all time slots
    for (const slot of timeSlots) {
      if (!validateTimeSlot(slot.start, slot.end)) {
        return;
      }
    }

    // Check for overlapping time slots
    for (let i = 0; i < timeSlots.length; i++) {
      for (let j = i + 1; j < timeSlots.length; j++) {
        const slot1 = timeSlots[i];
        const slot2 = timeSlots[j];

        const [start1Hour, start1Minute] = slot1.start.split(':').map(Number);
        const [end1Hour, end1Minute] = slot1.end.split(':').map(Number);
        const [start2Hour, start2Minute] = slot2.start.split(':').map(Number);
        const [end2Hour, end2Minute] = slot2.end.split(':').map(Number);

        const start1Minutes = start1Hour * 60 + start1Minute;
        const end1Minutes = end1Hour * 60 + end1Minute;
        const start2Minutes = start2Hour * 60 + start2Minute;
        const end2Minutes = end2Hour * 60 + end2Minute;

        if (
          (start1Minutes >= start2Minutes && start1Minutes < end2Minutes) ||
          (end1Minutes > start2Minutes && end1Minutes <= end2Minutes) ||
          (start1Minutes <= start2Minutes && end1Minutes >= end2Minutes)
        ) {
          setError('Time slots cannot overlap');
          return;
        }
      }
    }

    // Sort time slots by start time
    const sortedSlots = [...timeSlots].sort((a, b) => {
      const [aHour, aMinute] = a.start.split(':').map(Number);
      const [bHour, bMinute] = b.start.split(':').map(Number);
      const aMinutes = aHour * 60 + aMinute;
      const bMinutes = bHour * 60 + bMinute;
      return aMinutes - bMinutes;
    });

    onSave(sortedSlots);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.modalContent}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Manage Time Slots</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <ScrollView style={styles.form}>
            <View style={styles.quickActions}>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setTimeSlots([
                  { start: '09:00', end: '12:00' },
                  { start: '13:00', end: '17:00' },
                ])}
              >
                <Text style={styles.quickActionText}>Business Hours</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickActionButton}
                onPress={() => setTimeSlots([
                  { start: '00:00', end: '08:00' },
                  { start: '08:00', end: '16:00' },
                  { start: '16:00', end: '23:59' },
                ])}
              >
                <Text style={styles.quickActionText}>24/7 Shifts</Text>
              </TouchableOpacity>
            </View>

            {timeSlots.map((slot, index) => (
              <View key={index} style={styles.timeSlotContainer}>
                <View style={styles.timeSlotHeader}>
                  <View style={styles.timeSlotIcon}>
                    <Clock size={20} color="#666" />
                    <Text style={styles.timeSlotLabel}>Time Slot {index + 1}</Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeTimeSlot(index)}
                  >
                    <Trash2 size={20} color="#FF3B30" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.timeInputContainer}>
                  <View style={styles.timeInput}>
                    <Text style={styles.timeInputLabel}>Start Time</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        setActiveTimeField({ index, field: 'start' });
                        setShowTimePicker(true);
                      }}
                    >
                      <Text style={styles.timeButtonText}>{slot.start}</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.timeInput}>
                    <Text style={styles.timeInputLabel}>End Time</Text>
                    <TouchableOpacity
                      style={styles.timeButton}
                      onPress={() => {
                        setActiveTimeField({ index, field: 'end' });
                        setShowTimePicker(true);
                      }}
                    >
                      <Text style={styles.timeButtonText}>{slot.end}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.addButton}
              onPress={addTimeSlot}
            >
              <Plus size={20} color="#007AFF" />
              <Text style={styles.addButtonText}>Add Time Slot</Text>
            </TouchableOpacity>
          </ScrollView>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.saveButton, timeSlots.length === 0 && styles.disabledButton]}
              onPress={handleSave}
              disabled={timeSlots.length === 0}
            >
              <Text style={styles.saveButtonText}>
                Save {timeSlots.length} Time Slot{timeSlots.length !== 1 ? 's' : ''}
              </Text>
            </TouchableOpacity>
          </View>

          {activeTimeField && (
            <TimePickerModal
              visible={showTimePicker}
              onClose={() => {
                setShowTimePicker(false);
                setActiveTimeField(null);
              }}
              onSelectTime={(time) => {
                updateTimeSlot(activeTimeField.index, activeTimeField.field, time);
                setShowTimePicker(false);
                setActiveTimeField(null);
              }}
              initialTime={
                timeSlots[activeTimeField.index][activeTimeField.field]
              }
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  errorContainer: {
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
  },
  form: {
    padding: 20,
  },
  timeSlotContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  timeSlotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeSlotIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeSlotLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  removeButton: {
    padding: 8,
  },
  timeInputContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  timeInput: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: 'white',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#f0f0f0',
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickActionButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  quickActionText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  timeButton: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  timeButtonText: {
    fontSize: 16,
    color: '#333',
  },
});