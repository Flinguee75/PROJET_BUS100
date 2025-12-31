import { describe, it, expect, beforeEach } from 'vitest';
import { GpsKalmanFilter } from './gpsKalmanFilter';

describe('GpsKalmanFilter', () => {
  describe('Initialization', () => {
    it('should initialize with starting position', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);
      const result = filter.filter(48.8566, 2.3522, 1);

      expect(result.lat).toBeCloseTo(48.8566, 4);
      expect(result.lng).toBeCloseTo(2.3522, 4);
    });

    it('should initialize with custom noise parameters', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522, 0.05, 50);
      const state = filter.getState();

      expect(state.position.lat).toBe(48.8566);
      expect(state.position.lng).toBe(2.3522);
      expect(state.velocity.vx).toBe(0);
      expect(state.velocity.vy).toBe(0);
    });
  });

  describe('Filtering (Smoothing)', () => {
    let filter: GpsKalmanFilter;

    beforeEach(() => {
      filter = new GpsKalmanFilter(48.8566, 2.3522);
    });

    it('should smooth noisy GPS data', () => {
      // Simuler données GPS bruitées (oscillations)
      const noisyPositions = [
        { lat: 48.8567, lng: 2.3523 },
        { lat: 48.8565, lng: 2.3521 }, // Saut brusque (bruit GPS)
        { lat: 48.8568, lng: 2.3524 },
      ];

      const filtered = noisyPositions.map((pos) =>
        filter.filter(pos.lat, pos.lng, 1)
      );

      // Le filtre devrait lisser les sauts (variation plus faible que le bruit)
      const variation1 = Math.abs(filtered[1].lat - filtered[0].lat);
      const variation2 = Math.abs(filtered[2].lat - filtered[1].lat);

      // Les variations filtrées devraient être petites (< 0.0003 degrés ≈ 33m)
      expect(variation1).toBeLessThan(0.0003);
      expect(variation2).toBeLessThan(0.0003);
    });

    it('should converge to true position over multiple measurements', () => {
      // Simuler 10 mesures GPS à la même position (avec bruit)
      const truePosition = { lat: 48.8570, lng: 2.3530 };
      const measurements = Array.from({ length: 10 }, () => ({
        lat: truePosition.lat + (Math.random() - 0.5) * 0.0001, // ±5m de bruit
        lng: truePosition.lng + (Math.random() - 0.5) * 0.0001,
      }));

      let lastFiltered = { lat: 48.8566, lng: 2.3522 };
      measurements.forEach((measurement) => {
        lastFiltered = filter.filter(measurement.lat, measurement.lng, 1);
      });

      // Après 10 mesures, le filtre devrait converger vers la position vraie
      expect(lastFiltered.lat).toBeCloseTo(truePosition.lat, 3);
      expect(lastFiltered.lng).toBeCloseTo(truePosition.lng, 3);
    });

    it('should handle large time deltas correctly', () => {
      // Première mesure
      const pos1 = filter.filter(48.8566, 2.3522, 1);

      // Deuxième mesure après 10 secondes
      const pos2 = filter.filter(48.8570, 2.3530, 10);

      // La position devrait être mise à jour
      expect(pos2.lat).not.toBe(pos1.lat);
      expect(pos2.lng).not.toBe(pos1.lng);

      // La nouvelle position devrait se rapprocher de la mesure (pas exacte car filtre lisse)
      expect(pos2.lat).toBeCloseTo(48.8570, 2);
      expect(pos2.lng).toBeCloseTo(2.3530, 2);
    });

    it('should estimate velocity from position changes', () => {
      // Première mesure
      filter.filter(48.8566, 2.3522, 1);

      // Deuxième mesure: déplacement de ~45m au nord (0.0004° lat)
      filter.filter(48.8570, 2.3522, 1);

      const state = filter.getState();

      // La vitesse en latitude devrait être positive (vers le nord)
      expect(state.velocity.vx).toBeGreaterThan(0);

      // La vitesse en longitude devrait être proche de 0 (pas de mouvement est-ouest)
      expect(Math.abs(state.velocity.vy)).toBeLessThan(0.0001);
    });
  });

  describe('Reset functionality', () => {
    it('should reset to new position', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);

      // Filtrer quelques positions
      filter.filter(48.8570, 2.3530, 1);
      filter.filter(48.8575, 2.3535, 1);

      // Réinitialiser
      filter.reset(48.8566, 2.3522);

      const state = filter.getState();
      expect(state.position.lat).toBe(48.8566);
      expect(state.position.lng).toBe(2.3522);
      expect(state.velocity.vx).toBe(0);
      expect(state.velocity.vy).toBe(0);
    });

    it('should work correctly after reset', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);

      // Filtrer puis réinitialiser
      filter.filter(48.8570, 2.3530, 1);
      filter.reset(48.8566, 2.3522);

      // Filtrer une nouvelle position
      const result = filter.filter(48.8567, 2.3523, 1);

      // Le filtre lisse, donc pas exactement la mesure brute
      expect(result.lat).toBeCloseTo(48.8567, 3);
      expect(result.lng).toBeCloseTo(2.3523, 3);
    });
  });

  describe('Edge cases', () => {
    it('should handle zero time delta', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);

      // dt = 0 devrait utiliser dt minimum (0.1s) pour éviter division par zéro
      const result = filter.filter(48.8567, 2.3523, 0);

      expect(result.lat).toBeDefined();
      expect(result.lng).toBeDefined();
      expect(Number.isFinite(result.lat)).toBe(true);
      expect(Number.isFinite(result.lng)).toBe(true);
    });

    it('should handle very small time deltas', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);

      // dt très petit (0.01s)
      const result = filter.filter(48.8567, 2.3523, 0.01);

      expect(Number.isFinite(result.lat)).toBe(true);
      expect(Number.isFinite(result.lng)).toBe(true);
    });

    it('should handle same position repeated measurements', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);

      // Mesurer la même position 5 fois
      for (let i = 0; i < 5; i++) {
        const result = filter.filter(48.8566, 2.3522, 1);
        expect(result.lat).toBeCloseTo(48.8566, 4);
        expect(result.lng).toBeCloseTo(2.3522, 4);
      }

      // La vitesse devrait être proche de 0
      const state = filter.getState();
      expect(Math.abs(state.velocity.vx)).toBeLessThan(0.0001);
      expect(Math.abs(state.velocity.vy)).toBeLessThan(0.0001);
    });

    it('should reduce uncertainty over time with consistent measurements', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);

      const initialState = filter.getState();
      const initialUncertainty = initialState.uncertainty;

      // Mesurer plusieurs fois à des positions proches
      for (let i = 0; i < 10; i++) {
        filter.filter(
          48.8566 + (Math.random() - 0.5) * 0.00001,
          2.3522 + (Math.random() - 0.5) * 0.00001,
          1
        );
      }

      const finalState = filter.getState();
      const finalUncertainty = finalState.uncertainty;

      // L'incertitude devrait diminuer avec des mesures cohérentes
      expect(finalUncertainty).toBeLessThan(initialUncertainty);
    });
  });

  describe('Real-world scenarios', () => {
    it('should smooth GPS jitter when bus is stationary', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);

      // Simuler "GPS jitter" quand bus à l'arrêt (oscillations < 5m)
      const stationaryPositions = [
        { lat: 48.8566, lng: 2.3522 },
        { lat: 48.85661, lng: 2.35221 },  // +1m
        { lat: 48.85659, lng: 2.35219 },  // -1m
        { lat: 48.85662, lng: 2.35222 },  // +2m
        { lat: 48.85660, lng: 2.35220 },  // 0m
      ];

      const filtered = stationaryPositions.map((pos) =>
        filter.filter(pos.lat, pos.lng, 1)
      );

      // Vérifier que les positions filtrées sont plus stables
      const maxVariation = Math.max(
        ...filtered.slice(1).map((pos, i) => Math.abs(pos.lat - filtered[i].lat))
      );

      expect(maxVariation).toBeLessThan(0.00002); // < 2m de variation
    });

    it('should track moving bus smoothly', () => {
      const filter = new GpsKalmanFilter(48.8566, 2.3522);

      // Simuler bus se déplaçant à 40 km/h vers le nord (~11 m/s)
      // 11 m/s ≈ 0.0001° latitude/seconde
      const speed = 0.0001; // degrés/seconde
      const positions = Array.from({ length: 10 }, (_, i) => ({
        lat: 48.8566 + i * speed,
        lng: 2.3522,
        dt: 1, // 1 seconde entre mesures
      }));

      const filtered = positions.map((pos) => filter.filter(pos.lat, pos.lng, pos.dt));

      // Vérifier que le mouvement est lisse (pas de retours en arrière)
      for (let i = 1; i < filtered.length; i++) {
        expect(filtered[i].lat).toBeGreaterThanOrEqual(filtered[i - 1].lat);
      }

      // Vérifier que la vitesse est estimée correctement (dans le bon ordre de grandeur)
      const state = filter.getState();
      expect(state.velocity.vx).toBeGreaterThan(0);
      // La vitesse converge progressivement, donc tolérance plus large
      expect(state.velocity.vx).toBeGreaterThan(speed * 0.1); // Au moins 10% de la vitesse réelle
    });
  });
});
