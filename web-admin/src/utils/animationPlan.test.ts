/**
 * Tests de la fonction pure `computeAnimationPlan`.
 *
 * Cette fonction décide, à chaque mise à jour de position côté carte:
 *   - quelle position finale interpoler vers
 *   - sur quelle durée
 *
 * Mode démo: pipeline court (cible brute, durée alignée sur le tick simulé).
 * Mode réel: Kalman + extrapolation conditionnelle, durée calibrée Firestore.
 */

import { describe, it, expect, vi } from 'vitest';
import { computeAnimationPlan } from './animationPlan';
import { GpsKalmanFilter } from './gpsKalmanFilter';
import { DEMO_TICK_MS } from '@/demo/config';

const RAW = { lat: 5.36, lng: -3.95 };

describe('computeAnimationPlan', () => {
  describe('mode démo', () => {
    it('retourne la position cible brute sans filtrage', () => {
      const plan = computeAnimationPlan({
        raw: RAW,
        previousTimestamp: 1_000,
        currentTimestamp: 1_250,
        bus: { currentPosition: { speed: 12, heading: 90 } },
        kalmanFilter: null,
        isDemo: true,
      });

      expect(plan.target.lat).toBe(RAW.lat);
      expect(plan.target.lng).toBe(RAW.lng);
    });

    it('utilise une durée d’animation alignée sur le tick démo', () => {
      const plan = computeAnimationPlan({
        raw: RAW,
        previousTimestamp: null,
        currentTimestamp: null,
        bus: { currentPosition: null },
        kalmanFilter: null,
        isDemo: true,
      });

      // Tolérance: la durée doit être courte (< 600ms) pour rester perceptible
      // comme un mouvement continu sans dépasser le prochain tick simulé.
      expect(plan.durationMs).toBeLessThanOrEqual(DEMO_TICK_MS * 2);
      expect(plan.durationMs).toBeGreaterThan(0);
    });

    it('n’appelle pas le filtre Kalman même s’il est fourni', () => {
      const kalman = new GpsKalmanFilter(0, 0);
      const spy = vi.spyOn(kalman, 'filter');

      computeAnimationPlan({
        raw: RAW,
        previousTimestamp: 1_000,
        currentTimestamp: 1_250,
        bus: { currentPosition: { speed: 12, heading: 90 } },
        kalmanFilter: kalman,
        isDemo: true,
      });

      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('mode réel', () => {
    it('applique le filtre Kalman à la position brute', () => {
      const kalman = new GpsKalmanFilter(5.0, -4.0);
      const spy = vi.spyOn(kalman, 'filter');

      computeAnimationPlan({
        raw: RAW,
        previousTimestamp: 0,
        currentTimestamp: 1_000,
        bus: { currentPosition: null },
        kalmanFilter: kalman,
        isDemo: false,
      });

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('utilise une durée calibrée pour la latence Firestore (≥ 600 ms)', () => {
      const kalman = new GpsKalmanFilter(5.0, -4.0);

      const plan = computeAnimationPlan({
        raw: RAW,
        previousTimestamp: 0,
        currentTimestamp: 1_000,
        bus: { currentPosition: null },
        kalmanFilter: kalman,
        isDemo: false,
      });

      expect(plan.durationMs).toBeGreaterThanOrEqual(600);
      expect(plan.durationMs).toBeLessThanOrEqual(15_000);
    });

    it('extrapole quand dt > 3s et vitesse perceptible (> 5 km/h)', () => {
      const kalman = new GpsKalmanFilter(RAW.lat, RAW.lng);

      const plan = computeAnimationPlan({
        raw: RAW,
        previousTimestamp: 0,
        currentTimestamp: 5_000,
        bus: { currentPosition: { speed: 10, heading: 0 } },
        kalmanFilter: kalman,
        isDemo: false,
      });

      // Avec speed=10 m/s pendant ≥5s vers le nord, la cible extrapolée doit
      // être au moins ~10 m plus au nord que la position brute filtrée.
      expect(plan.target.lat).toBeGreaterThan(RAW.lat);
      expect(plan.durationMs).toBeGreaterThanOrEqual(5_000);
    });
  });
});
