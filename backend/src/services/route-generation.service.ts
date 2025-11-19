/**
 * Service RouteGeneration - Logique métier pour la génération automatique de routes
 * Utilise l'API Mapbox Optimization pour optimiser les trajets des bus
 */

import axios from 'axios';
import { getDb } from '../config/firebase.config';
import {
  Route,
  RouteStop,
  CommuneAbidjan,
  DayOfWeek,
} from '../types/route.types';
import { Student, Location } from '../types/student.types';
import studentService from './student.service';
import busService from './bus.service';
import routeService from './route.service';

// Configuration Mapbox
const MAPBOX_ACCESS_TOKEN = process.env.MAPBOX_ACCESS_TOKEN || '';
const MAPBOX_OPTIMIZATION_ENABLED = process.env.MAPBOX_OPTIMIZATION_ENABLED === 'true';
const MAPBOX_OPTIMIZATION_URL = 'https://api.mapbox.com/optimized-trips/v1/mapbox/driving';
const MAPBOX_DIRECTIONS_URL = 'https://api.mapbox.com/directions/v5/mapbox/driving';

interface MapboxOptimizationResponse {
  code: string;
  waypoints: Array<{
    waypoint_index: number;
    trips_index: number;
    location: [number, number];
    name: string;
  }>;
  trips: Array<{
    geometry: any;
    legs: Array<{
      summary: string;
      duration: number; // seconds
      distance: number; // meters
      steps: any[];
    }>;
    duration: number;
    distance: number;
  }>;
}

interface MapboxDirectionsResponse {
  routes: Array<{
    duration: number; // seconds
    distance: number; // meters
    legs: Array<{
      duration: number;
      distance: number;
    }>;
  }>;
}

interface ETACalculation {
  absoluteTime: string; // HH:mm format
  relativeMinutes: number; // Minutes depuis le départ
}

