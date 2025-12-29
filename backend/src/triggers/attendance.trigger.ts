/**
 * Attendance Trigger - Cloud Function déclenchée sur changements d'attendance
 * Met à jour automatiquement Bus.lastScan et Bus.currentTrip.scannedStudentIds
 * quand un chauffeur scanne un élève depuis l'app mobile
 */

import * as functions from 'firebase-functions/v1';
import { getDb, collections } from '../config/firebase.config';
import admin from 'firebase-admin';

/**
 * Trigger Firestore onCreate sur /attendance/{docId}
 * Se déclenche UNIQUEMENT à la création d'un nouveau document attendance
 * (pas sur les modifications pour éviter les boucles infinies)
 */
export const onAttendanceChange = functions
  .region('europe-west4')
  .firestore.document('attendance/{docId}')
  .onCreate(async (snapshot) => {
    const db = getDb();

    // Récupérer les données du document créé
    if (!snapshot.exists) {
      console.log('⚠️ Document attendance inexistant');
      return null;
    }

    const attendanceData = snapshot.data();
    if (!attendanceData) {
      console.log('⚠️ Pas de données dans le document attendance');
      return null;
    }

    // Vérifier que c'est un scan "present" (pas un absent)
    if (attendanceData.status !== 'present') {
      console.log(`⏭️ Statut ${attendanceData.status}, pas de mise à jour lastScan`);
      return null;
    }

    const { studentId, busId } = attendanceData;

    if (!studentId || !busId) {
      console.log('⚠️ studentId ou busId manquant dans attendance');
      return null;
    }

    try {
      // 1. Récupérer les infos de l'élève pour obtenir son nom
      const studentDoc = await db.collection(collections.students).doc(studentId).get();
      if (!studentDoc.exists) {
        console.log(`⚠️ Élève ${studentId} introuvable`);
        return null;
      }

      const studentData = studentDoc.data();
      if (!studentData) {
        return null;
      }

      const studentName = `${studentData.firstName} ${studentData.lastName}`;

      // 2. Récupérer le bus pour mettre à jour lastScan et currentTrip
      const busRef = db.collection(collections.buses).doc(busId);
      const busDoc = await busRef.get();

      if (!busDoc.exists) {
        console.log(`⚠️ Bus ${busId} introuvable`);
        return null;
      }

      const busData = busDoc.data();
      if (!busData) {
        return null;
      }

      // 3. Préparer les mises à jour
      const timestamp = Date.now();
      const updates: any = {
        // Mettre à jour lastScan
        lastScan: {
          studentId,
          studentName,
          timestamp,
          type: 'boarding',
          location: attendanceData.location || null,
        },
      };

      // 4. Mettre à jour currentTrip.scannedStudentIds si currentTrip existe
      if (busData.currentTrip) {
        const scannedIds = busData.currentTrip.scannedStudentIds || [];

        // Ajouter l'élève seulement s'il n'est pas déjà dans la liste
        if (!scannedIds.includes(studentId)) {
          updates['currentTrip.scannedStudentIds'] =
            admin.firestore.FieldValue.arrayUnion(studentId);
        }
      }

      // 5. Effectuer la mise à jour
      await busRef.update(updates);

      console.log(`✅ Bus ${busId} mis à jour:`);
      console.log(`   - lastScan: ${studentName} (${timestamp})`);
      console.log(`   - currentTrip.scannedStudentIds: +${studentId}`);

      return null;
    } catch (error) {
      console.error('❌ Erreur dans onAttendanceChange:', error);
      // On ne throw pas pour éviter de bloquer l'exécution
      return null;
    }
  });
