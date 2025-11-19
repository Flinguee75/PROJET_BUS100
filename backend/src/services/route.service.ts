/**
 * Service Route - Logique métier pour la gestion des routes
 * Gère les opérations CRUD sur la collection Firestore /routes
 */

import { getDb } from '../config/firebase.config';
import {
  Route,
  RouteCreateInput,
  RouteUpdateInput,
  RouteStop,
  CommuneAbidjan,
} from '../types/route.types';
import { Timestamp } from 'firebase-admin/firestore';

export class RouteService {
  private getCollection() {
    return getDb().collection('routes');
  }

  /**
   * Génère des IDs pour les stops
   */
  private generateStopIds(stops: Omit<RouteStop, 'id'>[]): RouteStop[] {
    const timestamp = Date.now();
    return stops.map((stop, index) => ({
      ...stop,
      id: `stop-${timestamp}-${index}`,
    }));
  }

  /**
   * Crée une nouvelle route dans Firestore
   * @param input - Données de la route à créer
   * @returns La route créée avec son ID
   */
  async createRoute(input: RouteCreateInput): Promise<Route> {
    const now = Timestamp.now();
    
    // Générer les IDs pour les stops
    const stopsWithIds = this.generateStopIds(input.stops);

    const routeData = {
      ...input,
      stops: stopsWithIds,
      currentOccupancy: 0,
      busId: null,
      driverId: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.getCollection().add(routeData);
    const doc = await docRef.get();

    return {
      id: docRef.id,
      ...routeData,
      createdAt: doc.createTime?.toDate() || new Date(),
      updatedAt: doc.updateTime?.toDate() || new Date(),
    } as Route;
  }

  /**
   * Récupère toutes les routes
   * @returns Liste de toutes les routes
   */
  async getAllRoutes(): Promise<Route[]> {
    const snapshot = await this.getCollection().get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Route;
    });
  }

  /**
   * Récupère une route par son ID
   * @param routeId - ID de la route à récupérer
   * @returns La route trouvée ou null
   */
  async getRouteById(routeId: string): Promise<Route | null> {
    const doc = await this.getCollection().doc(routeId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
    } as Route;
  }

  /**
   * Récupère les routes d'une commune
   * @param commune - Commune d'Abidjan
   * @returns Liste des routes de la commune
   */
  async getRoutesByCommune(commune: CommuneAbidjan): Promise<Route[]> {
    const snapshot = await this.getCollection()
      .where('commune', '==', commune)
      .get();
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Route;
    });
  }

  /**
   * Récupère les routes qui desservent un quartier
   * @param quartier - Nom du quartier
   * @returns Liste des routes qui passent par ce quartier
   */
  async getRoutesByQuartier(quartier: string): Promise<Route[]> {
    const snapshot = await this.getCollection()
      .where('quartiers', 'array-contains', quartier)
      .get();
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Route;
    });
  }

  /**
   * Récupère les routes actives
   * @returns Liste des routes actives
   */
  async getActiveRoutes(): Promise<Route[]> {
    const snapshot = await this.getCollection()
      .where('isActive', '==', true)
      .get();
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Route;
    });
  }

  /**
   * Récupère les routes disponibles (avec places libres)
   * @returns Liste des routes avec places disponibles
   */
  async getAvailableRoutes(): Promise<Route[]> {
    const allRoutes = await this.getActiveRoutes();
    return allRoutes.filter(route => route.currentOccupancy < route.capacity);
  }

  /**
   * Met à jour une route existante
   * @param routeId - ID de la route à mettre à jour
   * @param input - Données à mettre à jour
   * @returns La route mise à jour
   */
  async updateRoute(routeId: string, input: RouteUpdateInput): Promise<Route> {
    const docRef = this.getCollection().doc(routeId);

    // Vérifier que la route existe
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Route with ID ${routeId} not found`);
    }

    const updateData: any = {
      ...input,
      updatedAt: Timestamp.now(),
    };

    // Gérer les stops si présents
    if (input.stops) {
      updateData.stops = this.generateStopIds(input.stops);
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    const data = updated.data();

    return {
      id: updated.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || updated.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || updated.updateTime?.toDate() || new Date(),
    } as Route;
  }

  /**
   * Supprime une route (soft delete - marque comme inactive)
   * @param routeId - ID de la route à supprimer
   */
  async deleteRoute(routeId: string): Promise<void> {
    const doc = await this.getCollection().doc(routeId).get();
    if (!doc.exists) {
      throw new Error(`Route with ID ${routeId} not found`);
    }

    // Soft delete
    await this.getCollection().doc(routeId).update({
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Assigne un bus à une route
   * @param routeId - ID de la route
   * @param busId - ID du bus
   */
  async assignBus(routeId: string, busId: string): Promise<Route> {
    return this.updateRoute(routeId, { busId });
  }

  /**
   * Retire le bus d'une route
   * @param routeId - ID de la route
   */
  async removeBus(routeId: string): Promise<Route> {
    return this.updateRoute(routeId, { busId: null });
  }

  /**
   * Assigne un chauffeur à une route
   * @param routeId - ID de la route
   * @param driverId - ID du chauffeur
   */
  async assignDriver(routeId: string, driverId: string): Promise<Route> {
    return this.updateRoute(routeId, { driverId });
  }

  /**
   * Retire le chauffeur d'une route
   * @param routeId - ID de la route
   */
  async removeDriver(routeId: string): Promise<Route> {
    return this.updateRoute(routeId, { driverId: null });
  }

  /**
   * Met à jour l'occupation d'une route
   * @param routeId - ID de la route
   * @param occupancy - Nouveau nombre d'élèves
   */
  async updateOccupancy(routeId: string, occupancy: number): Promise<Route> {
    const route = await this.getRouteById(routeId);
    if (!route) {
      throw new Error(`Route with ID ${routeId} not found`);
    }

    if (occupancy > route.capacity) {
      throw new Error(`Occupancy ${occupancy} exceeds route capacity ${route.capacity}`);
    }

    return this.updateRoute(routeId, { currentOccupancy: occupancy });
  }

  /**
   * Incrémente l'occupation d'une route (ajouter un élève)
   * @param routeId - ID de la route
   */
  async incrementOccupancy(routeId: string): Promise<Route> {
    const route = await this.getRouteById(routeId);
    if (!route) {
      throw new Error(`Route with ID ${routeId} not found`);
    }

    const newOccupancy = route.currentOccupancy + 1;
    if (newOccupancy > route.capacity) {
      throw new Error(`Route is full (capacity: ${route.capacity})`);
    }

    return this.updateRoute(routeId, { currentOccupancy: newOccupancy });
  }

  /**
   * Décrémente l'occupation d'une route (retirer un élève)
   * @param routeId - ID de la route
   */
  async decrementOccupancy(routeId: string): Promise<Route> {
    const route = await this.getRouteById(routeId);
    if (!route) {
      throw new Error(`Route with ID ${routeId} not found`);
    }

    const newOccupancy = Math.max(0, route.currentOccupancy - 1);
    return this.updateRoute(routeId, { currentOccupancy: newOccupancy });
  }
}

export default new RouteService();

