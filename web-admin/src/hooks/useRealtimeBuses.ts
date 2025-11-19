/**
 * Custom React hooks pour les données en temps réel via Firestore
 */

import { useEffect, useState } from 'react';
import { watchAllBuses, calculateStatistics } from '@/services/realtime.firestore';
import type { BusRealtimeData, BusStatistics } from '@/types/realtime';

/**
 * Hook pour écouter tous les bus en temps réel
 */
export function useRealtimeBuses() {
  const [buses, setBuses] = useState<BusRealtimeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = watchAllBuses(
      (updatedBuses) => {
        setBuses(updatedBuses);
        setIsLoading(false);
        setError(null);
      },
      (err) => {
        setError(err);
        setIsLoading(false);
      }
    );

    // Cleanup: se désabonner quand le composant est démonté
    return () => {
      unsubscribe();
    };
  }, []);

  return { buses, isLoading, error };
}

/**
 * Hook pour calculer les statistiques en temps réel à partir des bus
 */
export function useRealtimeStatistics() {
  const { buses, isLoading, error } = useRealtimeBuses();
  const [stats, setStats] = useState<BusStatistics | null>(null);

  useEffect(() => {
    if (!isLoading && buses.length > 0) {
      const calculatedStats = calculateStatistics(buses);
      setStats(calculatedStats);
    }
  }, [buses, isLoading]);

  return { stats, isLoading, error };
}
