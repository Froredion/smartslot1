import { 
  doc, 
  onSnapshot, 
  collection,
  query,
  where,
} from 'firebase/firestore';
import { db } from '../config';
import { Analytics, ActivityLog } from './types';

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