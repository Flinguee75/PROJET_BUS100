/**
 * Script pour créer/mettre à jour le document utilisateur dans Firestore
 * 
 * Ce script vérifie si l'utilisateur connecté a un document dans /users/{userId}
 * avec les champs requis (role, isActive, schoolId) et le crée/mette à jour si nécessaire.
 * 
 * Usage:
 *   ts-node backend/scripts/fix-user-document.ts <email> <role> [schoolId]
 * 
 * Exemples:
 *   ts-node backend/scripts/fix-user-document.ts admin@test.com admin school-grain-de-soleil
 *   ts-node backend/scripts/fix-user-document.ts admin@test.com admin
 */

import * as admin from 'firebase-admin';
import * as path from 'path';
import * as fs from 'fs';

// Configuration pour pointer vers Firebase (production ou émulateur)
const useEmulator = process.env.FIRESTORE_EMULATOR_HOST !== undefined;

if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

  if (fs.existsSync(serviceAccountPath) && !useEmulator) {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'projet-bus-60a3f',
    });
    console.log('✅ Firebase Admin initialisé avec service account\n');
  } else {
    admin.initializeApp({
      projectId: 'projet-bus-60a3f',
    });
    console.log('✅ Firebase Admin initialisé en mode émulateur\n');
  }
}

const db = admin.firestore();
const auth = admin.auth();

async function fixUserDocument(email: string, role: string, schoolId?: string) {
  try {
    console.log(`\n🔍 Recherche de l'utilisateur: ${email}`);

    // Récupérer l'utilisateur Auth
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(email);
      console.log(`✅ Utilisateur Auth trouvé: ${userRecord.uid}`);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        console.error(`❌ Utilisateur Auth non trouvé pour ${email}`);
        console.log(`💡 Créez d'abord l'utilisateur avec:`);
        console.log(`   firebase auth:import users.json`);
        process.exit(1);
      }
      throw error;
    }

    const userId = userRecord.uid;

    // Vérifier si le document existe dans Firestore
    const userDocRef = db.collection('users').doc(userId);
    const userDoc = await userDocRef.get();

    // Déterminer le schoolId par défaut si non fourni
    let finalSchoolId = schoolId;
    if (!finalSchoolId) {
      // Chercher une école par défaut
      const schoolsSnapshot = await db.collection('schools').limit(1).get();
      if (!schoolsSnapshot.empty) {
        finalSchoolId = schoolsSnapshot.docs[0]!.id;
        console.log(`📚 École par défaut trouvée: ${finalSchoolId}`);
      } else {
        console.warn(`⚠️ Aucune école trouvée, schoolId sera null`);
      }
    }

    const userData: any = {
      email: userRecord.email || email,
      displayName: userRecord.displayName || email.split('@')[0] || 'Utilisateur',
      phoneNumber: userRecord.phoneNumber || '',
      role: role,
      isActive: true,
      schoolId: finalSchoolId || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    // Ajouter createdAt seulement si le document n'existe pas
    if (!userDoc.exists) {
      userData.createdAt = admin.firestore.FieldValue.serverTimestamp();
      console.log(`📝 Création du document utilisateur...`);
    } else {
      console.log(`📝 Mise à jour du document utilisateur...`);
      const existingData = userDoc.data();
      console.log(`   Données existantes:`, {
        role: existingData?.role,
        isActive: existingData?.isActive,
        schoolId: existingData?.schoolId,
      });
    }

    // Champs spécifiques par rôle
    if (role === 'driver') {
      userData.busId = userDoc.data()?.busId || null;
      userData.licenseNumber = userDoc.data()?.licenseNumber || null;
      userData.licenseExpiry = userDoc.data()?.licenseExpiry || null;
    } else if (role === 'parent') {
      userData.studentIds = userDoc.data()?.studentIds || [];
      userData.assignedBusIds = userDoc.data()?.assignedBusIds || [];
      userData.address = userDoc.data()?.address || null;
    } else if (role === 'admin') {
      userData.permissions = userDoc.data()?.permissions || [
        'manage_buses',
        'manage_drivers',
        'manage_students',
        'manage_routes',
        'view_reports',
      ];
    }

    // Créer ou mettre à jour le document
    await userDocRef.set(userData, { merge: true });

    console.log(`✅ Document utilisateur ${userDoc.exists ? 'mis à jour' : 'créé'} avec succès!`);
    console.log(`\n📋 Données utilisateur:`);
    console.log(`   UID: ${userId}`);
    console.log(`   Email: ${userData.email}`);
    console.log(`   Role: ${userData.role}`);
    console.log(`   IsActive: ${userData.isActive}`);
    console.log(`   SchoolId: ${userData.schoolId || 'null'}`);

    // Vérifier que le document est bien accessible
    const verifyDoc = await userDocRef.get();
    if (verifyDoc.exists) {
      console.log(`\n✅ Vérification réussie: Le document est accessible dans Firestore`);
    } else {
      console.error(`\n❌ Erreur: Le document n'est pas accessible après création`);
    }

    return userData;
  } catch (error) {
    console.error(`\n❌ Erreur lors de la création/mise à jour du document:`, error);
    throw error;
  }
}

// Point d'entrée
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.error('❌ Usage: ts-node fix-user-document.ts <email> <role> [schoolId]');
    console.error('\nExemples:');
    console.error('  ts-node fix-user-document.ts admin@test.com admin school-grain-de-soleil');
    console.error('  ts-node fix-user-document.ts admin@test.com admin');
    process.exit(1);
  }

  const [email, role, schoolId] = args;

  // Valider le rôle
  const validRoles = ['admin', 'driver', 'parent', 'escort'];
  if (!validRoles.includes(role)) {
    console.error(`❌ Rôle invalide: ${role}`);
    console.error(`   Rôles valides: ${validRoles.join(', ')}`);
    process.exit(1);
  }

  try {
    await fixUserDocument(email, role, schoolId);
    console.log('\n✅ Script terminé avec succès!');
    process.exit(0);
  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { fixUserDocument };

