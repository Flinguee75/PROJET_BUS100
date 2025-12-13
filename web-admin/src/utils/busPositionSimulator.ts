/**
 * Utilitaires pour simuler les positions GPS des bus
 * Génère des positions dans les quartiers proches de l'école
 */

// Quartiers proches d'Abidjan - Coordonnées réalistes autour de l'école Grain de Soleil
// Points de départ des bus (ils se dirigent vers l'école)
const NEARBY_NEIGHBORHOODS = [
  { name: 'Riviera-Bonoumin', lat: 5.362691, lng: -3.973329 },
  { name: 'Riviera-Palmeraie', lat: 5.368859, lng: -3.956818 },
  { name: 'Akouédo-Village', lat: 5.351122, lng: -3.942706 },
  { name: 'M-Pouto', lat: 5.326388, lng: -3.955677 },
  { name: 'Riviera-2', lat: 5.344162, lng: -3.978827 },
];

// Position de l'école (destination finale)
const SCHOOL_LOCATION = { lat: 5.351824, lng: -3.953979 };

/**
 * Génère une position aléatoire dans un cercle autour d'un point central
 * @param center Point central (lat, lng)
 * @param radiusMeters Rayon en mètres
 * @returns Position avec décalage aléatoire
 */
export const generateOffsetPosition = (
  center: { lat: number; lng: number },
  radiusMeters: number
): { lat: number; lng: number } => {
  // Convertir le rayon en degrés (approximation)
  // 1 degré de latitude ≈ 111 km
  const radiusDegrees = radiusMeters / 111000;

  // Générer un angle aléatoire et une distance aléatoire
  const angle = Math.random() * 2 * Math.PI;
  const distance = Math.random() * radiusDegrees;

  // Calculer le décalage en latitude et longitude
  const latOffset = distance * Math.cos(angle);
  const lngOffset = distance * Math.sin(angle) / Math.cos(center.lat * Math.PI / 180);

  return {
    lat: center.lat + latOffset,
    lng: center.lng + lngOffset,
  };
};

/**
 * Simule une trajectoire de bus partant d'un quartier et se dirigeant vers l'école
 * Le bus progresse graduellement du quartier de départ vers l'école
 * @param schoolLocation Position de l'école (destination finale)
 * @param busId ID du bus (pour déterminer le quartier de départ de façon déterministe)
 * @param progress Progression de la trajectoire (0 = quartier, 1 = école)
 * @returns Position le long de la trajectoire quartier → école
 */
export const simulateBusTrajectoryToSchool = (
  schoolLocation: { lat: number; lng: number },
  busId: string,
  progress: number // 0 = départ quartier, 1 = arrivée école
): { lat: number; lng: number } => {
  // Utiliser busId pour sélectionner un quartier de départ de façon déterministe
  const seed = busId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const neighborhoodIndex = seed % NEARBY_NEIGHBORHOODS.length;
  const departure = NEARBY_NEIGHBORHOODS[neighborhoodIndex] || NEARBY_NEIGHBORHOODS[0]!;

  // Position de départ : ajouter un léger décalage aléatoire basé sur le seed
  const random = (seed % 1000) / 1000;
  const departureOffsetLat = (random - 0.5) * 0.005; // ~500m de variation
  const departureOffsetLng = ((seed * 7) % 1000 / 1000 - 0.5) * 0.005;
  
  const departurePos = {
    lat: departure.lat + departureOffsetLat,
    lng: departure.lng + departureOffsetLng,
  };

  // Interpolation linéaire entre le quartier de départ et l'école
  // progress = 0 → position au quartier
  // progress = 1 → position à l'école
  const clampedProgress = Math.max(0, Math.min(1, progress));
  
  const lat = departurePos.lat + (schoolLocation.lat - departurePos.lat) * clampedProgress;
  const lng = departurePos.lng + (schoolLocation.lng - departurePos.lng) * clampedProgress;

  // Ajouter une légère courbe pour simuler les routes (pas une ligne droite)
  // La courbe est maximale au milieu du trajet (progress = 0.5)
  const curveIntensity = Math.sin(clampedProgress * Math.PI) * 0.002;
  const curveDirection = ((seed * 3) % 2 === 0 ? 1 : -1); // Direction de la courbe basée sur le bus

  return {
    lat: lat + curveIntensity * curveDirection,
    lng: lng + curveIntensity * curveDirection * 0.5,
  };
};

/**
 * Simule une position GPS pour un bus en mouvement dans les quartiers proches
 * @deprecated Utiliser simulateBusTrajectoryToSchool à la place
 * @param schoolLocation Position de l'école
 * @param busId ID du bus (pour générer une position déterministe mais variée)
 * @param isMoving Si le bus est en mouvement
 * @returns Position simulée ou null si le bus n'est pas en mouvement
 */
export const simulateBusPosition = (
  schoolLocation: { lat: number; lng: number },
  busId: string,
  isMoving: boolean
): { lat: number; lng: number } | null => {
  if (!isMoving) {
    return null;
  }

  // Utiliser busId pour générer une position déterministe mais variée
  // Convertir busId en nombre pour la seed
  const seed = busId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed % 1000) / 1000;

  // Sélectionner un quartier proche basé sur le seed
  const neighborhoodIndex = Math.floor(random * NEARBY_NEIGHBORHOODS.length);
  const neighborhood = NEARBY_NEIGHBORHOODS[neighborhoodIndex] || NEARBY_NEIGHBORHOODS[0]!;

  // Générer une position dans un rayon de 500m à 2km autour du quartier
  const minRadius = 500; // 500m
  const maxRadius = 2000; // 2km
  const baseRadius = minRadius + (random * (maxRadius - minRadius));

  // Ajouter une variation temporelle pour simuler le mouvement
  // Utiliser busId pour créer une variation unique par bus
  const timeVariation = (Date.now() / 10000 + seed) % 1; // Variation basée sur le temps + seed
  const angleVariation = (Date.now() / 15000 + seed * 0.7) % (2 * Math.PI); // Variation d'angle
  
  // Variation du rayon (±200m) et de l'angle pour créer un mouvement circulaire
  const radiusVariation = Math.sin(timeVariation * Math.PI * 2) * 200;
  const finalRadius = baseRadius + radiusVariation;

  // Générer position avec angle variable
  const radiusDegrees = finalRadius / 111000;
  const latOffset = radiusDegrees * Math.cos(angleVariation);
  const lngOffset = radiusDegrees * Math.sin(angleVariation) / Math.cos(neighborhood.lat * Math.PI / 180);

  return {
    lat: neighborhood.lat + latOffset,
    lng: neighborhood.lng + lngOffset,
  };
};

/**
 * Génère une position pour un bus stationné à l'école avec décalage
 * @param schoolLocation Position de l'école
 * @param busId ID du bus (pour position déterministe)
 * @returns Position avec décalage autour de l'école
 */
export const generateStationedPosition = (
  schoolLocation: { lat: number; lng: number },
  busId: string
): { lat: number; lng: number } => {
  // Utiliser busId pour générer une position déterministe
  const seed = busId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const random = (seed % 1000) / 1000;

  // Décalage entre 30m et 80m autour de l'école
  const radius = 30 + (random * 50);

  return generateOffsetPosition(schoolLocation, radius);
};

