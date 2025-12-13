/**
 * Hook pour récupérer le nombre d'élèves scannés et non scannés pour un bus
 */

import { useEffect, useState } from 'react';
import { getScannedStudents, getUnscannedStudents } from '@/services/students.firestore';

interface UseBusStudentsCountReturn {
  scanned: number;
  unscanned: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Récupère le nombre d'élèves scannés et non scannés pour un bus
 * @param busId ID du bus
 * @returns Nombre d'élèves scannés, non scannés et total
 */
export const useBusStudentsCount = (busId: string | null): UseBusStudentsCountReturn => {
  const [scanned, setScanned] = useState<number>(0);
  const [unscanned, setUnscanned] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!busId) {
      setScanned(0);
      setUnscanned(0);
      setTotal(0);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    // Date du jour au format YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const fetchStudentsCount = async () => {
      try {
        const [scannedStudents, unscannedStudents] = await Promise.all([
          getScannedStudents(busId, today),
          getUnscannedStudents(busId, today),
        ]);

        const scannedCount = scannedStudents.length;
        const unscannedCount = unscannedStudents.length;
        const totalCount = scannedCount + unscannedCount;

        setScanned(scannedCount);
        setUnscanned(unscannedCount);
        setTotal(totalCount);
      } catch (err) {
        console.error(`❌ Erreur lors de la récupération des élèves pour le bus ${busId}:`, err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
        // En cas d'erreur, on garde les valeurs par défaut (0)
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudentsCount();
  }, [busId]);

  return { scanned, unscanned, total, isLoading, error };
};

