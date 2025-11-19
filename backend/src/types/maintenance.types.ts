/**
 * Types pour la gestion des maintenances
 * Définit les structures de données pour le suivi des problèmes et maintenances des bus
 */

export interface Maintenance {
  id: string;
  busId: string; // ID du bus concerné
  type: MaintenanceType;
  severity: MaintenanceSeverity;
  title: string; // Titre court du problème
  description: string; // Description détaillée
  reportedBy: string; // ID de l'utilisateur qui a signalé
  reportedAt: Date; // Date de signalement
  status: MaintenanceStatus;
  scheduledDate?: Date; // Date prévue pour la maintenance
  completedDate?: Date; // Date de fin de maintenance
  cost?: number; // Coût estimé ou réel
  notes?: string; // Notes additionnelles
  createdAt: Date;
  updatedAt: Date;
}

export enum MaintenanceType {
  MECHANICAL = 'mechanical', // Problème mécanique (moteur, freins, etc.)
  ELECTRICAL = 'electrical', // Problème électrique
  TIRE = 'tire', // Problème de pneus
  BODY = 'body', // Carrosserie, vitres
  SAFETY = 'safety', // Équipements de sécurité
  CLEANING = 'cleaning', // Nettoyage
  INSPECTION = 'inspection', // Inspection périodique
  OTHER = 'other', // Autre
}

export enum MaintenanceSeverity {
  LOW = 'low', // Faible - peut attendre
  MEDIUM = 'medium', // Moyen - à planifier rapidement
  HIGH = 'high', // Élevé - urgent
  CRITICAL = 'critical', // Critique - immobilise le bus
}

export enum MaintenanceStatus {
  REPORTED = 'reported', // Signalé, en attente
  SCHEDULED = 'scheduled', // Planifié
  IN_PROGRESS = 'in_progress', // En cours
  COMPLETED = 'completed', // Terminé
  CANCELLED = 'cancelled', // Annulé
}

export interface MaintenanceCreateInput {
  busId: string;
  type: MaintenanceType;
  severity: MaintenanceSeverity;
  title: string;
  description: string;
  reportedBy: string;
  scheduledDate?: Date;
  cost?: number;
  notes?: string;
}

export interface MaintenanceUpdateInput {
  type?: MaintenanceType;
  severity?: MaintenanceSeverity;
  title?: string;
  description?: string;
  status?: MaintenanceStatus;
  scheduledDate?: Date;
  completedDate?: Date;
  cost?: number;
  notes?: string;
}

export interface MaintenanceFilter {
  busId?: string;
  status?: MaintenanceStatus;
  severity?: MaintenanceSeverity;
  type?: MaintenanceType;
}
