/**
 * API Service Route - Opérations CRUD pour les routes géographiques
 * Système adapté pour Abidjan (Côte d'Ivoire)
 */

import api from './gps.api';

export enum CommuneAbidjan {
  COCODY = 'Cocody',
  YOPOUGON = 'Yopougon',
  ABOBO = 'Abobo',
  ADJAME = 'Adjamé',
  PLATEAU = 'Plateau',
  MARCORY = 'Marcory',
  KOUMASSI = 'Koumassi',
  PORT_BOUET = 'Port-Bouët',
  TREICHVILLE = 'Treichville',
  ATTÉCOUBÉ = 'Attécoubé',
  BINGERVILLE = 'Bingerville',
  SONGON = 'Songon',
  ANYAMA = 'Anyama',
}

export interface RouteStop {
  id: string;
  name: string;
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  order: number;
  estimatedTimeMinutes: number;
  type: 'pickup' | 'dropoff' | 'both';
  quartier: string;
  notes?: string;
}

export interface Route {
  id: string;
  name: string;
  code: string;
  description?: string;
  commune: CommuneAbidjan;
  quartiers: string[];
  stops: RouteStop[];
  schedule: {
    morningDeparture: string;
    morningArrival: string;
    afternoonDeparture: string;
    afternoonArrival: string;
  };
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  capacity: number;
  currentOccupancy: number;
  busId: string | null;
  driverId: string | null;
  activeDays: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RouteCreateInput {
  name: string;
  code: string;
  description?: string;
  commune: CommuneAbidjan;
  quartiers: string[];
  stops: Omit<RouteStop, 'id'>[];
  schedule: {
    morningDeparture: string;
    morningArrival: string;
    afternoonDeparture: string;
    afternoonArrival: string;
  };
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  capacity: number;
  activeDays: string[];
}

export interface RouteUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  commune?: CommuneAbidjan;
  quartiers?: string[];
  stops?: Omit<RouteStop, 'id'>[];
  schedule?: {
    morningDeparture: string;
    morningArrival: string;
    afternoonDeparture: string;
    afternoonArrival: string;
  };
  totalDistanceKm?: number;
  estimatedDurationMinutes?: number;
  capacity?: number;
  busId?: string | null;
  driverId?: string | null;
  activeDays?: string[];
  isActive?: boolean;
}

/**
 * Récupère toutes les routes
 */
export const getAllRoutes = async (): Promise<Route[]> => {
  try {
    const response = await api.get('/api/routes');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching routes:', error);
    throw new Error('Erreur lors de la récupération des routes');
  }
};

/**
 * Récupère les routes d'une commune
 */
export const getRoutesByCommune = async (commune: CommuneAbidjan): Promise<Route[]> => {
  try {
    const response = await api.get(`/api/routes?commune=${commune}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching routes by commune:', error);
    throw new Error('Erreur lors de la récupération des routes');
  }
};

/**
 * Récupère les routes qui desservent un quartier
 */
export const getRoutesByQuartier = async (quartier: string): Promise<Route[]> => {
  try {
    const response = await api.get(`/api/routes?quartier=${quartier}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching routes by quartier:', error);
    throw new Error('Erreur lors de la récupération des routes');
  }
};

/**
 * Récupère les routes actives
 */
export const getActiveRoutes = async (): Promise<Route[]> => {
  try {
    const response = await api.get('/api/routes?active=true');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching active routes:', error);
    throw new Error('Erreur lors de la récupération des routes actives');
  }
};

/**
 * Récupère les routes disponibles (avec places)
 */
export const getAvailableRoutes = async (): Promise<Route[]> => {
  try {
    const response = await api.get('/api/routes/available');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching available routes:', error);
    throw new Error('Erreur lors de la récupération des routes disponibles');
  }
};

/**
 * Récupère la liste des communes
 */
export const getCommunes = async (): Promise<string[]> => {
  try {
    const response = await api.get('/api/routes/communes');
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching communes:', error);
    throw new Error('Erreur lors de la récupération des communes');
  }
};

/**
 * Récupère les quartiers d'une commune
 */
export const getQuartiersByCommune = async (commune: string): Promise<string[]> => {
  try {
    const response = await api.get(`/api/routes/quartiers/${commune}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching quartiers:', error);
    throw new Error('Erreur lors de la récupération des quartiers');
  }
};

/**
 * Récupère une route par son ID
 */
export const getRouteById = async (id: string): Promise<Route> => {
  try {
    const response = await api.get(`/api/routes/${id}`);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error fetching route:', error);
    throw new Error('Route introuvable');
  }
};

/**
 * Crée une nouvelle route
 */
export const createRoute = async (data: RouteCreateInput): Promise<Route> => {
  try {
    const response = await api.post('/api/routes', data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error creating route:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la création de la route'
    );
  }
};

/**
 * Met à jour une route
 */
export const updateRoute = async (
  id: string,
  data: RouteUpdateInput
): Promise<Route> => {
  try {
    const response = await api.patch(`/api/routes/${id}`, data);
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error updating route:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la mise à jour de la route'
    );
  }
};

/**
 * Supprime une route
 */
export const deleteRoute = async (id: string): Promise<void> => {
  try {
    await api.delete(`/api/routes/${id}`);
  } catch (error: unknown) {
    console.error('Error deleting route:', error);
    const err = error as { response?: { data?: { error?: string } } };
    throw new Error(
      err.response?.data?.error || 'Erreur lors de la suppression de la route'
    );
  }
};

/**
 * Assigne un bus à une route
 */
export const assignBusToRoute = async (
  routeId: string,
  busId: string
): Promise<Route> => {
  try {
    const response = await api.post(`/api/routes/${routeId}/assign-bus`, { busId });
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error assigning bus to route:', error);
    throw new Error('Erreur lors de l\'assignation du bus à la route');
  }
};

/**
 * Assigne un chauffeur à une route
 */
export const assignDriverToRoute = async (
  routeId: string,
  driverId: string
): Promise<Route> => {
  try {
    const response = await api.post(`/api/routes/${routeId}/assign-driver`, { driverId });
    return response.data.data;
  } catch (error: unknown) {
    console.error('Error assigning driver to route:', error);
    throw new Error('Erreur lors de l\'assignation du chauffeur à la route');
  }
};

