/**
 * Service Dashboard - Calcul des statistiques du dashboard
 */

import { getDb } from '../config/firebase.config';
import busService from './bus.service';
import { BusStatus, BusMaintenanceStatus, Bus } from '../types/bus.types';

export interface DashboardStats {
  // Métriques de base
  busActifs: number;
  busTotaux: number;
  elevesTransportes: number;
  busEnRetard: number;
  totalTrajets: number;
  alertesMaintenance: number;
  
  // Nouvelles métriques opérationnelles (contexte Abidjan)
  retardsCritiques: number; // Retards > 15 minutes
  retardsGraves: number; // Retards > 20 minutes
  busImmobilises: number; // Bus en panne/hors service
  busDisponibles: number; // Bus disponibles (totaux - immobilisés)
  tauxValidation: number; // Pourcentage élèves scannés (0-100)
  elevesNonScannes: number; // Nombre élèves non scannés
  
  // État détaillé du service
  busEnRoute: number; // Bus actuellement en déplacement
  busArrives: number; // Bus arrivés à destination
  busNonPartis: number; // Bus n'ayant pas encore démarré
  busEnAttente: number; // Bus à l'arrêt (attente élèves)
  
  // Métriques de performance (trafic vs prévision)
  retardMoyen: number; // Retard moyen en minutes
  tauxPonctualite: number; // % de bus à l'heure (0-100)
  tempsTrajetMoyen: number; // Temps de trajet moyen (minutes)
  tempsTrajetPrevu: number; // Temps prévu initialement
}

