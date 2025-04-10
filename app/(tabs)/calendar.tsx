import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
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
import { format, addDays, isSameDay, isValid, addMonths, subMonths, startOfMonth } from 'date-fns';
import { BookingModal } from '@/components/BookingModal';
import { 
  subscribeToBookings, 
  createBooking, 
  updateBooking, 
  deleteBooking, 
  subscribeToAssets,
  subscribeToOrganizations,
  updateAsset,
  type Asset, 
  type Booking 
} from '@/lib/firebase/firestore';
import { auth } from '@/lib/firebase/config';
import { AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react-native';

export default function Calendar() {
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState<Date>(startOfMonth(new Date()));
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<any | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(null);
  const [isMonthNavigation, setIsMonthNavigation] = useState(false);
  const [lastAction, setLastAction] = useState<'select' | 'navigate'>('select');
  const [calendarKey, setCalendarKey] = useState(0);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const navigationTimeout = useRef<NodeJS.Timeout>();
  const animationTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    console.log('DEBUG: selectedDate changed to:', selectedDate);
    console.log('DEBUG: selectedDate formatted:', format(selectedDate, 'yyyy-MM-dd'));
    console.log('DEBUG: selectedDate day of month:', selectedDate.getDate());
  }, [selectedDate]);

  useEffect(() => {
    console.log('DEBUG: currentMonth changed to:', currentMonth);
    console.log('DEBUG: currentMonth formatted:', format(currentMonth, 'yyyy-MM'));
    console.log('DEBUG: currentMonth day of month:', currentMonth.getDate());
  }, [currentMonth]);

  useEffect(() => {
    if (!auth.currentUser) return;

    let unsubscribeOrgs: (() => void) | undefined;

    const setupSubscriptions = async () => {
      try {
        setError(null);
        
        unsubscribeOrgs = subscribeToOrganizations(auth.currentUser.uid, (orgs) => {
          if (orgs.length > 0 && !selectedOrg) {
            setSelectedOrg({
              id: orgs[0].id,
              name: orgs[0].name
            });
          }
        });

      } catch (err: any) {
        setError(err.message || 'Failed to load data');
        setLoading(false);
      }
    };

    setupSubscriptions();

    return () => {
      unsubscribeOrgs?.();
    };
  }, []);

  useEffect(() => {
    if (!selectedOrg) return;

    let unsubscribeAssets: (() => void) | undefined;
    let unsubscribeBookings: (() => void) | undefined;

    const setupOrgSubscriptions = () => {
      unsubscribeAssets = subscribeToAssets(selectedOrg.id, (updatedAssets) => {
        setAssets(updatedAssets);
      });

      unsubscribeBookings = subscribeToBookings(selectedOrg.id, (updatedBookings) => {
        setBookings(updatedBookings);
        setLoading(false);
        setRefreshing(false);
      });
    };

    setupOrgSubscriptions();

    return () => {
      unsubscribeAssets?.();
      unsubscribeBookings?.();
    };
  }, [selectedOrg]);

  const getDateAvailability = useCallback((date: Date | null) => {
    if (!date || !isValid(date) || assets.length === 0) {
      return {
        bookedCount: 0,
        availableCount: assets.length,
        percentage: 0
      };
    }

    let availableCount = 0;
    assets.forEach(asset => {
      const assetBookings = bookings.filter(booking => 
        isSameDay(booking.date, date) && booking.assetId === asset.id
      );

      if (asset.bookingType === 'full-day') {
        if (assetBookings.length === 0) {
          availableCount++;
        }
      } else if (asset.bookingType === 'time-slots' && asset.timeSlots) {
        const bookedSlots = new Set(assetBookings.map(b => 
          b.timeSlot ? `${b.timeSlot.start}-${b.timeSlot.end}` : null
        ));
        
        const hasAvailableSlot = asset.timeSlots.some(slot => 
          !bookedSlots.has(`${slot.start}-${slot.end}`)
        );
        
        if (hasAvailableSlot) {
          availableCount++;
        }
      }
    });

    const bookedCount = assets.length - availableCount;
    return {
      bookedCount,
      availableCount,
      percentage: assets.length > 0 ? (bookedCount / assets.length) * 100 : 0
    };
  }, [bookings, assets]);

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

  const debounce = (func: Function, wait: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => func(...args), wait);
    };
  };

  const getStartingDate = (date: Date) => {
    // Calculate a date 3 days before the selected date to center it in the week view
    return addDays(date, -3);
  };

  const handleDateSelect = (date: any) => {
    console.log('----------------------------------------');
    console.log('DEBUG: Date selection started');
    console.log('DEBUG: Date selected (raw):', date);
    console.log('DEBUG: Current states before selection:', {
      currentMonth: format(currentMonth, 'yyyy-MM-dd'),
      selectedDate: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null,
      isNavigating,
      isAnimating,
      isMonthNavigation,
      lastAction
    });
    
    // Reset the month navigation flag since this is a direct date selection
    setIsNavigating(false);
    setIsAnimating(false);
    setIsMonthNavigation(false);
    setLastAction('select');
    
    let newDate: Date;
    if (date && date._isAMomentObject) {
      newDate = date.toDate();
      console.log('DEBUG: Converted Moment to Date:', format(newDate, 'yyyy-MM-dd'));
    } else if (isValid(date)) {
      newDate = new Date(date);
      console.log('DEBUG: Setting selected date to:', format(newDate, 'yyyy-MM-dd'));
    } else {
      console.log('DEBUG: Invalid date selected');
      return;
    }
    
    // Update selected date first
    setSelectedDate(newDate);
    
    // Update current month to center around the selected date
    const selectedMonth = startOfMonth(newDate);
    setCurrentMonth(selectedMonth);
    
    // Force calendar to re-render centered on the new date
    setCalendarKey(prevKey => prevKey + 1);
    
    setSelectedAsset(null);
    setSelectedBooking(null);
    
    console.log('DEBUG: Date selection complete');
    console.log('----------------------------------------');
  };

  const handleMonthNavigation = (direction: 'prev' | 'next') => {
    // Skip if currently navigating or animating
    if (isNavigating || isAnimating) {
      console.log('DEBUG: Navigation in progress, skipping');
      return;
    }

    console.log('----------------------------------------');
    console.log(`DEBUG: Starting month navigation (${direction})`);
    console.log(`DEBUG: Current month before navigation:`, format(currentMonth, 'yyyy-MM-dd'));
    console.log(`DEBUG: Current selected date before navigation:`, format(selectedDate, 'yyyy-MM-dd'));
    
    setIsNavigating(true);
    setIsAnimating(true);
    setIsMonthNavigation(true);
    setLastAction('navigate');
    
    // Use a callback to ensure we have the latest state
    setCurrentMonth(prevMonth => {
      const newMonth = direction === 'prev' 
        ? subMonths(prevMonth, 1) 
        : addMonths(prevMonth, 1);

      // Check if the new month is within our allowed range
      const minAllowedDate = addMonths(startOfMonth(new Date()), -12);
      const maxAllowedDate = addMonths(startOfMonth(new Date()), 24);

      console.log('DEBUG: Date range validation:', {
        minAllowedDate: format(minAllowedDate, 'yyyy-MM-dd'),
        maxAllowedDate: format(maxAllowedDate, 'yyyy-MM-dd'),
        newMonth: format(newMonth, 'yyyy-MM-dd'),
        isBeforeMin: newMonth < minAllowedDate,
        isAfterMax: newMonth > maxAllowedDate
      });

      if (newMonth < minAllowedDate || newMonth > maxAllowedDate) {
        console.log('DEBUG: Attempted to navigate outside allowed date range');
        console.log('----------------------------------------');
        // Reset navigation states if we hit the limits
        setIsNavigating(false);
        setIsAnimating(false);
        setIsMonthNavigation(false);
        return prevMonth; // Keep the current month
      }

      console.log(`DEBUG: New month will be:`, format(newMonth, 'yyyy-MM-dd'));
      
      // Update selected date and trigger re-render after the month is updated
      setTimeout(() => {
        setSelectedDate(newMonth);
        setCalendarKey(prevKey => {
          console.log('DEBUG: Incrementing calendar key from:', prevKey);
          return prevKey + 1;
        });
        setIsAnimating(false);
        
        setTimeout(() => {
          setIsNavigating(false);
          console.log('DEBUG: Navigation complete');
          console.log('----------------------------------------');
        }, 100);
      }, 50);

      return newMonth;
    });
  };

  // Create debounced version of handleMonthNavigation
  const navigateMonth = useCallback(
    debounce(handleMonthNavigation, 200),
    []
  );

  const navigateWeek = (direction: 'prev' | 'next') => {
    console.log(`DEBUG: Navigating week ${direction} from:`, format(selectedDate, 'yyyy-MM-dd'));
    
    const newDate = direction === 'prev'
      ? addDays(selectedDate, -7)
      : addDays(selectedDate, 7);
    
    console.log(`DEBUG: New date will be:`, format(newDate, 'yyyy-MM-dd'));
    
    // Update the selected date
    setSelectedDate(newDate);
    
    // Check if we need to update the current month
    const newMonth = startOfMonth(newDate);
    if (!isSameDay(startOfMonth(currentMonth), newMonth)) {
      console.log('DEBUG: Week navigation crossed month boundary, updating current month');
      setCurrentMonth(newMonth);
      setCalendarKey(prevKey => prevKey + 1);
    }
  };

  // Add useEffect to ensure calendar is centered on selected date when component mounts
  useEffect(() => {
    const initialDate = selectedDate || new Date();
    setCurrentMonth(startOfMonth(initialDate));
    setCalendarKey(prevKey => prevKey + 1);
  }, []);

  const handleAssetPress = (asset: Asset, booking?: Booking) => {
    setSelectedAsset(asset.id);
    setSelectedBooking(booking || null);
    setModalVisible(true);
  };

  const handleBookingConfirm = async (bookingDetails: any) => {
    if (!selectedDate || !auth.currentUser || !selectedOrg) return;

    try {
      setError(null);
      const selectedAssetData = assets.find(a => a.id === bookingDetails.assetId);
      
      if (!selectedAssetData) {
        throw new Error('Selected asset not found');
      }

      const existingBookings = bookings.filter(b => 
        isSameDay(b.date, selectedDate) && 
        b.assetId === bookingDetails.assetId
      );

      if (selectedAssetData.bookingType === 'full-day' && existingBookings.length > 0 && !selectedBooking) {
        throw new Error('This asset is already booked for the selected date');
      }

      if (selectedAssetData.bookingType === 'time-slots' && bookingDetails.timeSlot) {
        const timeSlotConflict = existingBookings.some(b => 
          b.timeSlot?.start === bookingDetails.timeSlot.start &&
          b.timeSlot?.end === bookingDetails.timeSlot.end &&
          (!selectedBooking || b.id !== selectedBooking.id)
        );

        if (timeSlotConflict) {
          throw new Error('This time slot is already booked');
        }
      }

      if (selectedBooking) {
        await updateBooking(selectedOrg.id, selectedBooking.id, {
          ...bookingDetails,
          date: selectedDate,
          status: 'confirmed',
        });
      } else {
        await createBooking(selectedOrg.id, {
          ...bookingDetails,
          date: selectedDate,
          bookedBy: auth.currentUser.email || 'Anonymous',
          status: 'confirmed',
        });

        if (selectedAssetData.bookingType === 'full-day') {
          await updateAsset(selectedOrg.id, bookingDetails.assetId, {
            status: 'Unavailable',
          });
        }
      }

      handleCloseModal();
    } catch (err: any) {
      console.error('Error confirming booking:', err);
      setError(err.message || 'Failed to save booking');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (!selectedOrg) return;

    try {
      setError(null);
      await deleteBooking(selectedOrg.id, bookingId);
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

  const renderAssetItem = ({ item: asset }: { item: Asset }) => {
    const assetBookings = bookings.filter(b => 
      b.assetId === asset.id && selectedDate && isSameDay(b.date, selectedDate)
    );

    const isFullyBooked = asset.bookingType === 'full-day' 
      ? assetBookings.length > 0
      : asset.timeSlots && assetBookings.length >= asset.timeSlots.length;

    return (
      <TouchableOpacity
        style={styles.assetCard}
        onPress={() => {
          if (isFullyBooked && asset.bookingType === 'full-day') {
            handleAssetPress(asset, assetBookings[0]);
          } else {
            handleAssetPress(asset);
          }
        }}
      >
        <View style={styles.assetHeader}>
          <Text style={styles.assetName}>{asset.name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: isFullyBooked ? '#FFE5E5' : '#E5FFE5' }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: isFullyBooked ? '#FF3B30' : '#34C759' }
            ]} />
            <Text style={[
              styles.assetStatus,
              { color: isFullyBooked ? '#FF3B30' : '#34C759' }
            ]}>
              {isFullyBooked ? 'Booked' : 'Available'}
            </Text>
          </View>
        </View>

        <Text style={styles.assetType}>{asset.type}</Text>
        <Text style={styles.assetPrice}>{asset.currency} {asset.pricePerDay} per day</Text>

        {asset.bookingType === 'time-slots' && assetBookings.length > 0 && (
          <View style={styles.bookingsList}>
            <Text style={styles.bookingsHeader}>
              {assetBookings.length} Booking{assetBookings.length !== 1 ? 's' : ''}:
            </Text>
            {assetBookings.map((booking, index) => (
              <TouchableOpacity
                key={booking.id}
                style={styles.bookingItem}
                onPress={() => handleAssetPress(asset, booking)}
              >
                <Text style={styles.bookingTime}>
                  {booking.timeSlot?.start} - {booking.timeSlot?.end}
                </Text>
                <Text style={styles.bookedBy}>by {booking.bookedBy}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {asset.bookingType === 'full-day' && isFullyBooked && (
          <View style={styles.bookingDetails}>
            <Text style={styles.bookingText}>
              Booked by: {assetBookings[0].bookedBy}
            </Text>
            {assetBookings[0].description && (
              <Text style={styles.bookingText}>
                {assetBookings[0].description}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeout.current) {
        clearTimeout(navigationTimeout.current);
      }
      if (animationTimeout.current) {
        clearTimeout(animationTimeout.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  if (!selectedOrg) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>No organization selected</Text>
      </View>
    );
  }

  const selectedDateAvailability = getDateAvailability(selectedDate);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Book an Asset</Text>
      </View>

      <View style={styles.monthSelector}>
        <TouchableOpacity 
          style={[styles.monthButton, (isNavigating || isAnimating) && styles.monthButtonDisabled]} 
          disabled={isNavigating || isAnimating}
          onPress={() => navigateMonth('prev')}
        >
          <View style={{ opacity: isNavigating || isAnimating ? 0.5 : 1 }}>
            <ChevronLeft size={24} />
          </View>
        </TouchableOpacity>
        <Text style={styles.monthText}>
          {format(currentMonth, 'MMMM yyyy')}
        </Text>
        <TouchableOpacity 
          style={[styles.monthButton, (isNavigating || isAnimating) && styles.monthButtonDisabled]}
          disabled={isNavigating || isAnimating}
          onPress={() => navigateMonth('next')}
        >
          <View style={{ opacity: isNavigating || isAnimating ? 0.5 : 1 }}>
            <ChevronRight size={24} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.weekSelector}>
        <TouchableOpacity 
          style={styles.weekButton} 
          onPress={() => navigateWeek('prev')}
        >
          <ChevronLeft size={20} />
        </TouchableOpacity>
        <Text style={styles.weekText}>
          {format(selectedDate, 'MMM d')} - {format(addDays(selectedDate, 6), 'MMM d')}
        </Text>
        <TouchableOpacity 
          style={styles.weekButton} 
          onPress={() => navigateWeek('next')}
        >
          <ChevronRight size={20} />
        </TouchableOpacity>
      </View>

      <CalendarStrip
        key={calendarKey}
        style={styles.calendar}
        calendarHeaderStyle={styles.calendarHeader}
        dateNumberStyle={styles.dateNumber}
        dateNameStyle={styles.dateName}
        highlightDateNumberStyle={styles.highlightDateNumber}
        highlightDateNameStyle={styles.highlightDateName}
        calendarColor={'#ffffff'}
        calendarHeaderFormat={'MMMM yyyy'}
        onDateSelected={handleDateSelect}
        selectedDate={selectedDate}
        startingDate={selectedDate ? getStartingDate(selectedDate) : currentMonth}
        minDate={addMonths(startOfMonth(new Date()), -12)}
        maxDate={addMonths(startOfMonth(new Date()), 24)}
        scrollable={false}
        showMonth={false}
        upperCaseDays={false}
        markedDates={markedDates}
        useIsoWeekday={false}
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
            { backgroundColor: getAvailabilityColor(selectedDateAvailability.percentage) }
          ]} />
          <Text style={styles.availabilityText}>
            {selectedDateAvailability.availableCount} of {assets.length} available
          </Text>
        </View>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={assets}
        renderItem={renderAssetItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshing={refreshing}
        onRefresh={() => {
          setRefreshing(true);
        }}
      />

      {selectedDate && (
        <BookingModal
          visible={modalVisible}
          onClose={() => {
            setModalVisible(false);
            setSelectedAsset(null);
            setSelectedBooking(null);
            setError(null);
          }}
          onConfirm={handleBookingConfirm}
          onDelete={handleDeleteBooking}
          selectedDate={selectedDate}
          assets={selectedAsset 
            ? [assets.find(a => a.id === selectedAsset)].filter((a): a is Asset => a !== undefined)
            : assets}
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  monthButton: {
    padding: 8,
  },
  monthButtonDisabled: {
    opacity: 0.5,
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    marginHorizontal: 16,
  },
  weekSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  weekButton: {
    padding: 8,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '500',
    marginHorizontal: 16,
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
  bookingsList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  bookingsHeader: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  bookingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bookingTime: {
    fontSize: 14,
    color: '#333',
  },
  bookedBy: {
    fontSize: 12,
    color: '#666',
  },
});

function getAvailabilityColor(percentage: number) {
  if (percentage === 100) return '#FF3B30';
  if (percentage <= 33) return '#34C759';
  if (percentage <= 66) return '#FFCC00';
  return '#FF9500';
}