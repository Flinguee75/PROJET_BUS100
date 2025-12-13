/**
 * Types pour les données en temps réel de la carte
 */

import { BusStatus } from './bus.types';
import { GPSPosition, BusLiveStatus } from './gps.types';

/**
 * Informations du conducteur
 */
export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
}

/**
 * Informations de la route
 */
export interface RouteInfo {
  id: string;
  name: string;
  fromZone: string;
  toZone: string;
}

/**
 * Bus avec toutes les informations pour la carte en temps réel
 */
export interface BusRealtimeData {
  // Informations de base du bus
  id: string;
  number: string; // Format: BUS-XX (ex: BUS-12, BUS-45)
  plateNumber: string;
  capacity: number;
  model: string;
  year: number;
  status: BusStatus;

  // Position GPS actuelle
  currentPosition: GPSPosition | null;

  // Statut en temps réel
  liveStatus: BusLiveStatus | null;

  // Informations du conducteur
  driver: DriverInfo | null;

  // Informations de la route
  route: RouteInfo | null;

  // Nombre d'élèves actuels
  passengersCount: number;

  // Zone actuelle (déduite de la position)
  currentZone: string | null;

  // Dernière mise à jour GPS
  lastUpdate: Date | null;

  // Indicateur si le bus est en course ou non
  isActive: boolean;
}

/**
 * Statistiques pour le dashboard
 */
export interface BusStatistics {
  total: number;
  active: number;
  inactive: number;
  enRoute: number;
  stopped: number;
  totalPassengers: number;
}
