import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalendarStrip from 'react-native-calendar-strip';
import { format, addDays, isSameDay, isValid } from 'date-fns';
import { BookingModal } from '@/components/BookingModal';
import { subscribeToBookings, createBooking, updateBooking, deleteBooking } from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { AlertCircle } from 'lucide-react-native';

// Temporary mock data for assets until we implement asset management
const MOCK_ASSETS = [
  { id: '1', name: 'Car A-123', type: 'Vehicle', pricePerDay: 50, currency: 'USD' },
  { id: '2', name: 'Room 201', type: 'Room', pricePerDay: 100, currency: 'USD' },
  { id: '3', name: 'Villa Paradise', type: 'Property', pricePerDay: 200, currency: 'USD' },
];

const getAvailabilityColor = (percentage: number) => {
  if (percentage === 100) return '#FF3B30';
  if (percentage <= 33) return '#34C759';
  if (percentage <= 66) return '#FFCC00';
  return '#FF9500';
};

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupBookingsSubscription = async () => {
      try {
        setError(null);
        unsubscribe = subscribeToBookings((updatedBookings) => {
          setBookings(updatedBookings);
          setLoading(false);
          setRefreshing(false);
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load bookings');
        setLoading(false);
        setRefreshing(false);
      }
    };

    setupBookingsSubscription();
    return () => unsubscribe?.();
  }, []);

  const getDateAvailability = useCallback((date: Date | null) => {
    if (!date || !isValid(date)) {
      return {
        bookedCount: 0,
        availableCount: MOCK_ASSETS.length,
        percentage: 0
      };
    }

    const bookedAssets = bookings.filter(booking => 
      isSameDay(booking.date, date)
    ).length;
    return {
      bookedCount: bookedAssets,
      availableCount: MOCK_ASSETS.length - bookedAssets,
      percentage: (bookedAssets / MOCK_ASSETS.length) * 100
    };
  }, [bookings]);

  const markedDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
    const endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
    
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const availability = getDateAvailability(currentDate);
      dates.push({
        date: new Date(currentDate),
        dots: [{
          color: getAvailabilityColor(availability.percentage),
          selectedDotColor: '#007AFF'
        }],
      });
      currentDate = addDays(currentDate, 1);
    }
    return dates;
  }, [getDateAvailability]);

  const handleDateSelect = (date: Date) => {
    if (isValid(date)) {
      setSelectedDate(date);
      setSelectedAsset(null);
      setSelectedBooking(null);
      setModalVisible(true);
    }
  };

  const handleBookingConfirm = async (bookingDetails: any) => {
    if (!selectedDate || !auth.currentUser) return;

    try {
      setError(null);
      if (selectedBooking) {
        await updateBooking(selectedBooking.id, {
          ...bookingDetails,
          date: selectedDate,
        });
      } else {
        await createBooking({
          ...bookingDetails,
          date: selectedDate,
          bookedBy: auth.currentUser.email || 'Anonymous',
        });
      }
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to save booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      setError(null);
      await deleteBooking(bookingId);
      handleCloseModal();
    } catch (err: any) {
      setError(err.message || 'Failed to delete booking');
    }
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setSelectedAsset(null);
    setSelectedBooking(null);
    setError(null);
  };

  const handleEditBooking = (booking: any) => {
    setSelectedDate(booking.date);
    setSelectedBooking(booking);
    setSelectedAsset(booking.assetId);
    setModalVisible(true);
  };

  const availability = getDateAvailability(selectedDate);

  const renderAssetItem = ({ item: asset }) => {
    const booking = bookings.find(b => 
      b.assetId === asset.id && selectedDate && isSameDay(b.date, selectedDate)
    );
    const isBooked = !!booking;
    
    return (
      <TouchableOpacity
        style={styles.assetCard}
        onPress={() => {
          if (isBooked) {
            handleEditBooking(booking);
          } else {
            setSelectedAsset(asset.id);
            setModalVisible(true);
          }
        }}
      >
        <View style={styles.assetHeader}>
          <Text style={styles.assetName}>{asset.name}</Text>
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
        <Text style={styles.assetType}>{asset.type}</Text>
        <Text style={styles.assetPrice}>${asset.pricePerDay} per day</Text>
        {isBooked && (
          <View style={styles.bookingDetails}>
            <Text style={styles.bookingText}>Booked by: {booking.bookedBy}</Text>
            {booking.description && (
              <Text style={styles.bookingText}>{booking.description}</Text>
            )}
            {booking.numberOfPeople && (
              <Text style={styles.bookingText}>People: {booking.numberOfPeople}</Text>
            )}
            {booking.customPrice && (
              <Text style={styles.bookingText}>
                Custom Price: {booking.currency} {booking.customPrice}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Book an Asset</Text>
      </View>

      <CalendarStrip
        style={styles.calendar}
        calendarHeaderStyle={styles.calendarHeader}
        dateNumberStyle={styles.dateNumber}
        dateNameStyle={styles.dateName}
        highlightDateNumberStyle={styles.highlightDateNumber}
        highlightDateNameStyle={styles.highlightDateName}
        calendarColor={'#ffffff'}
        calendarHeaderFormat={'MMMM yyyy'}
        onDateSelected={handleDateSelect}
        minDate={addDays(new Date(), -365)}
        maxDate={addDays(new Date(), 365)}
        scrollable
        upperCaseDays={false}
        markedDates={markedDates}
        selectedDate={selectedDate}
      />

      <View style={styles.selectedDateContainer}>
        <Text style={styles.selectedDateText}>
          {selectedDate && isValid(selectedDate) 
            ? format(selectedDate, 'EEEE, MMMM d, yyyy')
            : 'Select a date'}
        </Text>
        <View style={styles.availabilityIndicator}>
          <View style={[
            styles.availabilityDot,
            { backgroundColor: getAvailabilityColor(availability.percentage) }
          ]} />
          <Text style={styles.availabilityText}>
            {availability.availableCount} of {MOCK_ASSETS.length} available
          </Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color="#FF3B30" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={MOCK_ASSETS}
        renderItem={renderAssetItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
          // The subscription will automatically update the data
        }}
      />

      {selectedDate && (
        <BookingModal
          visible={modalVisible}
          onClose={handleCloseModal}
          onConfirm={handleBookingConfirm}
          onDelete={handleDeleteBooking}
          selectedDate={selectedDate}
          assets={selectedAsset 
            ? [MOCK_ASSETS.find(a => a.id === selectedAsset)].filter(Boolean)
            : MOCK_ASSETS}
          bookings={bookings}
          initialAssetId={selectedAsset}
          editBooking={selectedBooking}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 20,
    backgroundColor: '#ffffff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
  },
  calendar: {
    height: 120,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  calendarHeader: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  dateNumber: {
    color: '#1a1a1a',
    fontSize: 16,
  },
  dateName: {
    color: '#666',
    fontSize: 12,
  },
  highlightDateNumber: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
  highlightDateName: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  selectedDateContainer: {
    padding: 20,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedDateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  availabilityIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  availabilityDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  availabilityText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFE5E5',
    padding: 12,
    marginHorizontal: 20,
    marginTop: 12,
    borderRadius: 8,
    gap: 8,
  },
  errorText: {
    flex: 1,
    color: '#FF3B30',
    fontSize: 14,
  },
  listContainer: {
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
  bookingDetails: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bookingText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
});