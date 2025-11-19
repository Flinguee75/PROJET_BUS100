/**
 * Service Student - Logique métier pour la gestion des élèves
 * Gère les opérations CRUD sur la collection Firestore /students
 */

import { getDb } from '../config/firebase.config';
import {
  Student,
  StudentCreateInput,
  StudentUpdateInput,
} from '../types/student.types';
import { Timestamp } from 'firebase-admin/firestore';

export class StudentService {
  private getCollection() {
    return getDb().collection('students');
  }

  /**
   * Crée un nouvel élève dans Firestore
   * @param input - Données de l'élève à créer
   * @returns L'élève créé avec son ID
   */
  async createStudent(input: StudentCreateInput): Promise<Student> {
    const now = Timestamp.now();
    const studentData = {
      ...input,
      dateOfBirth: input.dateOfBirth instanceof Date 
        ? Timestamp.fromDate(input.dateOfBirth)
        : Timestamp.fromDate(new Date(input.dateOfBirth)),
      busId: null,
      routeId: null,
      photoUrl: undefined,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await this.getCollection().add(studentData);
    const doc = await docRef.get();
    const data = doc.data();

    return {
      id: docRef.id,
      ...data,
      dateOfBirth: data?.dateOfBirth?.toDate() || new Date(),
      createdAt: doc.createTime?.toDate() || new Date(),
      updatedAt: doc.updateTime?.toDate() || new Date(),
    } as Student;
  }

  /**
   * Récupère tous les élèves
   * @returns Liste de tous les élèves
   */
  async getAllStudents(): Promise<Student[]> {
    const snapshot = await this.getCollection().get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Student;
    });
  }

  /**
   * Récupère un élève par son ID
   * @param studentId - ID de l'élève à récupérer
   * @returns L'élève trouvé ou null
   */
  async getStudentById(studentId: string): Promise<Student | null> {
    const doc = await this.getCollection().doc(studentId).get();
    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      dateOfBirth: data?.dateOfBirth?.toDate() || new Date(),
      createdAt: data?.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
    } as Student;
  }

  /**
   * Récupère les élèves d'un parent spécifique
   * @param parentId - ID du parent
   * @returns Liste des élèves du parent
   */
  async getStudentsByParent(parentId: string): Promise<Student[]> {
    const snapshot = await this.getCollection()
      .where('parentIds', 'array-contains', parentId)
      .get();
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Student;
    });
  }

  /**
   * Récupère les élèves assignés à un bus
   * @param busId - ID du bus
   * @returns Liste des élèves du bus
   */
  async getStudentsByBus(busId: string): Promise<Student[]> {
    const snapshot = await this.getCollection()
      .where('busId', '==', busId)
      .get();
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        dateOfBirth: data.dateOfBirth?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || doc.createTime?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || doc.updateTime?.toDate() || new Date(),
      } as Student;
    });
  }

  /**
   * Met à jour un élève existant
   * @param studentId - ID de l'élève à mettre à jour
   * @param input - Données à mettre à jour
   * @returns L'élève mis à jour
   */
  async updateStudent(studentId: string, input: StudentUpdateInput): Promise<Student> {
    const docRef = this.getCollection().doc(studentId);

    // Vérifier que l'élève existe
    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    const updateData: any = {
      ...input,
      updatedAt: Timestamp.now(),
    };

    // Convertir dateOfBirth si présent
    if (input.dateOfBirth) {
      updateData.dateOfBirth = input.dateOfBirth instanceof Date
        ? Timestamp.fromDate(input.dateOfBirth)
        : Timestamp.fromDate(new Date(input.dateOfBirth));
    }

    await docRef.update(updateData);

    const updated = await docRef.get();
    const data = updated.data();

    return {
      id: updated.id,
      ...data,
      dateOfBirth: data?.dateOfBirth?.toDate() || new Date(),
      createdAt: data?.createdAt?.toDate() || updated.createTime?.toDate() || new Date(),
      updatedAt: data?.updatedAt?.toDate() || updated.updateTime?.toDate() || new Date(),
    } as Student;
  }

  /**
   * Supprime un élève (soft delete - marque comme inactif)
   * @param studentId - ID de l'élève à supprimer
   */
  async deleteStudent(studentId: string): Promise<void> {
    const doc = await this.getCollection().doc(studentId).get();
    if (!doc.exists) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Soft delete - marquer comme inactif au lieu de supprimer
    await this.getCollection().doc(studentId).update({
      isActive: false,
      updatedAt: Timestamp.now(),
    });
  }

  /**
   * Assigne un élève à un bus et une route
   * @param studentId - ID de l'élève
   * @param busId - ID du bus
   * @param routeId - ID de la route (optionnel si auto-génération active)
   * @param autoRegenerate - Si true, déclenche la régénération de route auto (défaut: true)
   */
  async assignToBus(
    studentId: string,
    busId: string,
    routeId?: string,
    autoRegenerate: boolean = true
  ): Promise<Student> {
    const result = await this.updateStudent(studentId, { busId, routeId: routeId || null });

    // Déclencher la régénération automatique de la route si activée
    if (autoRegenerate) {
      // Note: Auto-regeneration is triggered via external call to avoid circular dependency
      // Frontend should call /api/routes/generate/:busId after student assignment
      console.log(`Student ${studentId} assigned to bus ${busId}. Route regeneration recommended.`);
    }

    return result;
  }

  /**
   * Retire un élève d'un bus
   * @param studentId - ID de l'élève
   * @param autoRegenerate - Si true, déclenche la régénération de route auto (défaut: true)
   */
  async removeFromBus(studentId: string, autoRegenerate: boolean = true): Promise<Student> {
    // Récupérer l'élève pour obtenir son busId
    const student = await this.getStudentById(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    const previousBusId = student.busId;
    const result = await this.updateStudent(studentId, { busId: null, routeId: null });

    // Déclencher la régénération automatique de la route si activée
    if (autoRegenerate && previousBusId) {
      // Note: Auto-regeneration is triggered via external call to avoid circular dependency
      // Frontend should call /api/routes/regenerate/:busId after student removal
      console.log(`Student ${studentId} removed from bus ${previousBusId}. Route regeneration recommended.`);
    }

    return result;
  }
}

export default new StudentService();

