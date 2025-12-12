/**
 * Service Bus - Logique métier pour la gestion des bus
 * Gère les opérations CRUD sur la collection Firestore /buses
 */

import { getDb } from '../config/firebase.config';
import {
  Bus,
  BusCreateInput,
  BusUpdateInput,
  BusStatus,
  BusMaintenanceStatus,
} from '../types/bus.types';
import { UserRole } from '../types/user.types';
import { Timestamp } from 'firebase-admin/firestore';

export class BusService {
  private getCollection() {
    return getDb().collection('buses');
  }

  private getUsersCollection() {
    return getDb().collection('users');
  }

  /**
   * Enrichit un bus avec le nom du chauffeur et du convoyeur
   * @param bus - Bus à enrichir
   * @returns Bus enrichi avec driverName et escortName
   */
  private async enrichWithDriverName(bus: Bus): Promise<Bus> {
    let enrichedBus = { ...bus, driverName: null, escortName: null };

    // Enrichir avec le nom du chauffeur
    if (bus.driverId) {
      try {
        const driverDoc = await this.getUsersCollection().doc(bus.driverId).get();
        if (driverDoc.exists) {
          const driverData = driverDoc.data();
          if (driverData?.role === UserRole.DRIVER) {
            enrichedBus.driverName = driverData.displayName || null;
          }
        }
      } catch (error) {
        console.error(`Error enriching bus ${bus.id} with driver name:`, error);
      }
    }

    // Enrichir avec le nom du convoyeur
    if (bus.escortId) {
      try {
        const escortDoc = await this.getUsersCollection().doc(bus.escortId).get();
        if (escortDoc.exists) {
          const escortData = escortDoc.data();
          if (escortData?.role === UserRole.ESCORT) {
            enrichedBus.escortName = escortData.displayName || null;
          }
        }
      } catch (error) {
        console.error(`Error enriching bus ${bus.id} with escort name:`, error);
      }
    }

    return enrichedBus;
  }

  /**
   * Enrichit plusieurs bus avec les noms des chauffeurs et convoyeurs
   * @param buses - Liste des bus à enrichir
   * @returns Buses enrichis avec driverName et escortName
   */
  private async enrichBusesWithDriverNames(buses: Bus[]): Promise<Bus[]> {
    // Récupérer tous les IDs de chauffeurs et convoyeurs uniques
    const driverIds = [...new Set(buses.map(b => b.driverId).filter(id => id !== null))] as string[];
    const escortIds = [...new Set(buses.map(b => b.escortId).filter(id => id !== null))] as string[];

    if (driverIds.length === 0 && escortIds.length === 0) {
      return buses.map(bus => ({ ...bus, driverName: null, escortName: null }));
    }

    // Récupérer tous les chauffeurs en une seule requête
    const driversSnapshot = await this.getUsersCollection()
      .where('role', '==', UserRole.DRIVER)
      .get();

    // Récupérer tous les convoyeurs en une seule requête
    const escortsSnapshot = await this.getUsersCollection()
      .where('role', '==', UserRole.ESCORT)
      .get();

    // Créer des maps ID -> nom
    const driverNamesMap = new Map<string, string>();
    driversSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.displayName) {
        driverNamesMap.set(doc.id, data.displayName);
      }
    });

    const escortNamesMap = new Map<string, string>();
    escortsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.displayName) {
        escortNamesMap.set(doc.id, data.displayName);
      }
    });

    // Enrichir les bus
    return buses.map(bus => ({
      ...bus,
      driverName: bus.driverId ? (driverNamesMap.get(bus.driverId) || null) : null,
      escortName: bus.escortId ? (escortNamesMap.get(bus.escortId) || null) : null,
    }));
  }

  /**
   * Crée un nouveau bus dans Firestore
   * @param input - Données du bus à créer
   * @returns Le bus créé avec son ID
   */
  async createBus(input: BusCreateInput): Promise<Bus> {
    const now = Timestamp.now();
    const busData = {
      ...input,
      status: BusStatus.ACTIVE,
      maintenanceStatus: BusMaintenanceStatus.OK,
      driverId: null,
      escortId: null,
      routeId: null,
      studentIds: [],
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.getCollection().add(busData);
    const doc = await docRef.get();

    return {
      id: docRef.id,
      ...busData,
      createdAt: doc.createTime?.toDate() || new Date(),
      updatedAt: doc.updateTime?.toDate() || new Date(),
    } as Bus;
  }

  /**
   * Récupère tous les bus
   * @returns Liste de tous les bus enrichis avec les noms des chauffeurs
   */
  async getAllBuses(): Promise<Bus[]> {
    const snapshot = await this.getCollection().get();
    const buses = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Bus;
    });

    // Enrichir avec les noms des chauffeurs
    return this.enrichBusesWithDriverNames(buses);
  }

  /**
   * Récupère un bus par son ID
   * @param busId - ID du bus à récupérer
   * @returns Le bus trouvé enrichi avec le nom du chauffeur, ou null
   */
  async getBusById(busId: string): Promise<Bus | null> {
    const doc = await this.getCollection().doc(busId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    const bus = {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
    } as Bus;

    // Enrichir avec le nom du chauffeur
    return this.enrichWithDriverName(bus);
  }

  /**
   * Met à jour un bus existant
   * @param busId - ID du bus à mettre à jour
   * @param input - Données à mettre à jour
   * @returns Le bus mis à jour enrichi avec le nom du chauffeur
   */
  async updateBus(busId: string, input: BusUpdateInput): Promise<Bus> {
    const docRef = this.getCollection().doc(busId);

    // Vérifier que le bus existe
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Bus with ID ${busId} not found`);
    }

    await docRef.update({
      ...input,
      updatedAt: Timestamp.now(),
    });

    const updated = await docRef.get();
    const data = updated.data();

    const bus = {
      id: updated.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || updated.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || updated.updateTime?.toDate() || new Date(),
    } as Bus;

    // Enrichir avec le nom du chauffeur
    return this.enrichWithDriverName(bus);
  }

  /**
   * Supprime un bus
   * @param busId - ID du bus à supprimer
   */
  async deleteBus(busId: string): Promise<void> {
    const doc = await this.getCollection().doc(busId).get();
    if (!doc.exists) {
      throw new Error(`Bus with ID ${busId} not found`);
    }

    await this.getCollection().doc(busId).delete();
  }

  /**
   * Récupère les bus avec leurs positions GPS en temps réel
   * @returns Liste des bus avec positions enrichis avec les noms des chauffeurs
   */
  async getBusesWithLivePosition(): Promise<Bus[]> {
    const buses = await this.getAllBuses(); // Déjà enrichis avec les noms
    const gpsSnapshot = await getDb().collection('gps_live').get();
    const gpsMap = new Map(gpsSnapshot.docs.map((doc) => [doc.id, doc.data()]));

    return buses.map((bus) => {
      const gpsData = gpsMap.get(bus.id);
      return {
        ...bus,
        currentPosition: gpsData
          ? {
              lat: gpsData.lat,
              lng: gpsData.lng,
              speed: gpsData.speed || 0,
              timestamp: gpsData.timestamp,
            }
          : undefined,
      };
    });
  }
}

export default new BusService();
