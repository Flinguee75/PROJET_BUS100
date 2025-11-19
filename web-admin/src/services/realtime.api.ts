/**
 * API client pour les données en temps réel
 */

import axios from 'axios';
import type { BusRealtimeData, BusStatistics } from '../types/realtime';

// Utiliser la même base URL que gps.api.ts (sans /api à la fin)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/projet-bus-60a3f/europe-west4';

/**
 * Récupère tous les bus avec leurs données en temps réel
 */
export async function getAllBusesRealtime(): Promise<BusRealtimeData[]> {
  const response = await axios.get<{ success: boolean; data: BusRealtimeData[]; count: number }>(
    `${API_BASE_URL}/api/realtime/buses`
  );
  return response.data.data;
}

/**
 * Récupère les statistiques globales des bus
 */
export async function getBusStatistics(): Promise<BusStatistics> {
  const response = await axios.get<{ success: boolean; data: BusStatistics }>(
    `${API_BASE_URL}/api/realtime/statistics`
  );
  return response.data.data;
}

/**
 * Récupère un bus spécifique avec ses données en temps réel
 */
export async function getBusRealtime(busId: string): Promise<BusRealtimeData> {
  const response = await axios.get<{ success: boolean; data: BusRealtimeData }>(
    `${API_BASE_URL}/api/realtime/buses/${busId}`
  );
  return response.data.data;
}
