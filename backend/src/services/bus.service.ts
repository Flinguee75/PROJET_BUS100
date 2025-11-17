/**
 * Service Bus - Logique métier pour la gestion des bus
 * Gère les opérations CRUD sur la collection Firestore /buses
 */

import { getDb } from '../config/firebase.config';
import { Bus, BusCreateInput, BusUpdateInput, BusStatus, MaintenanceStatus } from '../types/bus.types';
import { Timestamp } from 'firebase-admin/firestore';

export class BusService {
  private getCollection() {
    return getDb().collection('buses');
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
      maintenanceStatus: MaintenanceStatus.OK,
      driverId: null,
      routeId: null,
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
   * @returns Liste de tous les bus
   */
  async getAllBuses(): Promise<Bus[]> {
    const snapshot = await this.getCollection().get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Bus;
    });
  }

  /**
   * Récupère un bus par son ID
   * @param busId - ID du bus à récupérer
   * @returns Le bus trouvé ou null
   */
  async getBusById(busId: string): Promise<Bus | null> {
    const doc = await this.getCollection().doc(busId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
    } as Bus;
  }

  /**
   * Met à jour un bus existant
   * @param busId - ID du bus à mettre à jour
   * @param input - Données à mettre à jour
   * @returns Le bus mis à jour
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
    
    return {
      id: updated.id,
      ...data,
      createdAt: data?.createdAt?.toDate() || updated.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || updated.updateTime?.toDate() || new Date(),
    } as Bus;
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
   * @returns Liste des bus avec positions
   */
  async getBusesWithLivePosition(): Promise<Bus[]> {
    const buses = await this.getAllBuses();
    const gpsSnapshot = await getDb().collection('gps_live').get();
    const gpsMap = new Map(
      gpsSnapshot.docs.map((doc) => [doc.id, doc.data()])
    );

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

