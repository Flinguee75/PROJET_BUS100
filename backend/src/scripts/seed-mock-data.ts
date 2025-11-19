/**
 * Script pour créer des données mock pour les bus d'Abidjan
 * Routes typiques : Cocody, Yopougon, Abobo, Adjamé, Plateau, Treichville
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { BusStatus, BusMaintenanceStatus } from '../types/bus.types';
import { BusLiveStatus } from '../types/gps.types';

// Initialiser Firebase Admin
const serviceAccount = require('../../../projet-bus-60a3f-firebase-adminsdk-bqkqg-6e1f23e4eb.json');

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

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

// Fonction principale de seeding
async function seedMockData() {
  console.log('🚀 Début du seeding des données mock pour Abidjan...\n');

  // 1. Créer les conducteurs
  console.log('👨‍✈️ Création des conducteurs...');
  for (const driver of drivers) {
    await db.collection('users').doc(driver.id).set({
      name: driver.name,
      phone: driver.phone,
      role: 'driver',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });
  }
  console.log(`✅ ${drivers.length} conducteurs créés\n`);

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
  const busStatuses = [
    { status: BusLiveStatus.EN_ROUTE, speed: 35, passengersCount: 25 },
    { status: BusLiveStatus.EN_ROUTE, speed: 40, passengersCount: 30 },
    { status: BusLiveStatus.EN_ROUTE, speed: 25, passengersCount: 18 },
    { status: BusLiveStatus.STOPPED, speed: 0, passengersCount: 15 },
    { status: BusLiveStatus.EN_ROUTE, speed: 45, passengersCount: 28 },
    { status: BusLiveStatus.IDLE, speed: 3, passengersCount: 12 },
    { status: BusLiveStatus.STOPPED, speed: 0, passengersCount: 0 }, // Bus hors course
    { status: BusLiveStatus.STOPPED, speed: 0, passengersCount: 0 }, // Bus hors course
  ];

  for (let i = 0; i < drivers.length; i++) {
    const busId = `bus-${i + 1}`;
    const driver = drivers[i]!;
    const route = routes[i % routes.length]!;
    const busInfo = busStatuses[i]!;
    const isActive = busInfo.passengersCount > 0 || busInfo.status === BusLiveStatus.EN_ROUTE;

    // Créer le bus
    await db.collection('buses').doc(busId).set({
      plateNumber: `CI ${1000 + i} AB ${10 + i}`,
      capacity: 35,
      model: i % 2 === 0 ? 'Mercedes Sprinter' : 'Toyota Coaster',
      year: 2020 + (i % 4),
      driverId: driver.id,
      routeId: isActive ? route.id : null,
      status: isActive ? BusStatus.ACTIVE : BusStatus.INACTIVE,
      maintenanceStatus: BusMaintenanceStatus.OK,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    // Si le bus est actif, créer sa position GPS
    if (isActive) {
      const progress = (i * 0.15) % 1; // Position sur la route (0-100%)
      const position = getRandomPositionOnRoute(route, progress);

      await db.collection('gps_live').doc(busId).set({
        busId,
        position: {
          lat: position.lat,
          lng: position.lng,
          speed: busInfo.speed,
          heading: Math.floor(Math.random() * 360),
          accuracy: 10 + Math.random() * 5,
          timestamp: Date.now(),
        },
        driverId: driver.id,
        routeId: route.id,
        status: busInfo.status,
        passengersCount: busInfo.passengersCount,
        lastUpdate: Timestamp.now(),
      });

      console.log(
        `  ✓ Bus ${busId} - ${route.name} - ${busInfo.status} - ${busInfo.passengersCount} élèves`
      );
    } else {
      console.log(`  ✓ Bus ${busId} - HORS COURSE`);
    }
  }

  console.log(`\n✅ ${drivers.length} bus créés avec positions GPS\n`);
  console.log('🎉 Seeding terminé avec succès !');
  console.log('\nRésumé :');
  console.log(`  - ${drivers.length} conducteurs`);
  console.log(`  - ${routes.length} routes`);
  console.log(`  - ${drivers.length} bus`);
  console.log(
    `  - ${busStatuses.filter((s) => s.passengersCount > 0).length} bus en course`
  );
  console.log(
    `  - ${busStatuses.filter((s) => s.passengersCount === 0).length} bus hors course`
  );
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
