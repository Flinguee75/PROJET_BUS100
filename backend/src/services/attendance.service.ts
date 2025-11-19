/**
 * Attendance Service - Logique métier pour la montée/descente des élèves
 * Gère l'enregistrement des présences et envoie des notifications aux parents
 */

import { getDb, collections } from '../config/firebase.config';
import notificationService from './notification.service';
import { NotificationType, NotificationPriority } from '../types';

export interface BoardingEvent {
  studentId: string;
  busId: string;
  driverId: string;
  timestamp: Date;
  location?: {
    lat: number;
    lng: number;
  };
  type: 'board' | 'exit';
  notes?: string;
}

export interface AttendanceRecord {
  id?: string;
  studentId: string;
  busId: string;
  driverId: string;
  date: string; // Format: YYYY-MM-DD
  boardingTime?: Date;
  boardingLocation?: { lat: number; lng: number };
  exitTime?: Date;
  exitLocation?: { lat: number; lng: number };
  status: 'boarded' | 'completed' | 'absent';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudentAttendanceStatus {
  studentId: string;
  studentName: string;
  isOnBus: boolean;
  boardingTime?: Date;
  exitTime?: Date;
}

export class AttendanceService {
  /**
   * Enregistre la montée d'un élève dans le bus
   * - Crée/met à jour le record d'attendance
   * - Envoie une notification aux parents
   */
  async boardStudent(event: BoardingEvent): Promise<AttendanceRecord> {
    const db = getDb();
    const today = this.getTodayDateString();

    // Vérifier que l'élève existe
    const studentDoc = await db.collection(collections.students).doc(event.studentId).get();
    if (!studentDoc.exists) {
      throw new Error(`Student ${event.studentId} not found`);
    }

    const student = studentDoc.data();

    // Chercher si un record existe déjà pour aujourd'hui
    const existingRecords = await db
      .collection(collections.attendance)
      .where('studentId', '==', event.studentId)
      .where('date', '==', today)
      .get();

    let attendanceRecord: AttendanceRecord;

    if (!existingRecords.empty) {
      // Record existe déjà
      const existingDoc = existingRecords.docs[0]!;
      const existingData = existingDoc.data() as AttendanceRecord;

      // Vérifier que l'élève n'est pas déjà monté
      if (existingData.status === 'boarded') {
        throw new Error(
          `Student ${event.studentId} is already on the bus (boarded at ${existingData.boardingTime})`
        );
      }

      // Mettre à jour avec la nouvelle montée
      attendanceRecord = {
        ...existingData,
        id: existingDoc.id,
        busId: event.busId,
        driverId: event.driverId,
        boardingTime: event.timestamp,
        boardingLocation: event.location,
        status: 'boarded',
        notes: event.notes,
        updatedAt: new Date(),
      };

      await existingDoc.ref.update({
        busId: event.busId,
        driverId: event.driverId,
        boardingTime: event.timestamp,
        boardingLocation: event.location,
        status: 'boarded',
        notes: event.notes,
        updatedAt: new Date(),
      });
    } else {
      // Créer un nouveau record
      attendanceRecord = {
        studentId: event.studentId,
        busId: event.busId,
        driverId: event.driverId,
        date: today,
        boardingTime: event.timestamp,
        boardingLocation: event.location,
        status: 'boarded',
        notes: event.notes,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const docRef = await db.collection(collections.attendance).add(attendanceRecord);
      attendanceRecord.id = docRef.id;
    }

    // Envoyer notification aux parents
    await this.notifyParentsBoarding(event.studentId, student, event.timestamp, 'board');

    console.log(`✅ Student ${event.studentId} boarded bus ${event.busId}`);
    return attendanceRecord;
  }

  /**
   * Enregistre la descente d'un élève du bus
   * - Met à jour le record d'attendance
   * - Envoie une notification aux parents
   */
  async exitStudent(event: BoardingEvent): Promise<AttendanceRecord> {
    const db = getDb();
    const today = this.getTodayDateString();

    // Vérifier que l'élève existe
    const studentDoc = await db.collection(collections.students).doc(event.studentId).get();
    if (!studentDoc.exists) {
      throw new Error(`Student ${event.studentId} not found`);
    }

    const student = studentDoc.data();

    // Chercher le record d'aujourd'hui
    const existingRecords = await db
      .collection(collections.attendance)
      .where('studentId', '==', event.studentId)
      .where('date', '==', today)
      .get();

    if (existingRecords.empty) {
      throw new Error(
        `No boarding record found for student ${event.studentId} today. Student must board first.`
      );
    }

    const existingDoc = existingRecords.docs[0]!;
    const existingData = existingDoc.data() as AttendanceRecord;

    // Vérifier que l'élève est bien monté et pas déjà descendu
    if (existingData.status !== 'boarded') {
      throw new Error(
        `Student ${event.studentId} is not currently on the bus (status: ${existingData.status})`
      );
    }

    // Mettre à jour avec la descente
    const attendanceRecord: AttendanceRecord = {
      ...existingData,
      id: existingDoc.id,
      exitTime: event.timestamp,
      exitLocation: event.location,
      status: 'completed',
      updatedAt: new Date(),
    };

    await existingDoc.ref.update({
      exitTime: event.timestamp,
      exitLocation: event.location,
      status: 'completed',
      updatedAt: new Date(),
    });

    // Envoyer notification aux parents
    await this.notifyParentsBoarding(event.studentId, student, event.timestamp, 'exit');

    console.log(`✅ Student ${event.studentId} exited bus ${event.busId}`);
    return attendanceRecord;
  }

  /**
   * Récupère le statut d'attendance d'un élève pour une date donnée
   */
  async getStudentAttendance(studentId: string, date?: string): Promise<AttendanceRecord | null> {
    const db = getDb();
    const targetDate = date || this.getTodayDateString();

    const snapshot = await db
      .collection(collections.attendance)
      .where('studentId', '==', studentId)
      .where('date', '==', targetDate)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0]!;
    return {
      id: doc.id,
      ...doc.data(),
    } as AttendanceRecord;
  }

