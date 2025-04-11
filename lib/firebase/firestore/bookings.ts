import { 
  collection, 
  doc, 
  onSnapshot, 
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { Booking } from './types';

export const subscribeToBookings = (organizationId: string, callback: (bookings: Booking[]) => void) => {
  const bookingsRef = collection(db, 'organizations', organizationId, 'bookings');

  const unsubscribe = onSnapshot(
    bookingsRef,
    (snapshot) => {
      const bookings = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date?.toDate() || new Date(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Booking));
      callback(bookings);
    },
    (error) => {
      console.error('Error fetching bookings:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

export const createBooking = async (organizationId: string, booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
  const bookingsRef = collection(db, 'organizations', organizationId, 'bookings');
  const docRef = await addDoc(bookingsRef, {
    ...booking,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

export const updateBooking = async (organizationId: string, bookingId: string, booking: Partial<Booking>) => {
  const bookingRef = doc(db, 'organizations', organizationId, 'bookings', bookingId);
  await updateDoc(bookingRef, {
    ...booking,
    updatedAt: serverTimestamp(),
  });
};

export const deleteBooking = async (organizationId: string, bookingId: string) => {
  const bookingRef = doc(db, 'organizations', organizationId, 'bookings', bookingId);
  await deleteDoc(bookingRef);
}; 