/**
 * Service Driver - Logique métier pour la gestion des chauffeurs
 * Gère les opérations CRUD sur la collection Firestore /users avec role=driver
 */

import { getDb } from '../config/firebase.config';
import { Driver, UserRole } from '../types/user.types';
import { Timestamp } from 'firebase-admin/firestore';

export interface DriverCreateInput {
  email: string;
  displayName: string;
  phoneNumber: string;
  licenseNumber: string;
  licenseExpiry: Date | string;
  photoUrl?: string;
}

export interface DriverUpdateInput {
  displayName?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  licenseExpiry?: Date | string;
  busId?: string | null;
  photoUrl?: string;
  isActive?: boolean;
}

export class DriverService {
  private getCollection() {
    return getDb().collection('users');
  }

  /**
   * Crée un nouveau chauffeur dans Firestore
   * @param input - Données du chauffeur à créer
   * @returns Le chauffeur créé avec son ID
   */
  async createDriver(input: DriverCreateInput): Promise<Driver> {
    const now = Timestamp.now();
    const driverData = {
      email: input.email,
      displayName: input.displayName,
      phoneNumber: input.phoneNumber,
      role: UserRole.DRIVER,
      licenseNumber: input.licenseNumber,
      licenseExpiry: input.licenseExpiry instanceof Date
        ? Timestamp.fromDate(input.licenseExpiry)
        : Timestamp.fromDate(new Date(input.licenseExpiry)),
      busId: null,
      photoUrl: input.photoUrl || undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.getCollection().add(driverData);
    const doc = await docRef.get();
    const data = doc.data();

    return {
      id: docRef.id,
      ...data,
      licenseExpiry: this.convertLicenseExpiry(data?.licenseExpiry),
      createdAt: doc.createTime?.toDate() || new Date(),
      updatedAt: doc.updateTime?.toDate() || new Date(),
    } as Driver;
  }

  /**
   * Convertit licenseExpiry en Date, qu'il soit Timestamp ou string
   */
  private convertLicenseExpiry(licenseExpiry: any): Date {
    if (!licenseExpiry) {
      return new Date();
    }

    // Si c'est un Timestamp Firestore
    if (typeof licenseExpiry.toDate === 'function') {
      return licenseExpiry.toDate();
    }

    // Si c'est une string ISO
    if (typeof licenseExpiry === 'string') {
      return new Date(licenseExpiry);
    }

    // Si c'est déjà une Date
    if (licenseExpiry instanceof Date) {
      return licenseExpiry;
    }

    return new Date();
  }

  /**
   * Récupère tous les chauffeurs
   * @returns Liste de tous les chauffeurs
   */
  async getAllDrivers(): Promise<Driver[]> {
    const snapshot = await this.getCollection()
      .where('role', '==', UserRole.DRIVER)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        licenseExpiry: this.convertLicenseExpiry(data.licenseExpiry),
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Driver;
    });
  }

  /**
   * Récupère un chauffeur par son ID
   * @param driverId - ID du chauffeur à récupérer
   * @returns Le chauffeur trouvé ou null
   */
  async getDriverById(driverId: string): Promise<Driver | null> {
    const doc = await this.getCollection().doc(driverId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Vérifier que c'est bien un chauffeur
    if (data?.role !== UserRole.DRIVER) {
      return null;
    }

    return {
      id: doc.id,
      ...data,
      licenseExpiry: this.convertLicenseExpiry(data?.licenseExpiry),
      createdAt: data?.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
    } as Driver;
  }

  /**
   * Récupère le chauffeur assigné à un bus
   * @param busId - ID du bus
   * @returns Le chauffeur du bus ou null
   */
  async getDriverByBus(busId: string): Promise<Driver | null> {
    const snapshot = await this.getCollection()
      .where('role', '==', UserRole.DRIVER)
      .where('busId', '==', busId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0];
    if (!doc) {
      return null;
    }

    const data = doc.data();

    return {
      id: doc.id,
      ...data,
      licenseExpiry: this.convertLicenseExpiry(data.licenseExpiry),
      createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
    } as Driver;
  }

  /**
   * Récupère les chauffeurs disponibles (sans bus assigné)
   * @returns Liste des chauffeurs disponibles
   */
  async getAvailableDrivers(): Promise<Driver[]> {
    const snapshot = await this.getCollection()
      .where('role', '==', UserRole.DRIVER)
      .where('busId', '==', null)
      .where('isActive', '==', true)
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        licenseExpiry: this.convertLicenseExpiry(data.licenseExpiry),
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Driver;
    });
  }

  /**
   * Met à jour un chauffeur existant
   * @param driverId - ID du chauffeur à mettre à jour
   * @param input - Données à mettre à jour
   * @returns Le chauffeur mis à jour
   */
  async updateDriver(driverId: string, input: DriverUpdateInput): Promise<Driver> {
    const docRef = this.getCollection().doc(driverId);

    // Vérifier que le chauffeur existe
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Driver with ID ${driverId} not found`);
    }

    const data = doc.data();
    if (data?.role !== UserRole.DRIVER) {
      throw new Error(`User ${driverId} is not a driver`);
    }

    const updateData: any = {
      ...input,
      updatedAt: Timestamp.now(),
    };

    // Convertir licenseExpiry si présent
    if (input.licenseExpiry) {
      updateData.licenseExpiry = input.licenseExpiry instanceof Date
        ? Timestamp.fromDate(input.licenseExpiry)
        : Timestamp.fromDate(new Date(input.licenseExpiry));
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    const updatedData = updated.data();

    return {
      id: updated.id,
      ...updatedData,
      licenseExpiry: this.convertLicenseExpiry(updatedData?.licenseExpiry),
      createdAt: updatedData?.createdAt?.toDate() || updated.createTime?.toDate() || new Date(),
      updatedAt: updatedData?.updatedAt?.toDate() || updated.updateTime?.toDate() || new Date(),
    } as Driver;
  }

  /**
   * Supprime un chauffeur (soft delete - marque comme inactif)
   * @param driverId - ID du chauffeur à supprimer
   */
  async deleteDriver(driverId: string): Promise<void> {
    const doc = await this.getCollection().doc(driverId).get();
    if (!doc.exists) {
      throw new Error(`Driver with ID ${driverId} not found`);
    }

    const data = doc.data();
    if (data?.role !== UserRole.DRIVER) {
      throw new Error(`User ${driverId} is not a driver`);
    }

    // Soft delete - marquer comme inactif
    await this.getCollection().doc(driverId).update({
      isActive: false,
      busId: null, // Retirer l'assignation du bus
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Assigne un chauffeur à un bus
   * @param driverId - ID du chauffeur
   * @param busId - ID du bus
   */
  async assignToBus(driverId: string, busId: string): Promise<Driver> {
    return this.updateDriver(driverId, { busId });
  }

  /**
   * Retire un chauffeur d'un bus
   * @param driverId - ID du chauffeur
   */
  async removeFromBus(driverId: string): Promise<Driver> {
    return this.updateDriver(driverId, { busId: null });
  }

  /**
   * Vérifie si le permis d'un chauffeur est expiré
   * @param driverId - ID du chauffeur
   * @returns true si le permis est expiré
   */
  async isLicenseExpired(driverId: string): Promise<boolean> {
    const driver = await this.getDriverById(driverId);
    if (!driver) {
      throw new Error(`Driver with ID ${driverId} not found`);
    }

    return driver.licenseExpiry < new Date();
  }

  /**
   * Récupère les chauffeurs avec permis expiré
   * @returns Liste des chauffeurs avec permis expiré
   */
  async getDriversWithExpiredLicense(): Promise<Driver[]> {
    const allDrivers = await this.getAllDrivers();
    const now = new Date();
    
    return allDrivers.filter(driver => driver.licenseExpiry < now);
  }
}

export default new DriverService();

