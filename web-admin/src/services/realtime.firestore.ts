/**
 * Service Firestore en temps réel pour le suivi des bus
 * Utilise onSnapshot pour des mises à jour instantanées
 */

import { collection, doc, onSnapshot, query, Unsubscribe } from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { BusStatus, BusLiveStatus, type BusRealtimeData, type BusStatistics } from '../types/realtime';

/**
 * Écouter tous les bus en temps réel depuis gps_live
 */
export function watchAllBuses(
  onUpdate: (buses: BusRealtimeData[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const gpsLiveRef = collection(db, 'gps_live');

  return onSnapshot(
    query(gpsLiveRef),
    (snapshot) => {
      const buses: BusRealtimeData[] = [];

      snapshot.forEach((doc) => {
        const data = doc.data();

        // Transformer les données Firestore en format BusRealtimeData
        const bus: BusRealtimeData = {
          id: doc.id,
          number: data.number || data.busNumber || `BUS-${doc.id.slice(0, 2).toUpperCase()}`,
          plateNumber: data.plateNumber || data.plate || doc.id,
          model: data.model || 'Bus scolaire',
          year: data.year || 2020,
          capacity: data.capacity || 45,
          status: mapFirestoreToBusStatus(data.status),
          isActive: data.status === 'en_route' || data.status === 'moving',
          liveStatus: mapFirestoreToLiveStatus(data.status),
          currentPosition: data.position
            ? {
                lat: data.position.lat,
                lng: data.position.lng,
                speed: data.position.speed || 0,
                heading: data.position.heading || 0,
                timestamp: data.position.timestamp || Date.now(),
              }
            : null,
          currentZone: data.currentZone || null,
          passengersCount: data.passengersCount || 0,
          driver: data.driverId
            ? {
                id: data.driverId,
                name: data.driverName || 'Chauffeur',
                phone: data.driverPhone || '',
              }
            : null,
          route: data.routeId
            ? {
                id: data.routeId,
                name: data.routeName || 'Route',
                fromZone: data.fromZone || '',
                toZone: data.toZone || '',
              }
            : null,
          lastUpdate: data.updatedAt || data.timestamp || Date.now(),
        };

        buses.push(bus);
      });

      onUpdate(buses);
    },
    (error) => {
      console.error('❌ Erreur Firestore watchAllBuses:', error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
}

/**
 * Écouter un bus spécifique en temps réel
 */
export function watchBus(
  busId: string,
  onUpdate: (bus: BusRealtimeData | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const busRef = doc(db, 'gps_live', busId);

  return onSnapshot(
    busRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onUpdate(null);
        return;
      }

      const data = snapshot.data();
      const bus: BusRealtimeData = {
        id: snapshot.id,
        number: data.number || data.busNumber || `BUS-${snapshot.id.slice(0, 2).toUpperCase()}`,
        plateNumber: data.plateNumber || data.plate || snapshot.id,
        model: data.model || 'Bus scolaire',
        year: data.year || 2020,
        capacity: data.capacity || 45,
        status: mapFirestoreToBusStatus(data.status),
        isActive: data.status === 'en_route' || data.status === 'moving',
        liveStatus: mapFirestoreToLiveStatus(data.status),
        currentPosition: data.position
          ? {
              lat: data.position.lat,
              lng: data.position.lng,
              speed: data.position.speed || 0,
              heading: data.position.heading || 0,
              timestamp: data.position.timestamp || Date.now(),
            }
          : null,
        currentZone: data.currentZone || null,
        passengersCount: data.passengersCount || 0,
        driver: data.driverId
          ? {
              id: data.driverId,
              name: data.driverName || 'Chauffeur',
              phone: data.driverPhone || '',
            }
          : null,
        route: data.routeId
          ? {
              id: data.routeId,
              name: data.routeName || 'Route',
              fromZone: data.fromZone || '',
              toZone: data.toZone || '',
            }
          : null,
        lastUpdate: data.updatedAt || data.timestamp || Date.now(),
      };

      onUpdate(bus);
    },
    (error) => {
      console.error(`❌ Erreur Firestore watchBus(${busId}):`, error);
      if (onError) {
        onError(error as Error);
      }
    }
  );
}

/**
 * Calculer les statistiques en temps réel à partir des données des bus
 */
export function calculateStatistics(buses: BusRealtimeData[]): BusStatistics {
  const activeBuses = buses.filter((b) => b.isActive);
  const enRouteBuses = buses.filter((b) => b.liveStatus === BusLiveStatus.EN_ROUTE);
  const totalPassengers = buses.reduce((sum, b) => sum + (b.passengersCount || 0), 0);

  return {
    total: buses.length,
    active: activeBuses.length,
    inactive: buses.length - activeBuses.length,
    enRoute: enRouteBuses.length,
    stopped: buses.filter((b) => b.liveStatus === BusLiveStatus.STOPPED).length,
    totalPassengers,
  };
}

/**
 * Mapper le statut Firestore vers BusStatus enum
 */
function mapFirestoreToBusStatus(status: string | undefined): BusStatus {
  const isActive = status === 'en_route' || status === 'moving';
  return isActive ? BusStatus.ACTIVE : BusStatus.INACTIVE;
}

/**
 * Mapper le statut Firestore vers BusLiveStatus enum
 */
function mapFirestoreToLiveStatus(status: string | undefined): BusLiveStatus | null {
  switch (status) {
    case 'en_route':
    case 'moving':
      return BusLiveStatus.EN_ROUTE;
    case 'stopped':
    case 'a_l_arret':
      return BusLiveStatus.STOPPED;
    case 'idle':
    case 'attente':
      return BusLiveStatus.IDLE;
    case 'delayed':
    case 'en_retard':
      return BusLiveStatus.DELAYED;
    case 'arrived':
    case 'arrive':
      return BusLiveStatus.ARRIVED;
    default:
      return null;
  }
}
