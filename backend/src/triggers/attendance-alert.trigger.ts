/**
 * Cloud Function Trigger - Génération d'alertes pour étudiants non scannés
 * Se déclenche périodiquement pour vérifier les étudiants non scannés et générer des alertes
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getDb, collections } from '../config/firebase.config';
import type admin from 'firebase-admin';

/**
 * Trigger programmé qui s'exécute toutes les 5 minutes
 * Vérifie les étudiants non scannés et génère des alertes dans /alerts_live
 */
export const checkUnscannedStudents = onSchedule(
  {
    region: 'europe-west4',
    schedule: '*/5 * * * *', // Toutes les 5 minutes
    timeZone: 'Africa/Abidjan',
  },
  async () => {
    try {
      console.log('🔍 Vérification des étudiants non scannés...');

      const db = getDb();
      const today =
        new Date().toISOString().split('T')[0] || new Date().toISOString().slice(0, 10); // Format YYYY-MM-DD

      // 1. Récupérer tous les bus actifs (qui ont une position GPS récente)
      const gpsLiveSnapshot = await db.collection(collections.gpsLive).get();
      const activeBusIds = new Set<string>();

      gpsLiveSnapshot.forEach((doc) => {
        const data = doc.data();
        // Un bus est actif s'il a une position récente (moins de 30 minutes)
        const lastUpdate = data.lastUpdate?.toMillis?.() || data.lastUpdate?.getTime?.() || 0;
        const now = Date.now();
        const thirtyMinutesAgo = now - 30 * 60 * 1000;

        if (lastUpdate > thirtyMinutesAgo) {
          activeBusIds.add(doc.id);
        }
      });

      console.log(`📊 ${activeBusIds.size} bus actifs détectés`);

      // 2. Pour chaque bus actif, vérifier les étudiants non scannés
      for (const busId of activeBusIds) {
        await checkBusUnscannedStudents(db, busId, today);
      }

      console.log('✅ Vérification des étudiants non scannés terminée');
    } catch (error) {
      console.error('❌ Erreur lors de la vérification des étudiants non scannés:', error);
    }
  }
);

/**
 * Vérifie les étudiants non scannés pour un bus spécifique
 */
async function checkBusUnscannedStudents(
  db: admin.firestore.Firestore,
  busId: string,
  date: string
): Promise<void> {
  try {
    // 1. Récupérer tous les étudiants assignés au bus
    const studentsSnapshot = await db
      .collection(collections.students)
      .where('busId', '==', busId)
      .where('isActive', '==', true)
      .get();

    if (studentsSnapshot.empty) {
      return; // Pas d'étudiants assignés à ce bus
    }

    // 2. Récupérer les scans du jour pour ce bus
    const attendanceSnapshot = await db
      .collection(collections.attendance)
      .where('busId', '==', busId)
      .where('date', '==', date)
      .get();

    const scannedStudentIds = new Set<string>();
    attendanceSnapshot.forEach((doc) => {
      const data = doc.data();
      // Un étudiant est scanné s'il a un statut "present" pour le matin ou le soir
      if (
        data.morningStatus === 'present' ||
        data.eveningStatus === 'present'
      ) {
        scannedStudentIds.add(data.studentId);
      }
    });

    // 3. Identifier les étudiants non scannés
    const unscannedStudents: string[] = [];
    studentsSnapshot.forEach((doc) => {
      if (!scannedStudentIds.has(doc.id)) {
        unscannedStudents.push(doc.id);
      }
    });

    // 4. Récupérer les informations du bus pour le message d'alerte
    const busDoc = await db.collection(collections.buses).doc(busId).get();
    const busData = busDoc.data();
    const busNumber = busData?.number || busData?.busNumber || `BUS-${busId.slice(0, 2).toUpperCase()}`;

    // 5. Supprimer les anciennes alertes pour ce bus et ce type
    const existingAlertsSnapshot = await db
      .collection('alerts_live')
      .where('busId', '==', busId)
      .where('type', '==', 'UNSCANNED_CHILD')
      .get();

    const batch = db.batch();
    existingAlertsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // 6. Créer une nouvelle alerte si des étudiants sont non scannés
    if (unscannedStudents.length > 0) {
      const alertRef = db.collection('alerts_live').doc();
      batch.set(alertRef, {
        type: 'UNSCANNED_CHILD',
        busId: busId,
        busNumber: busNumber,
        severity: unscannedStudents.length > 3 ? 'HIGH' : 'MEDIUM', // Plus de 3 = urgent
        message: `${unscannedStudents.length} élève${unscannedStudents.length > 1 ? 's' : ''} non scanné${unscannedStudents.length > 1 ? 's' : ''} dans le bus ${busNumber}`,
        timestamp: Date.now(),
        createdAt: new Date(),
        studentIds: unscannedStudents, // Liste des IDs des étudiants non scannés
      });

      console.log(
        `⚠️ Alerte créée pour le bus ${busNumber}: ${unscannedStudents.length} étudiant(s) non scanné(s)`
      );
    }

    await batch.commit();
  } catch (error) {
    console.error(
      `❌ Erreur lors de la vérification des étudiants non scannés pour le bus ${busId}:`,
      error
    );
  }
}
