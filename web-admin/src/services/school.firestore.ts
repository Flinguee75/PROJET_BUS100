/**
 * Service Firestore pour la gestion des écoles côté frontend
 */

import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where,
  type DocumentData,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import type { School } from '@/types/school';
import type { BusRealtimeData } from '@/types/realtime';
import { mapSnapshotToRealtimeBus } from './realtime.firestore';

const toDate = (value: unknown): Date => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value);
  }

  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate();
    } catch {
      return new Date();
    }
  }

  return new Date();
};

const mapDataToSchool = (id: string, data: DocumentData): School => {
  const location = data.location || {};

  return {
    id,
    name: data.name || 'École',
    location: {
      lat: typeof location.lat === 'number' ? location.lat : data.lat || 0,
      lng: typeof location.lng === 'number' ? location.lng : data.lng || 0,
    },
    fleetSize: data.fleetSize ?? data.fleet_size ?? data.busCount ?? 0,
    address: data.address,
    contactEmail: data.contactEmail ?? data.email,
    contactPhone: data.contactPhone ?? data.phone,
    createdAt: toDate(data.createdAt),
    updatedAt: toDate(data.updatedAt),
    isActive: data.isActive ?? true,
  };
};

export const watchSchool = (
  schoolId: string | null | undefined,
  onUpdate?: (school: School | null) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!schoolId) {
    onUpdate?.(null);
    return () => undefined;
  }

  const db = getFirebaseDb();
  const schoolRef = doc(db, 'schools', schoolId);

  return onSnapshot(
    schoolRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate?.(null);
        return;
      }

      onUpdate?.(mapDataToSchool(snapshot.id, snapshot.data() as DocumentData));
    },
    (error) => {
      console.error('❌ Erreur Firestore watchSchool:', error);
      onError?.(error as Error);
    }
  );
};

export const getSchool = async (schoolId: string): Promise<School | null> => {
  const db = getFirebaseDb();
  const schoolRef = doc(db, 'schools', schoolId);
  const snapshot = await getDoc(schoolRef);

  if (!snapshot.exists()) {
    return null;
  }

  return mapDataToSchool(snapshot.id, snapshot.data() as DocumentData);
};

export const watchSchoolBuses = (
  schoolId: string | null | undefined,
  onUpdate?: (buses: BusRealtimeData[]) => void,
  onError?: (error: Error) => void
): Unsubscribe => {
  if (!schoolId) {
    onUpdate?.([]);
    return () => undefined;
  }

  const db = getFirebaseDb();
  const busesRef = collection(db, 'gps_live');
  const busesQuery = query(busesRef, where('schoolId', '==', schoolId));

  return onSnapshot(
    busesQuery,
    (snapshot) => {
      const buses = snapshot.docs.map((docSnapshot) =>
        mapSnapshotToRealtimeBus(docSnapshot.id, docSnapshot.data() as DocumentData)
      );
      onUpdate?.(buses);
    },
    (error) => {
      console.error('❌ Erreur Firestore watchSchoolBuses:', error);
      onError?.(error as Error);
    }
  );
};
