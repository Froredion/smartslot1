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
import { Asset } from './types';

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