import { 
  collection, 
  doc, 
  onSnapshot, 
  query, 
  where,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config';
import { OrganizationInvite, PendingInvite, UserPermissions } from './types';

export const createOrganizationInvite = async (
  organizationId: string,
  email: string,
  invitedBy: string
) => {
  try {
    const orgRef = doc(db, 'organizations', organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data();
    
    // Check if user already exists
    const usersByEmail = await getDocs(
      query(collection(db, 'users'), where('email', '==', email))
    );

    // Check if invite already exists
    const existingInvites = await getDocs(
      query(
        collection(db, 'organization_invites'), 
        where('organizationId', '==', organizationId),
        where('email', '==', email),
        where('status', '==', 'pending')
      )
    );

    if (!existingInvites.empty) {
      throw new Error('An invitation has already been sent to this email');
    }

    // Create the invite
    const inviteData = {
      organizationId,
      organizationName: orgData.name,
      invitedBy,
      invitedAt: new Date().toISOString(),
      status: 'pending',
      email,
      userId: !usersByEmail.empty ? usersByEmail.docs[0].id : null
    };

    const inviteRef = await addDoc(collection(db, 'organization_invites'), inviteData);
    
    return { id: inviteRef.id, ...inviteData };
  } catch (error) {
    console.error('Error creating organization invite:', error);
    throw error;
  }
};

export const inviteUserToOrganization = async (
  organizationId: string, 
  inviteInput: string,  // Can be either username or email
  invitedBy: string
) => {
  try {
    console.log('🚀 Starting invite process:', { organizationId, inviteInput, invitedBy });

    // Check organization
    const orgRef = doc(db, 'organizations', organizationId);
    console.log('📂 Fetching organization:', organizationId);
    const orgDoc = await getDoc(orgRef);
    
    if (!orgDoc.exists()) {
      console.error('❌ Organization not found');
      throw new Error('Organization not found');
    }

    const orgData = orgDoc.data();
    console.log('✅ Organization found:', { 
      name: orgData.name, 
      ownerId: orgData.ownerId,
      memberCount: orgData.members?.length,
      inviterIsMember: orgData.members?.includes(invitedBy)
    });
    
    // Try to find user by username first
    console.log('🔍 Searching for user by username:', inviteInput);
    const usersByUsername = await getDocs(
      query(collection(db, 'users'), where('username', '==', inviteInput))
    );

    // If not found by username, try email
    let userDoc;
    if (usersByUsername.empty) {
      console.log('👤 User not found by username, trying email...');
      const usersByEmail = await getDocs(
        query(collection(db, 'users'), where('email', '==', inviteInput))
      );
      if (!usersByEmail.empty) {
        userDoc = usersByEmail.docs[0];
      }
    } else {
      userDoc = usersByUsername.docs[0];
    }

    // User exists
    if (userDoc) {
      const userId = userDoc.id;
      const userData = userDoc.data();
      console.log('✅ User found:', { userId, username: userData.username, email: userData.email });
      
      // Check if already a member
      if (orgData.members && orgData.members.includes(userId)) {
        console.error('❌ User is already a member');
        throw new Error('User is already a member of this organization');
      }

      // Create pending invite
      const pendingInviteRef = doc(db, 'pending_invites', userId);
      console.log('📝 Creating/updating pending invite for user:', userId);
      
      const pendingInviteDoc = await getDoc(pendingInviteRef);
      console.log('Current pending invites doc exists:', pendingInviteDoc.exists());
      
      const newInvite = {
        organizationId,
        organizationName: orgData.name,
        invitedBy,
        invitedAt: new Date().toISOString(),
        status: 'pending',
        username: userData.username,
        email: userData.email,
        permissions: {
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
        }
      };

      if (pendingInviteDoc.exists()) {
        const existingInvites = pendingInviteDoc.data().invites || [];
        console.log('Existing invites:', existingInvites.length);
        
        // Check if invite already exists
        if (existingInvites.some((invite: any) => invite.organizationId === organizationId && invite.status === 'pending')) {
          console.error('❌ Invitation already exists');
          throw new Error('An invitation has already been sent to this user');
        }

        console.log('📤 Adding new invite to existing invites');
        // Add new invite to existing invites and update timestamp
        await updateDoc(pendingInviteRef, {
          invites: [...existingInvites, newInvite],
          updatedAt: new Date()
        });
      } else {
        console.log('📤 Creating new pending invites document');
        // Create new document with first invite and timestamps
        await setDoc(pendingInviteRef, {
          invites: [newInvite],
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      console.log('✅ Invite created successfully');
      return { status: 'invited', userId };
    }
    // User doesn't exist, create email invite
    else {
      console.log('👤 User not found, creating email invite');
      // Check if invite already exists
      const existingInvites = await getDocs(
        query(
          collection(db, 'organization_invites'), 
          where('organizationId', '==', organizationId),
          where('email', '==', inviteInput),
          where('status', '==', 'pending')
        )
      );

      if (!existingInvites.empty) {
        console.error('❌ Email invitation already exists');
        throw new Error('An invitation has already been sent to this email');
      }

      // Create the invite
      const inviteData = {
        organizationId,
        organizationName: orgData.name,
        invitedBy,
        invitedAt: serverTimestamp(),
        status: 'pending',
        email: inviteInput,
        username: null
      };

      console.log('📤 Creating organization invite document');
      const inviteRef = await addDoc(collection(db, 'organization_invites'), inviteData);
      console.log('✅ Email invite created successfully');
      return { status: 'invited', inviteId: inviteRef.id };
    }
  } catch (error: any) {
    console.error('❌ Error inviting user to organization:', {
      error: error.message,
      code: error.code,
      details: error.details,
      name: error.name,
      stack: error.stack
    });
    throw error;
  }
};

export const acceptOrganizationInvite = async (organizationId: string, userId: string) => {
  try {
    const pendingInviteRef = doc(db, 'pending_invites', userId);
    const pendingInviteDoc = await getDoc(pendingInviteRef);
    
    if (!pendingInviteDoc.exists()) {
      throw new Error('No pending invites found');
    }

    const invites = pendingInviteDoc.data().invites || [];
    const invite = invites.find((inv: any) => inv.organizationId === organizationId && inv.status === 'pending');
    
    if (!invite) {
      throw new Error('Invitation not found');
    }

    // Add user to organization
    const orgRef = doc(db, 'organizations', organizationId);
    await updateDoc(orgRef, {
      members: arrayUnion(userId),
      updatedAt: serverTimestamp(),
    });

    // Apply permissions if they exist in the invite
    if (invite.permissions) {
      const permissionsRef = doc(db, 'organizations', organizationId, 'user_permissions', userId);
      await setDoc(permissionsRef, invite.permissions);
    }

    // Update invite status
    const updatedInvites = invites.map((inv: any) => 
      inv.organizationId === organizationId 
        ? { ...inv, status: 'accepted' } 
        : inv
    );

    await updateDoc(pendingInviteRef, { invites: updatedInvites });

    return { status: 'accepted' };
  } catch (error) {
    console.error('Error accepting organization invite:', error);
    throw error;
  }
};

export const declineOrganizationInvite = async (organizationId: string, userId: string) => {
  try {
    const pendingInviteRef = doc(db, 'pending_invites', userId);
    const pendingInviteDoc = await getDoc(pendingInviteRef);
    
    if (!pendingInviteDoc.exists()) {
      throw new Error('No pending invites found');
    }

    const invites = pendingInviteDoc.data().invites || [];
    const invite = invites.find((inv: PendingInvite) => inv.organizationId === organizationId && inv.status === 'pending');
    
    if (!invite) {
      throw new Error('Invitation not found');
    }

    // Update invite status
    const updatedInvites = invites.map((inv: PendingInvite) => 
      inv.organizationId === organizationId 
        ? { ...inv, status: 'declined' } 
        : inv
    );

    await updateDoc(pendingInviteRef, { invites: updatedInvites });

    return { status: 'declined' };
  } catch (error) {
    console.error('Error declining organization invite:', error);
    throw error;
  }
};

export const subscribeToPendingInvites = (userId: string, callback: (invites: Array<{
  organizationId: string;
  organizationName: string;
  invitedBy: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'declined';
}>) => void) => {
  const pendingInviteRef = doc(db, 'pending_invites', userId);
  
  return onSnapshot(pendingInviteRef, (doc) => {
    if (!doc.exists()) {
      callback([]);
      return;
    }

    const invites = doc.data().invites || [];
    callback(invites
      .filter((invite: PendingInvite) => invite.status === 'pending')
      .map((invite: PendingInvite) => ({
        ...invite,
        invitedAt: new Date(invite.invitedAt)
      }))
    );
  });
};

export const subscribeToOrganizationInvites = (organizationId: string, callback: (invites: Array<{
  id: string;
  email: string;
  status: 'pending';
  invitedAt: Date;
}>) => void) => {
  const invitesQuery = query(
    collection(db, 'organization_invites'),
    where('organizationId', '==', organizationId),
    where('status', '==', 'pending')
  );

  return onSnapshot(invitesQuery, (snapshot) => {
    const invites = snapshot.docs.map(doc => ({
      id: doc.id,
      email: doc.data().email,
      status: doc.data().status,
      invitedAt: doc.data().invitedAt?.toDate() || new Date()
    }));
    callback(invites);
  });
};

export const subscribeToAllOrganizationInvites = (organizationId: string, callback: (invites: Array<{
  id: string;
  email: string;
  status: 'pending';
  invitedAt: Date;
  type: 'email' | 'user';
  username?: string;
  permissions?: UserPermissions;
}>) => void) => {
  // Subscribe to email invites
  const emailInvitesQuery = query(
    collection(db, 'organization_invites'),
    where('organizationId', '==', organizationId),
    where('status', '==', 'pending')
  );

  // Subscribe to user invites
  const userInvitesQuery = query(
    collection(db, 'pending_invites')
  );

  // Handle email invites
  const emailUnsubscribe = onSnapshot(emailInvitesQuery, (snapshot) => {
    const emailInvites = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        email: data.email,
        status: data.status,
        invitedAt: data.invitedAt?.toDate ? data.invitedAt.toDate() : new Date(data.invitedAt),
        type: 'email' as const,
        permissions: data.permissions
      };
    });

    // Get user invites
    getDocs(userInvitesQuery).then((userSnapshot) => {
      const userInvites: any[] = [];
      
      userSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.invites) {
          data.invites.forEach((invite: any) => {
            if (invite.organizationId === organizationId && invite.status === 'pending') {
              userInvites.push({
                id: doc.id,
                email: invite.email || '',
                status: invite.status,
                invitedAt: invite.invitedAt?.toDate ? invite.invitedAt.toDate() : new Date(invite.invitedAt),
                type: 'user' as const,
                username: invite.username,
                permissions: invite.permissions
              });
            }
          });
        }
      });

      // Combine and return all invites
      callback([...emailInvites, ...userInvites]);
    });
  });

  // Subscribe to user invites in real-time
  const userUnsubscribe = onSnapshot(userInvitesQuery, (userSnapshot) => {
    const userInvites: any[] = [];
    
    userSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.invites) {
        data.invites.forEach((invite: any) => {
          if (invite.organizationId === organizationId && invite.status === 'pending') {
            userInvites.push({
              id: doc.id,
              email: invite.email || '',
              status: invite.status,
              invitedAt: invite.invitedAt?.toDate ? invite.invitedAt.toDate() : new Date(invite.invitedAt),
              type: 'user' as const,
              username: invite.username,
              permissions: invite.permissions
            });
          }
        });
      }
    });

    // Get email invites to combine with user invites
    getDocs(emailInvitesQuery).then((emailSnapshot) => {
      const emailInvites = emailSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          email: data.email,
          status: data.status,
          invitedAt: data.invitedAt?.toDate ? data.invitedAt.toDate() : new Date(data.invitedAt),
          type: 'email' as const,
          permissions: data.permissions
        };
      });

      // Combine and return all invites
      callback([...emailInvites, ...userInvites]);
    });
  });

  // Return a function to unsubscribe from both listeners
  return () => {
    emailUnsubscribe();
    userUnsubscribe();
  };
}; 