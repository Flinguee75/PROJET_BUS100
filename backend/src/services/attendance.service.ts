/**
 * Attendance Service - Logique métier pour la gestion de l'attendance
 * Règle: Toute la logique métier doit être dans les services, PAS dans les controllers
 */

import { getDb, collections } from '../config/firebase.config';

export interface ScanStudentInput {
  studentId: string;
  busId: string;
  date: string; // Format YYYY-MM-DD
  type: 'boarding' | 'alighting';
  driverId: string;
  location?: {
    lat: number;
    lng: number;
  };
}

export interface UnscanStudentInput {
  studentId: string;
  busId: string;
  date: string; // Format YYYY-MM-DD
  driverId: string;
}

export class AttendanceService {
  /**
   * Détermine si c'est un scan du matin ou du soir basé sur l'heure actuelle
   * Matin: avant 14h00, Soir: après 14h00
   */
  private getTimeOfDay(): 'morning' | 'evening' {
    const hour = new Date().getHours();
    return hour < 14 ? 'morning' : 'evening';
  }

  /**
   * Scanne un élève (marque comme présent)
   * Crée ou met à jour un enregistrement attendance avec morningStatus ou eveningStatus = "present"
   */
  async scanStudent(data: ScanStudentInput): Promise<void> {
    const db = getDb();
    const { studentId, busId, date, type, driverId, location } = data;

    // Vérifier que le bus existe
    const busDoc = await db.collection(collections.buses).doc(busId).get();
    if (!busDoc.exists) {
      throw new Error(`Bus ${busId} not found`);
    }

    const busData = busDoc.data();
    if (!busData) {
      throw new Error(`Bus ${busId} has no data`);
    }

    // Vérifier que le driver est assigné à ce bus
    if (busData.driverId !== driverId) {
      throw new Error(`Driver ${driverId} is not assigned to bus ${busId}`);
    }

    // Vérifier que l'élève existe et est assigné à ce bus
    const studentDoc = await db.collection(collections.students).doc(studentId).get();
    if (!studentDoc.exists) {
      throw new Error(`Student ${studentId} not found`);
    }

    const studentData = studentDoc.data();
    if (!studentData) {
      throw new Error(`Student ${studentId} has no data`);
    }

    if (studentData.busId !== busId) {
      throw new Error(`Student ${studentId} is not assigned to bus ${busId}`);
    }

    // Déterminer si c'est matin ou soir
    const timeOfDay = this.getTimeOfDay();
    const statusField = timeOfDay === 'morning' ? 'morningStatus' : 'eveningStatus';

    // Chercher un enregistrement d'attendance existant pour cet élève, ce bus et cette date
    const attendanceQuery = await db
      .collection(collections.attendance)
      .where('studentId', '==', studentId)
      .where('busId', '==', busId)
      .where('date', '==', date)
      .limit(1)
      .get();

    const timestamp = Date.now();

    if (!attendanceQuery.empty && attendanceQuery.docs.length > 0) {
      // Mettre à jour l'enregistrement existant
      const attendanceDoc = attendanceQuery.docs[0];
      if (attendanceDoc) {
        await attendanceDoc.ref.update({
          [statusField]: 'present',
          type,
          timestamp,
          location: location || null,
          updatedAt: timestamp,
        });
      }
    } else {
      // Créer un nouvel enregistrement
      await db.collection(collections.attendance).add({
        studentId,
        busId,
        date,
        [statusField]: 'present',
        type,
        timestamp,
        location: location || null,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    // ========== NOUVEAU: Mettre à jour le tracking en temps réel sur le bus ==========

    // Récupérer le nom complet de l'élève pour dénormalisation
    const studentName = `${studentData.firstName} ${studentData.lastName}`;

    // Mettre à jour Bus.lastScan
    await db.collection(collections.buses).doc(busId).update({
      lastScan: {
        studentId,
        studentName,
        timestamp,
        type,
        location: location || null,
      },
    });

    // Mettre à jour Bus.currentTrip.scannedStudentIds (ajouter l'élève s'il n'est pas déjà dans la liste)
    const currentScannedIds = busData.currentTrip?.scannedStudentIds || [];
    if (!currentScannedIds.includes(studentId)) {
      await db.collection(collections.buses).doc(busId).update({
        'currentTrip.scannedStudentIds': [...currentScannedIds, studentId],
      });
    }

    console.log(`✅ Élève ${studentId} scanné pour le bus ${busId} (${timeOfDay}, ${type})`);
  }

  /**
   * Dé-scanne un élève (marque comme absent)
   * Met à jour un enregistrement attendance avec morningStatus ou eveningStatus = "absent"
   */
  async unscanStudent(data: UnscanStudentInput): Promise<void> {
    const db = getDb();
    const { studentId, busId, date, driverId } = data;

    // Vérifier que le bus existe
    const busDoc = await db.collection(collections.buses).doc(busId).get();
    if (!busDoc.exists) {
      throw new Error(`Bus ${busId} not found`);
    }

    const busData = busDoc.data();
    if (!busData) {
      throw new Error(`Bus ${busId} has no data`);
    }

    // Vérifier que le driver est assigné à ce bus
    if (busData.driverId !== driverId) {
      throw new Error(`Driver ${driverId} is not assigned to bus ${busId}`);
    }

    // Déterminer si c'est matin ou soir
    const timeOfDay = this.getTimeOfDay();
    const statusField = timeOfDay === 'morning' ? 'morningStatus' : 'eveningStatus';

    // Chercher un enregistrement d'attendance existant
    const attendanceQuery = await db
      .collection(collections.attendance)
      .where('studentId', '==', studentId)
      .where('busId', '==', busId)
      .where('date', '==', date)
      .limit(1)
      .get();

    const timestamp = Date.now();

    if (!attendanceQuery.empty && attendanceQuery.docs.length > 0) {
      // Mettre à jour l'enregistrement existant
      const attendanceDoc = attendanceQuery.docs[0];
      if (attendanceDoc) {
        await attendanceDoc.ref.update({
          [statusField]: 'absent',
          timestamp,
          updatedAt: timestamp,
        });
      }
    } else {
      // Créer un nouvel enregistrement avec absent
      await db.collection(collections.attendance).add({
        studentId,
        busId,
        date,
        [statusField]: 'absent',
        timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }

    console.log(`✅ Élève ${studentId} dé-scanné pour le bus ${busId} (${timeOfDay})`);
  }
}

export default new AttendanceService();

