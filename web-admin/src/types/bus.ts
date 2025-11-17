/**
 * Types pour les bus et données GPS
 */

export type BusStatus = 'EN_ROUTE' | 'EN_RETARD' | 'A_L_ARRET' | 'HORS_SERVICE';

export interface GPSPosition {
  lat: number;
  lng: number;
  speed: number;
  timestamp: number;
}

export interface GPSHistoryPoint {
  location: string;
  time: string;
  lat: number;
  lng: number;
}

export interface Incident {
  type: 'pneu_creve' | 'retard_imprevu' | 'porte_bloquee' | 'autre';
  label: string;
  date: string;
  resolved: boolean;
}

export interface MaintenanceRecord {
  type: 'vidange' | 'controle_technique' | 'reparation' | 'autre';
  label: string;
  date: string;
  status: 'scheduled' | 'approved' | 'completed' | 'pending';
  statusLabel: string;
}

export interface Bus {
  id: string;
  immatriculation: string;
  chauffeur: string;
  chauffeurId?: string;
  capacite: number;
  itineraire: string;
  photoUrl?: string;
  status: BusStatus;
  statusLabel: string;
  currentPosition?: GPSPosition;
  lastGPSUpdate?: string;
  gpsHistory?: GPSHistoryPoint[];
  incidents?: Incident[];
  maintenanceStatus: number; // Pourcentage 0-100
  maintenanceRecords?: MaintenanceRecord[];
}

export interface DashboardStats {
  busActifs: number;
  busTotaux: number;
  elevesTransportes: number;
  busEnRetard: number;
  totalTrajets: number;
  alertesMaintenance: number;
}
