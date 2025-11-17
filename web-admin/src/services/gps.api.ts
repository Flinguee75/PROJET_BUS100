/**
 * API Service pour les opérations GPS et Bus
 * Utilise Axios pour les requêtes HTTP
 */

import axios, { AxiosInstance } from 'axios';
import { Bus, GPSPosition, DashboardStats } from '@/types/bus';
import { auth } from './firebase';

// Instance Axios configurée
const api: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use(
  async (config) => {
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.error('Non autorisé - redirection vers login');
      // Vous pouvez déclencher une action de déconnexion ici
    }
    return Promise.reject(error);
  }
);

/**
 * Récupère la liste de tous les bus
 */
export const getAllBuses = async (): Promise<Bus[]> => {
  try {
    const response = await api.get<Bus[]>('/api/buses');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des bus:', error);
    throw new Error('Impossible de récupérer la liste des bus');
  }
};

/**
 * Récupère les détails d'un bus spécifique
 */
export const getBusById = async (busId: string): Promise<Bus> => {
  try {
    const response = await api.get<Bus>(`/api/buses/${busId}`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération du bus ${busId}:`, error);
    throw new Error('Impossible de récupérer les détails du bus');
  }
};

/**
 * Récupère la position actuelle d'un bus
 */
export const getBusPosition = async (busId: string): Promise<GPSPosition> => {
  try {
    const response = await api.get<GPSPosition>(`/api/buses/${busId}/position`);
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de la position du bus ${busId}:`, error);
    throw new Error('Impossible de récupérer la position du bus');
  }
};

/**
 * Récupère les statistiques du dashboard
 */
export const getDashboardStats = async (): Promise<DashboardStats> => {
  try {
    const response = await api.get<DashboardStats>('/api/dashboard/stats');
    return response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    throw new Error('Impossible de récupérer les statistiques');
  }
};

/**
 * Récupère l'historique GPS d'un bus pour une date donnée
 */
export const getBusHistory = async (
  busId: string,
  date: string
): Promise<GPSPosition[]> => {
  try {
    const response = await api.get<GPSPosition[]>(`/api/buses/${busId}/history`, {
      params: { date },
    });
    return response.data;
  } catch (error) {
    console.error(`Erreur lors de la récupération de l'historique du bus ${busId}:`, error);
    throw new Error('Impossible de récupérer l\'historique du bus');
  }
};

// Alias pour compatibilité
export const getBusDetails = getBusById;

export default api;

