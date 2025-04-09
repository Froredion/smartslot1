import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  sendEmailVerification,
  User
} from 'firebase/auth';
import { auth } from './config';
import { createUserProfile, getUserProfile } from './firestore';

export const signUp = async (email: string, password: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    try {
      // Create user profile in Firestore
      await createUserProfile(userCredential.user.uid, {
        email: userCredential.user.email || '',
        displayName: '',
        createdAt: new Date(),
        updatedAt: new Date(),
        preferences: {
          notifications: true,
          theme: 'light',
          currency: 'USD'
        }
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

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    
    try {
      // Check if user profile exists, if not create it
      const profile = await getUserProfile(userCredential.user.uid);
      if (!profile) {
        await createUserProfile(userCredential.user.uid, {
          email: userCredential.user.email || '',
          displayName: '',
          createdAt: new Date(),
          updatedAt: new Date(),
          preferences: {
            notifications: true,
            theme: 'light',
            currency: 'USD'
          }
        });
      }
    } catch (profileError) {
      console.error('Error checking/creating user profile:', profileError);
      // Continue with sign in even if profile check/creation fails
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('Login error:', error);
    let message = 'Invalid email or password';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      message = 'Invalid email or password';
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

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};