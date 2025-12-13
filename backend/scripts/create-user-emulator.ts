/**
 * Script pour créer un utilisateur dans l'émulateur Firebase local
 * Usage: npm run create-user-emulator
 * Ou: npx ts-node scripts/create-user-emulator.ts
 */

// Configuration des variables d'environnement pour pointer vers les émulateurs
process.env.FUNCTIONS_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

import { getAuth, getDb } from '../src/config/firebase.config';

const EMAIL = 'redfoo923@gmail.com';
const PASSWORD = 'Nuage923';
const DISPLAY_NAME = 'Admin';
const ROLE = 'admin';
const SCHOOL_ID = 'school-grain-de-soleil';

async function createUserInEmulator() {
  try {
    console.log('🚀 Début de la création de l\'utilisateur dans l\'émulateur...\n');

    // Vérifier que les émulateurs sont accessibles
    console.log('📡 Connexion aux émulateurs Firebase...');
    console.log(`   - Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);
    console.log(`   - Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}\n`);

    const auth = getAuth();
    const db = getDb();

    // Étape 1: Créer l'utilisateur dans Auth
    console.log(`👤 Création de l'utilisateur dans Auth...`);
    console.log(`   Email: ${EMAIL}`);
    
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: EMAIL,
        password: PASSWORD,
        displayName: DISPLAY_NAME,
        emailVerified: true,
      });
      console.log(`✅ Utilisateur créé dans Auth avec succès!`);
      console.log(`   UID: ${userRecord.uid}\n`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-exists') {
        console.log(`⚠️  L'utilisateur existe déjà dans Auth. Récupération de l'utilisateur...`);
        userRecord = await auth.getUserByEmail(EMAIL);
        console.log(`✅ Utilisateur trouvé: ${userRecord.uid}\n`);
      } else {
        throw error;
      }
    }

    // Étape 2: Créer le document Firestore
    console.log(`📄 Création du document Firestore...`);
    const userDocRef = db.collection('users').doc(userRecord.uid);
    
    const userData = {
      uid: userRecord.uid,
      email: EMAIL,
      displayName: DISPLAY_NAME,
      role: ROLE,
      schoolId: SCHOOL_ID,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await userDocRef.set(userData);
    console.log(`✅ Document Firestore créé avec succès!`);
    console.log(`   Collection: users`);
    console.log(`   Document ID: ${userRecord.uid}`);
    console.log(`   Données:`, userData);
    console.log(`\n✅ Utilisateur créé avec succès dans l'émulateur!`);
    console.log(`\n📋 Résumé:`);
    console.log(`   - Email: ${EMAIL}`);
    console.log(`   - Password: ${PASSWORD}`);
    console.log(`   - UID: ${userRecord.uid}`);
    console.log(`   - Role: ${ROLE}`);
    console.log(`\n🎉 Vous pouvez maintenant vous connecter à l'application avec ces identifiants!`);
    
    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ Erreur lors de la création de l\'utilisateur:', error);
    
    if (error.code) {
      console.error(`   Code d'erreur: ${error.code}`);
    }
    
    if (error.message) {
      console.error(`   Message: ${error.message}`);
    }

    console.error('\n💡 Vérifiez que:');
    console.error('   1. Les émulateurs Firebase sont démarrés (auth, firestore)');
    console.error('   2. Vous avez exécuté: firebase emulators:start --only functions,firestore,auth');
    console.error('   3. Les ports 9099 (Auth) et 8080 (Firestore) sont accessibles\n');
    
    process.exit(1);
  }
}

// Exécuter le script
createUserInEmulator();
