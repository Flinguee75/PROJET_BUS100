/**
 * Hooks pour récupérer les informations d'une école et de sa flotte
 */

import { useEffect, useState } from 'react';
import { watchSchool, watchSchoolBuses } from '@/services/school.firestore';
import type { School } from '@/types/school';
import type { BusRealtimeData } from '@/types/realtime';

interface UseSchoolReturn {
  school: School | null;
  isLoading: boolean;
  error: string | null;
}

interface UseSchoolBusesReturn {
  buses: BusRealtimeData[];
  isLoading: boolean;
  error: string | null;
}

export const useSchool = (schoolId?: string | null): UseSchoolReturn => {
  const [school, setSchool] = useState<School | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(schoolId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setSchool(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = watchSchool(
      schoolId,
      (updatedSchool) => {
        setSchool(updatedSchool);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [schoolId]);

  return { school, isLoading, error };
};

export const useSchoolBuses = (schoolId?: string | null): UseSchoolBusesReturn => {
  const [buses, setBuses] = useState<BusRealtimeData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(schoolId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!schoolId) {
      setBuses([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    const unsubscribe = watchSchoolBuses(
      schoolId,
      (updatedBuses) => {
        setBuses(updatedBuses);
        setIsLoading(false);
      },
      (err) => {
        setError(err.message);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [schoolId]);

  return { buses, isLoading, error };
};

