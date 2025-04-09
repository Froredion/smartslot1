import { 
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from './config';

// User Profile Types
export interface UserProfile {
  id: string;
  email: string;
  displayName?: string;
  phoneNumber?: string;
  company?: string;
  role?: string;
  createdAt: any;
  updatedAt: any;
  preferences?: {
    notifications: boolean;
    theme: 'light' | 'dark';
    currency: string;
  };
  categories: string[];
}

// Time Slot Types
export interface TimeSlot {
  start: string; // 24-hour format "HH:mm"
  end: string; // 24-hour format "HH:mm"
}

// Asset Types
export interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: 'Available' | 'Unavailable';
  pricePerDay: number;
  currency: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  bookingType: 'full-day' | 'time-slots';
  timeSlots?: TimeSlot[];
  maxBookingsPerDay?: number;
}

export interface Booking {
  id: string;
  assetId: string;
  date: Date;
  timeSlot?: TimeSlot;
  description?: string;
  bookedBy: string;
  clientName?: string;
  numberOfPeople?: number;
  customPrice?: number;
  currency: string;
  createdAt: Timestamp;
  status: 'Pending' | 'Confirmed' | 'Cancelled';
}

const DEFAULT_CATEGORIES = [
  'Vehicle',
  'Room',
  'Property',
  'Equipment',
  'Electronics',
  'Furniture',
  'Tools',
  'Office',
  'Storage',
  'Outdoor'
];

// User Profile Operations
export const createUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  const batch = writeBatch(db);
  
  // Create user profile
  const userRef = doc(db, 'users', userId);
  const profileData = {
    ...data,
    id: userId,
    email: auth.currentUser.email,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    categories: DEFAULT_CATEGORIES,
    preferences: {
      notifications: true,
      theme: 'light',
      currency: 'USD',
      ...data.preferences
    }
  };
  
  batch.set(userRef, profileData);

  // Create bookings subcollection
  const bookingsRef = collection(userRef, 'bookings');
  const initialBookingRef = doc(bookingsRef);
  batch.set(initialBookingRef, {
    createdAt: serverTimestamp(),
    initialized: true
  });

  // Create assets subcollection
  const assetsRef = collection(userRef, 'assets');
  const initialAssetRef = doc(assetsRef);
  batch.set(initialAssetRef, {
    createdAt: serverTimestamp(),
    initialized: true
  });

  await batch.commit();
  return { id: userId, ...profileData };
};

export const getUserProfile = async (userId: string) => {
  try {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as UserProfile;
    }
    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

export const updateUserProfile = async (userId: string, data: Partial<UserProfile>) => {
  const userRef = doc(db, 'users', userId);
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };
  await updateDoc(userRef, updateData);
};

export const addCategory = async (userId: string, category: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    categories: arrayUnion(category),
    updatedAt: serverTimestamp()
  });
};

export const removeCategory = async (userId: string, category: string) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    categories: arrayRemove(category),
    updatedAt: serverTimestamp()
  });
};

export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
  return onSnapshot(doc(db, 'users', userId), (doc) => {
    if (doc.exists()) {
      callback({ id: doc.id, ...doc.data() } as UserProfile);
    } else {
      callback(null);
    }
  });
};

// Asset Operations
export const subscribeToAssets = (callback: (assets: Asset[]) => void) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const assetsRef = collection(db, 'users', auth.currentUser.uid, 'assets');
  
  return onSnapshot(assetsRef, (snapshot) => {
    const assets = snapshot.docs
      .filter(doc => !doc.data().initialized) // Filter out initialization document
      .map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Asset[];
    callback(assets);
  });
};

export const createAsset = async (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const assetsRef = collection(db, 'users', auth.currentUser.uid, 'assets');
  const docRef = doc(assetsRef);
  
  // Clean up the asset data by removing undefined values
  const cleanAsset = Object.entries(asset).reduce((acc, [key, value]) => {
    // Only include defined values, convert empty strings to null
    if (value !== undefined) {
      acc[key] = value === '' ? null : value;
    }
    return acc;
  }, {} as Record<string, any>);

  const assetData = {
    id: docRef.id,
    ...cleanAsset,
    // Ensure required fields have default values
    description: cleanAsset.description || null,
    timeSlots: cleanAsset.timeSlots || [],
    maxBookingsPerDay: cleanAsset.maxBookingsPerDay || null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  try {
    await setDoc(docRef, assetData);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating asset:', error);
    throw new Error('Failed to create asset. Please try again.');
  }
};

export const updateAsset = async (assetId: string, asset: Partial<Asset>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const assetRef = doc(db, 'users', auth.currentUser.uid, 'assets', assetId);
  
  // Clean up the update data by removing undefined values
  const cleanUpdate = Object.entries(asset).reduce((acc, [key, value]) => {
    // Only include defined values, convert empty strings to null
    if (value !== undefined) {
      acc[key] = value === '' ? null : value;
    }
    return acc;
  }, {} as Record<string, any>);

  const updateData = {
    ...cleanUpdate,
    updatedAt: serverTimestamp()
  };

  try {
    await updateDoc(assetRef, updateData);
  } catch (error: any) {
    console.error('Error updating asset:', error);
    throw new Error('Failed to update asset. Please try again.');
  }
};

export const deleteAsset = async (assetId: string) => {
  console.log('Firestore - Starting asset deletion:', assetId);
  
  if (!auth.currentUser) {
    console.error('Firestore - Cannot delete: No authenticated user');
    throw new Error('You must be logged in to delete assets');
  }

  const assetRef = doc(db, 'users', auth.currentUser.uid, 'assets', assetId);
  
  try {
    // First check if the asset exists and belongs to the user
    const assetDoc = await getDoc(assetRef);
    if (!assetDoc.exists()) {
      console.error('Firestore - Asset not found:', assetId);
      throw new Error('Asset not found');
    }

    console.log('Firestore - Deleting asset document:', assetId);
    await deleteDoc(assetRef);
    console.log('Firestore - Asset deleted successfully:', assetId);
  } catch (error: any) {
    console.error('Firestore - Error deleting asset:', error);
    if (error.code === 'permission-denied') {
      throw new Error('You do not have permission to delete this asset');
    }
    throw new Error('Failed to delete asset. Please try again.');
  }
};

// Booking Operations
export const subscribeToBookings = (callback: (bookings: Booking[]) => void) => {
  if (!auth.currentUser) {
    callback([]);
    return () => {};
  }

  const bookingsRef = collection(db, 'users', auth.currentUser.uid, 'bookings');
  
  return onSnapshot(bookingsRef, (snapshot) => {
    const bookings = snapshot.docs
      .filter(doc => !doc.data().initialized) // Filter out initialization document
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date instanceof Timestamp ? doc.data().date.toDate() : doc.data().date,
      })) as Booking[];
    callback(bookings);
  });
};

