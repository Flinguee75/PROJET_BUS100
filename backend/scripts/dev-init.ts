/**
 * Script d'initialisation complète de l'environnement de développement
 *
 * Ce script:
 * 1. Vérifie que les émulateurs Firebase sont démarrés
 * 2. Crée des utilisateurs de test (admin, driver, parent)
 * 3. Crée des buses de test
 * 4. Crée des students de test avec liens parents/bus
 * 5. Exécute la migration assignedBusIds
 * 6. Affiche un résumé des identifiants créés
 *
 * Usage:
 *   npm run dev:init
 *
 * Prérequis:
 *   Les émulateurs doivent être démarrés:
 *   firebase emulators:start --only functions,firestore,auth
 */

// Configuration des variables d'environnement pour pointer vers les émulateurs
process.env.FUNCTIONS_EMULATOR = 'true';
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

import { getAuth, getDb } from '../src/config/firebase.config';
import { FieldValue } from 'firebase-admin/firestore';

// ==========================
// CONFIGURATION
// ==========================

const USERS = [
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    displayName: 'Admin Test',
    role: 'admin',
    phoneNumber: '+33601020304',
  },
  {
    email: 'driver1@test.com',
    password: 'Driver123!',
    displayName: 'Jean Dupont',
    role: 'driver',
    phoneNumber: '+33601020305',
    licenseNumber: 'B123456789',
    licenseExpiry: '2026-12-31',
  },
  {
    email: 'driver2@test.com',
    password: 'Driver123!',
    displayName: 'Marie Martin',
    role: 'driver',
    phoneNumber: '+33601020306',
    licenseNumber: 'B987654321',
    licenseExpiry: '2027-06-30',
  },
  {
    email: 'parent1@test.com',
    password: 'Parent123!',
    displayName: 'Sophie Dubois',
    role: 'parent',
    phoneNumber: '+33601020307',
    address: '12 Rue de la Paix, 75001 Paris',
  },
  {
    email: 'parent2@test.com',
    password: 'Parent123!',
    displayName: 'Pierre Moreau',
    role: 'parent',
    phoneNumber: '+33601020308',
    address: '8 Avenue des Champs, 69001 Lyon',
  },
];

const BUSES = [
  {
    id: 'BUS001',
    plateNumber: 'AB-123-CD',
    capacity: 50,
    model: 'Mercedes Sprinter',
    year: 2020,
    status: 'active',
  },
  {
    id: 'BUS002',
    plateNumber: 'EF-456-GH',
    capacity: 45,
    model: 'Iveco Daily',
    year: 2021,
    status: 'active',
  },
  {
    id: 'BUS003',
    plateNumber: 'IJ-789-KL',
    capacity: 40,
    model: 'Renault Master',
    year: 2019,
    status: 'maintenance',
  },
];

// ==========================
// FONCTIONS UTILITAIRES
// ==========================

/**
 * Vérifie que les émulateurs sont démarrés
 */
