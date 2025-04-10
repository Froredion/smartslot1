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
import { checkUsernameAvailability } from './firestore';

export const signUp = async (email: string, password: string, username: string) => {
  try {
    // Check username availability first
    const isUsernameAvailable = await checkUsernameAvailability(username);
    if (!isUsernameAvailable) {
      throw new Error('Username is already taken');
    }

    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    try {
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

      // Create user profile in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: userCredential.user.email || '',
        username: username,
        displayName: '',
        organizationIds: [orgRef.id], // Store organization IDs array
        isOwner: true, // First user is always owner of their org
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        preferences: {
          notifications: true,
          theme: 'light',
          currency: 'USD',
        },
      });
    } catch (profileError) {
      console.error('Error creating user profile:', profileError);
      // Continue with registration even if profile creation fails
      // The profile can be created later when needed
    }

    // Send verification email
    try {
      await sendEmailVerification(userCredential.user);
    } catch (verificationError) {
      console.error('Error sending verification email:', verificationError);
      // Continue with registration even if email verification fails
      // User can request verification email later
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('Registration error:', error);
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
    let email = emailOrUsername;

    // If the input doesn't contain '@', assume it's a username
    if (!emailOrUsername.includes('@')) {
      // Query Firestore to get the email associated with the username
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', emailOrUsername));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        throw new Error('Invalid username or password');
      }

      const userDoc = querySnapshot.docs[0];
      email = userDoc.data().email;
    }

    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );

    try {
      // Check if user profile exists
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userDoc = await getDoc(userRef);

      if (!userDoc.exists()) {
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
          organizationIds: [orgRef.id], // Store organization IDs array
          isOwner: true, // First user is always owner of their org
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          preferences: {
            notifications: true,
            theme: 'light',
            currency: 'USD',
          },
        });
      }
    } catch (profileError) {
      console.error('Error checking/creating user profile:', profileError);
      // Continue with sign in even if profile check/creation fails
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error);
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
