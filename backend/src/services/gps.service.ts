/**
 * GPS Service - Logique métier pour le tracking GPS
 * Règle: Toute la logique métier doit être dans les services, PAS dans les controllers
 */

import { getDb, collections } from '../config/firebase.config';
import { GPSUpdateInput, GPSLiveData, GPSHistoryEntry, BusLiveStatus } from '../types';
import { BusStatus } from '../types/bus.types';
import type { BusRealtimeData, DriverInfo, RouteInfo } from '../types/realtime.types';
import notificationService from './notification.service';
import schoolService from './school.service';

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
    const db = getDb();
    const busDoc = await db.collection(collections.buses).doc(busId).get();
    if (!busDoc.exists) {
      throw new Error(`Bus ${busId} not found`);
    }

    const busData = busDoc.data();
    if (!busData) {
      throw new Error(`Bus ${busId} has no data`);
    }

    // Récupérer l'état précédent du bus pour détecter les transitions
    const previousLiveDoc = await db.collection(collections.gpsLive).doc(busId).get();
    const previousStatus = previousLiveDoc.exists
      ? (previousLiveDoc.data() as any)?.liveStatus
      : null;

    // Déterminer le nouveau statut du bus basé sur la vitesse
    const newStatus = await this.determineBusStatus(speed);

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
      status: newStatus,
      passengersCount: 0, // TODO: Implémenter comptage passagers
      lastUpdate: new Date(),
    };

    // NOUVEAU : Enrichir avec les infos du bus avant de sauvegarder
    let enrichedData = await this.enrichGPSDataWithBusInfo(gpsLive, busData);

    // 🔥 GESTION DU TIMESTAMP stoppedAt
    // Transition EN_ROUTE → STOPPED : enregistrer le timestamp
    if (previousStatus === BusLiveStatus.EN_ROUTE && newStatus === BusLiveStatus.STOPPED) {
      enrichedData = {
        ...enrichedData,
        stoppedAt: Date.now(),
      };
      console.log(`✅ [BACKEND] Bus ${busId} EN_ROUTE → STOPPED, stoppedAt enregistré`);
    }
    // Transition STOPPED → EN_ROUTE : effacer le timestamp
    else if (previousStatus === BusLiveStatus.STOPPED && newStatus === BusLiveStatus.EN_ROUTE) {
      enrichedData = {
        ...enrichedData,
        stoppedAt: null,
      };
      console.log(`🔄 [BACKEND] Bus ${busId} STOPPED → EN_ROUTE, stoppedAt effacé`);
    }
    // Si déjà STOPPED, conserver le stoppedAt existant
    else if (newStatus === BusLiveStatus.STOPPED && previousLiveDoc.exists) {
      const previousData = previousLiveDoc.data() as any;
      enrichedData = {
        ...enrichedData,
        stoppedAt: previousData.stoppedAt || null,
      };
    }

    // 🏫 DÉTECTION ARRIVÉE ÉCOLE
    // Si le bus passe à STOPPED et qu'il est près d'une école, notifier les parents
    if (newStatus === BusLiveStatus.STOPPED && previousStatus !== BusLiveStatus.STOPPED) {
      await this.checkSchoolArrivalAndNotify(busId, busData, lat, lng);
    }

    // Sauvegarder les données ENRICHIES dans /gps_live
    await db.collection(collections.gpsLive).doc(busId).set(enrichedData);

    // Archiver dans historique (format original)
    await this.archiveGPSPosition(data);

    return gpsLive;
  }

  /**
   * Enrichit les données GPS avec les métadonnées du bus, driver et route
   * Synchronise le format backend avec le frontend BusRealtimeData
   */
  private async enrichGPSDataWithBusInfo(
    gpsData: GPSLiveData,
    busData: any
  ): Promise<BusRealtimeData> {
    const db = getDb();

    // 1. Fetch driver info if assigned
    let driverInfo: DriverInfo | null = null;
    if (gpsData.driverId) {
      const driverDoc = await db.collection('users').doc(gpsData.driverId).get();
      if (driverDoc.exists) {
        const driver = driverDoc.data();
        if (driver) {
          driverInfo = {
            id: gpsData.driverId,
            name: driver.displayName || driver.email || 'Driver',
            phone: driver.phoneNumber || null,
          };
        }
      }
    }

    // 2. Fetch route info if assigned
    let routeInfo: RouteInfo | null = null;
    if (gpsData.routeId) {
      const routeDoc = await db.collection('routes').doc(gpsData.routeId).get();
      if (routeDoc.exists) {
        const route = routeDoc.data();
        if (route) {
          routeInfo = {
            id: gpsData.routeId,
            name: route.name || `Route ${gpsData.routeId}`,
            fromZone: route.zones?.[0] || null,
            toZone: route.zones?.[route.zones.length - 1] || null,
          };
        }
      }
    }

    // 2.5. Compter les passagers actuels depuis /attendance
    let passengersCount = 0;
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString().split('T')[0]; // Format YYYY-MM-DD

      const attendanceSnapshot = await db
        .collection(collections.attendance)
        .where('busId', '==', gpsData.busId)
        .where('date', '==', todayStr)
        .get();

      // Compter les étudiants présents (morningStatus ou eveningStatus = 'present')
      attendanceSnapshot.docs.forEach((doc) => {
        const attendanceData = doc.data();
        if (
          attendanceData.morningStatus === 'present' ||
          attendanceData.eveningStatus === 'present'
        ) {
          passengersCount++;
        }
      });
    } catch (error) {
      console.warn(`⚠️ Erreur lors du comptage des passagers pour le bus ${gpsData.busId}:`, error);
      // En cas d'erreur, utiliser la valeur par défaut (0 ou celle déjà dans gpsData)
      passengersCount = gpsData.passengersCount;
    }

    // 3. Return enriched data (compatible avec frontend BusRealtimeData)
    // Note: Firestore convertira automatiquement Date en Timestamp
    // Le frontend devra convertir le Timestamp en string ISO
    const busStatus = busData.status || 'active';
    return {
      id: gpsData.busId,
      number: busData.number || `BUS-${gpsData.busId}`,
      plateNumber: busData.plateNumber || '',
      capacity: busData.capacity || 0,
      model: busData.model || '',
      year: busData.year || new Date().getFullYear(),
      status: busStatus as BusStatus, // Assurer le type BusStatus
      currentPosition: gpsData.position,
      liveStatus: gpsData.status,
      driver: driverInfo,
      route: routeInfo,
      passengersCount: passengersCount,
      currentZone: null, // TODO: calculer depuis position GPS + zones
      lastUpdate: gpsData.lastUpdate ? gpsData.lastUpdate.toISOString() : null,
      isActive: busStatus === 'active',
    };
  }

  /**
   * Archive une position GPS dans l'historique
   * Collection: /gps_history/{busId}/positions/{timestamp}
   */
  private async archiveGPSPosition(data: GPSUpdateInput): Promise<void> {
    const { busId, lat, lng, speed, heading, accuracy, timestamp } = data;
    const db = getDb();

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

    const today = new Date().toISOString().split('T')[0]!; // Format: YYYY-MM-DD
    await db
      .collection(collections.gpsHistory)
      .doc(busId)
      .collection(today)
      .doc(timestamp.toString())
      .set(historyEntry);
  }

  /**
   * Détermine le statut du bus basé sur la vitesse
   */
  private async determineBusStatus(speed: number): Promise<BusLiveStatus> {
    if (speed === 0 || speed < 1) {
      return BusLiveStatus.STOPPED;
    } else {
      return BusLiveStatus.EN_ROUTE;
    }
  }

  /**
   * Récupère la position live d'un bus
   */
  async getLivePosition(busId: string): Promise<GPSLiveData | null> {
    const db = getDb();
    const doc = await db.collection(collections.gpsLive).doc(busId).get();

    if (!doc.exists) {
      return null;
    }

    return this.normalizeLiveData(doc.id, doc.data());
  }

  /**
   * Récupère toutes les positions live de tous les bus actifs
   */
  async getAllLivePositions(): Promise<GPSLiveData[]> {
    const db = getDb();
    const snapshot = await db.collection(collections.gpsLive).get();

    return snapshot.docs
      .map((doc) => this.normalizeLiveData(doc.id, doc.data()))
      .filter((data): data is GPSLiveData => data !== null);
  }

  /**
   * Récupère l'historique GPS d'un bus pour une journée
   */
  async getHistoryForDay(busId: string, date: Date): Promise<GPSHistoryEntry[]> {
    const dateStr = date.toISOString().split('T')[0]!;
    const db = getDb();

    const snapshot = await db
      .collection(collections.gpsHistory)
      .doc(busId)
      .collection(dateStr)
      .orderBy('timestamp', 'asc')
      .get();

    return snapshot.docs.map((doc) => doc.data() as GPSHistoryEntry);
  }

  /**
   * Vérifie si le bus est arrivé à l'école et envoie une notification si c'est le cas
   * @param busId - ID du bus
   * @param busData - Données du bus
   * @param lat - Latitude actuelle du bus
   * @param lng - Longitude actuelle du bus
   */
  private async checkSchoolArrivalAndNotify(
    busId: string,
    busData: any,
    lat: number,
    lng: number
  ): Promise<void> {
    try {
      // Vérifier si le bus a une école assignée
      if (!busData.schoolId) {
        console.log(`⚠️ Bus ${busId} n'a pas d'école assignée, skip notification`);
        return;
      }

      // Récupérer les coordonnées de l'école
      const school = await schoolService.getSchoolById(busData.schoolId);
      if (!school || !school.location) {
        console.log(`⚠️ École ${busData.schoolId} non trouvée ou sans localisation`);
        return;
      }

      // Calculer la distance entre le bus et l'école
      const distanceToSchool = this.calculateDistance(
        lat,
        lng,
        school.location.lat,
        school.location.lng
      );

      // Seuil de proximité : 200 mètres (0.2 km)
      const SCHOOL_PROXIMITY_THRESHOLD_KM = 0.2;

      if (distanceToSchool <= SCHOOL_PROXIMITY_THRESHOLD_KM) {
        const distance = Math.round(distanceToSchool * 1000);
        console.log(`🏫 Bus ${busId} est arrivé à l'école ${school.name} (${distance}m)`);

        // Envoyer notification aux parents
        await notificationService.notifyParentsArrival(busId, busData.schoolId);
      } else {
        const distance = Math.round(distanceToSchool * 1000);
        console.log(`📍 Bus ${busId} s'est arrêté à ${distance}m de l'école (seuil: 200m)`);
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la vérification d'arrivée à l'école pour le bus ${busId}:`,
        error
      );
      // Ne pas faire échouer l'update GPS si la notification échoue
    }
  }

  /**
   * Calcule la distance entre deux points GPS (formule Haversine)
   * Retourne la distance en kilomètres
   */
  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
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
    const distance = this.calculateDistance(currentLat, currentLng, destLat, destLng);

    // Si vitesse = 0, impossible de calculer ETA
    if (currentSpeed === 0) {
      return -1;
    }

    // ETA en heures = distance (km) / vitesse (km/h)
    const etaHours = distance / currentSpeed;

    // Convertir en minutes
    return Math.round(etaHours * 60);
  }

  /**
   * Normalise un document gps_live pour retourner un GPSLiveData stable
   * Supporte les formats GPSLiveData (position/status) et BusRealtimeData (currentPosition/liveStatus)
   */
  private normalizeLiveData(busId: string, data: any): GPSLiveData | null {
    if (!data) {
      return null;
    }

    const rawPosition = data.position || data.currentPosition || null;
    if (!rawPosition || rawPosition.lat === undefined || rawPosition.lng === undefined) {
      return null;
    }

    const status = this.normalizeLiveStatus(data.liveStatus ?? data.status);

    return {
      busId,
      position: {
        lat: Number(rawPosition.lat),
        lng: Number(rawPosition.lng),
        speed: Number(rawPosition.speed ?? 0),
        heading: rawPosition.heading !== undefined ? Number(rawPosition.heading) : undefined,
        accuracy: rawPosition.accuracy !== undefined ? Number(rawPosition.accuracy) : undefined,
        timestamp: Number(rawPosition.timestamp ?? Date.now()),
      },
      driverId: data.driverId ?? data.driver?.id ?? '',
      routeId: data.routeId ?? data.route?.id ?? null,
      status,
      passengersCount: Number(data.passengersCount ?? 0),
      lastUpdate: this.normalizeLastUpdate(data.lastUpdate ?? data.updatedAt ?? data.timestamp),
    };
  }

  private normalizeLiveStatus(rawStatus: unknown): BusLiveStatus {
    if (typeof rawStatus === 'string') {
      const normalized = rawStatus.toLowerCase();
      switch (normalized) {
        case BusLiveStatus.EN_ROUTE:
        case BusLiveStatus.STOPPED:
        case BusLiveStatus.DELAYED:
        case BusLiveStatus.ARRIVED:
        case BusLiveStatus.IDLE:
          return normalized as BusLiveStatus;
        case 'moving':
          return BusLiveStatus.EN_ROUTE;
        case 'a_l_arret':
          return BusLiveStatus.STOPPED;
        case 'attente':
          return BusLiveStatus.IDLE;
        case 'en_retard':
          return BusLiveStatus.DELAYED;
        case 'arrive':
          return BusLiveStatus.ARRIVED;
        default:
          return BusLiveStatus.STOPPED;
      }
    }

    return BusLiveStatus.STOPPED;
  }

  private normalizeLastUpdate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'number') {
      return new Date(value);
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      return Number.isNaN(parsed) ? new Date() : new Date(parsed);
    }
    if (
      value &&
      typeof value === 'object' &&
      'toDate' in value &&
      typeof (value as { toDate: () => Date }).toDate === 'function'
    ) {
      return (value as { toDate: () => Date }).toDate();
    }
    if (
      value &&
      typeof value === 'object' &&
      'toMillis' in value &&
      typeof (value as { toMillis: () => number }).toMillis === 'function'
    ) {
      return new Date((value as { toMillis: () => number }).toMillis());
    }
    return new Date();
  }
}

export default new GPSService();
