/**
 * Service School - Logique métier pour la gestion des écoles
 * Gère les opérations CRUD sur la collection Firestore /schools
 */

import { getDb, collections } from '../config/firebase.config';
import {
  School,
  SchoolCreateInput,
  SchoolUpdateInput,
} from '../types/school.types';
import { Timestamp } from 'firebase-admin/firestore';
import type admin from 'firebase-admin';

export class SchoolService {
  private getCollection() {
    return getDb().collection(collections.schools);
  }

  private getBusesCollection() {
    return getDb().collection(collections.buses);
  }

  /**
   * Crée une nouvelle école
   * @param data - Données de l'école à créer
   * @returns École créée avec ID généré
   */
  async createSchool(data: SchoolCreateInput): Promise<School> {
    const now = Timestamp.now();

    // Calculer fleetSize si non fourni
    let fleetSize = data.fleetSize ?? 0;
    if (!data.fleetSize) {
      // Si fleetSize n'est pas fourni, on le laisse à 0
      // Il sera mis à jour automatiquement quand des bus seront assignés
      fleetSize = 0;
    }

    // Valider les coordonnées GPS
    if (data.location.lat < -90 || data.location.lat > 90) {
      throw new Error('Latitude invalide (doit être entre -90 et 90)');
    }
    if (data.location.lng < -180 || data.location.lng > 180) {
      throw new Error('Longitude invalide (doit être entre -180 et 180)');
    }

    const schoolData = {
      name: data.name,
      location: {
        lat: data.location.lat,
        lng: data.location.lng,
      },
      fleetSize,
      address: data.address || null,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.getCollection().add(schoolData);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error('Erreur lors de la création de l\'école');
    }

    return this.mapFirestoreToSchool(doc);
  }

  /**
   * Récupère une école par son ID
   * @param schoolId - ID de l'école
   * @returns École ou null si non trouvée
   */
  async getSchoolById(schoolId: string): Promise<School | null> {
    const doc = await this.getCollection().doc(schoolId).get();

    if (!doc.exists) {
      return null;
    }

    return this.mapFirestoreToSchool(doc);
  }

  /**
   * Récupère toutes les écoles actives
   * @returns Liste des écoles actives
   */
  async getAllSchools(): Promise<School[]> {
    const snapshot = await this.getCollection()
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map((doc) => this.mapFirestoreToSchool(doc));
  }

  /**
   * Met à jour une école
   * @param schoolId - ID de l'école
   * @param data - Données à mettre à jour
   * @returns École mise à jour
   */
  async updateSchool(
    schoolId: string,
    data: SchoolUpdateInput
  ): Promise<School> {
    const docRef = this.getCollection().doc(schoolId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error(`School ${schoolId} not found`);
    }

    const updateData: any = {
      updatedAt: Timestamp.now(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }

    if (data.location !== undefined) {
      // Valider les coordonnées GPS
      if (data.location.lat < -90 || data.location.lat > 90) {
        throw new Error('Latitude invalide (doit être entre -90 et 90)');
      }
      if (data.location.lng < -180 || data.location.lng > 180) {
        throw new Error('Longitude invalide (doit être entre -180 et 180)');
      }
      updateData.location = {
        lat: data.location.lat,
        lng: data.location.lng,
      };
    }

    if (data.fleetSize !== undefined) {
      updateData.fleetSize = data.fleetSize;
    }

    if (data.address !== undefined) {
      updateData.address = data.address || null;
    }

    if (data.contactEmail !== undefined) {
      updateData.contactEmail = data.contactEmail || null;
    }

    if (data.contactPhone !== undefined) {
      updateData.contactPhone = data.contactPhone || null;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    await docRef.update(updateData);

    // Récupérer le document mis à jour
    const updatedDoc = await docRef.get();
    return this.mapFirestoreToSchool(updatedDoc);
  }

  /**
   * Supprime une école (soft delete)
   * @param schoolId - ID de l'école
   */
  async deleteSchool(schoolId: string): Promise<void> {
    const docRef = this.getCollection().doc(schoolId);
    const doc = await docRef.get();

    if (!doc.exists) {
      throw new Error(`School ${schoolId} not found`);
    }

    await docRef.update({
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Compte le nombre de bus d'une école
   * @param schoolId - ID de l'école
   * @returns Nombre de bus de l'école
   */
  async getSchoolFleetCount(schoolId: string): Promise<number> {
    const snapshot = await this.getBusesCollection()
      .where('schoolId', '==', schoolId)
      .get();

    return snapshot.size;
  }

  /**
   * Met à jour automatiquement le fleetSize d'une école
   * @param schoolId - ID de l'école
   */
  async updateFleetSize(schoolId: string): Promise<void> {
    const fleetCount = await this.getSchoolFleetCount(schoolId);
    const docRef = this.getCollection().doc(schoolId);

    await docRef.update({
      fleetSize: fleetCount,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Transforme un document Firestore en objet School
   * @param doc - Document Firestore
   * @returns Objet School
   */
  private mapFirestoreToSchool(doc: admin.firestore.DocumentSnapshot): School {
    const data = doc.data();
    if (!data) {
      throw new Error('Document data is null');
    }

    return {
      id: doc.id,
      name: data.name,
      location: {
        lat: data.location.lat,
        lng: data.location.lng,
      },
      fleetSize: data.fleetSize || 0,
      address: data.address || undefined,
      contactEmail: data.contactEmail || undefined,
      contactPhone: data.contactPhone || undefined,
      isActive: data.isActive !== false,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
    };
  }
}

// Export instance singleton
export default new SchoolService();
