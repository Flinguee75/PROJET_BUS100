/**
 * GPS Service - Logique métier pour le tracking GPS
 * Règle: Toute la logique métier doit être dans les services, PAS dans les controllers
 */

import { db, collections } from '../config/firebase.config';
import {
  GPSUpdateInput,
  GPSLiveData,
  GPSHistoryEntry,
  BusLiveStatus,
} from '../types';

export class GPSService {
  /**
   * Met à jour la position GPS en temps réel d'un bus
   * - Stocke dans /gps_live/{busId}
   * - Archive dans /gps_history/{busId}/positions/{timestamp}
   * - Calcule le statut du bus (en route, arrêté, etc.)
   */
  async updateGPSPosition(data: GPSUpdateInput): Promise<GPSLiveData> {
    const { busId, lat, lng, speed, heading, accuracy, timestamp } = data;

    // Validation business: vérifier que le bus existe
    const busDoc = await db.collection(collections.buses).doc(busId).get();
    if (!busDoc.exists) {
      throw new Error(`Bus ${busId} not found`);
    }

    const busData = busDoc.data();
    if (!busData) {
      throw new Error(`Bus ${busId} has no data`);
    }

    // Déterminer le statut du bus basé sur la vitesse
    const status = this.determineBusStatus(speed);

    // Créer l'objet GPS Live
    const gpsLive: GPSLiveData = {
      busId,
      position: {
        lat,
        lng,
        speed,
        heading,
        accuracy,
        timestamp,
      },
      driverId: busData.driverId || '',
      routeId: busData.routeId || null,
      status,
      passengersCount: 0, // TODO: Implémenter comptage passagers
      lastUpdate: new Date(),
    };

    // Sauvegarder position live
    await db.collection(collections.gpsLive).doc(busId).set(gpsLive);

    // Archiver dans historique
    await this.archiveGPSPosition(data);

    return gpsLive;
  }

  /**
   * Archive une position GPS dans l'historique
   * Collection: /gps_history/{busId}/positions/{timestamp}
   */
  private async archiveGPSPosition(data: GPSUpdateInput): Promise<void> {
    const { busId, lat, lng, speed, heading, accuracy, timestamp } = data;

    const historyEntry: GPSHistoryEntry = {
      busId,
      position: {
        lat,
        lng,
        speed,
        heading,
        accuracy,
        timestamp,
      },
      timestamp: new Date(timestamp),
    };

    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    await db
      .collection(collections.gpsHistory)
      .doc(busId)
      .collection(today || '')
      .doc(timestamp.toString())
      .set(historyEntry);
  }

  /**
   * Détermine le statut du bus basé sur la vitesse
   */
  private determineBusStatus(speed: number): BusLiveStatus {
    if (speed === 0) {
      return BusLiveStatus.STOPPED;
    } else if (speed > 0 && speed < 5) {
      return BusLiveStatus.IDLE;
    } else {
      return BusLiveStatus.EN_ROUTE;
    }
  }

  /**
   * Récupère la position live d'un bus
   */
  async getLivePosition(busId: string): Promise<GPSLiveData | null> {
    const doc = await db.collection(collections.gpsLive).doc(busId).get();

    if (!doc.exists) {
      return null;
    }

    return doc.data() as GPSLiveData;
  }

  /**
   * Récupère toutes les positions live de tous les bus actifs
   */
  async getAllLivePositions(): Promise<GPSLiveData[]> {
    const snapshot = await db.collection(collections.gpsLive).get();

    return snapshot.docs.map((doc) => doc.data() as GPSLiveData);
  }

  /**
   * Récupère l'historique GPS d'un bus pour une journée
   */
  async getHistoryForDay(
    busId: string,
    date: Date
  ): Promise<GPSHistoryEntry[]> {
    const dateStr = date.toISOString().split('T')[0];

    const snapshot = await db
      .collection(collections.gpsHistory)
      .doc(busId)
      .collection(dateStr ?? '')
      .orderBy('timestamp', 'asc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as GPSHistoryEntry);
  }

  /**
   * Calcule la distance entre deux points GPS (formule Haversine)
   * Retourne la distance en kilomètres
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) *
        Math.cos(this.toRadians(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Convertit degrés en radians
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcule l'ETA (temps d'arrivée estimé) en minutes
   * Basé sur la distance et la vitesse actuelle
   */
  calculateETA(
    currentLat: number,
    currentLng: number,
    destLat: number,
    destLng: number,
    currentSpeed: number
  ): number {
    const distance = this.calculateDistance(
      currentLat,
      currentLng,
      destLat,
      destLng
    );

    // Si vitesse = 0, impossible de calculer ETA
    if (currentSpeed === 0) {
      return -1;
    }

    // ETA en heures = distance (km) / vitesse (km/h)
    const etaHours = distance / currentSpeed;

    // Convertir en minutes
    return Math.round(etaHours * 60);
  }
}

export default new GPSService();
