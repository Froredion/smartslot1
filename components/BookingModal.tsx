import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { X } from 'lucide-react-native';
import { format, isSameDay } from 'date-fns';

interface Asset {
  id: string;
  name: string;
  type: string;
  pricePerDay: number;
}

interface Booking {
  id: string;
  assetId: string;
  date: Date;
}

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (assetId: string) => void;
  selectedDate: Date;
  assets: Asset[];
  bookings: Booking[];
}

const assetImages = {
  Vehicle: 'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?w=500',
  Room: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500',
  Property: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=500',
};

export function BookingModal({
  visible,
  onClose,
  onConfirm,
  selectedDate,
  assets,
  bookings,
}: BookingModalProps) {
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  const isAssetBooked = (assetId: string) => {
    return bookings.some(booking => 
      booking.assetId === assetId && isSameDay(booking.date, selectedDate)
    );
  };

  const handleConfirm = () => {
    if (selectedAsset) {
      onConfirm(selectedAsset);
      setSelectedAsset(null);
    }
  };

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
            <Text style={styles.modalTitle}>Book for</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.dateText}>
            {format(selectedDate, "EEEE, MMMM d, yyyy")}
          </Text>

          <View style={styles.assetListContainer}>
            <ScrollView 
              style={styles.assetList}
              contentContainerStyle={styles.assetListContent}
              showsVerticalScrollIndicator={false}
            >
              {assets.map((asset) => {
                const isBooked = isAssetBooked(asset.id);
                const isSelected = selectedAsset === asset.id;
                
                return (
                  <View key={asset.id} style={styles.assetItemContainer}>
                    <TouchableOpacity
                      style={[
                        styles.assetItem,
                        isSelected && styles.selectedAsset,
                        isBooked && styles.bookedAsset,
                      ]}
                      onPress={() => !isBooked && setSelectedAsset(asset.id)}
                      disabled={isBooked}
                    >
                      <Image
                        source={{ uri: assetImages[asset.type as keyof typeof assetImages] }}
                        style={[
                          styles.assetImage,
                          isBooked && styles.bookedAssetImage
                        ]}
                      />
                      <View style={styles.assetContent}>
                        <View style={styles.assetHeader}>
                          <Text style={[
                            styles.assetName,
                            isBooked && styles.bookedText
                          ]}>
                            {asset.name}
                          </Text>
                          <View style={[
                            styles.statusBadge,
                            { backgroundColor: isBooked ? '#FFE5E5' : '#E5FFE5' }
                          ]}>
                            <View style={[
                              styles.statusDot,
                              { backgroundColor: isBooked ? '#FF3B30' : '#34C759' }
                            ]} />
                            <Text style={[
                              styles.assetStatus,
                              { color: isBooked ? '#FF3B30' : '#34C759' }
                            ]}>
                              {isBooked ? 'Booked' : 'Available'}
                            </Text>
                          </View>
                        </View>
                        
                        <Text style={[
                          styles.assetType,
                          isBooked && styles.bookedText
                        ]}>
                          {asset.type}
                        </Text>
                        
                        <Text style={[
                          styles.assetPrice,
                          isBooked && styles.bookedText
                        ]}>
                          ${asset.pricePerDay} per day
                        </Text>
                      </View>
                      {!isBooked && (
                        <View style={[
                          styles.checkmark,
                          isSelected && styles.selectedCheckmark
                        ]} />
                      )}
                    </TouchableOpacity>
                  </View>
                );
              })}
            </ScrollView>
          </View>

          {selectedAsset && (
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Booking Summary</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration</Text>
                <Text style={styles.summaryValue}>1 day</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Total Price</Text>
                <Text style={styles.summaryValue}>
                  ${assets.find(a => a.id === selectedAsset)?.pricePerDay}
                </Text>
              </View>
            </View>
          )}

          <TouchableOpacity
            style={[styles.confirmButton, !selectedAsset && styles.disabledButton]}
            onPress={handleConfirm}
            disabled={!selectedAsset}
          >
            <Text style={styles.confirmButtonText}>
              {selectedAsset ? 'Confirm Booking' : 'Select an Available Asset'}
            </Text>
          </TouchableOpacity>
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
  assetListContainer: {
    flex: 1,
    marginBottom: 20,
    width: '100%',
  },
  assetList: {
    flex: 1,
    width: '100%',
  },
  assetListContent: {
    padding: 16,
    gap: 16,
    flexGrow: 1,
  },
  assetItemContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  assetItem: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 16,
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  selectedAsset: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  bookedAsset: {
    backgroundColor: '#f8f8f8',
  },
  bookedAssetImage: {
    opacity: 0.6,
  },
  assetImage: {
    width: 100,
    height: 100,
    borderRadius: 12,
  },
  assetContent: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  assetName: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  assetType: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  assetStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  assetPrice: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
    marginTop: 8,
  },
  bookedText: {
    opacity: 0.6,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
    marginLeft: 12,
    alignSelf: 'center',
  },
  selectedCheckmark: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  summaryContainer: {
    padding: 20,
    backgroundColor: '#f8f8ff',
    marginHorizontal: 20,
    borderRadius: 12,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    color: '#666',
  },
  summaryValue: {
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: Platform.OS === 'ios' ? 20 : 12,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});