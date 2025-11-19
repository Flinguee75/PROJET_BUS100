/**
 * API Service Maintenance - Opérations CRUD pour les maintenances
 * Utilise axios avec authentification automatique
 */

import api from './gps.api';

export enum MaintenanceType {
  MECHANICAL = 'mechanical',
  ELECTRICAL = 'electrical',
  TIRE = 'tire',
  BODY = 'body',
  SAFETY = 'safety',
  CLEANING = 'cleaning',
  INSPECTION = 'inspection',
  OTHER = 'other',
}

export enum MaintenanceSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MaintenanceStatus {
  REPORTED = 'reported',
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
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

export interface MaintenanceBackend {
  id: string;
  busId: string;
  type: MaintenanceType;
  severity: MaintenanceSeverity;
  title: string;
  description: string;
  reportedBy: string;
  reportedAt: Date;
  status: MaintenanceStatus;
  scheduledDate?: Date;
  completedDate?: Date;
  cost?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MaintenanceFilter {
  busId?: string;
  status?: MaintenanceStatus;
  severity?: MaintenanceSeverity;
  type?: MaintenanceType;
}

/**
 * Crée un nouveau rapport de maintenance
 */
export const createMaintenance = async (
  data: MaintenanceCreateInput
): Promise<MaintenanceBackend> => {
  try {
    const response = await api.post('/api/maintenances', data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error creating maintenance:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de créer le rapport de maintenance'
    );
  }
};

/**
 * Récupère toutes les maintenances avec filtres optionnels
 */
export const getAllMaintenances = async (
  filter?: MaintenanceFilter
): Promise<MaintenanceBackend[]> => {
  try {
    const response = await api.get('/api/maintenances', { params: filter });
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching maintenances:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de récupérer les maintenances'
    );
  }
};

/**
 * Récupère les maintenances actives
 */
export const getActiveMaintenances = async (): Promise<MaintenanceBackend[]> => {
  try {
    const response = await api.get('/api/maintenances/active');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching active maintenances:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de récupérer les maintenances actives'
    );
  }
};

/**
 * Récupère une maintenance par son ID
 */
export const getMaintenanceById = async (
  maintenanceId: string
): Promise<MaintenanceBackend> => {
  try {
    const response = await api.get(`/api/maintenances/${maintenanceId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching maintenance:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de récupérer la maintenance'
    );
  }
};

/**
 * Récupère les maintenances d'un bus spécifique
 */
export const getMaintenancesByBusId = async (
  busId: string
): Promise<MaintenanceBackend[]> => {
  try {
    const response = await api.get(`/api/maintenances/bus/${busId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching bus maintenances:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de récupérer les maintenances du bus'
    );
  }
};

/**
 * Met à jour une maintenance
 */
export const updateMaintenance = async (
  maintenanceId: string,
  data: MaintenanceUpdateInput
): Promise<MaintenanceBackend> => {
  try {
    const response = await api.put(`/api/maintenances/${maintenanceId}`, data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error updating maintenance:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de mettre à jour la maintenance'
    );
  }
};

/**
 * Supprime une maintenance
 */
export const deleteMaintenance = async (maintenanceId: string): Promise<void> => {
  try {
    await api.delete(`/api/maintenances/${maintenanceId}`);
  } catch (error: unknown) {
    console.error('Error deleting maintenance:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de supprimer la maintenance'
    );
  }
};
