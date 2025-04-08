import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CalendarStrip from 'react-native-calendar-strip';
import { format, addDays, isSameDay, isValid } from 'date-fns';
import { BookingModal } from '@/components/BookingModal';

// Temporary mock data
const MOCK_ASSETS = [
  { id: '1', name: 'Car A-123', type: 'Vehicle', pricePerDay: 50 },
  { id: '2', name: 'Room 201', type: 'Room', pricePerDay: 100 },
  { id: '3', name: 'Villa Paradise', type: 'Property', pricePerDay: 200 },
];

const MOCK_BOOKINGS = [
  { id: '1', assetId: '1', date: new Date(2024, 0, 20) },  // January 20, 2024
  { id: '2', assetId: '2', date: new Date(2024, 0, 22) },  // January 22, 2024
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
    for (let i = 0; i < 90; i++) {
      const date = addDays(today, i);
      const availability = getDateAvailability(date);
      dates.push({
        date,
        dots: [{
          color: getAvailabilityColor(availability.percentage),
          selectedDotColor: '#007AFF'
        }],
      });
    }
    return dates;
  }, []);

  const handleDateSelect = (date: Date) => {
    if (isValid(date)) {
      setSelectedDate(date);
      setModalVisible(true);
    }
  };

  const handleBookingConfirm = (assetId: string) => {
    if (selectedDate) {
      console.log('Booking confirmed:', { assetId, date: selectedDate });
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
        minDate={new Date()}
        maxDate={addDays(new Date(), 90)}
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

      {selectedDate && (
        <BookingModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onConfirm={handleBookingConfirm}
          selectedDate={selectedDate}
          assets={MOCK_ASSETS}
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
});