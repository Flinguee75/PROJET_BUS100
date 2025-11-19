/**
 * Service Maintenance - Logique métier pour la gestion des maintenances
 * Gère les opérations CRUD sur la collection Firestore /maintenances
 */

import { getDb } from '../config/firebase.config';
import {
  Maintenance,
  MaintenanceCreateInput,
  MaintenanceUpdateInput,
  MaintenanceFilter,
  MaintenanceStatus,
} from '../types/maintenance.types';
import { Timestamp } from 'firebase-admin/firestore';

export class MaintenanceService {
  private getCollection() {
    return getDb().collection('maintenances');
  }

  /**
   * Crée un nouveau rapport de maintenance dans Firestore
   * @param input - Données de la maintenance à créer
   * @returns La maintenance créée avec son ID
   */
  async createMaintenance(input: MaintenanceCreateInput): Promise<Maintenance> {
    const now = Timestamp.now();
    const maintenanceData = {
      ...input,
      status: MaintenanceStatus.REPORTED,
      reportedAt: now,
      createdAt: now,
      updatedAt: now,
      // Convertir les dates optionnelles en Timestamp si présentes
      scheduledDate: input.scheduledDate ? Timestamp.fromDate(input.scheduledDate) : null,
    };

    const docRef = await this.getCollection().add(maintenanceData);
    const doc = await docRef.get();
    const data = doc.data();

    return {
      id: docRef.id,
      ...data,
      reportedAt: data?.reportedAt?.toDate() || new Date(),
      scheduledDate: data?.scheduledDate?.toDate() || undefined,
      completedDate: data?.completedDate?.toDate() || undefined,
      createdAt: doc.createTime?.toDate() || new Date(),
      updatedAt: doc.updateTime?.toDate() || new Date(),
    } as Maintenance;
  }

  /**
   * Récupère toutes les maintenances avec filtres optionnels
   * @param filter - Filtres optionnels (busId, status, severity, type)
   * @returns Liste des maintenances filtrées
   */
  async getAllMaintenances(filter?: MaintenanceFilter): Promise<Maintenance[]> {
    let query = this.getCollection().orderBy('reportedAt', 'desc');

    // Appliquer les filtres
    if (filter?.busId) {
      query = query.where('busId', '==', filter.busId) as any;
    }
    if (filter?.status) {
      query = query.where('status', '==', filter.status) as any;
    }
    if (filter?.severity) {
      query = query.where('severity', '==', filter.severity) as any;
    }
    if (filter?.type) {
      query = query.where('type', '==', filter.type) as any;
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        reportedAt: data.reportedAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate() || undefined,
        completedDate: data.completedDate?.toDate() || undefined,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Maintenance;
    });
  }

  /**
   * Récupère une maintenance par son ID
   * @param maintenanceId - ID de la maintenance à récupérer
   * @returns La maintenance trouvée ou null
   */
  async getMaintenanceById(maintenanceId: string): Promise<Maintenance | null> {
    const doc = await this.getCollection().doc(maintenanceId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      reportedAt: data?.reportedAt?.toDate() || new Date(),
      scheduledDate: data?.scheduledDate?.toDate() || undefined,
      completedDate: data?.completedDate?.toDate() || undefined,
      createdAt: data?.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
    } as Maintenance;
  }

  /**
   * Met à jour une maintenance existante
   * @param maintenanceId - ID de la maintenance à mettre à jour
   * @param input - Données à mettre à jour
   * @returns La maintenance mise à jour
   */
  async updateMaintenance(
    maintenanceId: string,
    input: MaintenanceUpdateInput
  ): Promise<Maintenance> {
    const docRef = this.getCollection().doc(maintenanceId);

    // Vérifier que la maintenance existe
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Maintenance with ID ${maintenanceId} not found`);
    }

    // Préparer les données à mettre à jour
    const updateData: any = {
      ...input,
      updatedAt: Timestamp.now(),
    };

    // Convertir les dates en Timestamp si présentes
    if (input.scheduledDate) {
      updateData.scheduledDate = Timestamp.fromDate(input.scheduledDate);
    }
    if (input.completedDate) {
      updateData.completedDate = Timestamp.fromDate(input.completedDate);
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    const data = updated.data();

    return {
      id: updated.id,
      ...data,
      reportedAt: data?.reportedAt?.toDate() || new Date(),
      scheduledDate: data?.scheduledDate?.toDate() || undefined,
      completedDate: data?.completedDate?.toDate() || undefined,
      createdAt: data?.createdAt?.toDate() || updated.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || updated.updateTime?.toDate() || new Date(),
    } as Maintenance;
  }

  /**
   * Supprime une maintenance
   * @param maintenanceId - ID de la maintenance à supprimer
   */
  async deleteMaintenance(maintenanceId: string): Promise<void> {
    const doc = await this.getCollection().doc(maintenanceId).get();
    if (!doc.exists) {
      throw new Error(`Maintenance with ID ${maintenanceId} not found`);
    }

    await this.getCollection().doc(maintenanceId).delete();
  }

  /**
   * Récupère les maintenances d'un bus spécifique
   * @param busId - ID du bus
   * @returns Liste des maintenances du bus
   */
  async getMaintenancesByBusId(busId: string): Promise<Maintenance[]> {
    return this.getAllMaintenances({ busId });
  }

  /**
   * Récupère les maintenances actives (non complétées et non annulées)
   * @returns Liste des maintenances actives
   */
  async getActiveMaintenances(): Promise<Maintenance[]> {
    const snapshot = await this.getCollection()
      .where('status', 'in', [
        MaintenanceStatus.REPORTED,
        MaintenanceStatus.SCHEDULED,
        MaintenanceStatus.IN_PROGRESS,
      ])
      .orderBy('reportedAt', 'desc')
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        reportedAt: data.reportedAt?.toDate() || new Date(),
        scheduledDate: data.scheduledDate?.toDate() || undefined,
        completedDate: data.completedDate?.toDate() || undefined,
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Maintenance;
    });
  }
}

export default new MaintenanceService();
