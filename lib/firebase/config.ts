import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD7lc2XpFMneh0gBSUIh_2K27CPq0nxDKA",
  authDomain: "smartslot-61e33.firebaseapp.com",
  projectId: "smartslot-61e33",
  storageBucket: "smartslot-61e33.firebasestorage.app",
  messagingSenderId: "101045440122",
  appId: "1:101045440122:web:2e57b357586f49a06b75c3",
  measurementId: "G-0H08GW10YB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Initialize Analytics only if supported (web platform)
let analytics = null;
isSupported().then(yes => yes && (analytics = getAnalytics(app)));

export { analytics };
export default app;