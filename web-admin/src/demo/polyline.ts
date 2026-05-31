/**
 * Interpolation et orientation le long d'une polyligne (suite de points
 * lat/lng) pour le moteur de simulation du mode démo.
 *
 * On utilise une distance euclidienne en degrés (pas haversine) : pour des
 * trajets de quelques kilomètres autour d'une école, l'écart est invisible et
 * permet d'éviter un calcul trigonométrique à chaque tick.
 */

import type { LatLng } from './seed';

const segmentLength = (a: LatLng, b: LatLng): number => {
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  return Math.hypot(dLat, dLng);
};

const cumulativeLengths = (polyline: LatLng[]): number[] => {
  const lengths: number[] = [0];
  for (let i = 1; i < polyline.length; i++) {
    lengths.push(lengths[i - 1] + segmentLength(polyline[i - 1], polyline[i]));
  }
  return lengths;
};

/**
 * Retourne le point à la fraction `t` ∈ [0, 1] du chemin total.
 */
export const polylineAt = (polyline: LatLng[], t: number): LatLng => {
  if (polyline.length === 0) {
    throw new Error('polylineAt: polyligne vide');
  }
  if (polyline.length === 1) return { ...polyline[0] };

  const clamped = Math.min(1, Math.max(0, t));
  if (clamped === 0) return { ...polyline[0] };
  if (clamped === 1) return { ...polyline[polyline.length - 1] };

  const lengths = cumulativeLengths(polyline);
  const total = lengths[lengths.length - 1];
  const target = total * clamped;

  for (let i = 1; i < polyline.length; i++) {
    if (lengths[i] >= target) {
      const segStart = lengths[i - 1];
      const segLen = lengths[i] - segStart;
      const local = segLen > 0 ? (target - segStart) / segLen : 0;
      const a = polyline[i - 1];
      const b = polyline[i];
      return {
        lat: a.lat + (b.lat - a.lat) * local,
        lng: a.lng + (b.lng - a.lng) * local,
      };
    }
  }
  return { ...polyline[polyline.length - 1] };
};

/**
 * Coupe la polyligne en deux segments au point de fraction `t` ∈ [0, 1].
 * Retourne `traveled` (du début au point de coupure) et `remaining` (du point
 * de coupure à la fin). Les deux partagent le point de coupure interpolé.
 */
export const splitPolylineAt = (
  polyline: LatLng[],
  t: number
): { traveled: LatLng[]; remaining: LatLng[] } => {
  if (polyline.length < 2) return { traveled: [...polyline], remaining: [...polyline] };

  const clamped = Math.min(1, Math.max(0, t));
  if (clamped === 0) return { traveled: [polyline[0]], remaining: [...polyline] };
  if (clamped === 1) return { traveled: [...polyline], remaining: [polyline[polyline.length - 1]] };

  const lengths = cumulativeLengths(polyline);
  const total = lengths[lengths.length - 1];
  const target = total * clamped;

  let splitIndex = polyline.length - 1;
  for (let i = 1; i < polyline.length; i++) {
    if (lengths[i] >= target) {
      splitIndex = i;
      break;
    }
  }

  const segStart = lengths[splitIndex - 1];
  const segLen = lengths[splitIndex] - segStart;
  const local = segLen > 0 ? (target - segStart) / segLen : 0;
  const a = polyline[splitIndex - 1];
  const b = polyline[splitIndex];
  const splitPoint: LatLng = {
    lat: a.lat + (b.lat - a.lat) * local,
    lng: a.lng + (b.lng - a.lng) * local,
  };

  return {
    traveled: [...polyline.slice(0, splitIndex), splitPoint],
    remaining: [splitPoint, ...polyline.slice(splitIndex)],
  };
};

/**
 * Cap (orientation) du marqueur à la fraction `t` du parcours, en degrés
 * (0° = Nord, sens horaire — compatible avec CSS `transform: rotate()`).
 */
export const polylineHeadingAt = (polyline: LatLng[], t: number): number => {
  if (polyline.length < 2) return 0;

  const clamped = Math.min(1, Math.max(0, t));
  const lengths = cumulativeLengths(polyline);
  const total = lengths[lengths.length - 1];
  const target = total * clamped;

  let segIndex = polyline.length - 1;
  for (let i = 1; i < polyline.length; i++) {
    if (lengths[i] >= target) {
      segIndex = i;
      break;
    }
  }

  const a = polyline[segIndex - 1];
  const b = polyline[segIndex];
  const dLat = b.lat - a.lat;
  const dLng = b.lng - a.lng;
  // atan2(dLng, dLat) → 0 = Nord, sens horaire (cf. logique bezierHeading).
  let deg = (Math.atan2(dLng, dLat) * 180) / Math.PI;
  if (deg < 0) deg += 360;
  return deg;
};
