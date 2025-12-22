/**
 * API Service Bus - Opérations CRUD pour les bus
 * Utilise axios avec authentification automatique
 */

import api from './gps.api';

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
  status?: string;
  maintenanceStatus?: string;
  assignedCommune?: string;
  assignedQuartiers?: string[];
  preferredDepartureTime?: string;
}

export interface BusBackend {
  id: string;
  busNumber: number;
  plateNumber: string;
  capacity: number;
  model: string;
  year: number;
  status: string;
  maintenanceStatus: string;
  driverId: string | null;
  driverName?: string | null;
  routeId: string | null;
  assignedCommune?: string;
  assignedQuartiers?: string[];
  preferredDepartureTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Crée un nouveau bus
 */
export const createBus = async (data: BusCreateInput): Promise<BusBackend> => {
  try {
    const response = await api.post('/api/buses', data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error creating bus:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de créer le bus'
    );
  }
};

/**
 * Récupère tous les bus
 * @param includeLive - Inclure les positions GPS en temps réel
 */
export const getAllBuses = async (includeLive = false): Promise<BusBackend[]> => {
  try {
    const response = await api.get('/api/buses', {
      params: { live: includeLive },
    });
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching buses:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de récupérer les bus'
    );
  }
};

/**
 * Récupère un bus par son ID
 */
export const getBusById = async (busId: string): Promise<BusBackend> => {
  try {
    const response = await api.get(`/api/buses/${busId}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching bus:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de récupérer le bus'
    );
  }
};

/**
 * Met à jour un bus
 */
export const updateBus = async (
  busId: string,
  data: BusUpdateInput
): Promise<BusBackend> => {
  try {
    const response = await api.put(`/api/buses/${busId}`, data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error updating bus:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de mettre à jour le bus'
    );
  }
};

/**
 * Supprime un bus
 */
export const deleteBus = async (busId: string): Promise<void> => {
  try {
    await api.delete(`/api/buses/${busId}`);
  } catch (error: unknown) {
    console.error('Error deleting bus:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Impossible de supprimer le bus'
    );
  }
};

/**
 * Interface pour les informations du prochain élève à scanner
 */
export interface NextStudentInfo {
  studentId: string;
  studentName: string;
  stopOrder: number;
}

/**
 * Récupère le prochain élève à scanner pour un bus
 * Retourne null si tous les élèves ont été scannés
 */
export const getNextStudent = async (busId: string): Promise<NextStudentInfo | null> => {
  try {
    const response = await api.get(`/api/buses/${busId}/next-student`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching next student:', error);
    return null; // Retourner null en cas d'erreur plutôt que de throw
  }
};

