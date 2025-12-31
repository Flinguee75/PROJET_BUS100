/**
 * Service Firestore pour récupérer l'historique GPS d'un bus
 */

import { collection, getDocs, limit, orderBy, query } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

const normalizeTimestamp = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return value < 1e12 ? value * 1000 : value;
  }
  if (value instanceof Date) {
    return value.getTime();
  }
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch {
      return null;
    }
  }
  return null;
};

const readLatestTimestamp = async (path: string[]): Promise<number | null> => {
  const db = getFirebaseDb();
  const [firstSegment, ...restSegments] = path;
  if (!firstSegment) {
    return null;
  }
  const ref = collection(db, firstSegment, ...restSegments);
  const q = query(ref, orderBy('position.timestamp', 'desc'), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  const data = snapshot.docs[0]?.data();
  if (!data) {
    return null;
  }
  const positionTs = normalizeTimestamp(data.position?.timestamp);
  if (positionTs) {
    return positionTs;
  }
  return normalizeTimestamp(data.timestamp ?? data.createdAt ?? data.updatedAt);
};

export const getLatestGpsHistoryTimestamp = async (
  busId: string,
  date: string
): Promise<number | null> => {
  const fromDay = await readLatestTimestamp(['gps_history', busId, date]);
  if (fromDay) {
    return fromDay;
  }
  return readLatestTimestamp(['gps_history', busId, 'positions']);
};
