/**
 * Script de migration - Peuplement du champ assignedBusIds
 *
 * Ce script parcourt tous les students existants et peuple le champ
 * assignedBusIds dans les documents users (parents) correspondants.
 *
 * À exécuter UNE FOIS après avoir déployé le trigger student-changed.trigger.ts
 * et avant de déployer les nouvelles Firestore rules.
 *
 * Usage:
 *   npm run migrate:assignedBusIds
 */

import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

// Initialiser Firebase Admin SDK
// Utilise les credentials par défaut (GOOGLE_APPLICATION_CREDENTIALS ou émulateur)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

interface StudentData {
  id: string;
  parentIds: string[];
  busId: string | null;
}

/**
 * Fonction principale de migration
 */
async function migrateAssignedBusIds(): Promise<void> {
  console.log('🚀 Début de la migration assignedBusIds...\n');

  try {
    // Étape 1: Récupérer tous les students
    console.log('📚 Récupération de tous les students...');
    const studentsSnapshot = await db.collection('students').get();
    console.log(`   ✅ ${studentsSnapshot.size} students trouvés\n`);

    // Étape 2: Construire la map parent → busIds
    console.log('🔄 Construction de la map parent → busIds...');
    const parentBusMap = new Map<string, Set<string>>();

    studentsSnapshot.forEach((doc) => {
      const data = doc.data() as StudentData;
      const { parentIds, busId } = data;

      // Si le student a un bus assigné
      if (busId && parentIds && Array.isArray(parentIds)) {
        parentIds.forEach((parentId) => {
          // Initialiser le Set si nécessaire
          if (!parentBusMap.has(parentId)) {
            parentBusMap.set(parentId, new Set());
          }
          // Ajouter le busId
          parentBusMap.get(parentId)!.add(busId);
        });
      }
    });

    console.log(`   ✅ ${parentBusMap.size} parents à mettre à jour\n`);

    // Afficher le résumé de la migration
    console.log('📊 Résumé de la migration:');
    parentBusMap.forEach((busIds, parentId) => {
      console.log(`   Parent ${parentId}: ${Array.from(busIds).join(', ')}`);
    });
    console.log('');

    // Étape 3: Mettre à jour tous les documents users (parents)
    console.log('💾 Mise à jour des documents users...');

    let successCount = 0;
    let errorCount = 0;

    // Traiter par batch de 500 (limite Firestore)
    const batchSize = 500;
    const parentEntries = Array.from(parentBusMap.entries());

    for (let i = 0; i < parentEntries.length; i += batchSize) {
      const batch = db.batch();
      const currentBatch = parentEntries.slice(i, i + batchSize);

      for (const [parentId, busIds] of currentBatch) {
        try {
          const parentRef = db.collection('users').doc(parentId);

          // Vérifier si le document parent existe
          const parentDoc = await parentRef.get();

          if (!parentDoc.exists) {
            console.warn(`   ⚠️ Parent ${parentId} n'existe pas dans /users`);
            errorCount++;
            continue;
          }

          // Mettre à jour avec le tableau de busIds
          batch.update(parentRef, {
            assignedBusIds: Array.from(busIds),
            updatedAt: FieldValue.serverTimestamp(),
          });

          successCount++;
        } catch (error) {
          console.error(`   ❌ Erreur pour parent ${parentId}:`, error);
          errorCount++;
        }
      }

      // Commit le batch
      await batch.commit();
      console.log(
        `   ✅ Batch ${Math.floor(i / batchSize) + 1} commit (${currentBatch.length} parents)`
      );
    }

    // Étape 4: Résumé final
    console.log('\n✅ Migration terminée!');
    console.log(`   📈 Succès: ${successCount} parents`);
    if (errorCount > 0) {
      console.log(`   ❌ Erreurs: ${errorCount} parents`);
    }

    // Vérification finale
    console.log('\n🔍 Vérification (échantillon de 3 parents):');
    let verifiedCount = 0;
    for (const [parentId] of parentBusMap) {
      if (verifiedCount >= 3) break;

      const parentDoc = await db.collection('users').doc(parentId).get();
      if (parentDoc.exists) {
        const data = parentDoc.data();
        console.log(
          `   Parent ${parentId}: assignedBusIds = [${data?.assignedBusIds?.join(', ') || 'vide'}]`
        );
        verifiedCount++;
      }
    }

    console.log('\n✨ Migration réussie! Les Firestore rules peuvent maintenant être déployées.');
  } catch (error) {
    console.error('\n❌ Erreur fatale lors de la migration:', error);
    process.exit(1);
  }
}

// Point d'entrée du script
if (require.main === module) {
  migrateAssignedBusIds()
    .then(() => {
      console.log('\n👋 Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Script échoué:', error);
      process.exit(1);
    });
}

export { migrateAssignedBusIds };
