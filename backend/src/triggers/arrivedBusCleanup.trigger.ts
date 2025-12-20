/**
 * Cloud Function Schedulée pour gérer la transition automatique
 * ARRIVED → STOPPED après 15 minutes
 * 
 * Déclenchée toutes les minutes via Cloud Scheduler
 */

import { onSchedule } from 'firebase-functions/v2/scheduler';
import { getDb, collections } from '../config/firebase.config';
import { BusLiveStatus } from '../types/gps.types';

const ARRIVED_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes en millisecondes

/**
 * Fonction schedulée qui s'exécute toutes les minutes
 * pour vérifier les bus en statut ARRIVED et les passer à STOPPED
 * si le délai de 15 minutes est dépassé
 */
export const cleanupArrivedBuses = onSchedule(
  {
    schedule: 'every 1 minutes',
    region: 'europe-west4',
  },
  async () => {
    console.log('🔄 Début du nettoyage des bus ARRIVED...');

    try {
      const db = getDb();
      const now = new Date();

      // Récupérer tous les bus avec statut ARRIVED
      const snapshot = await db
        .collection(collections.gpsLive)
        .where('status', '==', BusLiveStatus.ARRIVED)
        .get();

      if (snapshot.empty) {
        console.log('✅ Aucun bus en statut ARRIVED à nettoyer');
        return;
      }

      console.log(`📊 Trouvé ${snapshot.size} bus en statut ARRIVED`);

      const batch = db.batch();
      let updatedCount = 0;

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        const arrivedAt = data.arrivedAt?.toDate?.() || data.arrivedAt;

        if (!arrivedAt) {
          // Pas de timestamp arrivedAt, on le met à jour avec STOPPED par sécurité
          console.warn(`⚠️ Bus ${doc.id} en ARRIVED sans arrivedAt, passage à STOPPED`);
          batch.update(doc.ref, {
            status: BusLiveStatus.STOPPED,
            arrivedAt: null,
            lastUpdate: now,
          });
          updatedCount++;
          return;
        }

        // Calculer le temps écoulé depuis l'arrivée
        const arrivedAtDate = arrivedAt instanceof Date ? arrivedAt : new Date(arrivedAt);
        const elapsedMs = now.getTime() - arrivedAtDate.getTime();

        // Si plus de 15 minutes, passer à STOPPED
        if (elapsedMs >= ARRIVED_TIMEOUT_MS) {
          console.log(
            `✅ Bus ${doc.id}: ARRIVED depuis ${Math.floor(elapsedMs / 60000)} min → passage à STOPPED`
          );
          batch.update(doc.ref, {
            status: BusLiveStatus.STOPPED,
            arrivedAt: null, // Nettoyer le timestamp
            lastUpdate: now,
          });
          updatedCount++;
        } else {
          const remainingMin = Math.ceil((ARRIVED_TIMEOUT_MS - elapsedMs) / 60000);
          console.log(
            `⏳ Bus ${doc.id}: ARRIVED depuis ${Math.floor(elapsedMs / 60000)} min (reste ${remainingMin} min)`
          );
        }
      });

      if (updatedCount > 0) {
        await batch.commit();
        console.log(`✅ ${updatedCount} bus passés de ARRIVED à STOPPED`);
      } else {
        console.log('✅ Aucun bus à mettre à jour (tous encore dans le délai de 15 min)');
      }

      return;
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des bus ARRIVED:', error);
      throw error;
    }
  }
);
