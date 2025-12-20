import {
  collection,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

export interface CourseHistoryEntry {
  id: string;
  busId: string;
  busNumber?: string;
  driverId: string;
  status: string;
  tripType?: string;
  tripLabel?: string;
  busLabel?: string;
  busPlate?: string;
  zoneLabel?: string;
  driverName?: string;
  driverPhone?: string;
  startTime: number | null;
  endTime: number | null;
  durationMinutes: number | null;
  stats: {
    totalStudents?: number | null;
    scannedCount?: number | null;
    unscannedCount?: number | null;
  };
  scannedStudentIds: string[];
  missedStudentIds: string[];
}

// Alias pour compatibilité avec UrgencySection
export type CourseHistory = CourseHistoryEntry;

/**
 * Récupère les courses récentes avec élèves manquants (pour la section Urgence)
 * @param recentMinutes - Nombre de minutes dans le passé à considérer (défaut: 60)
 * @returns Promise avec la liste des courses ayant des élèves manquants
 */
export async function getRecentCoursesWithMissedStudents(
  recentMinutes: number = 60
): Promise<CourseHistoryEntry[]> {
  const db = getFirebaseDb();
  const cutoffTime = Date.now() - recentMinutes * 60 * 1000;

  const historyRef = collection(db, 'course_history');
  const historyQuery = query(
    historyRef,
    where('endTime', '>=', cutoffTime),
    where('status', 'in', ['completed', 'stopped']),
    orderBy('endTime', 'desc'),
    limit(50)
  );

  try {
    const snapshot = await getDocs(historyQuery);
    const courses = snapshot.docs
      .map((docSnapshot) => mapCourseHistory(docSnapshot))
      .filter((course) => {
        const missedCount = course.stats?.unscannedCount ?? course.missedStudentIds?.length ?? 0;
        return missedCount > 0;
      });

    return courses;
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des courses avec élèves manquants:', error);
    return [];
  }
}

export function watchRecentCourseHistory(
  limitCount: number,
  onUpdate: (entries: CourseHistoryEntry[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const historyRef = collection(db, 'course_history');
  const historyQuery = query(historyRef, orderBy('startTime', 'desc'), limit(limitCount));

  return onSnapshot(
    historyQuery,
    (snapshot) => {
      const entries = snapshot.docs.map((docSnapshot) => mapCourseHistory(docSnapshot));
      onUpdate(entries);
    },
    (error) => {
      console.error('❌ Erreur Firestore watchRecentCourseHistory:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
}

function mapCourseHistory(
  docSnapshot: QueryDocumentSnapshot<DocumentData>
): CourseHistoryEntry {
  const data = docSnapshot.data();
  const startTime = normalizeTimestamp(data.startTime);
  const endTime = normalizeTimestamp(data.endTime);
  const durationMinutes = startTime && endTime ? Math.max(1, Math.round((endTime - startTime) / 60000)) : null;

  const stats = data.stats ?? {};
  const scannedIds: string[] = data.scannedStudentIds || [];
  const missedIds: string[] = data.missedStudentIds || [];
  const scannedCount = stats.scannedCount ?? scannedIds.length;
  const totalStudents = stats.totalStudents ?? ((scannedIds.length + missedIds.length) || null);
  const unscannedCount =
    stats.unscannedCount ??
    (totalStudents != null
      ? Math.max(0, totalStudents - scannedCount)
      : (missedIds.length || null));

  const busInfo = data.busInfo || {};
  const driverInfo = data.driverInfo || {};

  return {
    id: docSnapshot.id,
    busId: data.busId || '',
    busNumber: busInfo.busNumber,
    driverId: data.driverId || '',
    status: data.status || 'completed',
    tripType: data.tripType,
    tripLabel: data.tripLabel,
    busLabel: deriveBusLabel(busInfo, data.busId),
    busPlate: busInfo.plateNumber,
    zoneLabel: busInfo.assignedCommune || busInfo.zone,
    driverName: driverInfo.name,
    driverPhone: driverInfo.phoneNumber,
    startTime,
    endTime,
    durationMinutes,
    stats: {
      totalStudents,
      scannedCount,
      unscannedCount,
    },
    scannedStudentIds: scannedIds,
    missedStudentIds: missedIds,
  };
}

function deriveBusLabel(busInfo: Record<string, any>, fallbackId: string): string {
  if (busInfo.busNumber != null) {
    return `Bus ${busInfo.busNumber}`;
  }
  if (busInfo.busName) {
    return String(busInfo.busName);
  }
  return fallbackId;
}

function normalizeTimestamp(value: unknown): number | null {
  if (!value) {
    return null;
  }

  if (typeof value === 'number') {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (
    typeof value === 'object' &&
    'toMillis' in (value as { toMillis?: () => number }) &&
    typeof (value as { toMillis?: () => number }).toMillis === 'function'
  ) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch (error) {
      console.warn('⚠️ Impossible de convertir le timestamp Firestore:', error);
      return null;
    }
  }

  return null;
}
