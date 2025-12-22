/**
 * Types pour les données en temps réel de la carte
 */

export interface GPSPosition {
  lat: number;
  lng: number;
  speed: number;
  heading?: number;
  accuracy?: number;
  timestamp: number;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
}

export interface RouteInfo {
  id: string;
  name: string;
  fromZone: string;
  toZone: string;
}

export enum BusStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  IN_MAINTENANCE = 'in_maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum BusLiveStatus {
  IDLE = 'idle',
  EN_ROUTE = 'en_route',
  STOPPED = 'stopped',
  DELAYED = 'delayed',
  ARRIVED = 'arrived',
}

export interface BusRealtimeData {
  id: string;
  number: string; // Format: BUS-XX (ex: BUS-12, BUS-45)
  plateNumber: string;
  capacity: number;
  model: string;
  year: number;
  status: BusStatus;
  currentPosition: GPSPosition | null;
  liveStatus: BusLiveStatus | null;
  driver: DriverInfo | null;
  route: RouteInfo | null;
  passengersCount: number;
  passengersPresent?: number; // Nombre d'élèves présents actuellement
  currentZone: string | null;
  lastUpdate: string | null;
  isActive: boolean;
  schoolId?: string | null;
  tripType?: string | null;
  tripLabel?: string | null;
  tripStartTime?: number | null;
  
  // Phase 4: Tracking du ramassage en temps réel
  lastScan?: {
    studentId: string;
    studentName: string;
    timestamp: number;
    type: 'boarding' | 'alighting';
    location?: { lat: number; lng: number };
  };
  currentTrip?: {
    tripType: string;
    routeId: string;
    startTime: number;
    scannedStudentIds: string[];
    totalStudentCount: number;
  };
}

export interface BusStatistics {
  total: number;
  active: number;
  inactive: number;
  enRoute: number;
  stopped: number;
  totalPassengers: number;
}
