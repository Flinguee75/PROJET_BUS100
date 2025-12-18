/**
 * Service pour les données en temps réel
 * Gère l'enrichissement et l'agrégation des données bus+GPS+école+conducteur+route
 */

import { getDb, collections } from '../config/firebase.config';
import { BusService } from './bus.service';
import { GPSService } from './gps.service';
import { SchoolService } from './school.service';
import { BusRealtimeData, BusStatistics, DriverInfo, RouteInfo } from '../types/realtime.types';
import { Bus } from '../types/bus.types';
import { GPSLiveData, GPSPosition, BusLiveStatus } from '../types/gps.types';

// Seuil de fraîcheur GPS (2 minutes)
const GPS_STALE_THRESHOLD_MS = 2 * 60 * 1000; // 120,000 ms

// Position par défaut (Abidjan centre)
const DEFAULT_POSITION: GPSPosition = {
  lat: 5.3599,
  lng: -4.0083,
  speed: 0,
  heading: 0,
  accuracy: 100,
  timestamp: Date.now(),
};

export class RealtimeService {
  private busService: BusService;
  private gpsService: GPSService;
  private schoolService: SchoolService;

  constructor() {
    this.busService = new BusService();
    this.gpsService = new GPSService();
    this.schoolService = new SchoolService();
  }

  /**
   * Récupère toutes les données en temps réel des bus
   * Enrichit chaque bus avec GPS, conducteur, route, et applique le fallback si nécessaire
   */
  async getAllBusesRealtimeData(): Promise<BusRealtimeData[]> {
    // Récupérer toutes les données en parallèle
    const [buses, gpsDataMap] = await Promise.all([
      this.busService.getAllBuses(),
      this.getAllGPSDataAsMap(),
    ]);

    // Enrichir chaque bus avec les données en temps réel
    const enrichedBuses = await Promise.all(
      buses.map((bus) => this.enrichBusWithRealtimeData(bus, gpsDataMap.get(bus.id) || null))
    );

    return enrichedBuses;
  }

  /**
   * Récupère les statistiques du dashboard
   */
  async getBusStatistics(): Promise<BusStatistics> {
    const buses = await this.getAllBusesRealtimeData();

    const stats: BusStatistics = {
      total: buses.length,
      active: buses.filter((b) => b.isActive).length,
      inactive: buses.filter((b) => !b.isActive).length,
      enRoute: buses.filter((b) => b.liveStatus === 'en_route').length,
      stopped: buses.filter((b) => b.liveStatus === 'stopped').length,
      totalPassengers: buses.reduce((sum, b) => sum + b.passengersCount, 0),
    };

    return stats;
  }

  /**
   * Enrichit un bus avec toutes les données en temps réel
   */
  private async enrichBusWithRealtimeData(
    bus: Bus,
    gpsData: GPSLiveData | null
  ): Promise<BusRealtimeData> {
    // Récupérer la position avec fallback si nécessaire
    let currentPosition: GPSPosition | null = null;
    let lastUpdate: string | null = null;
    let liveStatus = gpsData?.status || null;
    let passengersCount = 0;
    let passengersPresent = 0;

    if (gpsData && !this.isGPSDataStale(gpsData.position.timestamp)) {
      // GPS data is fresh
      currentPosition = gpsData.position;
      lastUpdate = new Date(gpsData.position.timestamp).toISOString();
      passengersCount = gpsData.passengersCount || 0;
    } else {
      // GPS data is missing or stale - use fallback position
      currentPosition = await this.getPositionWithFallback(bus);
      lastUpdate = gpsData?.position.timestamp
        ? new Date(gpsData.position.timestamp).toISOString()
        : null;
      liveStatus = BusLiveStatus.STOPPED; // Assume stopped if GPS is stale
    }

    // Récupérer les informations du conducteur
    const driver = await this.getDriverInfo(bus.driverId);

    // Récupérer les informations de la route
    const route = await this.getRouteInfo(bus.routeId);

    // Récupérer le nombre de passagers depuis les enregistrements d'attendance
    if (gpsData) {
      const attendanceCount = await this.getPassengersFromAttendance(bus.id);
      passengersPresent = attendanceCount;
    }

    // Construire l'objet BusRealtimeData
    const realtimeData: BusRealtimeData = {
      id: bus.id,
      number: `BUS-${bus.busNumber.toString().padStart(2, '0')}`,
      plateNumber: bus.plateNumber,
      capacity: bus.capacity,
      model: bus.model,
      year: bus.year,
      status: bus.status,
      currentPosition,
      liveStatus,
      driver,
      route,
      passengersCount,
      passengersPresent,
      currentZone: null, // TODO: Calculate from position if needed
      lastUpdate,
      isActive: bus.status === 'active',
      schoolId: bus.schoolId || null,
      tripType: null, // TODO: Get from current trip if needed
      tripLabel: null,
      tripStartTime: null,
    };

    return realtimeData;
  }