export class RouteGenerationService {
  /**
   * Génère automatiquement une route pour un bus en fonction des élèves assignés
   * @param busId - ID du bus
   * @returns La route générée
   */
  async generateRouteForBus(busId: string): Promise<Route> {
    // Récupérer le bus
    const bus = await busService.getBusById(busId);
    if (!bus) {
      throw new Error(`Bus with ID ${busId} not found`);
    }

    // Récupérer tous les élèves assignés au bus
    const students = await studentService.getStudentsByBus(busId);
    if (students.length === 0) {
      throw new Error(`No students assigned to bus ${busId}`);
    }

    // Extraire les pickup locations des élèves
    const pickupLocations: Array<{ location: Location; student: Student }> = students.map(
      (student) => ({
        location: student.pickupLocation,
        student,
      })
    );

    // Déterminer l'heure de départ
    const departureTime = bus.preferredDepartureTime || '07:00';

    // Optimiser l'ordre des arrêts avec Mapbox (ou fallback géographique)
    let optimizedStops: RouteStop[];
    let isOptimized = false;
    let optimizationEngine = 'manual';

    try {
      if (MAPBOX_OPTIMIZATION_ENABLED && MAPBOX_ACCESS_TOKEN) {
        const optimizedLocations = await this.optimizeStopsWithMapbox(
          pickupLocations.map((pl) => pl.location)
        );

        // Reconstruire les stops avec l'ordre optimisé
        optimizedStops = await this.buildOptimizedStops(
          optimizedLocations,
          pickupLocations,
          departureTime
        );
        isOptimized = true;
        optimizationEngine = 'mapbox';
      } else {
        // Fallback: ordre géographique simple (nord → sud, ouest → est)
        optimizedStops = await this.buildGeographicStops(pickupLocations, departureTime);
        isOptimized = false;
        optimizationEngine = 'geographic-fallback';
      }
    } catch (error) {
      console.error('Optimization failed, using geographic fallback:', error);
      optimizedStops = await this.buildGeographicStops(pickupLocations, departureTime);
      isOptimized = false;
      optimizationEngine = 'geographic-fallback';
    }

    // Calculer la distance et durée totales
    const totalStats = this.calculateTotalStats(optimizedStops);

    // Déterminer la commune principale (la plus fréquente)
    const mainCommune = this.determineMainCommune(students);

    // Déterminer tous les quartiers desservis
    const quartiers = [...new Set(students.map((s) => s.quartier))];

    // Calculer l'heure d'arrivée estimée
    const arrivalTime = this.calculateArrivalTime(departureTime, totalStats.durationMinutes);

    // Créer ou mettre à jour la route
    const routeData: Route = {
      id: '', // Sera généré par Firestore
      name: `Route Auto - ${bus.plateNumber}`,
      code: `AUTO-${bus.plateNumber}-${Date.now()}`,
      description: `Route générée automatiquement pour le bus ${bus.plateNumber} (${students.length} élèves)`,
      commune: mainCommune,
      quartiers,
      stops: optimizedStops,
      schedule: {
        morningDeparture: departureTime,
        morningArrival: arrivalTime,
        afternoonDeparture: '15:30', // Par défaut
        afternoonArrival: '16:30', // Par défaut
      },
      totalDistanceKm: totalStats.distanceKm,
      estimatedDurationMinutes: totalStats.durationMinutes,
      capacity: bus.capacity,
      currentOccupancy: students.length,
      busId,
      driverId: bus.driverId,
      activeDays: [
        DayOfWeek.MONDAY,
        DayOfWeek.TUESDAY,
        DayOfWeek.WEDNESDAY,
        DayOfWeek.THURSDAY,
        DayOfWeek.FRIDAY,
      ],
      isActive: true,
      isManual: false, // Route auto-générée
      generatedAt: new Date(),
      isOptimized,
      optimizationEngine,
      departureTime,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Vérifier si une route existe déjà pour ce bus
    const existingRoutes = await this.getRoutesByBus(busId);
    const existingAutoRoute = existingRoutes.find((r) => !r.isManual);

    if (existingAutoRoute) {
      // Mettre à jour la route existante
      const updated = await routeService.updateRoute(existingAutoRoute.id, {
        name: routeData.name,
        code: routeData.code,
        description: routeData.description,
        commune: routeData.commune,
        quartiers: routeData.quartiers,
        stops: routeData.stops.map((s) => ({
          name: s.name,
          address: s.address,
          location: s.location,
          order: s.order,
          estimatedTimeMinutes: s.estimatedTimeMinutes,
          type: s.type,
          quartier: s.quartier,
          notes: s.notes,
          studentId: s.studentId,
          estimatedArrivalTime: s.estimatedArrivalTime,
          relativeTimeMinutes: s.relativeTimeMinutes,
        })),
        schedule: routeData.schedule,
        totalDistanceKm: routeData.totalDistanceKm,
        estimatedDurationMinutes: routeData.estimatedDurationMinutes,
        currentOccupancy: routeData.currentOccupancy,
        isActive: routeData.isActive,
        departureTime: routeData.departureTime,
      });

      // Update generated metadata manually in Firestore
      await getDb().collection('routes').doc(updated.id).update({
        generatedAt: new Date(),
        isOptimized,
        optimizationEngine,
      });

      // Re-fetch to get updated data
      const final = await routeService.getRouteById(updated.id);
      return final!;
    } else {
      // Créer une nouvelle route
      const created = await routeService.createRoute({
        name: routeData.name,
        code: routeData.code,
        description: routeData.description,
        commune: routeData.commune,
        quartiers: routeData.quartiers,
        stops: routeData.stops.map((s) => ({
          name: s.name,
          address: s.address,
          location: s.location,
          order: s.order,
          estimatedTimeMinutes: s.estimatedTimeMinutes,
          type: s.type,
          quartier: s.quartier,
          notes: s.notes,
          studentId: s.studentId,
          estimatedArrivalTime: s.estimatedArrivalTime,
          relativeTimeMinutes: s.relativeTimeMinutes,
        })),
        schedule: routeData.schedule,
        totalDistanceKm: routeData.totalDistanceKm,
        estimatedDurationMinutes: routeData.estimatedDurationMinutes,
        capacity: routeData.capacity,
        activeDays: routeData.activeDays,
        isManual: false,
        departureTime: routeData.departureTime,
      });

      // Update generated metadata manually in Firestore
      await getDb().collection('routes').doc(created.id).update({
        generatedAt: new Date(),
        isOptimized,
        optimizationEngine,
      });

      // Re-fetch to get updated data
      const final = await routeService.getRouteById(created.id);
      return final!;
    }
  }

  /**
   * Force la régénération d'une route
   * @param busId - ID du bus
   * @returns La route régénérée
   */
  async regenerateRoute(busId: string): Promise<Route> {
    return this.generateRouteForBus(busId);
  }

  /**
   * Prévisualise une route sans la sauvegarder
   * @param busId - ID du bus
   * @returns La route prévisualisée
   */
  async previewRoute(busId: string): Promise<Partial<Route>> {
    const route = await this.generateRouteForBus(busId);
    return route;
  }

  /**
   * Optimise l'ordre des arrêts avec l'API Mapbox Optimization
   * @param locations - Liste des locations à optimiser
   * @returns Liste des locations dans l'ordre optimisé
   */
  private async optimizeStopsWithMapbox(locations: Location[]): Promise<Location[]> {
    if (!MAPBOX_ACCESS_TOKEN) {
      throw new Error('Mapbox access token not configured');
    }

    // Construire les coordonnées au format Mapbox: lng,lat;lng,lat;...
    const coordinates = locations
      .map((loc) => `${loc.lng},${loc.lat}`)
      .join(';');

    const url = `${MAPBOX_OPTIMIZATION_URL}/${coordinates}`;
    const params = {
      access_token: MAPBOX_ACCESS_TOKEN,
      roundtrip: false, // Pas de retour au point de départ
      source: 'first', // Commence au premier point
      destination: 'last', // Termine au dernier point
      geometries: 'geojson',
    };

    try {
      const response = await axios.get<MapboxOptimizationResponse>(url, { params });

      if (response.data.code !== 'Ok') {
        throw new Error(`Mapbox Optimization API error: ${response.data.code}`);
      }

      // Récupérer l'ordre optimisé des waypoints
      const optimizedOrder = response.data.waypoints.map((wp: any) => wp.waypoint_index);

      // Réorganiser les locations selon l'ordre optimisé
      return optimizedOrder.map((index: number) => locations[index]).filter((loc): loc is Location => loc !== undefined);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        console.error('Mapbox API error:', error.response?.data);
        throw new Error(`Mapbox API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Calcule les ETAs pour chaque arrêt en utilisant Mapbox Directions API
   * @param stops - Liste des locations dans l'ordre
   * @param departureTime - Heure de départ (format HH:mm)
   * @returns Tableau des ETAs pour chaque arrêt
   */
  private async calculateETAs(
    stops: Location[],
    departureTime: string
  ): Promise<ETACalculation[]> {
    if (stops.length === 0) {
      return [];
    }

    const etas: ETACalculation[] = [];
    let cumulativeMinutes = 0;

    // Premier arrêt (départ)
    etas.push({
      absoluteTime: departureTime,
      relativeMinutes: 0,
    });

    // Calculer les durées entre chaque paire d'arrêts
    for (let i = 0; i < stops.length - 1; i++) {
      const origin = stops[i];
      const destination = stops[i + 1];

      if (!origin || !destination) {
        continue;
      }

      let durationMinutes = 5; // Durée par défaut: 5 minutes

      if (MAPBOX_ACCESS_TOKEN && MAPBOX_OPTIMIZATION_ENABLED) {
        try {
          const duration = await this.getDirectionDuration(origin, destination);
          durationMinutes = Math.ceil(duration / 60); // Convertir secondes → minutes
        } catch (error) {
          console.error('Failed to get direction duration, using default:', error);
          // Utiliser la durée par défaut
        }
      } else {
        // Fallback: estimation basée sur la distance à vol d'oiseau
        const originLoc: Location = { address: '', lat: origin.lat, lng: origin.lng };
        const destLoc: Location = { address: '', lat: destination.lat, lng: destination.lng };
        const distance = this.calculateHaversineDistance(originLoc, destLoc);
        durationMinutes = Math.ceil(distance / 0.5); // Assume 30 km/h moyenne en ville
      }

      // Ajouter un temps d'arrêt (pickup time)
      const pickupTime = 2; // 2 minutes par arrêt
      cumulativeMinutes += durationMinutes + pickupTime;

      const absoluteTime = this.addMinutesToTime(departureTime, cumulativeMinutes);

      etas.push({
        absoluteTime,
        relativeMinutes: cumulativeMinutes,
      });
    }

    return etas;
  }

  /**
   * Obtient la durée d'un trajet via Mapbox Directions API
   * @param origin - Point de départ
   * @param destination - Point d'arrivée
   * @returns Durée en secondes
   */
  private async getDirectionDuration(origin: Location, destination: Location): Promise<number> {
    const coordinates = `${origin.lng},${origin.lat};${destination.lng},${destination.lat}`;
    const url = `${MAPBOX_DIRECTIONS_URL}/${coordinates}`;

    const params = {
      access_token: MAPBOX_ACCESS_TOKEN,
      geometries: 'geojson',
      overview: 'false',
    };

    try {
      const response = await axios.get<MapboxDirectionsResponse>(url, { params });
      if (response.data.routes && response.data.routes.length > 0) {
        const route = response.data.routes[0];
        if (route) {
          return route.duration;
        }
      }
      throw new Error('No routes found');
    } catch (error) {
      console.error('Mapbox Directions API error:', error);
      throw error;
    }
  }

  /**
   * Construit les stops optimisés avec les ETAs calculées
   * @param optimizedLocations - Locations dans l'ordre optimisé
   * @param originalData - Données originales avec les students
   * @param departureTime - Heure de départ
   * @returns Liste des RouteStop avec ETAs
   */
  private async buildOptimizedStops(
    optimizedLocations: Location[],
    originalData: Array<{ location: Location; student: Student }>,
    departureTime: string
  ): Promise<RouteStop[]> {
    // Calculer les ETAs
    const etas = await this.calculateETAs(optimizedLocations, departureTime);

    // Construire les stops
    const stops: RouteStop[] = optimizedLocations.map((location, index) => {
      // Trouver l'élève correspondant
      const data = originalData.find(
        (d) =>
          d.location.lat === location.lat &&
          d.location.lng === location.lng
      );

      const student = data?.student;
      const eta = etas[index];
      if (!eta || !student) {
        throw new Error('ETA or student data missing');
      }

      return {
        id: `stop-${Date.now()}-${index}`,
        name: student
          ? `Pickup ${student.firstName} ${student.lastName}`
          : location.address,
        address: location.address,
        location: {
          lat: location.lat,
          lng: location.lng,
        },
        order: index + 1,
        estimatedTimeMinutes: eta.relativeMinutes,
        type: 'pickup' as const,
        quartier: student?.quartier || location.quartier || '',
        notes: location.notes,
        studentId: student?.id,
        estimatedArrivalTime: eta.absoluteTime,
        relativeTimeMinutes: eta.relativeMinutes,
      };
    });

    return stops;
  }

  /**
   * Construit les stops dans un ordre géographique simple (fallback)
   * @param data - Données des locations et students
   * @param departureTime - Heure de départ
   * @returns Liste des RouteStop
   */
  private async buildGeographicStops(
    data: Array<{ location: Location; student: Student }>,
    departureTime: string
  ): Promise<RouteStop[]> {
    // Trier par latitude (nord → sud), puis longitude (ouest → est)
    const sorted = [...data].sort((a, b) => {
      if (Math.abs(a.location.lat - b.location.lat) > 0.01) {
        return b.location.lat - a.location.lat; // Nord → Sud
      }
      return a.location.lng - b.location.lng; // Ouest → Est
    });

    const locations = sorted.map((d) => d.location);
    const etas = await this.calculateETAs(locations, departureTime);

    const stops: RouteStop[] = sorted.map((item, index) => {
      const eta = etas[index];
      if (!eta) {
        throw new Error('ETA calculation failed for geographic fallback');
      }
      return {
        id: `stop-${Date.now()}-${index}`,
        name: `Pickup ${item.student.firstName} ${item.student.lastName}`,
        address: item.location.address,
        location: {
          lat: item.location.lat,
          lng: item.location.lng,
        },
        order: index + 1,
        estimatedTimeMinutes: eta.relativeMinutes,
        type: 'pickup' as const,
        quartier: item.student.quartier,
        notes: item.location.notes,
        studentId: item.student.id,
        estimatedArrivalTime: eta.absoluteTime,
        relativeTimeMinutes: eta.relativeMinutes,
      };
    });

    return stops;
  }

  /**
   * Calcule la distance à vol d'oiseau entre deux points (Haversine)
   * @param loc1 - Premier point
   * @param loc2 - Second point
   * @returns Distance en kilomètres
   */
  private calculateHaversineDistance(loc1: Location, loc2: Location): number {
    const R = 6371; // Rayon de la Terre en km
    const dLat = this.toRadians(loc2.lat - loc1.lat);
    const dLng = this.toRadians(loc2.lng - loc1.lng);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(loc1.lat)) *
        Math.cos(this.toRadians(loc2.lat)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Calcule les statistiques totales de la route
   * @param stops - Liste des arrêts
   * @returns Distance totale (km) et durée totale (minutes)
   */
  private calculateTotalStats(stops: RouteStop[]): {
    distanceKm: number;
    durationMinutes: number;
  } {
    if (stops.length === 0) {
      return { distanceKm: 0, durationMinutes: 0 };
    }

    // Calculer la distance totale à vol d'oiseau (approximation)
    let totalDistance = 0;
    for (let i = 0; i < stops.length - 1; i++) {
      const currentStop = stops[i];
      const nextStop = stops[i + 1];

      if (currentStop && nextStop) {
        const loc1: Location = { address: '', ...currentStop.location };
        const loc2: Location = { address: '', ...nextStop.location };
        totalDistance += this.calculateHaversineDistance(loc1, loc2);
      }
    }

    // Multiplier par 1.3 pour approximer la distance routière
    const distanceKm = totalDistance * 1.3;

    // La durée est la relativeTimeMinutes du dernier arrêt
    const lastStop = stops[stops.length - 1];
    const durationMinutes = lastStop?.relativeTimeMinutes || 0;

    return {
      distanceKm: Math.round(distanceKm * 10) / 10, // Arrondir à 1 décimale
      durationMinutes: Math.round(durationMinutes),
    };
  }

  /**
   * Détermine la commune principale (la plus fréquente)
   * @param students - Liste des élèves
   * @returns La commune la plus fréquente
   */
  private determineMainCommune(students: Student[]): CommuneAbidjan {
    const communeCounts: Record<string, number> = {};

    students.forEach((student) => {
      const commune = student.commune;
      communeCounts[commune] = (communeCounts[commune] || 0) + 1;
    });

    // Trouver la commune avec le plus d'occurrences
    let maxCount = 0;
    let mainCommune = CommuneAbidjan.COCODY; // Par défaut

    Object.entries(communeCounts).forEach(([commune, count]) => {
      if (count > maxCount) {
        maxCount = count;
        mainCommune = commune as CommuneAbidjan;
      }
    });

    return mainCommune;
  }

  /**
   * Ajoute des minutes à une heure au format HH:mm
   * @param time - Heure de base (format HH:mm)
   * @param minutes - Minutes à ajouter
   * @returns Nouvelle heure (format HH:mm)
   */
  private addMinutesToTime(time: string, minutes: number): string {
    const parts = time.split(':').map(Number);
    const hours = parts[0] || 0;
    const mins = parts[1] || 0;
    const totalMinutes = hours * 60 + mins + minutes;
    const newHours = Math.floor(totalMinutes / 60) % 24;
    const newMins = totalMinutes % 60;

    return `${String(newHours).padStart(2, '0')}:${String(newMins).padStart(2, '0')}`;
  }

  /**
   * Calcule l'heure d'arrivée
   * @param departureTime - Heure de départ (HH:mm)
   * @param durationMinutes - Durée du trajet en minutes
   * @returns Heure d'arrivée (HH:mm)
   */
  private calculateArrivalTime(departureTime: string, durationMinutes: number): string {
    return this.addMinutesToTime(departureTime, durationMinutes);
  }

  /**
   * Récupère les routes d'un bus
   * @param busId - ID du bus
   * @returns Liste des routes du bus
   */
  private async getRoutesByBus(busId: string): Promise<Route[]> {
    const snapshot = await getDb()
      .collection('routes')
      .where('busId', '==', busId)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
        generatedAt: data.generatedAt?.toDate(),
      } as Route;
    });
  }
}

export default new RouteGenerationService();
