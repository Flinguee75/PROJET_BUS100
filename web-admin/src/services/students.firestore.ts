/**
 * Service Firestore pour les étudiants et l'attendance
 * Fournit des fonctions pour récupérer les étudiants d'un bus et leur statut de scan
 */

import {
  collection,
  doc,
  documentId,
  onSnapshot,
  query,
  where,
  Unsubscribe,
  getDocs,
  Timestamp,
  type QueryDocumentSnapshot,
  type DocumentData,
  type QueryConstraint,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string | Date;
  grade: string;
  parentIds: string[];
  busId: string | null;
  routeId: string | null;
  commune: string;
  quartier: string;
  isActive: boolean;
  photoUrl?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  busId: string;
  date: string; // Format YYYY-MM-DD
  morningStatus?: 'present' | 'absent' | 'late' | 'excused';
  eveningStatus?: 'present' | 'absent' | 'late' | 'excused';
  status?: 'present' | 'absent' | 'late' | 'excused';
  tripType?: string;
  timestamp?: number;
  type?: 'boarding' | 'alighting';
  location?: {
    lat: number;
    lng: number;
  };
}

/**
 * Écouter les étudiants d'un bus en temps réel
 */
export function watchBusStudents(
  busId: string,
  onUpdate: (students: Student[]) => void,
  onError?: (error: Error) => void,
  tripType?: string | null
): Unsubscribe {
  const db = getFirebaseDb();
  const studentsRef = collection(db, 'students');
  const constraints: QueryConstraint[] = [
    where('busId', '==', busId),
    where('isActive', '==', true),
  ];

  if (tripType) {
    constraints.push(where('activeTrips', 'array-contains', tripType));
  }

  const studentsQuery = query(studentsRef, ...constraints);

  return onSnapshot(
    studentsQuery,
    (snapshot) => {
      const students: Student[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const student: Student = {
          id: docSnapshot.id,
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          dateOfBirth: data.dateOfBirth || '',
          grade: data.grade || '',
          parentIds: data.parentIds || [],
          busId: data.busId || null,
          routeId: data.routeId || null,
          commune: data.commune || '',
          quartier: data.quartier || '',
          isActive: data.isActive !== false,
          photoUrl: data.photoUrl,
        };

        students.push(student);
      });

      onUpdate(students);
    },
    (error) => {
      console.error(`❌ Erreur Firestore watchBusStudents(${busId}):`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
}

/**
 * Récupérer la liste des étudiants d'un bus (one-shot)
 */
export async function getBusStudents(
  busId: string,
  tripType?: string | null
): Promise<Student[]> {
  const db = getFirebaseDb();
  const studentsRef = collection(db, 'students');
  const constraints: QueryConstraint[] = [
    where('busId', '==', busId),
    where('isActive', '==', true),
  ];

  if (tripType) {
    constraints.push(where('activeTrips', 'array-contains', tripType));
  }

  const studentsQuery = query(studentsRef, ...constraints);

  const snapshot = await getDocs(studentsQuery);
  const students: Student[] = [];

  snapshot.forEach((docSnapshot) => {
    const data = docSnapshot.data();
    const student: Student = {
      id: docSnapshot.id,
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      dateOfBirth: data.dateOfBirth || '',
      grade: data.grade || '',
      parentIds: data.parentIds || [],
      busId: data.busId || null,
      routeId: data.routeId || null,
      commune: data.commune || '',
      quartier: data.quartier || '',
      isActive: data.isActive !== false,
      photoUrl: data.photoUrl,
    };

    students.push(student);
  });

  return students;
}

/**
 * Écouter les scans d'un bus pour une date donnée
 */
export function watchBusAttendance(
  busId: string,
  date: string, // Format YYYY-MM-DD
  onUpdate: (attendance: AttendanceRecord[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const attendanceRef = collection(db, 'attendance');
  const attendanceQuery = query(
    attendanceRef,
    where('busId', '==', busId),
    where('date', '==', date)
  );

  return onSnapshot(
    attendanceQuery,
    (snapshot) => {
      const attendance: AttendanceRecord[] = [];

      snapshot.forEach((docSnapshot) => {
        attendance.push(buildAttendanceRecord(docSnapshot, date));
      });

      onUpdate(attendance);
    },
    (error) => {
      console.error(
        `❌ Erreur Firestore watchBusAttendance(${busId}, ${date}):`,
        error
      );
      if (onError) {
        onError(error as Error);
      }
    }
  );
}

/**
 * Récupérer les étudiants scannés pour un bus et une date
 */
export async function getScannedStudents(
  busId: string,
  date: string // Format YYYY-MM-DD
): Promise<Student[]> {
  const attendance = await getBusAttendance(busId, date);
  const scannedStudentIds = new Set<string>();

  attendance.forEach((record) => {
    if (
      record.morningStatus === 'present' ||
      record.eveningStatus === 'present'
    ) {
      scannedStudentIds.add(record.studentId);
    }
  });

  const allStudents = await getBusStudents(busId);
  return allStudents.filter((student) => scannedStudentIds.has(student.id));
}

/**
 * Récupérer les étudiants non scannés pour un bus et une date
 */
export async function getUnscannedStudents(
  busId: string,
  date: string // Format YYYY-MM-DD
): Promise<Student[]> {
  const attendance = await getBusAttendance(busId, date);
  const scannedStudentIds = new Set<string>();

  attendance.forEach((record) => {
    if (
      record.morningStatus === 'present' ||
      record.eveningStatus === 'present'
    ) {
      scannedStudentIds.add(record.studentId);
    }
  });

  const allStudents = await getBusStudents(busId);
  return allStudents.filter((student) => !scannedStudentIds.has(student.id));
}

/**
 * Récupérer tous les enregistrements d'attendance pour un bus et une date (one-shot)
 */
async function getBusAttendance(
  busId: string,
  date: string
): Promise<AttendanceRecord[]> {
  const db = getFirebaseDb();
  const attendanceRef = collection(db, 'attendance');
  const attendanceQuery = query(
    attendanceRef,
    where('busId', '==', busId),
    where('date', '==', date)
  );

  const snapshot = await getDocs(attendanceQuery);
  const attendance: AttendanceRecord[] = [];

  snapshot.forEach((docSnapshot) => {
    attendance.push(buildAttendanceRecord(docSnapshot, date));
  });

  return attendance;
}

export async function getStudentsByIds(ids: string[]): Promise<Student[]> {
  if (!ids.length) {
    return [];
  }

  const db = getFirebaseDb();
  const studentsRef = collection(db, 'students');
  const result: Student[] = [];
  const chunkSize = 10;

  for (let i = 0; i < ids.length; i += chunkSize) {
    const chunk = ids.slice(i, i + chunkSize);
    const chunkQuery = query(studentsRef, where(documentId(), 'in', chunk));
    const snapshot = await getDocs(chunkQuery);
    snapshot.forEach((docSnapshot) => {
      const data = docSnapshot.data();
      result.push({
        id: docSnapshot.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        dateOfBirth: data.dateOfBirth || '',
        grade: data.grade || '',
        parentIds: data.parentIds || [],
        busId: data.busId || null,
        routeId: data.routeId || null,
        commune: data.commune || '',
        quartier: data.quartier || '',
        isActive: data.isActive !== false,
        photoUrl: data.photoUrl,
      });
    });
  }

  return result;
}

function buildAttendanceRecord(
  docSnapshot: QueryDocumentSnapshot<DocumentData>,
  fallbackDate: string
): AttendanceRecord {
  const data = docSnapshot.data();
  const status = (data.status || data.morningStatus || data.eveningStatus) as
    | 'present'
    | 'absent'
    | 'late'
    | 'excused'
    | undefined;
  const tripType = data.tripType as string | undefined;

  let morningStatus = data.morningStatus as AttendanceRecord['morningStatus'];
  let eveningStatus = data.eveningStatus as AttendanceRecord['eveningStatus'];

  if (!morningStatus && !eveningStatus && tripType && status) {
    if (tripType === 'morning_outbound' || tripType === 'midday_return') {
      morningStatus = status;
    } else if (tripType === 'midday_outbound' || tripType === 'evening_return') {
      eveningStatus = status;
    }
  }

  return {
    id: docSnapshot.id,
    studentId: data.studentId || '',
    busId: data.busId || '',
    date: data.date || fallbackDate,
    morningStatus,
    eveningStatus,
    status,
    tripType,
    timestamp: normalizeTimestamp(data.timestamp || data.scannedAt || data.updatedAt),
    type: data.type,
    location: data.location,
  };
}

/**
 * Convertit un timestamp Firestore en nombre (millisecondes)
 */
function normalizeTimestamp(value: unknown): number | undefined {
  if (typeof value === 'number') {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    try {
      return (value as { toMillis: () => number }).toMillis();
    } catch (err) {
      console.warn('⚠️ Impossible de convertir le timestamp Firestore:', err);
      return undefined;
    }
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  return undefined;
}
