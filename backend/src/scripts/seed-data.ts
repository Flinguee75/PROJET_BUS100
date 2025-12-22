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
import { BusLiveStatus } from '../types/gps.types';
import { TimeOfDay } from '../types/route.types';
import * as path from 'path';
import * as fs from 'fs';

// Configuration pour les émulateurs Firebase
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

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

const defaultSchool = {
  
  id: 'school-grain-de-soleil',
  name: 'Ecole Grain de Soleil',
  location: {
    lat: 5.351824,
    lng: -3.953979,
  },
  address: '922W+PCC, Abidjan, Côte d\'Ivoire (Cocody / Riviera)',
  contactEmail: 'contact@grain-de-soleil.ci',
  contactPhone: '+225 07 12 34 56 78',
  fleetSize: 5,
  createdAt: Timestamp.now(),
  updatedAt: Timestamp.now(),
  isActive: true,
};
const defaultSchoolId = defaultSchool.id;

const prénoms = ['Kouassi', 'Aya', 'Koné', 'Fatou', 'Mamadou', 'Aïcha', 'Ibrahim', 'Aminata', 'Sébastien', 'Mariam'];
const noms = ['Traoré', 'Ouattara', 'Coulibaly', 'Sanogo', 'Diallo', 'Bamba', 'Konaté', 'Touré', 'Yao', 'Kouamé'];

// Note: quartiersByCommune disponible pour extensions futures

// Coordonnées réelles d'Abidjan - Quartiers autour de l'école Grain de Soleil
const coordonnées = {
  'Cocody-RivieraBonoumin': { lat: 5.362691, lng: -3.973329 },
  'Cocody-RivieraPalmeraie': { lat: 5.368859, lng: -3.956818 },
  'Cocody-AkouédoVillage': { lat: 5.351122, lng: -3.942706 },
  'Cocody-M\'Pouto': { lat: 5.326388, lng: -3.955677 },
  'Cocody-Riviera2': { lat: 5.344162, lng: -3.978827 },
  // Coordonnées de l'école
  'École-Cocody': { lat: 5.351824, lng: -3.953979 },
};

// ==============================================
// FONCTION HELPERS
// ==============================================

async function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function checkEmulators(maxAttempts = 10) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await db.collection('_test').doc('_test').set({ test: true });
      await db.collection('_test').doc('_test').delete();
      return true;
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      console.warn(`⚠️  Tentative ${attempt}/${maxAttempts} – émulateurs indisponibles (${reason}).`);
      if (attempt === maxAttempts) {
        console.error('❌ Erreur : Les émulateurs Firebase ne sont pas démarrés !\n');
        console.log('📌 Pour démarrer les émulateurs :');
        console.log('   1. cd backend');
        console.log('   2. npm run serve\n');
        console.log('💡 Puis relancez : npm run seed\n');
        return false;
      }
      await wait(3000);
    }
  }
  return false;
}

function randomChoice<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)]!;
}

function randomPhone(): string {
  return `+225 07 ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)} ${Math.floor(10 + Math.random() * 90)}`;
}

