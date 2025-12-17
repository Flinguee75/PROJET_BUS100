/**
 * Script pour créer des données mock pour les bus d'Abidjan
 * Routes typiques : Cocody, Yopougon, Abobo, Adjamé, Plateau, Treichville
 */

import * as admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';
import { BusStatus, BusMaintenanceStatus } from '../types/bus.types';
import { BusLiveStatus } from '../types/gps.types';
import * as path from 'path';
import * as fs from 'fs';

// Configuration pour les émulateurs Firebase
process.env.FIRESTORE_EMULATOR_HOST = '127.0.0.1:8080';
process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';

// Initialiser Firebase Admin pour les émulateurs
if (!admin.apps.length) {
  // Chercher le fichier service account (optionnel pour émulateurs)
  const serviceAccountPath = path.join(__dirname, '../../service-account-key.json');
  
  if (fs.existsSync(serviceAccountPath)) {
    // Si le service account existe, l'utiliser
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'projet-bus-60a3f',
    });
    console.log('✅ Firebase Admin initialisé avec service account\n');
  } else {
    // Sinon, utiliser la config de base (émulateurs uniquement)
    admin.initializeApp({
      projectId: 'projet-bus-60a3f',
    });
    console.log('✅ Firebase Admin initialisé en mode émulateur (sans credentials)\n');
  }
}

const db = admin.firestore();

// Zones d'Abidjan avec coordonnées approximatives
const zones = {
  cocody: { name: 'Cocody', lat: 5.3473, lng: -3.9875 },
  yopougon: { name: 'Yopougon', lat: 5.3365, lng: -4.0872 },
  abobo: { name: 'Abobo', lat: 5.4235, lng: -4.0196 },
  adjame: { name: 'Adjamé', lat: 5.3567, lng: -4.0239 },
  plateau: { name: 'Plateau', lat: 5.3223, lng: -4.0415 },
  treichville: { name: 'Treichville', lat: 5.2947, lng: -4.0093 },
  marcory: { name: 'Marcory', lat: 5.2886, lng: -3.9863 },
  koumassi: { name: 'Koumassi', lat: 5.2975, lng: -3.9489 },
};

// Routes typiques avec points intermédiaires
const routes = [
  {
    id: 'route-1',
    name: 'Cocody → Plateau',
    from: zones.cocody,
    to: zones.plateau,
    waypoints: [
      { lat: 5.340, lng: -4.000 },
      { lat: 5.335, lng: -4.015 },
      { lat: 5.330, lng: -4.030 },
    ],
  },
  {
    id: 'route-2',
    name: 'Yopougon → Adjamé',
    from: zones.yopougon,
    to: zones.adjame,
    waypoints: [
      { lat: 5.340, lng: -4.070 },
      { lat: 5.345, lng: -4.055 },
      { lat: 5.350, lng: -4.040 },
    ],
  },
  {
    id: 'route-3',
    name: 'Abobo → Plateau',
    from: zones.abobo,
    to: zones.plateau,
    waypoints: [
      { lat: 5.410, lng: -4.025 },
      { lat: 5.380, lng: -4.030 },
      { lat: 5.350, lng: -4.035 },
    ],
  },
  {
    id: 'route-4',
    name: 'Treichville → Cocody',
    from: zones.treichville,
    to: zones.cocody,
    waypoints: [
      { lat: 5.300, lng: -4.015 },
      { lat: 5.315, lng: -4.005 },
      { lat: 5.330, lng: -3.995 },
    ],
  },
  {
    id: 'route-5',
    name: 'Marcory → Plateau',
    from: zones.marcory,
    to: zones.plateau,
    waypoints: [
      { lat: 5.290, lng: -4.000 },
      { lat: 5.300, lng: -4.020 },
      { lat: 5.310, lng: -4.035 },
    ],
  },
];

// Localisation de l'école (parking principal pour les bus stationnés)
const SCHOOL_LOCATION = { lat: 5.351824, lng: -3.953979 };

// Conducteurs mock
const drivers = [
  { id: 'driver-1', name: 'Kouassi Jean', phone: '+225 07 12 34 56 78' },
  { id: 'driver-2', name: 'Traoré Mamadou', phone: '+225 07 23 45 67 89' },
  { id: 'driver-3', name: 'Koné Awa', phone: '+225 07 34 56 78 90' },
  { id: 'driver-4', name: 'Ouattara Ibrahim', phone: '+225 07 45 67 89 01' },
  { id: 'driver-5', name: 'Bamba Sébastien', phone: '+225 07 56 78 90 12' },
  { id: 'driver-6', name: 'Coulibaly Fatou', phone: '+225 07 67 89 01 23' },
  { id: 'driver-7', name: 'Diallo Moussa', phone: '+225 07 78 90 12 34' },
  { id: 'driver-8', name: 'Sanogo Adama', phone: '+225 07 89 01 23 45' },
];

