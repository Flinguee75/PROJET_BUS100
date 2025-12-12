/**
 * Cloud Function Trigger - Maintenance automatique du champ assignedBusIds
 * Se déclenche automatiquement quand un student est créé/modifié/supprimé
 *
 * Ce trigger maintient la cohérence entre:
 * - /students/{studentId}.busId et /students/{studentId}.parentIds
 * - /users/{parentId}.assignedBusIds
 *
 * Requis pour les Firestore Security Rules qui utilisent assignedBusIds
 * pour contrôler l'accès des parents aux données GPS des bus
 */

import * as functions from 'firebase-functions/v1';
import { getDb } from '../config/firebase.config';
import { FieldValue } from 'firebase-admin/firestore';

/**
 * Trigger qui s'exécute automatiquement à chaque modification de student
 * Met à jour le champ assignedBusIds dans les documents users (parents)
 */
export const onStudentChanged = functions
  .region('europe-west4')
  .firestore.document('students/{studentId}')
  .onWrite(async (change, context) => {
    const db = getDb();
    const studentId = context.params.studentId;

    try {
      // Récupérer les données avant et après
      const oldData = change.before.exists ? change.before.data() : null;
      const newData = change.after.exists ? change.after.data() : null;

      // Cas 1: Student supprimé
      if (!newData && oldData) {
        console.log(
          `🗑️ Student ${studentId} supprimé - Retrait du bus ${oldData.busId} des parents`
        );
        await removeParentBusAssignments(
          db,
          oldData.parentIds || [],
          oldData.busId
        );
        return;
      }

      // Cas 2: Student créé ou modifié
      if (newData) {
        const newBusId = newData.busId;
        const newParentIds: string[] = newData.parentIds || [];
        const oldBusId = oldData?.busId;
        const oldParentIds: string[] = oldData?.parentIds || [];

        // Déterminer les parents ajoutés et retirés
        const addedParents = newParentIds.filter(
          (id) => !oldParentIds.includes(id)
        );
        const removedParents = oldParentIds.filter(
          (id) => !newParentIds.includes(id)
        );

        console.log(
          `📝 Student ${studentId} modifié - Bus: ${oldBusId} → ${newBusId}`
        );

        // Cas 2a: Le bus a changé
        if (oldBusId !== newBusId) {
          // Retirer l'ancien bus de tous les parents existants
          if (oldBusId && oldParentIds.length > 0) {
            console.log(
              `  ↪ Retrait bus ${oldBusId} de ${oldParentIds.length} parents`
            );
            await removeParentBusAssignments(db, oldParentIds, oldBusId);
          }

          // Ajouter le nouveau bus à tous les parents actuels
          if (newBusId && newParentIds.length > 0) {
            console.log(
              `  ↪ Ajout bus ${newBusId} à ${newParentIds.length} parents`
            );
            await addParentBusAssignments(db, newParentIds, newBusId);
          }
        }

        // Cas 2b: Les parents ont changé (mais pas le bus)
        if (newBusId && (addedParents.length > 0 || removedParents.length > 0)) {
          // Ajouter le bus aux nouveaux parents
          if (addedParents.length > 0) {
            console.log(
              `  ↪ Ajout bus ${newBusId} aux nouveaux parents: ${addedParents.join(', ')}`
            );
            await addParentBusAssignments(db, addedParents, newBusId);
          }

          // Retirer le bus des anciens parents
          if (removedParents.length > 0) {
            console.log(
              `  ↪ Retrait bus ${newBusId} des anciens parents: ${removedParents.join(', ')}`
            );
            await removeParentBusAssignments(db, removedParents, newBusId);
          }
        }

        console.log(`✅ Mise à jour assignedBusIds terminée pour student ${studentId}`);
      }
    } catch (error) {
      console.error(
        `❌ Erreur lors de la mise à jour assignedBusIds pour student ${studentId}:`,
        error
      );
      // Ne pas lancer d'erreur pour ne pas bloquer l'opération principale
    }
  });

/**
 * Ajoute un busId au champ assignedBusIds des parents
 */
async function addParentBusAssignments(
  db: FirebaseFirestore.Firestore,
  parentIds: string[],
  busId: string
): Promise<void> {
  const batch = db.batch();

  for (const parentId of parentIds) {
    const parentRef = db.collection('users').doc(parentId);
    batch.update(parentRef, {
      assignedBusIds: FieldValue.arrayUnion(busId),
      updatedAt: new Date(),
    });
  }

  await batch.commit();
  console.log(
    `   ✅ Bus ${busId} ajouté à ${parentIds.length} parent(s)`
  );
}

/**
 * Retire un busId du champ assignedBusIds des parents
 */
async function removeParentBusAssignments(
  db: FirebaseFirestore.Firestore,
  parentIds: string[],
  busId: string
): Promise<void> {
  const batch = db.batch();

  for (const parentId of parentIds) {
    const parentRef = db.collection('users').doc(parentId);
    batch.update(parentRef, {
      assignedBusIds: FieldValue.arrayRemove(busId),
      updatedAt: new Date(),
    });
  }

  await batch.commit();
  console.log(
    `   ✅ Bus ${busId} retiré de ${parentIds.length} parent(s)`
  );
}
