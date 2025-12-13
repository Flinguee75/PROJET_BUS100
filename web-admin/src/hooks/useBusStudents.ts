/**
 * Custom React hooks pour les étudiants d'un bus et leur attendance
 */

import { useEffect, useState } from 'react';
import {
  watchBusStudents,
  getBusStudents,
  watchBusAttendance,
  getScannedStudents,
  getUnscannedStudents,
  type Student,
  type AttendanceRecord,
} from '@/services/students.firestore';

/**
 * Hook pour récupérer les étudiants d'un bus en temps réel
 */
export function useBusStudents(busId: string | null) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!busId) {
      setStudents([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = watchBusStudents(
      busId,
      (updatedStudents) => {
        setStudents(updatedStudents);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [busId]);

  return { students, isLoading, error };
}

/**
 * Hook pour récupérer les scans d'un bus pour une date donnée
 */
export function useBusAttendance(busId: string | null, date?: string) {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Utiliser la date du jour par défaut si non fournie
  const targetDate =
    date || new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

  useEffect(() => {
    if (!busId) {
      setAttendance([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    const unsubscribe = watchBusAttendance(
      busId,
      targetDate,
      (updatedAttendance) => {
        setAttendance(updatedAttendance);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [busId, targetDate]);

  return { attendance, isLoading, error };
}

/**
 * Hook pour récupérer les étudiants scannés d'un bus
 */
export function useScannedStudents(busId: string | null, date?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const targetDate =
    date || new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

  useEffect(() => {
    if (!busId) {
      setStudents([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    getScannedStudents(busId, targetDate)
      .then((scannedStudents) => {
        setStudents(scannedStudents);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err as Error);
        setIsLoading(false);
      });
  }, [busId, targetDate]);

  return { students, isLoading, error };
}

/**
 * Hook pour récupérer les étudiants non scannés d'un bus
 */
export function useUnscannedStudents(busId: string | null, date?: string) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const targetDate =
    date || new Date().toISOString().split('T')[0]; // Format YYYY-MM-DD

  useEffect(() => {
    if (!busId) {
      setStudents([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    getUnscannedStudents(busId, targetDate)
      .then((unscannedStudents) => {
        setStudents(unscannedStudents);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err as Error);
        setIsLoading(false);
      });
  }, [busId, targetDate]);

  return { students, isLoading, error };
}

/**
 * Hook pour récupérer les étudiants d'un bus (one-shot, pas en temps réel)
 * Utile pour les cas où on n'a pas besoin de mises à jour en temps réel
 */
export function useBusStudentsOnce(busId: string | null) {
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!busId) {
      setStudents([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);

    getBusStudents(busId)
      .then((busStudents) => {
        setStudents(busStudents);
        setIsLoading(false);
        setError(null);
      })
      .catch((err) => {
        setError(err as Error);
        setIsLoading(false);
      });
  }, [busId]);

  return { students, isLoading, error };
}

