import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalendarStrip from 'react-native-calendar-strip';
import { format, addDays, isSameDay, isValid } from 'date-fns';
import { BookingModal } from '@/components/BookingModal';

// Temporary mock data
const MOCK_ASSETS = [
  { id: '1', name: 'Car A-123', type: 'Vehicle', pricePerDay: 50, currency: 'USD' },
  { id: '2', name: 'Room 201', type: 'Room', pricePerDay: 100, currency: 'USD' },
  { id: '3', name: 'Villa Paradise', type: 'Property', pricePerDay: 200, currency: 'USD' },
];

const MOCK_BOOKINGS = [
  { 
    id: '1', 
    assetId: '1', 
    date: new Date(2024, 0, 20),
    description: 'Business trip',
    bookedBy: 'John Doe',
    numberOfPeople: 2,
    customPrice: 60,
    currency: 'USD'
  },
  { 
    id: '2', 
    assetId: '2', 
    date: new Date(2024, 0, 22),
    description: 'Team meeting',
    bookedBy: 'Jane Smith',
    numberOfPeople: 5,
    customPrice: 120,
    currency: 'USD'
  },
];

const getAvailabilityColor = (percentage: number) => {
  if (percentage === 100) return '#FF3B30'; // Red for fully booked (0% available)
  if (percentage <= 33) return '#34C759'; // Green for high availability (66%+ available)
  if (percentage <= 66) return '#FFCC00'; // Yellow for medium availability (33-66% available)
  return '#FF9500'; // Orange for low availability (less than 33% available)
};

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);

  // Calculate availability for a specific date
  const getDateAvailability = (date: Date | null) => {
    if (!date || !isValid(date)) {
      return {
        bookedCount: 0,
        availableCount: MOCK_ASSETS.length,
        percentage: 0
      };
    }

    const bookedAssets = MOCK_BOOKINGS.filter(booking => 
      isSameDay(booking.date, date)
    ).length;
    return {
      bookedCount: bookedAssets,
      availableCount: MOCK_ASSETS.length - bookedAssets,
      percentage: (bookedAssets / MOCK_ASSETS.length) * 100
    };
  };

  // Generate marked dates for the calendar
  const markedDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    const startDate = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()); // Allow viewing 1 year back
    const endDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate()); // Allow viewing 1 year ahead
    
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
  }, []);

  const handleDateSelect = (date: Date) => {
    if (isValid(date)) {
      console.log('Date selected:', date);
      setSelectedDate(date);
      setModalVisible(true);
      console.log('Modal visibility set to true');
    }
  };

  const handleBookingConfirm = (bookingDetails: Omit<Booking, 'id'>) => {
    if (selectedDate) {
      const newBooking: Booking = {
        id: Date.now().toString(), // Simple ID generation
        ...bookingDetails,
      };
      MOCK_BOOKINGS.push(newBooking);
      console.log('Booking confirmed:', newBooking);
    }
    setModalVisible(false);
  };

  const availability = getDateAvailability(selectedDate);

  // Filter available assets for the selected date
  const availableAssets = MOCK_ASSETS.filter(asset => 
    !MOCK_BOOKINGS.some(booking => 
      booking.assetId === asset.id && selectedDate && isSameDay(booking.date, selectedDate)
    )
  );

  const renderAssetItem = ({ item: asset }) => {
    const isBooked = MOCK_BOOKINGS.some(booking => 
      booking.assetId === asset.id && selectedDate && isSameDay(booking.date, selectedDate)
    );
    
    return (
      <TouchableOpacity
        style={styles.assetCard}
        onPress={() => {
          setSelectedAsset(asset.id);
          setModalVisible(true);
        }}
        disabled={isBooked}
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {console.log('Current selectedDate:', selectedDate)}
      {console.log('Current modalVisible:', modalVisible)}
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
        minDate={addDays(new Date(), -365)} // Allow viewing 1 year back
        maxDate={addDays(new Date(), 365)} // Allow viewing 1 year ahead
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

      <FlatList
        data={MOCK_ASSETS}
        renderItem={renderAssetItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {selectedDate && (
        <BookingModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onConfirm={handleBookingConfirm}
          selectedDate={selectedDate}
          assets={[MOCK_ASSETS.find(a => a.id === selectedAsset)].filter(Boolean)}
          bookings={MOCK_BOOKINGS}
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
});