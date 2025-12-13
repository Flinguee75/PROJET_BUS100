/**
 * Types pour le tracking GPS
 * Gère les positions en temps réel et l'historique des déplacements
 */

export interface GPSPosition {
  lat: number; // Latitude (WGS84)
  lng: number; // Longitude (WGS84)
  speed: number; // Vitesse en km/h
  heading?: number; // Direction en degrés (0-360)
  accuracy?: number; // Précision GPS en mètres
  timestamp: number; // Timestamp Unix en millisecondes
}

export interface GPSLiveData {
  busId: string;
  position: GPSPosition;
  driverId: string;
  routeId: string | null;
  status: BusLiveStatus;
  passengersCount: number; // Nombre actuel de passagers
  lastUpdate: Date;
}

export enum BusLiveStatus {
  IDLE = 'idle', // En attente
  EN_ROUTE = 'en_route', // En route
  STOPPED = 'stopped', // Arrêté
  DELAYED = 'delayed', // En retard
  ARRIVED = 'arrived', // Arrivé
}

export interface GPSHistoryEntry {
  busId: string;
  position: GPSPosition;
  timestamp: Date;
  eventType?: GPSEventType;
}

export enum GPSEventType {
  DEPARTURE = 'departure', // Départ
  ARRIVAL = 'arrival', // Arrivée
  STOP = 'stop', // Arrêt
  ROUTE_DEVIATION = 'route_deviation', // Déviation du parcours
}

export interface GPSUpdateInput {
  busId: string;
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  accuracy?: number;
  timestamp: number;
}

export interface GPSHistoryQuery {
  busId: string;
  startDate: Date;
  endDate: Date;
}

// Note: BusRealtimeData, DriverInfo, RouteInfo sont définis dans realtime.types.ts