export const createBooking = async (booking: Omit<Booking, 'id' | 'createdAt' | 'status' | 'bookedBy'>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const bookingsRef = collection(db, 'users', auth.currentUser.uid, 'bookings');
  const docRef = doc(bookingsRef);
  
  // Clean up the booking data by removing undefined values
  const cleanBooking = Object.entries(booking).reduce((acc, [key, value]) => {
    // Only include defined values, convert empty strings to null
    if (value !== undefined) {
      acc[key] = value === '' ? null : value;
    }
    return acc;
  }, {} as Record<string, any>);

  const bookingData = {
    id: docRef.id,
    ...cleanBooking,
    date: Timestamp.fromDate(booking.date),
    status: 'Confirmed' as const,
    createdAt: serverTimestamp(),
    bookedBy: auth.currentUser.email,
  };

  try {
    await setDoc(docRef, bookingData);
    return docRef.id;
  } catch (error: any) {
    console.error('Error creating booking:', error);
    throw new Error('Failed to create booking. Please try again.');
  }
};

export const updateBooking = async (bookingId: string, booking: Partial<Booking>) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const bookingRef = doc(db, 'users', auth.currentUser.uid, 'bookings', bookingId);
  
  // Clean up the update data by removing undefined values
  const cleanUpdate = Object.entries(booking).reduce((acc, [key, value]) => {
    // Only include defined values, convert empty strings to null
    if (value !== undefined) {
      acc[key] = value === '' ? null : value;
    }
    return acc;
  }, {} as Record<string, any>);

  const updateData = {
    ...cleanUpdate,
    ...(booking.date && { date: Timestamp.fromDate(booking.date) }),
    updatedAt: serverTimestamp()
  };

  try {
    await updateDoc(bookingRef, updateData);
  } catch (error: any) {
    console.error('Error updating booking:', error);
    throw new Error('Failed to update booking. Please try again.');
  }
};

export const deleteBooking = async (bookingId: string) => {
  if (!auth.currentUser) throw new Error('User not authenticated');

  const bookingRef = doc(db, 'users', auth.currentUser.uid, 'bookings', bookingId);
  
  try {
    await deleteDoc(bookingRef);
  } catch (error: any) {
    console.error('Error deleting booking:', error);
    throw new Error('Failed to delete booking. Please try again.');
  }
};

// Time Slot Validation
export const isTimeSlotAvailable = (
  asset: Asset,
  date: Date,
  timeSlot: TimeSlot,
  existingBookings: Booking[]
): boolean => {
  if (asset.bookingType === 'full-day') {
    return !existingBookings.some(booking => 
      isSameDay(booking.date, date) && booking.assetId === asset.id
    );
  }

  const dateBookings = existingBookings.filter(booking => 
    booking.assetId === asset.id && isSameDay(booking.date, date)
  );

  // If maxBookingsPerDay is set, check if we've reached the limit
  if (asset.maxBookingsPerDay && dateBookings.length >= asset.maxBookingsPerDay) {
    return false;
  }

  // Check if the requested time slot overlaps with any existing bookings
  return !dateBookings.some(booking => {
    if (!booking.timeSlot) return false;
    
    const requestedStart = parseTime(timeSlot.start);
    const requestedEnd = parseTime(timeSlot.end);
    const existingStart = parseTime(booking.timeSlot.start);
    const existingEnd = parseTime(booking.timeSlot.end);

    return (
      (requestedStart >= existingStart && requestedStart < existingEnd) ||
      (requestedEnd > existingStart && requestedEnd <= existingEnd) ||
      (requestedStart <= existingStart && requestedEnd >= existingEnd)
    );
  });
};

// Helper function to parse time string to minutes since midnight
const parseTime = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};