/**
 * Next Student Service - Logique pour déterminer le prochain élève à scanner
 * Basé sur l'ordre des stops de route et les élèves déjà scannés
 */

import { getDb, collections } from '../config/firebase.config';

export interface NextStudentInfo {
  studentId: string;
  studentName: string;
  stopOrder: number;
}

export class NextStudentService {
  /**
   * Détermine le prochain élève à scanner pour un bus
   * Retourne null si tous les élèves ont été scannés
   */
  async getNextStudentToPickup(busId: string): Promise<NextStudentInfo | null> {
    const db = getDb();

    // 1. Récupérer le bus
    const busDoc = await db.collection(collections.buses).doc(busId).get();
    if (!busDoc.exists) {
      throw new Error(`Bus ${busId} not found`);
    }

    const busData = busDoc.data();
    if (!busData) {
      throw new Error(`Bus ${busId} has no data`);
    }

    // Vérifier que le bus a un currentTrip et une route
    if (!busData.currentTrip || !busData.currentTrip.routeId) {
      return null; // Pas de trajet en cours
    }

    const routeId = busData.currentTrip.routeId;

    // 2. Récupérer la route et ses stops
    const routeDoc = await db.collection(collections.routes).doc(routeId).get();
    if (!routeDoc.exists) {
      return null; // Route introuvable
    }

    const routeData = routeDoc.data();
    if (!routeData || !routeData.stops) {
      return null; // Pas de stops sur la route
    }

    // Filtrer les stops de type 'pickup' et trier par ordre
    const pickupStops = routeData.stops
      .filter((stop: any) => stop.type === 'pickup' || stop.type === 'both')
      .sort((a: any, b: any) => a.order - b.order);

    if (pickupStops.length === 0) {
      return null; // Aucun stop de pickup
    }

    // 3. Récupérer les élèves déjà scannés pour ce trajet
    const scannedIds = busData.currentTrip.scannedStudentIds || [];

    // 4. Trouver le prochain stop dont l'élève n'est pas scanné
    for (const stop of pickupStops) {
      if (!stop.studentId) continue; // Skip si pas de studentId sur le stop
      if (scannedIds.includes(stop.studentId)) continue; // Déjà scanné

      // Cet élève n'a pas été scanné - c'est le prochain !
      const studentDoc = await db.collection(collections.students).doc(stop.studentId).get();
      if (!studentDoc.exists) continue; // Skip si élève introuvable

      const studentData = studentDoc.data();
      if (!studentData) continue;

      return {
        studentId: stop.studentId,
        studentName: `${studentData.firstName} ${studentData.lastName}`,
        stopOrder: stop.order,
      };
    }

    // Tous les élèves ont été scannés
    return null;
  }
}

export default new NextStudentService();
