import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  getDocs,
  arrayUnion,
  arrayRemove,
  getDoc,
} from 'firebase/firestore';
import { db } from './config';

export interface UserProfile {
  id: string;
  email: string;
  organizationIds: string[];
  isOwner: boolean;
  createdAt: Date;
  updatedAt: Date;
  preferences: {
    notifications: boolean;
    theme: 'light' | 'dark';
    currency: string;
  };
}

export interface Organization {
  id: string;
  name: string;
  ownerId: string;
  members: string[];
  currency: string;
  categories: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  description?: string;
  status: 'Available' | 'Unavailable';
  pricePerDay: number;
  agentFee: number;
  currency: string;
  bookingType: 'full-day' | 'time-slots';
  timeSlots?: TimeSlot[];
  maxBookingsPerDay?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface TimeSlot {
  start: string;
  end: string;
}

export interface Booking {
  id: string;
  assetId: string;
  date: Date;
  description?: string;
  bookedBy: string;
  clientName?: string;
  numberOfPeople?: number;
  customPrice?: number;
  customAgentFee?: number;
  currency: string;
  timeSlot?: TimeSlot;
  createdAt: Date;
  updatedAt: Date;
}

export interface Analytics {
  totalEarned: number;
  unpaidAmount: number;
  agentPayments: number;
  currency: string;
}

export interface ActivityLog {
  id: string;
  userEmail: string;
  action: string;
  resourceType: string;
  details: string;
  timestamp: {
    toDate: () => Date;
  };
}

export const createOrganization = async (name: string, ownerId: string) => {
  try {
    // Create the organization
    const orgRef = await addDoc(collection(db, 'organizations'), {
      name,
      ownerId,
      members: [ownerId],
      currency: 'USD',
      categories: ['Default'],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update user's organizations
    const userRef = doc(db, 'users', ownerId);
    await updateDoc(userRef, {
      organizationIds: arrayUnion(orgRef.id),
      updatedAt: serverTimestamp(),
    });

    return orgRef.id;
  } catch (error) {
    console.error('Error creating organization:', error);
    throw error;
  }
};

export const updateOrganization = async (orgId: string, updates: Partial<Organization>) => {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
};

export const addUserToOrganization = async (orgId: string, userId: string) => {
  try {
    // Add user to organization
    const orgRef = doc(db, 'organizations', orgId);
    await updateDoc(orgRef, {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Add organization to user's list
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      organizationIds: arrayUnion(orgId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error adding user to organization:', error);
    throw error;
  }
};

export const removeUserFromOrganization = async (orgId: string, userId: string) => {
  try {
    const orgRef = doc(db, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data();
    if (orgData.ownerId === userId) {
      throw new Error('Cannot remove organization owner');
    }

    // Remove user from organization
    await updateDoc(orgRef, {
      members: arrayRemove(userId),
      updatedAt: serverTimestamp(),
    });

    // Remove organization from user's list
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      organizationIds: arrayRemove(orgId),
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error removing user from organization:', error);
    throw error;
  }
};

export const subscribeToUserProfile = (userId: string, callback: (profile: UserProfile | null) => void) => {
  const unsubscribe = onSnapshot(
    doc(db, 'users', userId),
    (doc) => {
      if (doc.exists()) {
        callback({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        } as UserProfile);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error fetching user profile:', error);
      callback(null);
    }
  );

  return unsubscribe;
};

export const subscribeToOrganizations = (userId: string, callback: (orgs: Organization[]) => void) => {
  const orgsQuery = query(
    collection(db, 'organizations'),
    where('members', 'array-contains', userId)
  );

  const unsubscribe = onSnapshot(
    orgsQuery,
    (snapshot) => {
      const orgs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Organization));
      callback(orgs);
    },
    (error) => {
      console.error('Error fetching organizations:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

export const subscribeToAssets = (organizationId: string, callback: (assets: Asset[]) => void) => {
  const assetsRef = collection(db, 'organizations', organizationId, 'assets');

  const unsubscribe = onSnapshot(
    assetsRef,
    (snapshot) => {
      const assets = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
      } as Asset));
      callback(assets);
    },
    (error) => {
      console.error('Error fetching assets:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

export const createAsset = async (
  organizationId: string,
  asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>
) => {
  const assetsRef = collection(db, 'organizations', organizationId, 'assets');

  const finalAsset = {
    ...asset,
    maxBookingsPerDay:
      asset.bookingType === 'full-day'
        ? 1
        : asset.maxBookingsPerDay ?? 1,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const docRef = await addDoc(assetsRef, finalAsset);
  return docRef.id;
};

export const updateAsset = async (
  organizationId: string,
  assetId: string,
  asset: Partial<Asset>
) => {
  const assetRef = doc(db, 'organizations', organizationId, 'assets', assetId);

  const updatedAsset: Partial<Asset> = {
    ...asset,
    maxBookingsPerDay:
      asset.bookingType === 'full-day'
        ? 1
        : asset.maxBookingsPerDay ?? undefined,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(assetRef, updatedAsset);
};

export const deleteAsset = async (organizationId: string, assetId: string) => {
  const assetRef = doc(db, 'organizations', organizationId, 'assets', assetId);
  await deleteDoc(assetRef);
};

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

export const subscribeToAnalytics = (organizationId: string, callback: (analytics: Analytics | null) => void) => {
  const unsubscribe = onSnapshot(
    doc(db, 'organizations', organizationId, 'analytics', 'summary'),
    (doc) => {
      if (doc.exists()) {
        callback(doc.data() as Analytics);
      } else {
        callback(null);
      }
    },
    (error) => {
      console.error('Error fetching analytics:', error);
      callback(null);
    }
  );

  return unsubscribe;
};

export const subscribeToActivityLogs = (organizationId: string, callback: (logs: ActivityLog[]) => void) => {
  const logsRef = collection(db, 'organizations', organizationId, 'activity_logs');
  const logsQuery = query(logsRef, where('timestamp', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)));

  const unsubscribe = onSnapshot(
    logsQuery,
    (snapshot) => {
      const logs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as ActivityLog));
      callback(logs);
    },
    (error) => {
      console.error('Error fetching activity logs:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

export const addCategory = async (organizationId: string, category: string) => {
  const orgRef = doc(db, 'organizations', organizationId);
  await updateDoc(orgRef, {
    categories: arrayUnion(category),
    updatedAt: serverTimestamp(),
  });
};

export const removeCategory = async (organizationId: string, category: string) => {
  const orgRef = doc(db, 'organizations', organizationId);
  await updateDoc(orgRef, {
    categories: arrayRemove(category),
    updatedAt: serverTimestamp(),
  });
};