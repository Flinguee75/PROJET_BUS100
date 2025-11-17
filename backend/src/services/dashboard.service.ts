/**
 * Service Dashboard - Calcul des statistiques du dashboard
 */

import { getDb } from '../config/firebase.config';
import busService from './bus.service';
import { BusStatus, MaintenanceStatus, Bus } from '../types/bus.types';

export interface DashboardStats {
  busActifs: number;
  busTotaux: number;
  elevesTransportes: number;
  busEnRetard: number;
  totalTrajets: number;
  alertesMaintenance: number;
}

export class DashboardService {
  /**
   * Calcule les statistiques du dashboard
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Récupérer tous les bus avec timeout
      let buses: Bus[] = [];
      try {
        const busesPromise = busService.getAllBuses();
        const timeoutPromise = new Promise<Bus[]>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        buses = await Promise.race([busesPromise, timeoutPromise]);
      } catch (error) {
        console.warn(
          '⚠️ Impossible de récupérer les bus, utilisation de valeurs par défaut:',
          error
        );
      }

      const busTotaux = buses.length;
      const busActifs = buses.filter(
        (bus) => bus.status === BusStatus.ACTIVE || bus.status === BusStatus.INACTIVE
      ).length;
      const busEnRetard = 0;

      // Calculer le nombre d'élèves transportés depuis la collection students
      let elevesTransportes = 0;
      try {
        const studentsPromise = getDb().collection('students').get();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const studentsSnapshot = await Promise.race([studentsPromise, timeoutPromise]);
        elevesTransportes = studentsSnapshot.size;
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer les étudiants, utilisation de 0:', error);
      }

      const totalTrajets = 0;
      const alertesMaintenance = buses.filter(
        (bus) =>
          bus.maintenanceStatus === MaintenanceStatus.CRITICAL ||
          bus.maintenanceStatus === MaintenanceStatus.WARNING
      ).length;

      return {
        busActifs,
        busTotaux,
        elevesTransportes,
        busEnRetard,
        totalTrajets,
        alertesMaintenance,
      };
    } catch (error) {
      console.error('❌ Erreur lors du calcul des stats dashboard:', error);
      // Retourner des valeurs par défaut en cas d'erreur
      return {
        busActifs: 0,
        busTotaux: 0,
        elevesTransportes: 0,
        busEnRetard: 0,
        totalTrajets: 0,
        alertesMaintenance: 0,
      };
    }
  }
}

export default new DashboardService();
