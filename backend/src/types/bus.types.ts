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
  escortId: string | null; // ID du convoyeur assigné
  escortName?: string | null; // Nom du convoyeur (enrichi)
  routeId: string | null; // ID du parcours assigné
  studentIds: string[]; // Liste des élèves assignés
  status: BusStatus;
  maintenanceStatus: BusMaintenanceStatus;

  // Champs pour génération automatique de routes
  assignedCommune?: string; // Commune d'opération principale
  assignedQuartiers?: string[]; // Sous-zones optionnelles
  preferredDepartureTime?: string; // Heure de départ du matin (ex: "07:00")
  schoolId: string | null; // ID de l'école affiliée

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
  schoolId?: string | null; // Optionnel lors de la création
}

export interface BusUpdateInput {
  busNumber?: number;
  plateNumber?: string;
  capacity?: number;
  model?: string;
  year?: number;
  driverId?: string | null;
  escortId?: string | null;
  routeId?: string | null;
  studentIds?: string[];
  status?: BusStatus;
  maintenanceStatus?: BusMaintenanceStatus;
  assignedCommune?: string;
  assignedQuartiers?: string[];
  preferredDepartureTime?: string;
  schoolId?: string | null;
}
