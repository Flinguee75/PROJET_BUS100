/**
 * Script de seeding complet pour le système de transport scolaire
 * Crée des données réalistes pour Abidjan avec :
 * - 5 bus dans différentes communes
 * - Chauffeurs et escortes (convoyeurs)
 * - 30 élèves avec différents profils de trajet
 * - Routes avec arrêts réalistes et horaires multiples
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { BusStatus, BusMaintenanceStatus } from '../types/bus.types';
import { TimeOfDay } from '../types/route.types';
import * as path from 'path';
import * as fs from 'fs';

// Configuration pour les émulateurs Firebase
process.env.FIRESTORE_EMULATOR_HOST = 'localhost:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = 'localhost:9099';

// Initialiser Firebase Admin
if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, '../../service-account-key.json');

  if (fs.existsSync(serviceAccountPath)) {
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

// ==============================================
// DONNÉES DE BASE
// ==============================================

const prénoms = ['Kouassi', 'Aya', 'Koné', 'Fatou', 'Mamadou', 'Aïcha', 'Ibrahim', 'Aminata', 'Sébastien', 'Mariam'];
const noms = ['Traoré', 'Ouattara', 'Coulibaly', 'Sanogo', 'Diallo', 'Bamba', 'Konaté', 'Touré', 'Yao', 'Kouamé'];

// Note: quartiersByCommune disponible pour extensions futures

// Coordonnées réelles d'Abidjan
const coordonnées = {
  'Cocody-Riviera': { lat: 5.3600, lng: -4.0083 },
  'Cocody-IIPlateaux': { lat: 5.3650, lng: -4.0100 },
  'Cocody-Angré': { lat: 5.3700, lng: -4.0120 },
  'Yopougon-Niangon': { lat: 5.3500, lng: -4.0500 },
  'Yopougon-Maroc': { lat: 5.3450, lng: -4.0600 },
  'Abobo-Gare': { lat: 5.4235, lng: -4.0196 },
  'Adjamé-Liberté': { lat: 5.3567, lng: -4.0239 },
  'Marcory-Zone4': { lat: 5.2886, lng: -3.9863 },
  'École-Cocody': { lat: 5.3550, lng: -4.0050 },
  'École-Plateau': { lat: 5.3223, lng: -4.0415 },
};

// ==============================================
// FONCTION HELPERS
// ==============================================

async function checkEmulators() {
  try {
    await db.collection('_test').doc('_test').set({ test: true });
    await db.collection('_test').doc('_test').delete();
    return true;
  } catch (error) {
    console.error('❌ Erreur : Les émulateurs Firebase ne sont pas démarrés !\n');
    console.log('📌 Pour démarrer les émulateurs :');
    console.log('   1. cd backend');
    console.log('   2. npm run serve\n');
    console.log('💡 Puis relancez : npm run seed\n');
    return false;
  }
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function randomPhone(): string {
  return `+225 07 ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`;
}

// ==============================================
// FONCTION PRINCIPALE
// ==============================================

async function seedData() {
  console.log('🚀 Début du seeding des données...\n');

  const emulatorsReady = await checkEmulators();
  if (!emulatorsReady) {
    process.exit(1);
  }

  // ==================================================
  // 1. CRÉER LES CHAUFFEURS
  // ==================================================
  console.log('👨‍✈️ Création des chauffeurs...');
  const chauffeurs = [];
  for (let i = 1; i <= 5; i++) {
    const chauffeurId = `driver-${i}`;
    const chauffeur = {
      id: chauffeurId,
      email: `chauffeur${i}@bus-abidjan.ci`,
      displayName: `${randomChoice(prénoms)} ${randomChoice(noms)}`,
      phoneNumber: randomPhone(),
      role: 'driver',
      licenseNumber: `CI-DL-${2024000 + i}`,
      licenseExpiry: Timestamp.fromDate(new Date(2026, 11, 31)),
      busId: null,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('users').doc(chauffeurId).set(chauffeur);
    chauffeurs.push(chauffeur);
    console.log(`  ✓ ${chauffeur.displayName} - Permis ${chauffeur.licenseNumber}`);
  }
  console.log(`✅ ${chauffeurs.length} chauffeurs créés\n`);

  // ==================================================
  // 2. CRÉER LES ESCORTES (CONVOYEURS)
  // ==================================================
  console.log('👥 Création des escortes (convoyeurs)...');
  const escortes = [];
  for (let i = 1; i <= 5; i++) {
    const escorteId = `escort-${i}`;
    const escorte = {
      id: escorteId,
      email: `escorte${i}@bus-abidjan.ci`,
      displayName: `${randomChoice(prénoms)} ${randomChoice(noms)}`,
      phoneNumber: randomPhone(),
      role: 'escort',
      idCardNumber: `CI-${Math.floor(100000000 + Math.random() * 900000000)}`,
      busId: null,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('users').doc(escorteId).set(escorte);
    escortes.push(escorte);
    console.log(`  ✓ ${escorte.displayName} - CNI ${escorte.idCardNumber}`);
  }
  console.log(`✅ ${escortes.length} escortes créés\n`);

  // ==================================================
  // 3. CRÉER LES PARENTS
  // ==================================================
  console.log('👪 Création des parents...');
  const parents = [];
  const auth = admin.auth();
  for (let i = 1; i <= 15; i++) {
    const parentId = `parent-${i}`;
    const email = `parent${i}@example.com`;

    // Créer ou mettre à jour l'utilisateur Auth correspondant
    try {
      await auth.createUser({
        uid: parentId,
        email,
        password: `ParentSeed${i}23!`,
        displayName: `Parent ${i}`,
        emailVerified: true,
      });
      console.log(`  ✅ Utilisateur Auth créé pour ${parentId}`);
    } catch (error: any) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.log(`  ℹ️  Utilisateur Auth déjà existant pour ${parentId}`);
      } else {
        throw error;
      }
    }

    const parent = {
      id: parentId,
      email,
      displayName: `M./Mme ${randomChoice(noms)}`,
      phoneNumber: randomPhone(),
      role: 'parent',
      address: `${Math.floor(100 + Math.random() * 900)} Rue ${randomChoice(['de la Paix', 'du Commerce', 'Principale', 'de l\'École'])}`,
      studentIds: [], // Sera rempli plus tard
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('users').doc(parentId).set(parent);
    parents.push(parent);
  }
  console.log(`✅ ${parents.length} parents créés\n`);

  // ==================================================
  // 4. CRÉER LES BUS
  // ==================================================
  console.log('🚌 Création des bus...');
  const busConfigs = [
    { commune: 'Cocody', quartiers: ['Riviera', 'II Plateaux', 'Angré'] },
    { commune: 'Yopougon', quartiers: ['Niangon', 'Quartier Maroc'] },
    { commune: 'Abobo', quartiers: ['Abobo Gare', 'Abobo-PK 18'] },
    { commune: 'Adjamé', quartiers: ['Adjamé Liberté', 'Williamsville'] },
    { commune: 'Marcory', quartiers: ['Zone 4', 'Marcory Résidentiel'] },
  ];

  const buses = [];
  for (let i = 0; i < 5; i++) {
    const busId = `bus-${i + 1}`;
    const config = busConfigs[i]!;
    const bus = {
      id: busId,
      busNumber: i + 1,
      plateNumber: `CI ${1000 + i} AB ${10 + i}`,
      capacity: 35,
      model: i % 2 === 0 ? 'Mercedes Sprinter' : 'Toyota Coaster',
      year: 2020 + (i % 4),
      driverId: chauffeurs[i]!.id,
      driverName: chauffeurs[i]!.displayName,
      escortId: escortes[i]!.id,
      escortName: escortes[i]!.displayName,
      routeId: null, // Sera rempli après création des routes
      studentIds: [], // Sera rempli après création des élèves
      status: BusStatus.ACTIVE,
      maintenanceStatus: BusMaintenanceStatus.OK,
      assignedCommune: config.commune,
      assignedQuartiers: config.quartiers,
      preferredDepartureTime: '07:00',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('buses').doc(busId).set(bus);

    // Mettre à jour le chauffeur
    await db.collection('users').doc(chauffeurs[i]!.id).update({ busId });

    // Mettre à jour l'escorte
    await db.collection('users').doc(escortes[i]!.id).update({ busId });

    buses.push(bus);
    console.log(`  ✓ Bus ${bus.busNumber} - ${bus.plateNumber} - ${config.commune}`);
    console.log(`    Chauffeur: ${bus.driverName}`);
    console.log(`    Escorte: ${bus.escortName}`);
  }
  console.log(`✅ ${buses.length} bus créés\n`);

  // ==================================================
  // 5. CRÉER LES ÉLÈVES AVEC DIFFÉRENTS PROFILS
  // ==================================================
  console.log('👶 Création des élèves...');

  const profils = [
    { name: 'Matin + Soir uniquement', activeTrips: [TimeOfDay.MORNING_OUTBOUND, TimeOfDay.EVENING_RETURN], pct: 50 },
    { name: 'Full day (4 trajets)', activeTrips: [TimeOfDay.MORNING_OUTBOUND, TimeOfDay.MIDDAY_OUTBOUND, TimeOfDay.MIDDAY_RETURN, TimeOfDay.EVENING_RETURN], pct: 30 },
    { name: 'Matin + Midi sortie', activeTrips: [TimeOfDay.MORNING_OUTBOUND, TimeOfDay.MIDDAY_OUTBOUND], pct: 15 },
    { name: 'Midi retour + Soir', activeTrips: [TimeOfDay.MIDDAY_RETURN, TimeOfDay.EVENING_RETURN], pct: 5 },
  ];

  const élèves = [];
  let studentIndex = 1;

  for (let busIdx = 0; busIdx < buses.length; busIdx++) {
    const bus = buses[busIdx]!;
    const config = busConfigs[busIdx]!;
    const numStudentsForBus = 6; // 6 élèves par bus = 30 total

    console.log(`\n  Bus ${bus.busNumber} (${config.commune}):`);

    for (let i = 0; i < numStudentsForBus; i++) {
      const studentId = `student-${studentIndex}`;
      const parentId = parents[Math.floor((studentIndex - 1) / 2)]!.id; // 2 enfants par parent
      const quartier = randomChoice(config.quartiers);

      // Déterminer le profil
      let profil = profils[0]!;
      const rand = Math.random() * 100;
      let cumul = 0;
      for (const p of profils) {
        cumul += p.pct;
        if (rand <= cumul) {
          profil = p;
          break;
        }
      }

      // Créer des locations selon le profil
      const baseKey = `${config.commune}-${quartier.replace(/\s+/g, '')}`;
      const baseLat = coordonnées[baseKey as keyof typeof coordonnées]?.lat || 5.35;
      const baseLng = coordonnées[baseKey as keyof typeof coordonnées]?.lng || -4.00;

      const locations: any = {};

      if (profil.activeTrips.includes(TimeOfDay.MORNING_OUTBOUND)) {
        locations.morningPickup = {
          address: `${Math.floor(100 + Math.random() * 900)} ${quartier}, ${config.commune}`,
          lat: baseLat + (Math.random() - 0.5) * 0.01,
          lng: baseLng + (Math.random() - 0.5) * 0.01,
        };
      }

      if (profil.activeTrips.includes(TimeOfDay.MIDDAY_OUTBOUND)) {
        locations.middayDropoff = locations.morningPickup || {
          address: `${Math.floor(100 + Math.random() * 900)} ${quartier}, ${config.commune}`,
          lat: baseLat + (Math.random() - 0.5) * 0.01,
          lng: baseLng + (Math.random() - 0.5) * 0.01,
        };
      }

      if (profil.activeTrips.includes(TimeOfDay.MIDDAY_RETURN)) {
        locations.middayPickup = locations.morningPickup || {
          address: `${Math.floor(100 + Math.random() * 900)} ${quartier}, ${config.commune}`,
          lat: baseLat + (Math.random() - 0.5) * 0.01,
          lng: baseLng + (Math.random() - 0.5) * 0.01,
        };
      }

      if (profil.activeTrips.includes(TimeOfDay.EVENING_RETURN)) {
        locations.eveningDropoff = locations.morningPickup || {
          address: `${Math.floor(100 + Math.random() * 900)} ${quartier}, ${config.commune}`,
          lat: baseLat + (Math.random() - 0.5) * 0.01,
          lng: baseLng + (Math.random() - 0.5) * 0.01,
        };
      }

      const firstName = randomChoice(prénoms);
      const lastName = randomChoice(noms);
      const classe = randomChoice(['CP', 'CE1', 'CE2', 'CM1', 'CM2']);
      const ecole = `École ${config.commune}`;

      const élève = {
        id: studentId,
        firstName,
        lastName,
        nom: lastName,
        prenom: firstName,
        classe,
        ecole,
        dateOfBirth: Timestamp.fromDate(new Date(2010 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 12), Math.floor(1 + Math.random() * 28))),
        grade: classe,
        parentIds: [parentId],
        parentId,
        busId: bus.id,
        routeId: null, // Sera rempli après création des routes
        commune: config.commune,
        quartier: quartier,
        locations,
        activeTrips: profil.activeTrips,
        isActive: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      };

      await db.collection('students').doc(studentId).set(élève);

      // Ajouter l'élève au bus
      (bus.studentIds as string[]).push(studentId);

      // Ajouter l'élève au parent
      await db.collection('users').doc(parentId).update({
        studentIds: admin.firestore.FieldValue.arrayUnion(studentId),
      });

      élèves.push(élève);
      console.log(`    ✓ ${élève.firstName} ${élève.lastName} (${élève.grade}) - ${profil.name}`);
      studentIndex++;
    }

    // Mettre à jour le bus avec la liste des élèves
    await db.collection('buses').doc(bus.id).update({
      studentIds: bus.studentIds,
    });
  }

  console.log(`\n✅ ${élèves.length} élèves créés avec différents profils\n`);

  // ==================================================
  // 6. CRÉER LES ROUTES
  // ==================================================
  console.log('🛣️  Création des routes...');

  for (let busIdx = 0; busIdx < buses.length; busIdx++) {
    const bus = buses[busIdx]!;
    const config = busConfigs[busIdx]!;
    const routeId = `route-${busIdx + 1}`;

    // Récupérer les élèves de ce bus
    const studentsOfBus = élèves.filter(e => e.busId === bus.id);

    // Créer les arrêts à partir des élèves
    const stops = studentsOfBus.map((élève, idx) => ({
      name: `Arrêt ${élève.firstName} ${élève.lastName}`,
      address: élève.locations.morningPickup?.address || `${élève.quartier}, ${élève.commune}`,
      location: {
        lat: élève.locations.morningPickup?.lat || 5.35,
        lng: élève.locations.morningPickup?.lng || -4.00,
      },
      order: idx + 1,
      estimatedTimeMinutes: 5 + idx * 3,
      type: 'pickup' as const,
      quartier: élève.quartier,
      studentId: élève.id,
      activeTimeSlots: élève.activeTrips,
    }));

    // Ajouter l'arrêt école à la fin
    const écoleStop: any = {
      name: 'École Primaire Cocody',
      address: 'Boulevard VGE, Cocody',
      location: coordonnées['École-Cocody'],
      order: stops.length + 1,
      estimatedTimeMinutes: 5 + stops.length * 3,
      type: 'dropoff' as const,
      quartier: 'Cocody Centre',
      activeTimeSlots: [TimeOfDay.MORNING_OUTBOUND, TimeOfDay.MIDDAY_RETURN],
    };
    stops.push(écoleStop);

    const route = {
      name: `Route ${config.commune} - École`,
      code: `R-${config.commune.substring(0, 3).toUpperCase()}-${String(busIdx + 1).padStart(3, '0')}`,
      description: `Route automatique pour ${config.commune}`,
      commune: config.commune,
      quartiers: config.quartiers,
      stops,
      schedule: {
        morningOutbound: {
          departure: '07:00',
          arrival: '08:00',
        },
        middayOutbound: {
          departure: '11:45',
          arrival: '12:45',
        },
        middayReturn: {
          departure: '13:00',
          arrival: '14:00',
        },
        eveningReturn: {
          departure: '15:30',
          arrival: '16:30',
        },
      },
      totalDistanceKm: 10 + Math.random() * 5,
      estimatedDurationMinutes: 45 + Math.floor(Math.random() * 15),
      capacity: bus.capacity,
      currentOccupancy: studentsOfBus.length,
      busId: bus.id,
      driverId: bus.driverId,
      activeDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      isActive: true,
      isManual: false,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await db.collection('routes').doc(routeId).set(route);

    // Mettre à jour le bus avec l'ID de la route
    await db.collection('buses').doc(bus.id).update({ routeId });

    // Mettre à jour les élèves avec l'ID de la route
    for (const élève of studentsOfBus) {
      await db.collection('students').doc(élève.id).update({ routeId });
    }

    console.log(`  ✓ ${route.name} - ${route.code}`);
    console.log(`    ${stops.length} arrêts - ${studentsOfBus.length} élèves`);
  }

  console.log(`✅ ${buses.length} routes créées\n`);

  // ==================================================
  // 7. CRÉER DES POSITIONS GPS POUR QUELQUES BUS
  // ==================================================
  console.log('📍 Création des positions GPS...');

  for (let i = 0; i < 3; i++) { // 3 bus en mouvement
    const bus = buses[i]!;
    const config = busConfigs[i]!;
    const baseKey = `${config.commune}-${config.quartiers[0]!.replace(/\s+/g, '')}`;
    const baseLat = coordonnées[baseKey as keyof typeof coordonnées]?.lat || 5.35;
    const baseLng = coordonnées[baseKey as keyof typeof coordonnées]?.lng || -4.00;

    await db.collection('gps_live').doc(bus.id).set({
      busId: bus.id,
      lat: baseLat + (Math.random() - 0.5) * 0.02,
      lng: baseLng + (Math.random() - 0.5) * 0.02,
      speed: 20 + Math.random() * 40,
      heading: Math.floor(Math.random() * 360),
      accuracy: 10,
      timestamp: Date.now(),
      driverId: bus.driverId,
      routeId: `route-${i + 1}`,
      status: 'moving',
      lastUpdate: Timestamp.now(),
    });

    console.log(`  ✓ Bus ${bus.busNumber} - Position GPS créée`);
  }

  console.log(`✅ 3 positions GPS créées\n`);

  // ==================================================
  // RÉSUMÉ FINAL
  // ==================================================
  console.log('🎉 Seeding terminé avec succès !\n');
  console.log('📊 Résumé des données créées :');
  console.log(`  ✓ ${chauffeurs.length} chauffeurs`);
  console.log(`  ✓ ${escortes.length} escortes (convoyeurs)`);
  console.log(`  ✓ ${parents.length} parents`);
  console.log(`  ✓ ${buses.length} bus (tous avec chauffeur + escorte)`);
  console.log(`  ✓ ${élèves.length} élèves`);
  console.log(`  ✓ ${buses.length} routes avec horaires multiples`);
  console.log(`  ✓ 3 bus avec positions GPS en temps réel\n`);

  console.log('📈 Profils des élèves :');
  for (const profil of profils) {
    const count = élèves.filter(e => e.activeTrips.length === profil.activeTrips.length).length;
    console.log(`  • ${profil.name}: ${count} élèves (${profil.pct}%)`);
  }

  console.log('\n✨ Vous pouvez maintenant tester le système !');
  console.log('🌐 Backend: npm run serve');
  console.log('🖥️  Web Admin: cd ../web-admin && npm run dev');
}

// Exécuter le script
seedData()
  .then(() => {
    console.log('\n✅ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erreur lors du seeding:', error);
    process.exit(1);
  });