export class DashboardService {
  /**
   * Calcule les statistiques OPÉRATIONNELLES du dashboard (contexte Abidjan)
   * Focus: État du service, retards critiques, disponibilité flotte, validation sécurité
   */
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      const db = getDb();
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];

      // Récupérer tous les bus avec timeout
      let buses: Bus[] = [];
      try {
        const busesPromise = busService.getAllBuses();
        const timeoutPromise = new Promise<Bus[]>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        buses = await Promise.race([busesPromise, timeoutPromise]);
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer les bus, utilisation de valeurs par défaut:', error);
      }

      // ========== MÉTRIQUES DE BASE ==========
      const busTotaux = buses.length;
      const busActifs = buses.filter(
        (bus) => bus.status === BusStatus.ACTIVE || bus.status === BusStatus.INACTIVE
      ).length;

      // Bus immobilisés (en panne/hors service) - NOUVEAU
      const busImmobilises = buses.filter(
        (bus) =>
          bus.status === BusStatus.OUT_OF_SERVICE ||
          bus.status === BusStatus.IN_MAINTENANCE
      ).length;
      const busDisponibles = busTotaux - busImmobilises;

      // Alertes maintenance (WARNING + CRITICAL)
      const alertesMaintenance = buses.filter(
        (bus) =>
          bus.maintenanceStatus === BusMaintenanceStatus.CRITICAL ||
          bus.maintenanceStatus === BusMaintenanceStatus.WARNING
      ).length;

      // ========== DONNÉES GPS TEMPS RÉEL ==========
      // Récupérer les positions GPS live de tous les bus
      let gpsData: any[] = [];
      try {
        const gpsPromise = db.collection('gps_live').get();
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const gpsSnapshot = await Promise.race([gpsPromise, timeoutPromise]);
        gpsData = gpsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer les données GPS:', error);
      }

      // ========== ÉTAT DÉTAILLÉ DU SERVICE ==========
      // Calculer l'état de chaque bus en fonction de sa vitesse et position
      let busEnRoute = 0;
      let busArrives = 0;
      let busNonPartis = 0;
      let busEnAttente = 0;
      let retardsCritiques = 0; // > 15 minutes
      let retardsGraves = 0; // > 20 minutes

      gpsData.forEach((gps) => {
        const speed = gps.position?.speed ?? 0;
        const lastUpdate = gps.position?.timestamp
          ? new Date(gps.position.timestamp)
          : new Date(0);
        const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);

        // Déterminer l'état du bus
        if (speed > 5) {
          busEnRoute++; // En mouvement
        } else if (gps.status === 'arrived' || minutesSinceUpdate > 60) {
          busArrives++; // Arrivé ou inactif depuis longtemps
        } else if (minutesSinceUpdate < 5 && speed === 0) {
          busEnAttente++; // Arrêté mais récent
        } else {
          busNonPartis++; // Pas encore démarré
        }

        // Détection retards (basé sur le délai depuis dernière position)
        // Dans la vraie version, comparer avec l'horaire prévu
        const retardEstime = Math.max(0, minutesSinceUpdate - 5); // Seuil: 5 min acceptable
        if (retardEstime > 15) {
          retardsCritiques++;
        }
        if (retardEstime > 20) {
          retardsGraves++;
        }
      });

      const busEnRetard = retardsCritiques; // Compatibilité avec ancienne métrique

      // ========== VALIDATION SÉCURITÉ (Scan élèves) - NOUVEAU ==========
      let elevesTransportes = 0;
      let elevesNonScannes = 0;
      let tauxValidation = 100; // Par défaut 100% si pas de données

      try {
        // Compter les élèves totaux
        const studentsPromise = db.collection('students').get();
        const timeoutPromise1 = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const studentsSnapshot = await Promise.race([studentsPromise, timeoutPromise1]);
        const totalStudents = studentsSnapshot.size;

        // Compter les scans du jour (attendance)
        const attendancePromise = db
          .collection('attendance')
          .where('date', '>=', todayStr)
          .where('date', '<', todayStr + 'Z') // Toute la journée
          .get();
        const timeoutPromise2 = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout')), 5000)
        );
        const attendanceSnapshot = await Promise.race([attendancePromise, timeoutPromise2]);
        elevesTransportes = attendanceSnapshot.size;
        elevesNonScannes = Math.max(0, totalStudents - elevesTransportes);

        // Calculer le taux de validation
        if (totalStudents > 0) {
          tauxValidation = Math.round((elevesTransportes / totalStudents) * 100);
        }
      } catch (error) {
        console.warn('⚠️ Impossible de récupérer les données élèves/attendance:', error);
      }

      // ========== MÉTRIQUES DE PERFORMANCE (Trafic vs Prévision) - NOUVEAU ==========
      // Temps de trajet moyen vs prévu
      const tempsTrajetPrevu = 35; // Minutes (valeur par défaut Abidjan)
      let tempsTrajetMoyen = tempsTrajetPrevu;
      let retardMoyen = 0;

      // Calculer le temps moyen basé sur les retards détectés
      if (gpsData.length > 0) {
        const totalRetard = gpsData.reduce((sum, gps) => {
          const lastUpdate = gps.position?.timestamp
            ? new Date(gps.position.timestamp)
            : new Date(0);
          const minutesSinceUpdate = (now.getTime() - lastUpdate.getTime()) / (1000 * 60);
          return sum + Math.max(0, minutesSinceUpdate - 5);
        }, 0);
        retardMoyen = gpsData.length > 0 ? Math.round(totalRetard / gpsData.length) : 0;
        tempsTrajetMoyen = tempsTrajetPrevu + retardMoyen;
      }

      // Taux de ponctualité (% de bus sans retard critique)
      const busALHeure = gpsData.length - retardsCritiques;
      const tauxPonctualite = gpsData.length > 0 
        ? Math.round((busALHeure / gpsData.length) * 100) 
        : 100;

      const totalTrajets = gpsData.length; // Nombre de trajets actifs actuellement

      // ========== RETOUR DES STATS COMPLÈTES ==========
      return {
        // Métriques de base
        busActifs,
        busTotaux,
        elevesTransportes,
        busEnRetard,
        totalTrajets,
        alertesMaintenance,

        // Nouvelles métriques opérationnelles
        retardsCritiques,
        retardsGraves,
        busImmobilises,
        busDisponibles,
        tauxValidation,
        elevesNonScannes,

        // État détaillé du service
        busEnRoute,
        busArrives,
        busNonPartis,
        busEnAttente,

        // Métriques de performance
        retardMoyen,
        tauxPonctualite,
        tempsTrajetMoyen,
        tempsTrajetPrevu,
      };
    } catch (error) {
      console.error('❌ Erreur lors du calcul des stats dashboard:', error);
      // Retourner des valeurs par défaut sécurisées en cas d'erreur
      return this.getDefaultStats();
    }
  }

  /**
   * Retourne des statistiques par défaut en cas d'erreur
   */
  private getDefaultStats(): DashboardStats {
      return {
      // Métriques de base
        busActifs: 0,
        busTotaux: 0,
        elevesTransportes: 0,
        busEnRetard: 0,
        totalTrajets: 0,
        alertesMaintenance: 0,

      // Nouvelles métriques opérationnelles
      retardsCritiques: 0,
      retardsGraves: 0,
      busImmobilises: 0,
      busDisponibles: 0,
      tauxValidation: 100,
      elevesNonScannes: 0,

      // État détaillé du service
      busEnRoute: 0,
      busArrives: 0,
      busNonPartis: 0,
      busEnAttente: 0,

      // Métriques de performance
      retardMoyen: 0,
      tauxPonctualite: 100,
      tempsTrajetMoyen: 35,
      tempsTrajetPrevu: 35,
      };
  }
}

export default new DashboardService();
