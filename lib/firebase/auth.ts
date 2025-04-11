import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User,
} from 'firebase/auth';
import { auth } from './config';
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './config';
import { checkUsernameAvailability, syncUserOrganizations } from './firestore';
import { looksLikeEmail } from '../validation';

export const signUp = async (email: string, password: string, username: string) => {
  try {
    console.log('signUp - Starting registration process');
    console.log('signUp - Email:', email);
    console.log('signUp - Username:', username);
    console.log('signUp - Password length:', password.length);

    // Log username validation
    console.log('signUp - Username validation:', {
      isString: typeof username === 'string',
      length: username.length >= 3,
      matches: /^[a-zA-Z0-9_]+$/.test(username)
    });

    // Check username availability first
    const isUsernameAvailable = await checkUsernameAvailability(username);
    console.log('signUp - isUsernameAvailable:', isUsernameAvailable);
    
    if (!isUsernameAvailable) {
      console.log('signUp - Username is already taken');
      throw new Error('Username is already taken');
    }

    console.log('signUp - Creating user with Firebase Auth');
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log('signUp - User created successfully with ID:', userCredential.user.uid);

    try {
      console.log('signUp - Creating default organization');
      // Create default organization first
      const orgRef = await addDoc(collection(db, 'organizations'), {
        name: 'My Organization',
        ownerId: userCredential.user.uid,
        members: [userCredential.user.uid],
        currency: 'USD',
        categories: ['Vehicle', 'Property', 'Equipment'],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('signUp - Organization created successfully with ID:', orgRef.id);

      console.log('signUp - Creating user profile');
      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email || '',
        username: username,
        usernameLower: username.toLowerCase(),
        displayName: '',
        organizationIds: [orgRef.id],
        isOwner: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        preferences: {
          notifications: true,
          theme: 'light',
          currency: 'USD',
        },
      });
      console.log('signUp - User profile created successfully');
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
      // Continue with registration even if profile creation fails
      // The profile can be created later when needed
    }

    // Send verification email
    try {
      console.log('signUp - Sending verification email');
      await sendEmailVerification(userCredential.user);
      console.log('signUp - Verification email sent successfully');
    } catch (verificationError) {
      console.error('Error sending verification email:', verificationError);
      // Continue with registration even if email verification fails
      // User can request verification email later
    }

    console.log('signUp - Registration completed successfully');
    return userCredential.user;
  } catch (error: any) {
    console.error('Registration error:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    let message = 'An error occurred during registration';
    if (error.code === 'auth/email-already-in-use') {
      message = 'This email is already registered';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    } else if (error.code === 'auth/weak-password') {
      message = 'Password should be at least 6 characters';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Network error. Please check your internet connection';
    }
    throw new Error(message);
  }
};

export const signIn = async (emailOrUsername: string, password: string) => {
  try {
    console.log('signIn - Starting login process');
    console.log('signIn - Input:', emailOrUsername);
    
    let email = emailOrUsername;

    // Check if the input looks like an email first
    const isEmail = looksLikeEmail(emailOrUsername);
    console.log('signIn - Is email?', isEmail);

    if (!isEmail) {
      console.log('signIn - Attempting username login');
      // If not an email, query Firestore to get the email associated with the username
      const usersRef = collection(db, 'users');
      
      // Convert username to lowercase for case-insensitive comparison
      const lowercaseUsername = emailOrUsername.toLowerCase();
      console.log('signIn - Converting username to lowercase:', lowercaseUsername);
      
      // Try to find the user by username (case-sensitive first)
      let q = query(usersRef, where('username', '==', emailOrUsername));
      let querySnapshot = await getDocs(q);
      
      // If not found, try case-insensitive search using usernameLower field
      if (querySnapshot.empty) {
        console.log('signIn - No exact match found, trying case-insensitive search');
        q = query(usersRef, where('usernameLower', '==', lowercaseUsername));
        querySnapshot = await getDocs(q);
      }
      
      console.log('signIn - Username query results:', {
        empty: querySnapshot.empty,
        size: querySnapshot.size,
        docs: querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          username: doc.data().username,
          email: doc.data().email 
        }))
      });

      if (querySnapshot.empty) {
        console.log('signIn - No user found with username:', emailOrUsername);
        throw new Error('Invalid username or password');
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      console.log('signIn - User data found:', {
        id: userDoc.id,
        username: userData.username,
        email: userData.email
      });
      
      email = userData.email;
      console.log('signIn - Found email for username:', email);
    }

    console.log('signIn - Attempting Firebase auth with email:', email);
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log('signIn - Login successful for user:', userCredential.user.uid);

    try {
      // Check if user profile exists
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
        console.log('signIn - Creating default profile for user');
        // Create default organization if user doesn't have a profile
        const orgRef = await addDoc(collection(db, 'organizations'), {
          name: 'My Organization',
          ownerId: userCredential.user.uid,
          members: [userCredential.user.uid],
          currency: 'USD',
          categories: ['Default'],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        // Create user profile
        await setDoc(userRef, {
          email: userCredential.user.email || '',
          displayName: '',
          organizationIds: [orgRef.id],
          isOwner: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            notifications: true,
            theme: 'light',
            currency: 'USD',
          },
        });
        console.log('signIn - Default profile created');
      } else {
        console.log('signIn - Existing profile found, syncing organizations');
        // Sync user's organizations with their profile
        await syncUserOrganizations(userCredential.user.uid);
      }
    } catch (profileError) {
      console.error('Error checking/creating user profile:', profileError);
      // Continue with sign in even if profile check/creation fails
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', {
      code: error.code,
      message: error.message,
      fullError: error
    });
    let message = 'Invalid username/email or password';
    if (
      error.code === 'auth/user-not-found' ||
      error.code === 'auth/wrong-password'
    ) {
      message = 'Invalid username/email or password';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    } else if (error.code === 'auth/too-many-requests') {
      message = 'Too many failed attempts. Please try again later';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Network error. Please check your internet connection';
    }
    throw new Error(message);
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    let message = 'Error sending password reset email';
    if (error.code === 'auth/user-not-found') {
      message = 'No account found with this email';
    } else if (error.code === 'auth/invalid-email') {
      message = 'Invalid email address';
    } else if (error.code === 'auth/network-request-failed') {
      message = 'Network error. Please check your internet connection';
    }
    throw new Error(message);
  }
};

export const resendVerificationEmail = async (user: User) => {
  try {
    await sendEmailVerification(user);
  } catch (error: any) {
    console.error('Email verification error:', error);
    let message = 'Error sending verification email';
    if (error.code === 'auth/network-request-failed') {
      message = 'Network error. Please check your internet connection';
    }
    throw new Error(message);
  }
};

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error('Error signing out');
  }
};

export const subscribeToAuthChanges = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};