  /**
   * Récupère tous les élèves actuellement dans un bus
   */
  async getStudentsOnBus(busId: string): Promise<StudentAttendanceStatus[]> {
    const db = getDb();
    const today = this.getTodayDateString();

    // Récupérer tous les records 'boarded' pour ce bus aujourd'hui
    const snapshot = await db
      .collection(collections.attendance)
      .where('busId', '==', busId)
      .where('date', '==', today)
      .where('status', '==', 'boarded')
      .get();

    const studentsOnBus: StudentAttendanceStatus[] = [];

    for (const doc of snapshot.docs) {
      const data = doc.data() as AttendanceRecord;

      // Récupérer les infos de l'élève
      const studentDoc = await db.collection(collections.students).doc(data.studentId).get();

      if (studentDoc.exists) {
        const student = studentDoc.data();
        studentsOnBus.push({
          studentId: data.studentId,
          studentName: `${student?.firstName} ${student?.lastName}`,
          isOnBus: true,
          boardingTime: data.boardingTime,
          exitTime: data.exitTime,
        });
      }
    }

    return studentsOnBus;
  }

  /**
   * Récupère l'historique d'attendance pour un bus sur une période
   */
  async getBusAttendanceHistory(
    busId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceRecord[]> {
    const db = getDb();

    const snapshot = await db
      .collection(collections.attendance)
      .where('busId', '==', busId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .orderBy('boardingTime', 'desc')
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as AttendanceRecord
    );
  }

  /**
   * Récupère l'historique d'attendance pour un élève sur une période
   */
  async getStudentAttendanceHistory(
    studentId: string,
    startDate: string,
    endDate: string
  ): Promise<AttendanceRecord[]> {
    const db = getDb();

    const snapshot = await db
      .collection(collections.attendance)
      .where('studentId', '==', studentId)
      .where('date', '>=', startDate)
      .where('date', '<=', endDate)
      .orderBy('date', 'desc')
      .get();

    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as AttendanceRecord
    );
  }

  /**
   * Compte le nombre d'élèves présents dans un bus
   */
  async countStudentsOnBus(busId: string): Promise<number> {
    const students = await this.getStudentsOnBus(busId);
    return students.length;
  }

  /**
   * Envoie une notification aux parents lors d'une montée/descente
   */
  private async notifyParentsBoarding(
    studentId: string,
    studentData: any,
    timestamp: Date,
    type: 'board' | 'exit'
  ): Promise<void> {
    const studentName = `${studentData.firstName} ${studentData.lastName}`;
    const time = timestamp.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });

    const title =
      type === 'board'
        ? `${studentName} est monté(e) dans le bus`
        : `${studentName} est descendu(e) du bus`;

    const message =
      type === 'board'
        ? `Votre enfant ${studentName} est monté(e) dans le bus à ${time}.`
        : `Votre enfant ${studentName} est descendu(e) du bus à ${time}.`;

    try {
      await notificationService.notifyParentsOfStudent(
        studentId,
        title,
        message,
        type === 'board' ? NotificationType.STUDENT_BOARDED : NotificationType.STUDENT_EXITED,
        NotificationPriority.HIGH,
        {
          eventType: type,
          timestamp: timestamp.toISOString(),
          studentName,
        }
      );

      console.log(`📲 Notification envoyée aux parents de ${studentName} (${type})`);
    } catch (error) {
      console.error(`❌ Erreur lors de l'envoi de notification pour ${studentName}:`, error);
      // Ne pas bloquer l'enregistrement si la notification échoue
    }
  }

  /**
   * Retourne la date du jour au format YYYY-MM-DD
   */
  private getTodayDateString(): string {
    const today = new Date();
    return today.toISOString().split('T')[0]!;
  }
}

export default new AttendanceService();
