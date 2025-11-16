/**
 * Tests unitaires pour GPS Service
 * Test de la logique métier du tracking GPS
 */

import { GPSService } from '../../src/services/gps.service';

describe('GPSService', () => {
  let gpsService: GPSService;

  beforeEach(() => {
    gpsService = new GPSService();
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two GPS points correctly', () => {
      // Paris (48.8566, 2.3522) to Lyon (45.7640, 4.8357)
      const distance = gpsService.calculateDistance(
        48.8566,
        2.3522,
        45.764,
        4.8357
      );

      // Distance réelle ≈ 392 km
      expect(distance).toBeGreaterThan(390);
      expect(distance).toBeLessThan(400);
    });

    it('should return 0 for same coordinates', () => {
      const distance = gpsService.calculateDistance(
        48.8566,
        2.3522,
        48.8566,
        2.3522
      );

      expect(distance).toBe(0);
    });

    it('should handle negative coordinates', () => {
      const distance = gpsService.calculateDistance(-33.8688, 151.2093, 40.7128, -74.006);

      // Sydney to New York ≈ 16000 km
      expect(distance).toBeGreaterThan(15000);
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA correctly for normal speed', () => {
      // Distance 50km, vitesse 100km/h = 30 minutes
      const eta = gpsService.calculateETA(48.8566, 2.3522, 48.5, 2.3, 100);

      expect(eta).toBeGreaterThan(20);
      expect(eta).toBeLessThan(40);
    });

    it('should return -1 when speed is 0', () => {
      const eta = gpsService.calculateETA(48.8566, 2.3522, 48.5, 2.3, 0);

      expect(eta).toBe(-1);
    });

    it('should handle slow speeds', () => {
      // Distance courte, vitesse lente
      const eta = gpsService.calculateETA(48.8566, 2.3522, 48.86, 2.36, 5);

      expect(eta).toBeGreaterThan(0);
    });
  });

  describe('determineBusStatus', () => {
    it('should return STOPPED when speed is 0', () => {
      const service = new GPSService();
      // @ts-ignore - accessing private method for testing
      const status = service.determineBusStatus(0);

      expect(status).toBe('stopped');
    });

    it('should return IDLE when speed is between 0 and 5', () => {
      const service = new GPSService();
      // @ts-ignore - accessing private method for testing
      const status = service.determineBusStatus(3);

      expect(status).toBe('idle');
    });

    it('should return EN_ROUTE when speed is above 5', () => {
      const service = new GPSService();
      // @ts-ignore - accessing private method for testing
      const status = service.determineBusStatus(50);

      expect(status).toBe('en_route');
    });
  });
});