// Fonction pour générer une position aléatoire sur une route
function getRandomPositionOnRoute(route: typeof routes[0], progress: number) {
  // progress: 0 = départ, 1 = arrivée
  const allPoints = [route.from, ...route.waypoints, route.to];
  const index = Math.floor(progress * (allPoints.length - 1));
  const nextIndex = Math.min(index + 1, allPoints.length - 1);

  const p1 = allPoints[index]!;
  const p2 = allPoints[nextIndex]!;
  const localProgress = (progress * (allPoints.length - 1)) % 1;

  return {
    lat: p1.lat + (p2.lat - p1.lat) * localProgress,
    lng: p1.lng + (p2.lng - p1.lng) * localProgress,
  };
}

// Générer une position stationnée à proximité de l'école (répartition radiale)
function getStationedPosition(index: number, total: number) {
  const angle = (index / total) * 2 * Math.PI;
  const radiusMeters = 35 + (index % 3) * 12; // 35 à 59m
  const radiusDegreesLat = radiusMeters / 111000;
  const radiusDegreesLng =
    radiusMeters / (111000 * Math.cos((SCHOOL_LOCATION.lat * Math.PI) / 180));

  return {
    lat: SCHOOL_LOCATION.lat + radiusDegreesLat * Math.cos(angle),
    lng: SCHOOL_LOCATION.lng + radiusDegreesLng * Math.sin(angle),
  };
}

// Vérifier que les émulateurs sont démarrés
async function checkEmulators() {
  try {
    // Essayer de se connecter à Firestore
    await db.collection('_test').doc('_test').set({ test: true });
    await db.collection('_test').doc('_test').delete();
    return true;
  } catch (error) {
    console.error('❌ Erreur : Les émulateurs Firebase ne sont pas démarrés !\n');
    console.log('📌 Pour démarrer les émulateurs :');
    console.log('   1. Ouvrez un nouveau terminal');
    console.log('   2. cd backend');
    console.log('   3. npm run serve\n');
    console.log('💡 Puis relancez ce script : npm run seed\n');
    return false;
  }
}

