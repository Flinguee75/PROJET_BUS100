/**
 * API Service Driver - Opérations CRUD pour les chauffeurs
 * Utilise axios avec authentification automatique
 */

import api from './gps.api';

export interface DriverCreateInput {
  email: string;
  displayName: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseExpiry: string; // ISO string
  photoUrl?: string;
}

export interface DriverUpdateInput {
  displayName?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  busId?: string | null;
  photoUrl?: string;
  isActive?: boolean;
}

export interface Driver {
  id: string;
  email: string;
  displayName: string;
  phoneNumber: string;
  role: 'driver';
  licenseNumber: string;
  licenseExpiry: string;
  busId: string | null;
  photoUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Crée un nouveau chauffeur
 */
export const createDriver = async (data: DriverCreateInput): Promise<Driver> => {
  try {
    const response = await api.post('/api/drivers', data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error creating driver:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la création du chauffeur'
    );
  }
};

/**
 * Récupère tous les chauffeurs
 */
export const getAllDrivers = async (): Promise<Driver[]> => {
  try {
    const response = await api.get('/api/drivers');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching drivers:', error);
    throw new Error('Erreur lors de la récupération des chauffeurs');
  }
};

/**
 * Récupère les chauffeurs disponibles (sans bus assigné)
 */
export const getAvailableDrivers = async (): Promise<Driver[]> => {
  try {
    const response = await api.get('/api/drivers?available=true');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching available drivers:', error);
    throw new Error('Erreur lors de la récupération des chauffeurs disponibles');
  }
};

/**
 * Récupère un chauffeur par son ID
 */
export const getDriverById = async (id: string): Promise<Driver> => {
  try {
    const response = await api.get(`/api/drivers/${id}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching driver:', error);
    throw new Error('Chauffeur introuvable');
  }
};

/**
 * Récupère le chauffeur assigné à un bus
 */
export const getDriverByBus = async (busId: string): Promise<Driver | null> => {
  try {
    const response = await api.get(`/api/drivers/bus/${busId}`);
    return response.data.data;
  } catch (error: unknown) {
    // 404 si pas de chauffeur - retourner null au lieu d'une erreur
    const err = error as { response?: { status?: number } };
    if (err.response?.status === 404) {
      return null;
    }
    console.error('Error fetching driver by bus:', error);
    throw new Error('Erreur lors de la récupération du chauffeur');
  }
};

/**
 * Récupère les chauffeurs avec permis expiré
 */
export const getDriversWithExpiredLicense = async (): Promise<Driver[]> => {
  try {
    const response = await api.get('/api/drivers/expired-licenses');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching drivers with expired license:', error);
    throw new Error('Erreur lors de la récupération des permis expirés');
  }
};

/**
 * Met à jour un chauffeur existant
 */
export const updateDriver = async (
  id: string,
  data: DriverUpdateInput
): Promise<Driver> => {
  try {
    const response = await api.patch(`/api/drivers/${id}`, data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error updating driver:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la mise à jour du chauffeur'
    );
  }
};

/**
 * Supprime un chauffeur (soft delete)
 */
export const deleteDriver = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/drivers/${id}`);
  } catch (error: unknown) {
    console.error('Error deleting driver:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la suppression du chauffeur'
    );
  }
};

/**
 * Assigne un chauffeur à un bus
 */
export const assignDriverToBus = async (
  driverId: string,
  busId: string
): Promise<Driver> => {
  try {
    const response = await api.post(`/api/drivers/${driverId}/assign-bus`, {
      busId,
    });
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error assigning driver to bus:', error);
    throw new Error('Erreur lors de l\'assignation du chauffeur au bus');
  }
};

/**
 * Retire un chauffeur d'un bus
 */
export const removeDriverFromBus = async (driverId: string): Promise<Driver> => {
  try {
    const response = await api.post(`/api/drivers/${driverId}/remove-bus`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error removing driver from bus:', error);
    throw new Error('Erreur lors du retrait du chauffeur du bus');
  }
};

