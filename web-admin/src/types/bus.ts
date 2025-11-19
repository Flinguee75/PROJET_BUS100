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
  number: string; // Format: BUS-XX (ex: BUS-12, BUS-45)
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
  // Métriques de base
  busActifs: number;
  busTotaux: number;
  elevesTransportes: number;
  busEnRetard: number;
  totalTrajets: number;
  alertesMaintenance: number;
  
  // Nouvelles métriques opérationnelles (contexte Abidjan)
  retardsCritiques: number; // Retards > 15 minutes
  retardsGraves: number; // Retards > 20 minutes
  busImmobilises: number; // Bus en panne/hors service
  busDisponibles: number; // Bus disponibles (totaux - immobilisés)
  tauxValidation: number; // Pourcentage élèves scannés (0-100)
  elevesNonScannes: number; // Nombre élèves non scannés
  
  // État détaillé du service
  busEnRoute: number; // Bus actuellement en déplacement
  busArrives: number; // Bus arrivés à destination
  busNonPartis: number; // Bus n'ayant pas encore démarré
  busEnAttente: number; // Bus à l'arrêt (attente élèves)
  
  // Métriques de performance (trafic vs prévision)
  retardMoyen: number; // Retard moyen en minutes
  tauxPonctualite: number; // % de bus à l'heure (0-100)
  tempsTrajetMoyen: number; // Temps de trajet moyen (minutes)
  tempsTrajetPrevu: number; // Temps prévu initialement
}
