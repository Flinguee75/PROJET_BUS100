/**
 * Types pour la gestion des bus
 * Définit les structures de données pour les bus du système de transport scolaire
 */

export interface Bus {
  id: string;
  plateNumber: string; // Numéro d'immatriculation
  capacity: number; // Capacité totale de passagers
  model: string; // Modèle du bus
  year: number; // Année de fabrication
  driverId: string | null; // ID du chauffeur assigné
  routeId: string | null; // ID du parcours assigné
  status: BusStatus;
  maintenanceStatus: MaintenanceStatus;
  createdAt: Date;
  updatedAt: Date;
}

export enum BusStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  IN_MAINTENANCE = 'in_maintenance',
  OUT_OF_SERVICE = 'out_of_service',
}

export enum MaintenanceStatus {
  OK = 'ok',
  WARNING = 'warning',
  CRITICAL = 'critical',
}

export interface BusCreateInput {
  plateNumber: string;
  capacity: number;
  model: string;
  year: number;
}

export interface BusUpdateInput {
  plateNumber?: string;
  capacity?: number;
  model?: string;
  year?: number;
  driverId?: string | null;
  routeId?: string | null;
  status?: BusStatus;
  maintenanceStatus?: MaintenanceStatus;
}
