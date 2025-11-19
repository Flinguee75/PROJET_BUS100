/**
 * Service Realtime - Gestion des données en temps réel pour la carte
 * Enrichit les données des bus avec GPS, conducteur, route, etc.
 */

import { getDb, collections } from '../config/firebase.config';
import {
  BusRealtimeData,
  BusStatistics,
  DriverInfo,
  RouteInfo,
} from '../types/realtime.types';
import { Bus } from '../types/bus.types';
import { GPSLiveData, BusLiveStatus } from '../types/gps.types';

export class RealtimeService {
  /**
   * Zones d'Abidjan avec coordonnées pour déterminer la zone actuelle
   */
  private zones = [
    { name: 'Cocody', lat: 5.3473, lng: -3.9875, radius: 0.03 },
    { name: 'Yopougon', lat: 5.3365, lng: -4.0872, radius: 0.03 },
    { name: 'Abobo', lat: 5.4235, lng: -4.0196, radius: 0.03 },
    { name: 'Adjamé', lat: 5.3567, lng: -4.0239, radius: 0.03 },
    { name: 'Plateau', lat: 5.3223, lng: -4.0415, radius: 0.03 },
    { name: 'Treichville', lat: 5.2947, lng: -4.0093, radius: 0.03 },
    { name: 'Marcory', lat: 5.2886, lng: -3.9863, radius: 0.03 },
    { name: 'Koumassi', lat: 5.2975, lng: -3.9489, radius: 0.03 },
  ];

  /**
   * Récupère tous les bus avec leurs données en temps réel enrichies
   */
  async getAllBusesRealtime(): Promise<BusRealtimeData[]> {
    const db = getDb();

    // 1. Récupérer tous les bus
    const busesSnapshot = await db.collection(collections.buses).get();
    const buses: Bus[] = busesSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Bus;
    });

    // 2. Récupérer toutes les positions GPS live
    const gpsSnapshot = await db.collection(collections.gpsLive).get();
    const gpsMap = new Map<string, GPSLiveData>(
      gpsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return [
          doc.id,
          {
            ...data,
            lastUpdate: data.lastUpdate?.toDate() || new Date(),
          } as GPSLiveData,
        ];
      })
    );

    // 3. Récupérer tous les conducteurs
    const driversSnapshot = await db
      .collection('users')
      .where('role', '==', 'driver')
      .get();
    const driversMap = new Map<string, DriverInfo>(
      driversSnapshot.docs.map((doc) => {
        const data = doc.data();
        return [
          doc.id,
          {
            id: doc.id,
            name: data.name || 'N/A',
            phone: data.phone || 'N/A',
          },
        ];
      })
    );

    // 4. Récupérer toutes les routes
    const routesSnapshot = await db.collection(collections.routes).get();
    const routesMap = new Map<string, RouteInfo>(
      routesSnapshot.docs.map((doc) => {
        const data = doc.data();
        return [
          doc.id,
          {
            id: doc.id,
            name: data.name || 'N/A',
            fromZone: data.fromZone || 'N/A',
            toZone: data.toZone || 'N/A',
          },
        ];
      })
    );

    // 5. Enrichir chaque bus avec toutes les données
    const enrichedBuses: BusRealtimeData[] = buses.map((bus) => {
      const gpsData = gpsMap.get(bus.id);
      const driver = bus.driverId ? driversMap.get(bus.driverId) : null;
      const route = bus.routeId ? routesMap.get(bus.routeId) : null;

      // Déterminer la zone actuelle si GPS disponible
      const currentZone = gpsData
        ? this.determineZone(gpsData.position.lat, gpsData.position.lng)
        : null;

      // Vérifier si le bus est actif (en course)
      const isActive = gpsData !== undefined && gpsData.passengersCount > 0;

      return {
        id: bus.id,
        plateNumber: bus.plateNumber,
        capacity: bus.capacity,
        model: bus.model,
        year: bus.year,
        status: bus.status,
        currentPosition: gpsData?.position || null,
        liveStatus: gpsData?.status || null,
        driver: driver || null,
        route: route || null,
        passengersCount: gpsData?.passengersCount || 0,
        currentZone,
        lastUpdate: gpsData?.lastUpdate || null,
        isActive,
      };
    });

    return enrichedBuses;
  }

  /**
   * Récupère les statistiques globales des bus
   */
  async getBusStatistics(): Promise<BusStatistics> {
    const buses = await this.getAllBusesRealtime();

    const total = buses.length;
    const active = buses.filter((b) => b.isActive).length;
    const inactive = total - active;
    const enRoute = buses.filter((b) => b.liveStatus === BusLiveStatus.EN_ROUTE).length;
    const stopped = buses.filter(
      (b) => b.liveStatus === BusLiveStatus.STOPPED || b.liveStatus === BusLiveStatus.IDLE
    ).length;
    const totalPassengers = buses.reduce((sum, b) => sum + b.passengersCount, 0);

    return {
      total,
      active,
      inactive,
      enRoute,
      stopped,
      totalPassengers,
    };
  }

  /**
   * Détermine la zone d'Abidjan basée sur les coordonnées GPS
   */
  private determineZone(lat: number, lng: number): string | null {
    for (const zone of this.zones) {
      const distance = Math.sqrt(
        Math.pow(lat - zone.lat, 2) + Math.pow(lng - zone.lng, 2)
      );

      if (distance <= zone.radius) {
        return zone.name;
      }
    }

    return 'En transit'; // Hors des zones définies
  }

  /**
   * Récupère un bus spécifique avec ses données en temps réel
   */
  async getBusRealtime(busId: string): Promise<BusRealtimeData | null> {
    const buses = await this.getAllBusesRealtime();
    return buses.find((b) => b.id === busId) || null;
  }
}

export default new RealtimeService();
