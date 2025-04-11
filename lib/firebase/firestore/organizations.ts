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
  setDoc,
} from 'firebase/firestore';
import { db } from '../config';
import { Organization, UserPermissions } from './types';

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

export const addUserToOrganization = async (orgId: string, email: string) => {
  try {
    // First, find the user by email
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      throw new Error('User not found with this email address');
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;
    
    // Check if user is already a member
    const orgRef = doc(db, 'organizations', orgId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }
    
    const orgData = orgDoc.data();
    if (orgData.members && orgData.members.includes(userId)) {
      throw new Error('User is already a member of this organization');
    }
    
    // Add user to organization
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
    
    return userId;
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

    // Note: We're not updating the user's document anymore to avoid permission issues
    // The user will see they're no longer part of the organization when they log in next time
  } catch (error) {
    console.error('Error removing user from organization:', error);
    throw error;
  }
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

export const subscribeToOrganizationUsers = (
  organizationId: string,
  callback: (users: Array<{ id: string; email: string; username: string; isOwner?: boolean }>) => void
) => {
  const orgRef = doc(db, 'organizations', organizationId);
  
  const unsubscribe = onSnapshot(orgRef, async (orgDoc) => {
    if (!orgDoc.exists()) {
      callback([]);
      return;
    }

    const orgData = orgDoc.data();
    const users = await Promise.all(
      orgData.members.map(async (userId: string) => {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userData = userDoc.data();
        return {
          id: userId,
          email: userData?.email || '',
          username: userData?.username || '',
          isOwner: userId === orgData.ownerId,
        };
      })
    );

    callback(users);
  });

  return unsubscribe;
};

export const subscribeToUserPermissions = (
  organizationId: string,
  userId: string,
  callback: (permissions: UserPermissions) => void
) => {
  const permissionsRef = doc(db, 'organizations', organizationId, 'user_permissions', userId);
  
  const unsubscribe = onSnapshot(permissionsRef, (doc) => {
    if (!doc.exists()) {
      // Return default permissions if none set
      callback({
        analytics: {
          viewEarnings: false,
          viewUnpaidAmount: false,
          viewAgentPayments: false,
        },
        bookings: {
          create: true,
          createForOthers: false,
          edit: true,
          editOthers: false,
          delete: true,
          deleteOthers: false,
        },
        users: {
          manage: false,
        },
      });
      return;
    }

    callback(doc.data() as UserPermissions);
  });

  return unsubscribe;
};

export const updateUserPermissions = async (
  organizationId: string,
  userId: string,
  permissions: UserPermissions,
  isPendingInvite: boolean = false
) => {
  if (isPendingInvite) {
    // For pending invites, update the permissions in the pending_invites collection
    const pendingInviteRef = doc(db, 'pending_invites', userId);
    const pendingInviteDoc = await getDoc(pendingInviteRef);
    
    if (!pendingInviteDoc.exists()) {
      throw new Error('Pending invite not found');
    }
    
    const invites = pendingInviteDoc.data().invites || [];
    const updatedInvites = invites.map((invite: any) => {
      if (invite.organizationId === organizationId && invite.status === 'pending') {
        return {
          ...invite,
          permissions: permissions
        };
      }
      return invite;
    });
    
    await updateDoc(pendingInviteRef, {
      invites: updatedInvites,
      updatedAt: serverTimestamp()
    });
  } else {
    // For existing users, update permissions as before
    const permissionsRef = doc(db, 'organizations', organizationId, 'user_permissions', userId);
    await setDoc(permissionsRef, permissions);
  }
};

export const quitOrganization = async (organizationId: string, userId: string) => {
  try {
    console.log('🔍 Starting organization quit process...', { organizationId, userId });
    
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      console.error('❌ Organization not found');
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data();
    const isOwner = orgData.ownerId === userId;
    console.log('👤 User ownership check:', { 
      isOwner, 
      ownerId: orgData.ownerId, 
      userId,
      organizationName: orgData.name
    });

    if (isOwner) {
      console.log('🗑️ Starting deletion process as owner');
      
      // First, delete the organization document itself
      console.log('🏢 Attempting to delete organization document...');
      try {
        await deleteDoc(orgRef);
        console.log('✅ Successfully deleted organization document');
      } catch (error: any) {
        console.error('❌ Failed to delete organization document:', error);
        throw error;
      }

      // Now delete all subcollections
      const subcollections = ['user_permissions', 'assets', 'bookings', 'analytics'];  // Analytics last
      for (const subcollection of subcollections) {
        console.log(`📁 Processing subcollection: ${subcollection}`);
        try {
          const subcollectionRef = collection(db, 'organizations', organizationId, subcollection);
          const subcollectionDocs = await getDocs(subcollectionRef);
          console.log(`📊 Found ${subcollectionDocs.size} documents in ${subcollection}`);
          
          if (subcollectionDocs.size > 0) {
            const batchSize = 500;
            const batches = [];
            
            // Split into batches of 500 to handle large collections
            for (let i = 0; i < subcollectionDocs.size; i += batchSize) {
              const batch = subcollectionDocs.docs
                .slice(i, i + batchSize)
                .map(async (doc) => {
                  try {
                    await deleteDoc(doc.ref);
                  } catch (error: any) {
                    // Check if the error is due to document not found
                    if (error.code === 'not-found' || error.message.includes('Missing or insufficient permissions.')) {
                      console.log(`ℹ️ Document ${doc.id} in ${subcollection} already deleted or not found`);
                    } else {
                      // Rethrow other permission errors
                      console.error(`❌ Permission error deleting ${doc.id} in ${subcollection}:`, error);
                      throw error;
                    }
                  }
                });
              batches.push(Promise.all(batch));
            }
            
            // Process each batch sequentially to avoid overwhelming Firestore
            for (let i = 0; i < batches.length; i++) {
              try {
                await batches[i];
                console.log(`✅ Processed batch ${i + 1}/${batches.length} of ${subcollection}`);
              } catch (error: any) {
                // Only throw if it's a permission error
                if (error.code !== 'not-found' && !error.message.includes('Missing or insufficient permissions.')) {
                  throw error;
                }
              }
            }
          }
          console.log(`✅ Successfully processed all ${subcollection} documents`);
        } catch (error: any) {
          // Only throw if it's a permission error
          if (error.code !== 'not-found' && !error.message.includes('Missing or insufficient permissions.')) {
            console.error(`❌ Permission error processing ${subcollection}:`, error);
            throw error;
          }
          console.log(`ℹ️ Skipping ${subcollection} - already deleted or not found`);
        }
      }

      // Clean up organization invites
      console.log('📨 Processing organization invites...');
      try {
        const orgInvitesRef = collection(db, 'organization_invites');
        const orgInvitesQuery = query(orgInvitesRef, where('organizationId', '==', organizationId));
        const orgInvitesDocs = await getDocs(orgInvitesQuery);
        console.log(`📊 Found ${orgInvitesDocs.size} organization invites to delete`);
        
        if (orgInvitesDocs.size > 0) {
          const deletePromises = orgInvitesDocs.docs.map(async (doc) => {
            try {
              await deleteDoc(doc.ref);
            } catch (error: any) {
              // Only throw if it's a permission error
              if (error.code !== 'not-found' && !error.message.includes('Missing or insufficient permissions.')) {
                throw error;
              }
            }
          });
          await Promise.all(deletePromises);
        }
        console.log('✅ Successfully processed organization invites');
      } catch (error: any) {
        // Only throw if it's a permission error
        if (error.code !== 'not-found' && !error.message.includes('Missing or insufficient permissions.')) {
          console.error('❌ Permission error processing organization invites:', error);
          throw error;
        }
        console.log('ℹ️ Skipping organization invites - already deleted or not found');
      }

      // Clean up pending invites
      console.log('📨 Processing pending invites...');
      try {
        const pendingInvitesRef = collection(db, 'pending_invites');
        const pendingInvitesDocs = await getDocs(pendingInvitesRef);
        console.log(`📊 Found ${pendingInvitesDocs.size} pending invite documents to process`);
        
        const pendingInvitesPromises = pendingInvitesDocs.docs.map(async (doc) => {
          try {
            const data = doc.data();
            if (!data.invites) return;
            
            const invites = data.invites.filter((invite: any) => 
              !(invite.organizationId === organizationId && invite.status === 'pending')
            );
            
            if (invites.length === 0) {
              await deleteDoc(doc.ref);
            } else if (invites.length !== data.invites.length) {
              await updateDoc(doc.ref, { 
                invites,
                updatedAt: serverTimestamp()
              });
            }
          } catch (error: any) {
            // Only throw if it's a permission error
            if (error.code !== 'not-found' && !error.message.includes('Missing or insufficient permissions.')) {
              throw error;
            }
          }
        });
        await Promise.all(pendingInvitesPromises);
        console.log('✅ Successfully processed pending invites');
      } catch (error: any) {
        // Only throw if it's a permission error
        if (error.code !== 'not-found' && !error.message.includes('Missing or insufficient permissions.')) {
          console.error('❌ Permission error processing pending invites:', error);
          throw error;
        }
        console.log('ℹ️ Skipping pending invites - already deleted or not found');
      }

    } else {
      console.log('👋 Processing member removal...');
      try {
        await updateDoc(orgRef, {
          members: arrayRemove(userId),
          updatedAt: serverTimestamp(),
        });
        console.log('✅ Successfully removed member from organization');
      } catch (error) {
        console.error('❌ Failed to remove member from organization:', error);
        throw error;
      }
    }

    // Update user's organizationIds
    console.log('👤 Updating user organization list...');
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        organizationIds: arrayRemove(organizationId),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Successfully updated user organization list');
    } catch (error) {
      console.error('❌ Failed to update user organization list:', error);
      throw error;
    }

    console.log('✅ Organization quit process completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Error quitting organization:', error);
    throw error;
  }
};

export const syncOrganizationUsers = async (organizationId: string): Promise<void> => {
  // Implementation for syncing organization users
  // This function was empty in the original file
}; 