function getStationedPosition(index: number, total: number) {
  const angle = (index / Math.max(total, 1)) * 2 * Math.PI;
  const radiusMeters = 35 + (index % 3) * 12; // 35 à 59 mètres autour de l'école
  const radiusDegreesLat = radiusMeters / 111000;
  const radiusDegreesLng =
    radiusMeters /
    (111000 * Math.cos((defaultSchool.location.lat * Math.PI) / 180));

  return {
    lat: defaultSchool.location.lat + radiusDegreesLat * Math.cos(angle),
    lng: defaultSchool.location.lng + radiusDegreesLng * Math.sin(angle),
  };
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
  // 0. CRÉER L'ÉCOLE PAR DÉFAUT
  // ==================================================
  console.log('🏫 Création de l\'école principale...');
  await db.collection('schools').doc(defaultSchoolId).set(defaultSchool);
  console.log(`✅ École enregistrée: ${defaultSchool.name} (${defaultSchool.address})\n`);

  // ==================================================
  // 1. CRÉER LES CHAUFFEURS
  // ==================================================
  console.log('👨‍✈️ Création des chauffeurs...');
  const chauffeurs = [];
  const auth = admin.auth();
  for (let i = 1; i <= 5; i++) {
    const chauffeurId = `driver-${i}`;
    const email = `chauffeur${i}@bus-abidjan.ci`;
    const password = `DriverSeed${i}23!`;

    // CRÉER L'UTILISATEUR AUTH
    try {
      await auth.createUser({
        uid: chauffeurId,
        email,
        password,
        displayName: `${randomChoice(prénoms)} ${randomChoice(noms)}`,
        emailVerified: true,
      });
      console.log(`  ✅ Utilisateur Auth créé pour ${chauffeurId}`);
    } catch (error: any) {
      if (error.code === 'auth/uid-already-exists' || error.code === 'auth/email-already-exists') {
        console.log(`  ℹ️  Utilisateur Auth déjà existant pour ${chauffeurId}`);
      } else {
        throw error;
      }
    }

    const chauffeur = {
      id: chauffeurId,
      email,
      displayName: `${randomChoice(prénoms)} ${randomChoice(noms)}`,
      phoneNumber: randomPhone(),
      schoolId: defaultSchoolId,
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
      schoolId: defaultSchoolId,
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
      schoolId: defaultSchoolId,
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
    { commune: 'Cocody', quartiers: ['Riviera Bonoumin'] },
    { commune: 'Cocody', quartiers: ['Riviera Palmeraie'] },
    { commune: 'Cocody', quartiers: ['Akouédo Village'] },
    { commune: 'Cocody', quartiers: ['M\'Pouto'] },
    { commune: 'Cocody', quartiers: ['Riviera 2'] },
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
      driverPhone: chauffeurs[i]!.phoneNumber,
      escortId: escortes[i]!.id,
      escortName: escortes[i]!.displayName,
      routeId: null as string | null, // Sera rempli après création des routes
      studentIds: [], // Sera rempli après création des élèves
      status: BusStatus.ACTIVE,
      maintenanceStatus: BusMaintenanceStatus.OK,
      assignedCommune: config.commune,
      assignedQuartiers: config.quartiers,
      preferredDepartureTime: '07:00',
      schoolId: defaultSchoolId,
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

  await db
    .collection('schools')
    .doc(defaultSchoolId)
    .update({
      fleetSize: buses.length,
      updatedAt: Timestamp.now(),
    });

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
        schoolId: defaultSchoolId,
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
  const routes: Array<{ id: string; name: string; commune: string; quartiers: string[]; stops: any[] }> = [];

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
    routes.push({
      id: routeId,
      name: route.name,
      commune: route.commune,
      quartiers: route.quartiers,
      stops: route.stops,
    });

    // Mettre à jour le bus avec l'ID de la route
    await db.collection('buses').doc(bus.id).update({ routeId });
    bus.routeId = routeId;

    // Mettre à jour les élèves avec l'ID de la route
    for (const élève of studentsOfBus) {
      await db.collection('students').doc(élève.id).update({ routeId });
    }

    console.log(`  ✓ ${route.name} - ${route.code}`);
    console.log(`    ${stops.length} arrêts - ${studentsOfBus.length} élèves`);
  }

  console.log(`✅ ${buses.length} routes créées\n`);

  // ==================================================
  // 7. CRÉER DES POSITIONS GPS AVEC DIFFÉRENTS STATUTS
  // ==================================================
  console.log('📍 Création des positions GPS avec statuts variés...');

  // Configurations de statuts variés pour tester les panels colorés
  const busStatusConfigs = [
    // Bus arrivés à l'école (ARRIVED - fond vert)
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 5, minutesAgo: 2, atSchool: true },
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 6, minutesAgo: 1, atSchool: true },

    // Bus en route (EN_ROUTE - fond bleu)
    { status: BusLiveStatus.EN_ROUTE, speed: 42, passengersCount: 4, minutesAgo: 0, atSchool: false },
    { status: BusLiveStatus.EN_ROUTE, speed: 35, passengersCount: 5, minutesAgo: 1, atSchool: false },

    // Bus en retard (DELAYED - fond rouge)
    { status: BusLiveStatus.DELAYED, speed: 12, passengersCount: 3, minutesAgo: 28, atSchool: false },
  ];

  for (let i = 0; i < buses.length; i++) {
    const bus = buses[i]!;
    const statusConfig = busStatusConfigs[i] || busStatusConfigs[0]!;
    const now = Date.now();
    const gpsTimestamp = now - statusConfig.minutesAgo * 60 * 1000;

    const chauffeur = chauffeurs.find((c) => c.id === bus.driverId);
    const routeMeta = routes.find((route) => route.id === bus.routeId);

    // Position du bus selon son statut
    let position;
    let currentZone;

    if (statusConfig.atSchool) {
      // Bus à l'école
      position = getStationedPosition(i, buses.length);
      currentZone = `${defaultSchool.name} - Cocody`;
    } else {
      // Bus en route - position aléatoire entre le départ et l'école
      const quartier = bus.assignedQuartiers?.[0] || 'Cocody';
      const baseKey = `Cocody-${quartier.replace(/\s+/g, '')}`;
      const startLat = coordonnées[baseKey as keyof typeof coordonnées]?.lat || 5.36;
      const startLng = coordonnées[baseKey as keyof typeof coordonnées]?.lng || -3.97;
      const schoolLat = defaultSchool.location.lat;
      const schoolLng = defaultSchool.location.lng;

      // Progression (0.3 à 0.8 pour être entre le départ et l'école)
      const progress = statusConfig.status === BusLiveStatus.DELAYED ? 0.35 : 0.65;
      position = {
        lat: startLat + (schoolLat - startLat) * progress,
        lng: startLng + (schoolLng - startLng) * progress,
      };
      currentZone = quartier;
    }

    const statusLabels: Record<BusLiveStatus, string> = {
      [BusLiveStatus.ARRIVED]: '✅ Arrivé à l\'école',
      [BusLiveStatus.EN_ROUTE]: '🚌 En route',
      [BusLiveStatus.DELAYED]: '⚠️  En retard',
      [BusLiveStatus.STOPPED]: '🛑 Arrêté',
      [BusLiveStatus.IDLE]: '💤 Inactif',
    };

    await db.collection('gps_live').doc(bus.id).set({
      busId: bus.id,
      number: `BUS-${String(bus.busNumber).padStart(2, '0')}`,
      busNumber: bus.busNumber,
      plateNumber: bus.plateNumber,
      model: bus.model,
      year: bus.year,
      capacity: bus.capacity,
      status: statusConfig.status,
      liveStatus: statusConfig.status,
      passengersCount: statusConfig.passengersCount,
      passengersPresent: statusConfig.passengersCount,
      isActive: true,
      driverId: bus.driverId,
      driverName: bus.driverName,
      driverPhone: chauffeur?.phoneNumber || bus.driverPhone || '',
      routeId: bus.routeId || null,
      routeName: routeMeta?.name || null,
      fromZone: statusConfig.atSchool ? null : currentZone,
      toZone: statusConfig.atSchool ? null : 'École',
      currentZone,
      schoolId: defaultSchoolId,
      position: {
        lat: position.lat,
        lng: position.lng,
        speed: statusConfig.speed,
        heading: Math.floor(Math.random() * 360),
        accuracy: 10 + Math.random() * 5,
        timestamp: gpsTimestamp,
      },
      updatedAt: gpsTimestamp,
      lastUpdate: Timestamp.fromMillis(gpsTimestamp),
      timestamp: gpsTimestamp,
      tripStartTime: statusConfig.atSchool ? null : now - 25 * 60 * 1000, // Départ il y a 25 min
    });

    const statusLabel = statusLabels[statusConfig.status] || statusConfig.status;
    console.log(`  ✓ Bus ${bus.busNumber} - ${statusLabel} - ${statusConfig.passengersCount} élèves`);
  }

  console.log(`\n✅ ${buses.length} positions GPS créées avec statuts variés\n`);

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
  console.log(`  ✓ ${buses.length} bus avec positions GPS en temps réel\n`);

  console.log('🚌 Statuts des bus (pour tester les panels colorés) :');
  console.log(`  - ✅ ${busStatusConfigs.filter(c => c.status === BusLiveStatus.ARRIVED).length} bus arrivés (fond vert)`);
  console.log(`  - 🚌 ${busStatusConfigs.filter(c => c.status === BusLiveStatus.EN_ROUTE).length} bus en route (fond bleu)`);
  console.log(`  - ⚠️  ${busStatusConfigs.filter(c => c.status === BusLiveStatus.DELAYED).length} bus en retard (fond rouge)`);
  console.log(`  - 🛑 ${busStatusConfigs.filter(c => c.status === BusLiveStatus.STOPPED).length} bus arrêtés (fond gris)`);
  console.log(`  - 💤 ${busStatusConfigs.filter(c => c.status === BusLiveStatus.IDLE).length} bus inactifs (fond gris)\n`);

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