async function checkEmulators(): Promise<void> {
  console.log('📡 Vérification des émulateurs...');

  try {
    const auth = getAuth();
    const db = getDb();

    // Test Auth emulator
    await auth.listUsers(1);
    console.log(`   ✅ Auth Emulator: ${process.env.FIREBASE_AUTH_EMULATOR_HOST}`);

    // Test Firestore emulator
    await db.collection('_test').limit(1).get();
    console.log(`   ✅ Firestore Emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
    console.log('');
  } catch (error) {
    console.error('\n❌ Erreur: Les émulateurs ne sont pas accessibles!');
    console.error('\n💡 Démarrez les émulateurs avec:');
    console.error('   firebase emulators:start --only functions,firestore,auth\n');
    process.exit(1);
  }
}

/**
 * Crée les utilisateurs de test
 */
async function createUsers(): Promise<Map<string, string>> {
  console.log('👥 Création des utilisateurs de test...\n');

  const auth = getAuth();
  const db = getDb();
  const userIds = new Map<string, string>();

  for (const userData of USERS) {
    try {
      console.log(`   Création: ${userData.email} (${userData.role})`);

      // Créer dans Auth
      let userRecord;
      try {
        userRecord = await auth.createUser({
          email: userData.email,
          password: userData.password,
          displayName: userData.displayName,
          emailVerified: true,
        });
      } catch (error: any) {
        if (error.code === 'auth/email-already-exists') {
          userRecord = await auth.getUserByEmail(userData.email);
          console.log(`      ⚠️ Utilisateur existant, réutilisation`);
        } else {
          throw error;
        }
      }

      // Créer document Firestore
      const userDoc: any = {
        email: userData.email,
        displayName: userData.displayName,
        phoneNumber: userData.phoneNumber,
        role: userData.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Champs spécifiques par rôle
      if (userData.role === 'driver') {
        userDoc.licenseNumber = (userData as any).licenseNumber;
        userDoc.licenseExpiry = new Date((userData as any).licenseExpiry);
        userDoc.busId = null; // Sera assigné plus tard
      } else if (userData.role === 'parent') {
        userDoc.address = (userData as any).address;
        userDoc.studentIds = []; // Sera peuplé plus tard
        userDoc.assignedBusIds = []; // Sera peuplé par le trigger
      }

      await db.collection('users').doc(userRecord.uid).set(userDoc);

      userIds.set(userData.email, userRecord.uid);
      console.log(`      ✅ UID: ${userRecord.uid}`);
    } catch (error) {
      console.error(`      ❌ Erreur pour ${userData.email}:`, error);
    }
  }

  console.log('');
  return userIds;
}

/**
 * Crée les bus de test
 */
async function createBuses(driverIds: Map<string, string>): Promise<void> {
  console.log('🚌 Création des bus de test...\n');

  const db = getDb();
  const driverEmails = Array.from(driverIds.keys()).filter((email) =>
    email.startsWith('driver')
  );

  for (let i = 0; i < BUSES.length; i++) {
    const busData = BUSES[i];
    if (!busData) {
      continue;
    }

    try {
      console.log(`   Création: ${busData.plateNumber} (${busData.model})`);

      const bus: any = {
        plateNumber: busData.plateNumber,
        capacity: busData.capacity,
        model: busData.model,
        year: busData.year,
        status: busData.status,
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Assigner un chauffeur si disponible
      if (i < driverEmails.length) {
        const driverEmail = driverEmails[i];
        if (driverEmail) {
          const driverId = driverIds.get(driverEmail);
          if (driverId) {
            bus.driverId = driverId;

            // Mettre à jour le chauffeur avec le busId
            await db.collection('users').doc(driverId).update({
              busId: busData.id,
              updatedAt: new Date(),
            });

            console.log(`      ✅ Chauffeur assigné: ${driverEmail}`);
          } else {
            console.warn(`      ⚠️ Chauffeur introuvable pour ${driverEmail}`);
          }
        }
      }

      await db.collection('buses').doc(busData.id).set(bus);
      console.log(`      ✅ Bus créé: ${busData.id}`);
    } catch (error) {
      console.error(`      ❌ Erreur pour ${busData.plateNumber}:`, error);
    }
  }

  console.log('');
}

/**
 * Crée les students de test
 */
async function createStudents(parentIds: Map<string, string>): Promise<void> {
  console.log('👦 Création des students de test...\n');

  const db = getDb();

  const students = [
    {
      firstName: 'Léa',
      lastName: 'Dubois',
      grade: 'CM2',
      parentEmail: 'parent1@test.com',
      busId: 'BUS001',
    },
    {
      firstName: 'Lucas',
      lastName: 'Dubois',
      grade: 'CE1',
      parentEmail: 'parent1@test.com',
      busId: 'BUS001',
    },
    {
      firstName: 'Emma',
      lastName: 'Moreau',
      grade: 'CM1',
      parentEmail: 'parent2@test.com',
      busId: 'BUS002',
    },
  ];

  for (const studentData of students) {
    try {
      const parentId = parentIds.get(studentData.parentEmail);
      if (!parentId) {
        console.log(`   ⚠️ Parent ${studentData.parentEmail} non trouvé, skip`);
        continue;
      }

      console.log(
        `   Création: ${studentData.firstName} ${studentData.lastName} (${studentData.grade})`
      );

      const student = {
        firstName: studentData.firstName,
        lastName: studentData.lastName,
        grade: studentData.grade,
        dateOfBirth: new Date('2015-05-15'),
        parentIds: [parentId],
        busId: studentData.busId,
        address: '12 Rue de la Paix, 75001 Paris',
        emergencyContact: '+33601020309',
        medicalInfo: '',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const studentRef = await db.collection('students').add(student);

      // Mettre à jour le parent avec le studentId
      await db
        .collection('users')
        .doc(parentId)
        .update({
          studentIds: FieldValue.arrayUnion(studentRef.id),
          updatedAt: new Date(),
        });

      console.log(`      ✅ Student créé: ${studentRef.id}`);
      console.log(`      ✅ Parent mis à jour avec studentId`);
      console.log(`      ✅ Bus assigné: ${studentData.busId}`);
    } catch (error) {
      console.error(
        `      ❌ Erreur pour ${studentData.firstName} ${studentData.lastName}:`,
        error
      );
    }
  }

  console.log('');
}

/**
 * Exécute la migration assignedBusIds
 */
async function runMigration(): Promise<void> {
  console.log('🔄 Exécution de la migration assignedBusIds...\n');

  const db = getDb();

  // Construire la map parent → busIds
  const studentsSnapshot = await db.collection('students').get();
  const parentBusMap = new Map<string, Set<string>>();

  studentsSnapshot.forEach((doc) => {
    const data = doc.data();
    const { parentIds, busId } = data;

    if (busId && parentIds && Array.isArray(parentIds)) {
      parentIds.forEach((parentId: string) => {
        if (!parentBusMap.has(parentId)) {
          parentBusMap.set(parentId, new Set());
        }
        parentBusMap.get(parentId)!.add(busId);
      });
    }
  });

  // Mettre à jour les parents
  for (const [parentId, busIds] of parentBusMap) {
    await db
      .collection('users')
      .doc(parentId)
      .update({
        assignedBusIds: Array.from(busIds),
        updatedAt: new Date(),
      });
  }

  console.log(`   ✅ ${parentBusMap.size} parent(s) mis à jour avec assignedBusIds\n`);
}

/**
 * Affiche un résumé des identifiants créés
 */
function displaySummary(userIds: Map<string, string>): void {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('✅ Environnement de développement initialisé avec succès!');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log('🔑 IDENTIFIANTS DE TEST:\n');

  console.log('👨‍💼 ADMIN:');
  console.log(`   Email:    admin@test.com`);
  console.log(`   Password: Admin123!`);
  console.log(`   UID:      ${userIds.get('admin@test.com')}\n`);

  console.log('🚗 DRIVERS:');
  USERS.filter((u) => u.role === 'driver').forEach((driver) => {
    console.log(`   Email:    ${driver.email}`);
    console.log(`   Password: ${driver.password}`);
    console.log(`   UID:      ${userIds.get(driver.email)}`);
    console.log('');
  });

  console.log('👨‍👩‍👧‍👦 PARENTS:');
  USERS.filter((u) => u.role === 'parent').forEach((parent) => {
    console.log(`   Email:    ${parent.email}`);
    console.log(`   Password: ${parent.password}`);
    console.log(`   UID:      ${userIds.get(parent.email)}`);
    console.log('');
  });

  console.log('🚌 BUS CRÉÉS:');
  BUSES.forEach((bus) => {
    console.log(`   ${bus.id}: ${bus.plateNumber} (${bus.model})`);
  });

  console.log('\n🎯 PROCHAINES ÉTAPES:\n');
  console.log('   1. Connectez-vous à l\'application web avec un des comptes ci-dessus');
  console.log('   2. Les émulateurs Firebase sont accessibles à:');
  console.log('      - UI: http://localhost:4000');
  console.log('      - Auth: http://localhost:9099');
  console.log('      - Firestore: http://localhost:8080');
  console.log('   3. Les données sont automatiquement sauvegardées dans les émulateurs\n');
}

// ==========================
// POINT D'ENTRÉE
// ==========================

async function devInit(): Promise<void> {
  try {
    console.log('\n🚀 Initialisation de l\'environnement de développement\n');

    // 1. Vérifier les émulateurs
    await checkEmulators();

    // 2. Créer les utilisateurs
    const userIds = await createUsers();

    // 3. Créer les bus
    await createBuses(userIds);

    // 4. Créer les students
    await createStudents(userIds);

    // 5. Exécuter la migration
    await runMigration();

    // 6. Afficher le résumé
    displaySummary(userIds);

    process.exit(0);
  } catch (error) {
    console.error('\n💥 Erreur fatale:', error);
    process.exit(1);
  }
}

// Exécuter le script
if (require.main === module) {
  devInit();
}

export { devInit };
