import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  ScrollView,
} from 'react-native';
import { X } from 'lucide-react-native';
import { format, parse } from 'date-fns';

interface TimePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectTime: (time: string) => void;
  initialTime?: string;
}

export function TimePickerModal({
  visible,
  onClose,
  onSelectTime,
  initialTime = '09:00',
}: TimePickerModalProps) {
  // Convert 24h time to 12h format for initial display
  const initialDate = parse(initialTime, 'HH:mm', new Date());
  const [selectedHour, setSelectedHour] = useState(format(initialDate, 'hh'));
  const [selectedMinute, setSelectedMinute] = useState(format(initialDate, 'mm'));
  const [selectedPeriod, setSelectedPeriod] = useState(format(initialDate, 'a'));

  // Generate hours in 12-hour format (01-12)
  const hours = Array.from({ length: 12 }, (_, i) => 
    (i + 1).toString().padStart(2, '0')
  );
  
  // Generate all minutes (00-59)
  const minutes = Array.from({ length: 60 }, (_, i) => 
    i.toString().padStart(2, '0')
  );

  const periods = ['AM', 'PM'];

  const handleConfirm = () => {
    // Convert back to 24-hour format for storage
    const timeString = `${selectedHour}:${selectedMinute} ${selectedPeriod}`;
    const date = parse(timeString, 'hh:mm a', new Date());
    const time24 = format(date, 'HH:mm');
    onSelectTime(time24);
    onClose();
  };

  // Reset selections when modal opens
  useEffect(() => {
    if (visible) {
      const date = parse(initialTime, 'HH:mm', new Date());
      setSelectedHour(format(date, 'hh'));
      setSelectedMinute(format(date, 'mm'));
      setSelectedPeriod(format(date, 'a'));
    }
  }, [visible, initialTime]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity 
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity 
          style={styles.content}
          activeOpacity={1}
          onPress={e => e.stopPropagation()}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Select Time</Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <View style={styles.pickerContainer}>
            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Hour</Text>
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
              >
                {hours.map(hour => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      hour === selectedHour && styles.selectedItem
                    ]}
                    onPress={() => setSelectedHour(hour)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      hour === selectedHour && styles.selectedItemText
                    ]}>
                      {hour}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>Minute</Text>
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
              >
                {minutes.map(minute => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.pickerItem,
                      minute === selectedMinute && styles.selectedItem
                    ]}
                    onPress={() => setSelectedMinute(minute)}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      minute === selectedMinute && styles.selectedItemText
                    ]}>
                      {minute}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.pickerColumn}>
              <Text style={styles.pickerLabel}>AM/PM</Text>
              <View style={styles.periodContainer}>
                {periods.map(period => (
                  <TouchableOpacity
                    key={period}
                    style={[
                      styles.periodButton,
                      period === selectedPeriod && styles.selectedPeriod
                    ]}
                    onPress={() => setSelectedPeriod(period)}
                  >
                    <Text style={[
                      styles.periodButtonText,
                      period === selectedPeriod && styles.selectedPeriodText
                    ]}>
                      {period}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.previewContainer}>
            <Text style={styles.previewText}>
              {`${selectedHour}:${selectedMinute} ${selectedPeriod}`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirm}
          >
            <Text style={styles.confirmButtonText}>
              Confirm
            </Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  pickerColumn: {
    alignItems: 'center',
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  picker: {
    height: 200,
  },
  pickerItem: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    marginVertical: 2,
  },
  selectedItem: {
    backgroundColor: '#007AFF',
  },
  pickerItemText: {
    fontSize: 20,
    color: '#333',
  },
  selectedItemText: {
    color: 'white',
    fontWeight: '600',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginTop: 32,
  },
  periodContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 4,
    marginTop: 32,
  },
  periodButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    minWidth: 60,
  },
  selectedPeriod: {
    backgroundColor: '#007AFF',
  },
  periodButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  selectedPeriodText: {
    color: 'white',
  },
  previewContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  previewText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});