  /**
   * Récupère la position avec fallback (école puis position par défaut)
   */
  private async getPositionWithFallback(bus: Bus): Promise<GPSPosition> {
    // Essayer d'utiliser la position de l'école
    if (bus.schoolId) {
      try {
        const school = await this.schoolService.getSchoolById(bus.schoolId);
        if (school && school.location) {
          return {
            lat: school.location.lat,
            lng: school.location.lng,
            speed: 0,
            heading: 0,
            accuracy: 100,
            timestamp: Date.now(),
          };
        }
      } catch (error) {
        // School not found or error - continue to default
        console.warn(`School ${bus.schoolId} not found for bus ${bus.id}, using default position`);
      }
    }

    // Utiliser la position par défaut (Abidjan centre)
    return DEFAULT_POSITION;
  }

  /**
   * Vérifie si les données GPS sont périmées (>2 minutes)
   */
  private isGPSDataStale(timestamp: number): boolean {
    const now = Date.now();
    const age = now - timestamp;
    return age > GPS_STALE_THRESHOLD_MS;
  }

  /**
   * Récupère toutes les données GPS en tant que Map pour un accès rapide
   */
  private async getAllGPSDataAsMap(): Promise<Map<string, GPSLiveData>> {
    const gpsDataArray = await this.gpsService.getAllLivePositions();
    const gpsDataMap = new Map<string, GPSLiveData>();

    for (const gpsData of gpsDataArray) {
      gpsDataMap.set(gpsData.busId, gpsData);
    }

    return gpsDataMap;
  }

  /**
   * Récupère les informations du conducteur
   */
  private async getDriverInfo(driverId: string | null): Promise<DriverInfo | null> {
    if (!driverId) {
      return null;
    }

    try {
      const db = getDb();
      const driverDoc = await db.collection(collections.users).doc(driverId).get();

      if (!driverDoc.exists) {
        return null;
      }

      const driverData = driverDoc.data();
      return {
        id: driverId,
        name: driverData?.displayName || 'Unknown Driver',
        phone: driverData?.phoneNumber || '',
      };
    } catch (error) {
      console.error(`Error fetching driver ${driverId}:`, error);
      return null;
    }
  }

  /**
   * Récupère les informations de la route
   */
  private async getRouteInfo(routeId: string | null): Promise<RouteInfo | null> {
    if (!routeId) {
      return null;
    }

    try {
      const db = getDb();
      const routeDoc = await db.collection(collections.routes).doc(routeId).get();

      if (!routeDoc.exists) {
        return null;
      }

      const routeData = routeDoc.data();
      return {
        id: routeId,
        name: routeData?.name || 'Unknown Route',
        fromZone: routeData?.startLocation || '',
        toZone: routeData?.endLocation || '',
      };
    } catch (error) {
      console.error(`Error fetching route ${routeId}:`, error);
      return null;
    }
  }

  /**
   * Récupère le nombre de passagers depuis les enregistrements d'attendance
   */
  private async getPassengersFromAttendance(busId: string): Promise<number> {
    try {
      const db = getDb();
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendanceSnapshot = await db
        .collection(collections.attendance)
        .where('busId', '==', busId)
        .where('date', '>=', today)
        .where('status', '==', 'boarded')
        .get();

      return attendanceSnapshot.size;
    } catch (error) {
      console.error(`Error fetching attendance for bus ${busId}:`, error);
      return 0;
    }
  }
}
