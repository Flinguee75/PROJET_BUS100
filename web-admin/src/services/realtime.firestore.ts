/**
 * Service Firestore en temps réel pour le suivi des bus
 * Utilise onSnapshot pour des mises à jour instantanées
 */

import {
  collection,
  doc,
  onSnapshot,
  query,
  Unsubscribe,
  orderBy,
  limit,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { BusStatus, BusLiveStatus, type BusRealtimeData, type BusStatistics } from '../types/realtime';
import type { Alert } from '@/types/alerts';

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
        const bus = mapSnapshotToRealtimeBus(doc.id, doc.data());
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
 * Écouter les alertes en temps réel
 */
export function watchActiveAlerts(
  onUpdate: (alerts: Alert[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const db = getFirebaseDb();
  const alertsRef = collection(db, 'alerts_live');
  const alertsQuery = query(alertsRef, orderBy('timestamp', 'desc'), limit(100));

  return onSnapshot(
    alertsQuery,
    (snapshot) => {
      const alerts: Alert[] = [];

      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const alert: Alert = {
          id: docSnapshot.id,
          type: normalizeAlertType(data.type || data.category),
          busId: data.busId || data.bus_id || data.bus?.id || '',
          busNumber:
            data.busNumber ||
            data.bus_label ||
            data.bus?.number ||
            `BUS-${docSnapshot.id.slice(0, 2).toUpperCase()}`,
          severity: normalizeAlertSeverity(data.severity || data.level),
          message: data.message || data.description || 'Alerte en cours',
          timestamp: normalizeTimestamp(data.timestamp || data.createdAt || Date.now()),
        };

        alerts.push(alert);
      });

      onUpdate(alerts);
    },
    (error) => {
      console.error('❌ Erreur Firestore watchActiveAlerts:', error);
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

      const bus = mapSnapshotToRealtimeBus(snapshot.id, snapshot.data());
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

export const mapSnapshotToRealtimeBus = (id: string, data: DocumentData): BusRealtimeData => {
  return {
    id,
    number: data.number || data.busNumber || `BUS-${id.slice(0, 2).toUpperCase()}`,
    plateNumber: data.plateNumber || data.plate || id,
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
    passengersPresent: data.passengersPresent,
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
    lastUpdate: normalizeTimestampToString(data.lastUpdate || data.updatedAt || data.timestamp),
    schoolId: data.schoolId || data.school_id || null,
    tripType: data.tripType || null,
    tripLabel: data.tripLabel || null,
    tripStartTime: normalizeTimestampToMillis(data.tripStartTime),
  };
};

const ALERT_TYPES: Alert['type'][] = ['DELAY', 'STOPPED', 'UNSCANNED_CHILD'];
const ALERT_SEVERITIES: Alert['severity'][] = ['HIGH', 'MEDIUM'];

function normalizeAlertType(rawType: unknown): Alert['type'] {
  if (typeof rawType === 'string') {
    const upper = rawType.toUpperCase();
    if ((ALERT_TYPES as string[]).includes(upper)) {
      return upper as Alert['type'];
    }

    if (upper.includes('STOP')) return 'STOPPED';
    if (upper.includes('SCAN')) return 'UNSCANNED_CHILD';
    if (upper.includes('RETARD') || upper.includes('DELAY')) return 'DELAY';
  }
  return 'DELAY';
}

function normalizeAlertSeverity(rawSeverity: unknown): Alert['severity'] {
  if (typeof rawSeverity === 'string') {
    const upper = rawSeverity.toUpperCase();
    if ((ALERT_SEVERITIES as string[]).includes(upper)) {
      return upper as Alert['severity'];
    }

    if (upper.includes('HIGH') || upper.includes('CRIT')) {
      return 'HIGH';
    }
  }
  return 'MEDIUM';
}

function normalizeTimestamp(value: unknown): number {
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
    }
  }

  return Date.now();
}

/**
 * Convertit un timestamp Firestore en string ISO pour lastUpdate
 */
function normalizeTimestampToString(value: unknown): string | null {
  if (!value) return null;

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }

  // Firestore Timestamp
  if (
    value &&
    typeof value === 'object' &&
    'toMillis' in value &&
    typeof (value as { toMillis: () => number }).toMillis === 'function'
  ) {
    try {
      const millis = (value as { toMillis: () => number }).toMillis();
      return new Date(millis).toISOString();
    } catch (err) {
      console.warn('⚠️ Impossible de convertir le timestamp Firestore en string:', err);
      return null;
    }
  }

  // Firestore Timestamp avec toDate()
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      const date = (value as { toDate: () => Date }).toDate();
      return date.toISOString();
    } catch (err) {
      console.warn('⚠️ Impossible de convertir le timestamp Firestore en Date:', err);
      return null;
    }
  }

  return null;
}

function normalizeTimestampToMillis(value: unknown): number | null {
  if (!value) return null;
  if (typeof value === 'number') return value;
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
      return null;
    }
  }
  if (
    value &&
    typeof value === 'object' &&
    'toDate' in value &&
    typeof (value as { toDate: () => Date }).toDate === 'function'
  ) {
    try {
      return (value as { toDate: () => Date }).toDate().getTime();
    } catch (err) {
      console.warn('⚠️ Impossible de convertir le timestamp Firestore en Date:', err);
      return null;
    }
  }
  return null;
}

/**
 * Met à jour le statut d'un bus dans Firestore
 * @param busId ID du bus
 * @param status Nouveau statut (en_route, arrived, stopped, etc.)
 */
export const updateBusStatus = async (
  busId: string,
  status: string
): Promise<void> => {
  try {
    const db = getFirebaseDb();
    const busRef = doc(db, 'gps_live', busId);
    await updateDoc(busRef, {
      status,
      updatedAt: Date.now(),
      lastUpdate: new Date(),
    });
    console.log(`✅ Statut du bus ${busId} mis à jour: ${status}`);
  } catch (error) {
    console.error(`❌ Erreur lors de la mise à jour du statut du bus ${busId}:`, error);
    throw error;
  }
};
