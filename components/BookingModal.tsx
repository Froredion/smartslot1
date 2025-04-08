import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Image,
  FlatList,
  Dimensions,
  TextInput,
  ScrollView,
} from 'react-native';
import { X, User, Users, DollarSign, Info, ChevronDown } from 'lucide-react-native';
import { format, isSameDay } from 'date-fns';
import * as Localization from 'expo-localization';
import { CurrencySelector } from './CurrencySelector';
import { getCurrencyFromCountry, getCountryFromLocation } from '../utils/currencyUtils';

interface Asset {
  id: string;
  name: string;
  type: string;
  pricePerDay: number;
  currency: string;
}

interface Booking {
  id: string;
  assetId: string;
  date: Date;
  description?: string;
  bookedBy?: string;
  numberOfPeople?: number;
  customPrice?: number;
  currency?: string;
}

interface BookingModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (bookingDetails: Omit<Booking, 'id'>) => void;
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
  const [currencySelectorVisible, setCurrencySelectorVisible] = useState(false);
  const [userCountry, setUserCountry] = useState<string | null>(null);
  const [bookingDetails, setBookingDetails] = useState({
    description: '',
    bookedBy: '',
    numberOfPeople: '',
    customPrice: '',
    currency: 'USD', // Default to USD
  });

  useEffect(() => {
    const detectUserCountry = async () => {
      try {
        // First try to get country from location
        const countryFromLocation = await getCountryFromLocation();
        console.log('BookingModal - Country from location:', countryFromLocation);

        if (countryFromLocation) {
          setUserCountry(countryFromLocation);
          const countryCurrency = getCurrencyFromCountry(countryFromLocation);
          console.log('BookingModal - Setting currency based on location:', {
            countryCode: countryFromLocation,
            countryCurrency
          });
          setBookingDetails(prev => ({ ...prev, currency: countryCurrency }));
          return;
        }

        // If location detection fails, fall back to locale detection
        const locales = await Localization.getLocales();
        console.log('BookingModal - Falling back to locale detection:', JSON.stringify(locales, null, 2));
        
        if (locales && locales.length > 0) {
          // First try to find a US locale
          const usLocale = locales.find(locale => locale.regionCode === 'US');
          const primaryLocale = usLocale || locales[0];
          
          console.log('BookingModal - Primary locale details:', {
            languageCode: primaryLocale.languageCode,
            regionCode: primaryLocale.regionCode,
            measurementSystem: primaryLocale.measurementSystem,
            textDirection: primaryLocale.textDirection,
            decimalSeparator: primaryLocale.decimalSeparator,
            digitGroupingSeparator: primaryLocale.digitGroupingSeparator,
          });
          
          // Try to get country code from regionCode first
          let countryCode = primaryLocale.regionCode;
          console.log('BookingModal - Initial country code from regionCode:', countryCode);
          
          // If regionCode is not available, try to extract from languageCode
          if (!countryCode && primaryLocale.languageCode) {
            const parts = primaryLocale.languageCode.split('-');
            console.log('BookingModal - Language code parts:', parts);
            if (parts.length > 1) {
              countryCode = parts[1].toUpperCase();
              console.log('BookingModal - Country code extracted from language code:', countryCode);
            }
          }
          
          console.log('BookingModal - Final country code:', countryCode);
          
          if (countryCode) {
            setUserCountry(countryCode);
            const countryCurrency = getCurrencyFromCountry(countryCode);
            console.log('BookingModal - Setting currency based on locale:', {
              countryCode,
              countryCurrency
            });
            setBookingDetails(prev => ({ ...prev, currency: countryCurrency }));
          } else {
            console.log('BookingModal - No country code detected, using USD as default');
            setBookingDetails(prev => ({ ...prev, currency: 'USD' }));
          }
        } else {
          console.log('BookingModal - No locales detected, using USD as default');
          setBookingDetails(prev => ({ ...prev, currency: 'USD' }));
        }
      } catch (error) {
        console.error('BookingModal - Error detecting country:', error);
        // If country detection fails, use USD
        setBookingDetails(prev => ({ ...prev, currency: 'USD' }));
      }
    };
    detectUserCountry();
  }, []);

  const handleConfirm = () => {
    if (selectedAsset) {
      onConfirm({
        assetId: selectedAsset,
        date: selectedDate,
        description: bookingDetails.description,
        bookedBy: bookingDetails.bookedBy,
        numberOfPeople: bookingDetails.numberOfPeople ? parseInt(bookingDetails.numberOfPeople) : undefined,
        customPrice: bookingDetails.customPrice ? parseFloat(bookingDetails.customPrice) : undefined,
        currency: bookingDetails.currency,
      });
      setSelectedAsset(null);
      setBookingDetails({
        description: '',
        bookedBy: '',
        numberOfPeople: '',
        customPrice: '',
        currency: 'USD', // Reset to default
      });
    }
  };

  const isAssetBooked = (assetId: string) => {
    return bookings.some(booking => 
      booking.assetId === assetId && isSameDay(booking.date, selectedDate)
    );
  };

  const renderAssetItem = ({ item: asset }: { item: Asset }) => {
    const isBooked = isAssetBooked(asset.id);
    const isSelected = selectedAsset === asset.id;
    
    return (
      <TouchableOpacity
        style={[
          styles.assetCard,
          isSelected && styles.selectedAsset,
          isBooked && styles.bookedAsset,
        ]}
        onPress={() => !isBooked && setSelectedAsset(asset.id)}
        disabled={isBooked}
      >
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
          {asset.currency} {asset.pricePerDay} per day
        </Text>
        {!isBooked && (
          <View style={[
            styles.checkmark,
            isSelected && styles.selectedCheckmark
          ]} />
        )}
      </TouchableOpacity>
    );
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

          <FlatList
            data={assets}
            renderItem={renderAssetItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.assetListContent}
            showsVerticalScrollIndicator={false}
          />

          {selectedAsset && (
            <ScrollView style={styles.bookingDetailsContainer}>
              <Text style={styles.sectionTitle}>Booking Details</Text>
              
              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Info size={16} color="#666" />
                  <Text style={styles.labelText}>Description</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={bookingDetails.description}
                  onChangeText={(text) => setBookingDetails(prev => ({ ...prev, description: text }))}
                  placeholder="Enter booking description"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <User size={16} color="#666" />
                  <Text style={styles.labelText}>Booked By</Text>
                </View>
                <TextInput
                  style={styles.input}
                  value={bookingDetails.bookedBy}
                  onChangeText={(text) => setBookingDetails(prev => ({ ...prev, bookedBy: text }))}
                  placeholder="Enter name"
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.inputLabel}>
                  <Users size={16} color="#666" />
                  <Text style={styles.labelText}>Number of People</Text>
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
                  <Text style={styles.labelText}>Custom Price</Text>
                </View>
                <View style={styles.priceInputContainer}>
                  <TextInput
                    style={[styles.input, styles.priceInput]}
                    value={bookingDetails.customPrice}
                    onChangeText={(text) => setBookingDetails(prev => ({ ...prev, customPrice: text }))}
                    placeholder="Enter custom price"
                    keyboardType="numeric"
                  />
                  <TouchableOpacity
                    style={styles.currencyButton}
                    onPress={() => setCurrencySelectorVisible(true)}
                  >
                    <Text style={styles.currencyButtonText}>{bookingDetails.currency}</Text>
                    <ChevronDown size={16} color="#666" />
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
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

          <CurrencySelector
            visible={currencySelectorVisible}
            onClose={() => setCurrencySelectorVisible(false)}
            onSelect={(currency) => setBookingDetails(prev => ({ ...prev, currency }))}
            currentCurrency={bookingDetails.currency}
          />
        </View>
      </View>
    </Modal>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = (width - 48) / 2; // 48 = padding (16) * 2 + gap (16)

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    height: '80%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
    position: 'relative',
    zIndex: 1001,
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
  assetListContent: {
    padding: 20,
  },
  assetCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  selectedAsset: {
    backgroundColor: '#F0F8FF',
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  bookedAsset: {
    backgroundColor: '#f8f8f8',
  },
  assetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
    marginBottom: 4,
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
    fontSize: 14,
    fontWeight: '500',
  },
  assetPrice: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '600',
  },
  bookedText: {
    opacity: 0.6,
  },
  checkmark: {
    position: 'absolute',
    top: 15,
    right: 15,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ddd',
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
  bookingDetailsContainer: {
    padding: 20,
    backgroundColor: '#f8f8ff',
    marginHorizontal: 20,
    borderRadius: 12,
    maxHeight: 300,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  labelText: {
    marginLeft: 8,
    color: '#666',
    fontSize: 14,
  },
  input: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
  },
  currencyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  currencyButtonText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
});