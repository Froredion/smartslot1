import { 
  doc, 
  onSnapshot, 
  updateDoc, 
  serverTimestamp, 
  arrayUnion, 
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  getDoc
} from 'firebase/firestore';
import { db } from '../config';
import { UserProfile } from './types';

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

export const checkUsernameAvailability = async (username: string): Promise<boolean> => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty;
  } catch (error) {
    console.error('Error checking username availability:', error);
    throw error;
  }
};

export const syncUserOrganizations = async (userId: string): Promise<void> => {
  try {
    console.log('🔄 Starting user organizations sync...', { userId });
    
    // Get user's profile
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      console.error('❌ User profile not found');
      return;
    }

    const userData = userDoc.data();
    const currentOrgIds = userData.organizationIds || [];
    console.log('📊 Current organization IDs:', currentOrgIds);

    // Query organizations where user is a member
    const orgsRef = collection(db, 'organizations');
    const q = query(orgsRef, where('members', 'array-contains', userId));
    const querySnapshot = await getDocs(q);
    
    // Get list of organizations user is actually a member of
    const actualOrgIds = querySnapshot.docs.map(doc => doc.id);
    console.log('📊 Actual organization IDs:', actualOrgIds);
    
    // Find organizations to remove (in profile but not in actual memberships)
    const orgsToRemove = currentOrgIds.filter((id: string) => !actualOrgIds.includes(id));
    
    if (orgsToRemove.length > 0) {
      console.log(`🗑️ Removing ${orgsToRemove.length} organizations from user profile:`, orgsToRemove);
      // Update user profile to remove organizations they're no longer a member of
      await updateDoc(userRef, {
        organizationIds: currentOrgIds.filter((id: string) => !orgsToRemove.includes(id)),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Successfully synced user organizations');
    } else {
      console.log('✅ User organizations already in sync');
    }
  } catch (error) {
    console.error('❌ Error syncing user organizations:', error);
    throw error;
  }
}; 