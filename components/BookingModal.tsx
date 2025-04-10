import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Trash2, Users, DollarSign, Info, AlertCircle, User, Clock } from 'lucide-react-native';
import { format } from 'date-fns';
import { auth } from '@/lib/firebase/config';
import { TimeSlotSelector } from './TimeSlotSelector';
import type { Asset, Booking, TimeSlot } from '@/lib/firebase/firestore';

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (bookingDetails: Omit<Booking, 'id' | 'bookedBy'>) => void;
  onDelete: (bookingId: string) => void;
  selectedDate: Date;
  assets: Asset[];
  initialAssetId?: string | null;
  editBooking?: Booking | null;
  bookings: Booking[];
}

export function BookingModal({
  visible,
  onClose,
  onConfirm,
  onDelete,
  selectedDate,
  assets,
  initialAssetId,
  editBooking,
  bookings,
}: BookingModalProps) {
  const [bookingDetails, setBookingDetails] = useState({
    assetId: '',
    description: '',
    clientName: '',
    numberOfPeople: '',
    customPrice: '',
    customAgentFee: '',
    currency: 'USD',
    timeSlot: null as TimeSlot | null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editBooking) {
      setBookingDetails({
        assetId: editBooking.assetId,
        description: editBooking.description || '',
        clientName: editBooking.clientName || '',
        numberOfPeople: editBooking.numberOfPeople?.toString() || '',
        customPrice: editBooking.customPrice?.toString() || '',
        customAgentFee: editBooking.customAgentFee?.toString() || '',
        currency: editBooking.currency,
        timeSlot: editBooking.timeSlot || null,
      });
    } else if (initialAssetId) {
      setBookingDetails(prev => ({ ...prev, assetId: initialAssetId }));
    }
  }, [editBooking, initialAssetId]);

  const handleConfirm = async () => {
    try {
      console.log('BookingModal - Starting booking confirmation...');
      
      setError(null);
      setLoading(true);

      const selectedAsset = assets.find(a => a.id === bookingDetails.assetId);
      
      if (!selectedAsset) {
        setError('Please select an asset');
        return;
      }

      // Validate time slot if asset uses time slots
      if (selectedAsset.bookingType === 'time-slots' && !bookingDetails.timeSlot) {
        setError('Please select a time slot');
        return;
      }

      // Parse numeric fields
      let numberOfPeople: number | null = null;
      let customPrice: number | null = null;
      let customAgentFee: number | null = null;

      if (bookingDetails.numberOfPeople.trim()) {
        numberOfPeople = parseInt(bookingDetails.numberOfPeople, 10);
        if (isNaN(numberOfPeople) || numberOfPeople < 0) {
          setError('Invalid number of people');
          return;
        }
      }

      if (bookingDetails.customPrice.trim()) {
        customPrice = parseFloat(bookingDetails.customPrice);
        if (isNaN(customPrice) || customPrice < 0) {
          setError('Invalid custom price');
          return;
        }
      }

      if (bookingDetails.customAgentFee.trim()) {
        customAgentFee = parseFloat(bookingDetails.customAgentFee);
        if (isNaN(customAgentFee) || customAgentFee < 0) {
          setError('Invalid agent fee percentage');
          return;
        }
      }

      const bookingData = {
        assetId: selectedAsset.id,
        date: selectedDate,
        description: bookingDetails.description.trim() || null,
        clientName: bookingDetails.clientName.trim() || null,
        numberOfPeople: numberOfPeople,
        customPrice: customPrice,
        customAgentFee: customAgentFee !== selectedAsset.agentFee ? customAgentFee : null,
        currency: selectedAsset.currency,
        timeSlot: bookingDetails.timeSlot || null,
      };

      await onConfirm(bookingData);
      onClose();
    } catch (err: any) {
      console.error('BookingModal - Error in handleConfirm:', err);
      setError(err.message || 'Failed to save booking');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editBooking) return;
    
    try {
      setError(null);
      setLoading(true);
      await onDelete(editBooking.id);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to delete booking');
    } finally {
      setLoading(false);
    }
  };

  const selectedAsset = assets.find(a => a.id === bookingDetails.assetId);
  
  // Get booked time slots for the selected date and asset
  const bookedTimeSlots = selectedAsset?.bookingType === 'time-slots' 
    ? bookings
        .filter(b => 
          b.assetId === selectedAsset.id && 
          format(b.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') &&
          b.timeSlot &&
          (!editBooking || b.id !== editBooking.id)
        )
        .map(b => b.timeSlot!)
    : [];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editBooking ? 'Edit Booking' : 'New Booking'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.dateText}>
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </Text>

          {error && (
            <View style={styles.errorContainer}>
              <AlertCircle size={20} color="#FF3B30" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {selectedAsset && (
            <ScrollView style={styles.form}>
              <View style={styles.assetInfo}>
                <Text style={styles.assetName}>{selectedAsset.name}</Text>
                <Text style={styles.assetType}>{selectedAsset.type}</Text>
                <Text style={styles.assetPrice}>
                  {selectedAsset.currency} {selectedAsset.pricePerDay} per day
                </Text>
                {editBooking && (
                  <Text style={styles.bookedBy}>
                    Booked by: {editBooking.bookedBy}
                  </Text>
                )}
              </View>

              {selectedAsset.bookingType === 'time-slots' && selectedAsset.timeSlots && (
                <View style={styles.timeSlotsSection}>
                  <View style={styles.sectionHeader}>
                    <Clock size={20} color="#666" />
                    <Text style={styles.sectionTitle}>Select Time Slot</Text>
                  </View>
                  <TimeSlotSelector
                    timeSlots={selectedAsset.timeSlots}
                    selectedTimeSlot={bookingDetails.timeSlot}
                    onSelectTimeSlot={(timeSlot) => {
                      setBookingDetails(prev => ({ ...prev, timeSlot }));
                    }}
                    bookedTimeSlots={bookedTimeSlots}
                  />
                </View>
              )}

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <User size={16} color="#666" />
                  <Text style={styles.labelText}>Client Name (Optional)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={bookingDetails.clientName}
                  onChangeText={(text) => setBookingDetails(prev => ({ ...prev, clientName: text }))}
                  placeholder="Enter client name"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Info size={16} color="#666" />
                  <Text style={styles.labelText}>Description (Optional)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={bookingDetails.description}
                  onChangeText={(text) => setBookingDetails(prev => ({ ...prev, description: text }))}
                  placeholder="Enter booking description"
                  multiline
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Users size={16} color="#666" />
                  <Text style={styles.labelText}>Number of People (Optional)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={bookingDetails.numberOfPeople}
                  onChangeText={(text) => setBookingDetails(prev => ({ ...prev, numberOfPeople: text }))}
                  placeholder="Enter number of people"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <DollarSign size={16} color="#666" />
                  <Text style={styles.labelText}>Custom Price (Optional)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={bookingDetails.customPrice}
                  onChangeText={(text) => setBookingDetails(prev => ({ ...prev, customPrice: text }))}
                  placeholder={`Default: ${selectedAsset.currency} ${selectedAsset.pricePerDay}`}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <DollarSign size={16} color="#666" />
                  <Text style={styles.labelText}>Agent Fee % (Optional)</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={bookingDetails.customAgentFee}
                  onChangeText={(text) => setBookingDetails(prev => ({ ...prev, customAgentFee: text }))}
                  placeholder={`Default: ${selectedAsset.agentFee}%`}
                  keyboardType="numeric"
                />
              </View>
            </ScrollView>
          )}

          <View style={styles.buttonContainer}>
            {editBooking && (
              <TouchableOpacity
                style={[styles.button, styles.deleteButton]}
                onPress={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <>
                    <Trash2 size={20} color="white" />
                    <Text style={styles.buttonText}>Delete Booking</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.button, 
                styles.confirmButton,
                (!selectedAsset || loading) && styles.disabledButton
              ]}
              onPress={handleConfirm}
              disabled={!selectedAsset || loading}
            >
              {loading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.buttonText}>
                  {editBooking ? 'Update Booking' : 'Confirm Booking'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  dateText: {
    fontSize: 18,
    color: '#007AFF',
    paddingHorizontal: 20,
    marginBottom: 20,
    fontWeight: '600',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  form: {
    flex: 1,
    padding: 20,
  },
  assetInfo: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  assetName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  assetType: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  assetPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  bookedBy: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    fontStyle: 'italic',
  },
  timeSlotsSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    padding: 20,
    gap: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});