/**
 * Décide, à chaque mise à jour de position côté carte, vers quelle position
 * interpoler le marqueur et sur quelle durée.
 *
 * Mode démo : le moteur émet déjà des positions propres à cadence rapide.
 * On animate directement vers la position brute sur une durée ≈ tick simulé.
 *
 * Mode réel : les positions arrivent via Firestore avec latence variable
 * (5-10 s). On filtre via Kalman pour lisser le bruit GPS, et on extrapole
 * dans le futur quand la vitesse et le delta-temps le permettent — l'idée
 * étant de masquer la latence en montrant le bus là où il sera bientôt.
 */

import { GpsKalmanFilter } from './gpsKalmanFilter';
import { DEMO_TICK_MS } from '@/demo/config';

export interface AnimationPlanInput {
  raw: { lat: number; lng: number };
  previousTimestamp: number | null;
  currentTimestamp: number | null;
  bus: {
    currentPosition?: { speed?: number; heading?: number } | null;
  };
  kalmanFilter: GpsKalmanFilter | null;
  isDemo: boolean;
}

export interface AnimationPlan {
  target: { lat: number; lng: number };
  durationMs: number;
}

const FIRESTORE_AVG_LATENCY_MS = 8_000;
const MIN_DURATION_MS = 600;
const MAX_DURATION_MS = 15_000;
const MAX_DURATION_NO_EXTRAPOLATION_MS = 10_000;
const EXTRAPOLATION_MIN_DT_S = 3;
const EXTRAPOLATION_MIN_SPEED_KMH = 5;
const EXTRAPOLATION_MAX_HORIZON_S = 10;

function extrapolate(
  from: { lat: number; lng: number },
  speed: number,
  heading: number,
  seconds: number
): { lat: number; lng: number } {
  if (speed < 1) return { ...from };
  const distanceMeters = speed * seconds;
  const headingRad = (heading * Math.PI) / 180;
  const deltaLat = (distanceMeters * Math.cos(headingRad)) / 111_320;
  const deltaLng =
    (distanceMeters * Math.sin(headingRad)) /
    (111_320 * Math.cos((from.lat * Math.PI) / 180));
  return { lat: from.lat + deltaLat, lng: from.lng + deltaLng };
}

export function computeAnimationPlan(input: AnimationPlanInput): AnimationPlan {
  if (input.isDemo) {
    return {
      target: { lat: input.raw.lat, lng: input.raw.lng },
      durationMs: DEMO_TICK_MS,
    };
  }

  let dt = 1;
  if (
    input.previousTimestamp != null &&
    input.currentTimestamp != null &&
    input.currentTimestamp > input.previousTimestamp
  ) {
    dt = (input.currentTimestamp - input.previousTimestamp) / 1000;
  }

  const filtered = input.kalmanFilter
    ? input.kalmanFilter.filter(input.raw.lat, input.raw.lng, dt)
    : input.raw;

  const speed = input.bus.currentPosition?.speed ?? 0;
  const heading = input.bus.currentPosition?.heading ?? 0;
  const canExtrapolate =
    dt > EXTRAPOLATION_MIN_DT_S && speed * 3.6 > EXTRAPOLATION_MIN_SPEED_KMH;

  if (canExtrapolate) {
    const horizonSeconds = Math.min(dt, EXTRAPOLATION_MAX_HORIZON_S);
    return {
      target: extrapolate(filtered, speed, heading, horizonSeconds),
      durationMs: Math.min(
        Math.max(dt * 1000 * 1.2, FIRESTORE_AVG_LATENCY_MS / 1.6),
        MAX_DURATION_MS
      ),
    };
  }

  return {
    target: { lat: filtered.lat, lng: filtered.lng },
    durationMs: Math.min(
      Math.max(dt * 1000, MIN_DURATION_MS),
      MAX_DURATION_NO_EXTRAPOLATION_MS
    ),
  };
}
