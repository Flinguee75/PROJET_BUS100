/**
 * Route Service - Logique métier pour la gestion des routes
 * Règle: Toute la logique métier doit être dans les services, PAS dans les controllers
 */

import { getDb, collections } from '../config/firebase.config';
import { BusLiveStatus } from '../types';

export interface RouteStudent {
  id: string;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  grade: string;
  scanned: boolean; // true si déjà scanné aujourd'hui
  morningStatus?: 'present' | 'absent' | 'late' | 'excused';
  eveningStatus?: 'present' | 'absent' | 'late' | 'excused';
}

export class RouteService {
  /**
   * Lance une course pour un bus
   * Met à jour le statut du bus à "en_route" dans gps_live
   */
  async startRoute(busId: string, driverId: string): Promise<void> {
    const db = getDb();

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

    // Vérifier si le bus a déjà un document dans gps_live
    const gpsLiveDoc = await db.collection(collections.gpsLive).doc(busId).get();

    if (gpsLiveDoc.exists) {
      // Mettre à jour le statut existant
      await db.collection(collections.gpsLive).doc(busId).update({
        liveStatus: BusLiveStatus.EN_ROUTE,
        updatedAt: Date.now(),
      });
    } else {
      // Créer un nouveau document gps_live
      await db
        .collection(collections.gpsLive)
        .doc(busId)
        .set({
          busId,
          driverId,
          liveStatus: BusLiveStatus.EN_ROUTE,
          schoolId: busData.schoolId || null,
          updatedAt: Date.now(),
        });
    }

    console.log(`✅ Route démarrée pour le bus ${busId} par le chauffeur ${driverId}`);
  }

  /**
   * Récupère la liste des élèves d'un bus dans l'ordre manuel défini par l'admin
   * Retourne les élèves avec leur statut de scan pour la date donnée
   */
  async getRouteStudents(busId: string, date: string): Promise<RouteStudent[]> {
    const db = getDb();

    // Vérifier que le bus existe
    const busDoc = await db.collection(collections.buses).doc(busId).get();
    if (!busDoc.exists) {
      throw new Error(`Bus ${busId} not found`);
    }

    const busData = busDoc.data();
    if (!busData) {
      throw new Error(`Bus ${busId} has no data`);
    }

    // Récupérer la route assignée au bus pour obtenir l'ordre des élèves
    let studentOrder: string[] = [];
    if (busData.routeId) {
      const routeDoc = await db.collection(collections.routes).doc(busData.routeId).get();
      if (routeDoc.exists) {
        const routeData = routeDoc.data();
        if (routeData && routeData.studentOrder && Array.isArray(routeData.studentOrder)) {
          studentOrder = routeData.studentOrder;
        }
      }
    }

    // Récupérer tous les élèves du bus
    const studentsSnapshot = await db
      .collection(collections.students)
      .where('busId', '==', busId)
      .where('isActive', '==', true)
      .get();

    const studentsMap = new Map<string, RouteStudent>();

    // Récupérer les scans d'attendance pour cette date
    const attendanceSnapshot = await db
      .collection(collections.attendance)
      .where('busId', '==', busId)
      .where('date', '==', date)
      .get();

    const attendanceMap = new Map<string, { morningStatus?: string; eveningStatus?: string }>();
    attendanceSnapshot.forEach((doc) => {
      const data = doc.data();
      attendanceMap.set(data.studentId, {
        morningStatus: data.morningStatus,
        eveningStatus: data.eveningStatus,
      });
    });

    // Construire la liste des élèves avec leur statut
    studentsSnapshot.forEach((doc) => {
      const data = doc.data();
      const attendance = attendanceMap.get(doc.id) || {};
      const scanned =
        attendance.morningStatus === 'present' || attendance.eveningStatus === 'present';

      const student: RouteStudent = {
        id: doc.id,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        photoUrl: data.photoUrl,
        grade: data.grade || '',
        scanned,
        morningStatus: attendance.morningStatus as
          | 'present'
          | 'absent'
          | 'late'
          | 'excused'
          | undefined,
        eveningStatus: attendance.eveningStatus as
          | 'present'
          | 'absent'
          | 'late'
          | 'excused'
          | undefined,
      };

      studentsMap.set(doc.id, student);
    });

    // Trier selon l'ordre manuel si défini, sinon ordre alphabétique
    if (studentOrder.length > 0) {
      // Utiliser l'ordre manuel, en ajoutant les élèves non listés à la fin
      const orderedStudents: RouteStudent[] = [];
      const remainingStudents = new Set(studentsMap.keys());

      studentOrder.forEach((studentId) => {
        const student = studentsMap.get(studentId);
        if (student) {
          orderedStudents.push(student);
          remainingStudents.delete(studentId);
        }
      });

      // Ajouter les élèves restants (non dans l'ordre manuel) en ordre alphabétique
      const remaining = Array.from(remainingStudents)
        .map((id) => studentsMap.get(id)!)
        .sort((a, b) => {
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });

      return [...orderedStudents, ...remaining];
    } else {
      // Pas d'ordre manuel, utiliser l'ordre alphabétique
      return Array.from(studentsMap.values()).sort((a, b) => {
        const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
        const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    }
  }
}

export default new RouteService();
