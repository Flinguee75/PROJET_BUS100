import { useEffect, useState } from 'react';
import { watchActiveAlerts } from '@/services/realtime.firestore';
import type { Alert } from '@/types/alerts';

export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setIsLoading(true);

    const unsubscribe = watchActiveAlerts(
      (updatedAlerts) => {
        setAlerts(updatedAlerts);
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
  }, []);

  return { alerts, isLoading, error };
}
