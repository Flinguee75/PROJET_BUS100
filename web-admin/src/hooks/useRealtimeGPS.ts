/**
 * Hook personnalisé pour écouter les positions GPS en temps réel
 * Utilise Firestore onSnapshot pour les mises à jour temps réel
 */

import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, Unsubscribe } from 'firebase/firestore';
import { db } from '@/services/firebase';
import type { Bus, BusStatus, GPSPosition } from '@/types/bus';

interface UseRealtimeGPSReturn {
  buses: Bus[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook pour écouter les positions GPS en temps réel de tous les bus
 */
export const useRealtimeGPS = (): UseRealtimeGPSReturn => {
  const [buses, setBuses] = useState<Bus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    const setupRealtimeListener = async () => {
      try {
        // Écouter la collection gps_live
        const gpsLiveRef = collection(db, 'gps_live');
        const q = query(gpsLiveRef);

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const updatedBuses: Bus[] = [];

            snapshot.forEach((doc) => {
              const data = doc.data();
              
              // Construire l'objet Bus à partir des données Firestore
              const bus: Bus = {
                id: doc.id,
                immatriculation: data.immatriculation || data.plateNumber || doc.id,
                chauffeur: data.chauffeur || data.driverName || 'Non assigné',
                chauffeurId: data.chauffeurId || data.driverId,
                capacite: data.capacite || data.capacity || 0,
                itineraire: data.itineraire || data.routeId || 'Non défini',
                status: determineStatus(data),
                statusLabel: getStatusLabel(determineStatus(data)),
                currentPosition: data.position
                  ? {
                      lat: data.position.lat,
                      lng: data.position.lng,
                      speed: data.position.speed || 0,
                      timestamp: data.position.timestamp || Date.now(),
                    }
                  : undefined,
                lastGPSUpdate: data.lastGPSUpdate || formatLastUpdate(data.lastUpdate),
                maintenanceStatus: data.maintenanceStatus || 85,
              };

              updatedBuses.push(bus);
            });

            setBuses(updatedBuses);
            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error('Erreur lors de l\'écoute GPS temps réel:', err);
            setError('Impossible de récupérer les positions GPS en temps réel');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Erreur lors de la configuration du listener:', err);
        setError('Erreur de configuration du listener temps réel');
        setLoading(false);
      }
    };

    setupRealtimeListener();

    // Nettoyage lors du démontage
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, []);

  return { buses, loading, error };
};

/**
 * Détermine le statut du bus en fonction des données
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const determineStatus = (data: any): BusStatus => {
  if (data.status) {
    return data.status as BusStatus;
  }

  // Logique de détermination du statut si non fourni
  const lastUpdate = data.lastUpdate || 0;
  const now = Date.now();
  const timeSinceUpdate = now - lastUpdate;

  // Si pas de mise à jour depuis plus de 5 minutes
  if (timeSinceUpdate > 5 * 60 * 1000) {
    return 'HORS_SERVICE';
  }

  // Si vitesse proche de 0
  if (data.position?.speed !== undefined && data.position.speed < 1) {
    return 'A_L_ARRET';
  }

  return 'EN_ROUTE';
};

/**
 * Obtient le label du statut
 */
const getStatusLabel = (status: BusStatus): string => {
  switch (status) {
    case 'EN_ROUTE':
      return 'EN ROUTE';
    case 'EN_RETARD':
      return 'EN RETARD';
    case 'A_L_ARRET':
      return "À L'ARRÊT";
    case 'HORS_SERVICE':
      return 'HORS SERVICE';
    default:
      return status;
  }
};

/**
 * Formate le dernier timestamp en texte lisible
 */
const formatLastUpdate = (timestamp?: number): string => {
  if (!timestamp) return 'Jamais';
  
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  
  return `${hours}:${minutes} AM`;
};

/**
 * Hook pour écouter la position d'un bus spécifique
 */
export const useRealtimeBusPosition = (busId: string): {
  position: GPSPosition | null;
  loading: boolean;
  error: string | null;
} => {
  const [position, setPosition] = useState<GPSPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!busId) {
      setLoading(false);
      return;
    }

    let unsubscribe: Unsubscribe | null = null;

    const setupListener = async () => {
      try {
        const gpsLiveRef = collection(db, 'gps_live');
        const q = query(gpsLiveRef);

        unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const busDoc = snapshot.docs.find((doc) => doc.id === busId);
            
            if (busDoc) {
              const data = busDoc.data();
              if (data.position) {
                setPosition({
                  lat: data.position.lat,
                  lng: data.position.lng,
                  speed: data.position.speed || 0,
                  timestamp: data.position.timestamp || Date.now(),
                });
              }
            }

            setLoading(false);
            setError(null);
          },
          (err) => {
            console.error('Erreur lors de l\'écoute de la position:', err);
            setError('Impossible de récupérer la position du bus');
            setLoading(false);
          }
        );
      } catch (err) {
        console.error('Erreur lors de la configuration du listener:', err);
        setError('Erreur de configuration du listener');
        setLoading(false);
      }
    };

    setupListener();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [busId]);

  return { position, loading, error };
};