// Fonction principale de seeding
async function seedMockData() {
  console.log('🚀 Début du seeding des données mock pour Abidjan...\n');

  // Vérifier que les émulateurs sont accessibles
  const emulatorsReady = await checkEmulators();
  if (!emulatorsReady) {
    process.exit(1);
  }

  // 1. Créer les conducteurs
  console.log('👨‍✈️ Création des conducteurs...');
  for (const driver of drivers) {
    await db.collection('users').doc(driver.id).set({
      email: `${driver.id}@bus-abidjan.ci`,
      displayName: driver.name,
      phoneNumber: driver.phone,
      role: 'driver',
      licenseNumber: `CI-DL-${1000 + drivers.indexOf(driver)}`,
      licenseExpiry: Timestamp.fromDate(new Date(2026, 11, 31)), // 31 décembre 2026
      busId: null,
      isActive: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  console.log(`✅ ${drivers.length} conducteurs créés\n`);

  // 1.5. Créer les élèves
  console.log('👶 Création des élèves...');
  const studentCount = 100;
  for (let i = 1; i <= studentCount; i++) {
    await db.collection('students').doc(`student-${i}`).set({
      firstName: `Élève${i}`,
      lastName: `Test`,
      parentId: `parent-${Math.ceil(i / 2)}`, // 2 enfants par parent
      grade: `CE${(i % 5) + 1}`,
      school: 'École Primaire Cocody',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  console.log(`✅ ${studentCount} élèves créés\n`);

  // 1.6. Créer les scans du jour (attendance)
  console.log('📋 Création des scans d\'aujourd\'hui...');
  const today = new Date().toISOString().split('T')[0];
  const scannedCount = 90; // 90% de validation
  for (let i = 1; i <= scannedCount; i++) {
    await db.collection('attendance').add({
      studentId: `student-${i}`,
      busId: `bus-${(i % 6) + 1}`, // Distribuer sur 6 bus actifs
      date: today,
      type: 'boarding',
      timestamp: Timestamp.now(),
      location: {
        lat: 5.35 + Math.random() * 0.05,
        lng: -4.0 + Math.random() * 0.05,
      },
    });
  }
  console.log(`✅ ${scannedCount} scans créés (${scannedCount}% validation)\n`);

  // 2. Créer les routes
  console.log('🛣️  Création des routes...');
  for (const route of routes) {
    await db.collection('routes').doc(route.id).set({
      name: route.name,
      fromZone: route.from.name,
      toZone: route.to.name,
      stops: [route.from, ...route.waypoints, route.to],
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  console.log(`✅ ${routes.length} routes créées\n`);

  // 3. Créer les bus avec positions GPS
  console.log('🚌 Création des bus...');
  const now = Date.now();
  const busStatuses = [
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 26, minutesAgo: 1 },
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 24, minutesAgo: 2 },
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 22, minutesAgo: 0 },
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 27, minutesAgo: 3 },
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 25, minutesAgo: 1 },
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 23, minutesAgo: 4 },
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 21, minutesAgo: 2 },
    { status: BusLiveStatus.ARRIVED, speed: 0, passengersCount: 20, minutesAgo: 0 },
  ];

  for (let i = 0; i < drivers.length; i++) {
    const busId = `bus-${i + 1}`;
    const driver = drivers[i]!;
    const route = routes[i % routes.length]!;
    const busInfo = busStatuses[i]!;
    const isActive = busInfo.passengersCount > 0 || busInfo.status === BusLiveStatus.EN_ROUTE;

    // Créer le bus
    await db.collection('buses').doc(busId).set({
      busNumber: i + 1,
      plateNumber: `CI ${1000 + i} AB ${10 + i}`,
      capacity: 35,
      model: i % 2 === 0 ? 'Mercedes Sprinter' : 'Toyota Coaster',
      year: 2020 + (i % 4),
      driverId: driver.id,
      routeId: isActive ? route.id : null,
      status: isActive ? BusStatus.ACTIVE : BusStatus.INACTIVE,
      maintenanceStatus: BusMaintenanceStatus.OK,
      assignedCommune: route.from.name,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Si le bus est actif, créer sa position GPS
    if (isActive) {
      const progress = (i * 0.15) % 1; // Position sur la route (0-100%)
      const position =
        busInfo.status === BusLiveStatus.ARRIVED
          ? getStationedPosition(i, drivers.length)
          : getRandomPositionOnRoute(route, progress);
      const gpsTimestamp = now - busInfo.minutesAgo * 60 * 1000; // Timestamp avec retard

      await db.collection('gps_live').doc(busId).set({
        busId,
        position: {
          lat: position.lat,
          lng: position.lng,
          speed: busInfo.speed,
          heading: Math.floor(Math.random() * 360),
          accuracy: 10 + Math.random() * 5,
          timestamp: gpsTimestamp,
        },
        driverId: driver.id,
        routeId: route.id,
        status: busInfo.status,
        passengersCount: busInfo.passengersCount,
        lastUpdate: Timestamp.now(),
      });

      const statusLabel =
        busInfo.status === BusLiveStatus.ARRIVED ? 'Stationné à l’école' : busInfo.status;
      console.log(`  ✓ Bus ${busId} - ${statusLabel} - ${busInfo.passengersCount} élèves`);
    } else {
      console.log(`  ✓ Bus ${busId} - HORS COURSE`);
    }
  }

  console.log(`\n✅ ${drivers.length} bus créés avec positions GPS\n`);
  console.log('🎉 Seeding terminé avec succès !');
  console.log('\n📊 Résumé des données créées :');
  console.log(`  - ${drivers.length} conducteurs`);
  console.log(`  - ${routes.length} routes`);
  console.log(`  - ${drivers.length} bus`);
  console.log(`  - ${studentCount} élèves`);
  console.log(`  - ${scannedCount} scans aujourd'hui (${scannedCount}% validation)`);
  console.log(`  - ${busStatuses.filter((s) => s.status === BusLiveStatus.ARRIVED).length} bus stationnés`);
  console.log(`  - ${busStatuses.filter((s) => s.status === BusLiveStatus.EN_ROUTE).length} bus en cours de préparation`);
  console.log(`  - ${busStatuses.filter((s) => s.minutesAgo > 15).length} bus en retard critique`);
  console.log(`  - ${busStatuses.filter((s) => s.minutesAgo > 20).length} bus en retard grave`);
  console.log('\n✨ Vous pouvez maintenant tester le Dashboard avec ces données !');
  console.log('🌐 Démarrez le backend : npm run serve');
  console.log('🖥️  Démarrez le web-admin : cd ../web-admin && npm run dev');
}

// Exécuter le script
seedMockData()
  .then(() => {
    console.log('\n✨ Script terminé');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erreur lors du seeding:', error);
    process.exit(1);
  });
