/**
 * Types pour la gestion des bus
 * Définit les structures de données pour les bus du système de transport scolaire
 */

export interface Bus {
  id: string;
  busNumber: number; // Numéro du bus (1, 2, 3, 4...)
  plateNumber: string; // Numéro d'immatriculation
  capacity: number; // Capacité totale de passagers
  model: string; // Modèle du bus
  year: number; // Année de fabrication
  driverId: string | null; // ID du chauffeur assigné
  driverName?: string | null; // Nom du chauffeur (enrichi)
  routeId: string | null; // ID du parcours assigné
  status: BusStatus;
  maintenanceStatus: BusMaintenanceStatus;

  // Champs pour génération automatique de routes
  assignedCommune?: string; // Commune d'opération principale
  assignedQuartiers?: string[]; // Sous-zones optionnelles
  preferredDepartureTime?: string; // Heure de départ du matin (ex: "07:00")

  createdAt: Date;
  updatedAt: Date;
}

export enum BusStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  IN_MAINTENANCE = 'in_maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum BusMaintenanceStatus {
  OK = 'ok',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface BusCreateInput {
  busNumber: number;
  plateNumber: string;
  capacity: number;
  model: string;
  year: number;
}

export interface BusUpdateInput {
  busNumber?: number;
  plateNumber?: string;
  capacity?: number;
  model?: string;
  year?: number;
  driverId?: string | null;
  routeId?: string | null;
  status?: BusStatus;
  maintenanceStatus?: BusMaintenanceStatus;
  assignedCommune?: string;
  assignedQuartiers?: string[];
  preferredDepartureTime?: string;
}
