/**
 * Tests d'intégration pour GPS Routes
 * Test des endpoints API avec Express et supertest
 */

import request from 'supertest';
import express, { Express } from 'express';
import gpsRoutes from '../../src/routes/gps.routes';
import gpsService from '../../src/services/gps.service';
import { BusLiveStatus } from '../../src/types';

// Mock GPS Service
jest.mock('../../src/services/gps.service');

describe('GPS Routes Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/gps', gpsRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/gps/update', () => {
    it('should update GPS position successfully', async () => {
      const gpsData = {
        busId: 'bus-001',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        heading: 180,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const mockResult = {
        busId: 'bus-001',
        position: {
          lat: 48.8566,
          lng: 2.3522,
          speed: 50,
          heading: 180,
          accuracy: 10,
          timestamp: gpsData.timestamp,
        },
        status: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-123',
        routeId: 'route-456',
        passengersCount: 0,
        lastUpdate: new Date(),
      };

      (gpsService.updateGPSPosition as jest.Mock).mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/gps/update')
        .send(gpsData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Position GPS mise à jour',
        data: expect.objectContaining({
          busId: 'bus-001',
          status: BusLiveStatus.EN_ROUTE,
        }),
      });
    });

    it('should return 422 for invalid data', async () => {
      const invalidData = {
        busId: 'bus-001',
        lat: 95, // Invalid latitude
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      const response = await request(app)
        .post('/api/gps/update')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when bus not found', async () => {
      const gpsData = {
        busId: 'non-existent-bus',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      (gpsService.updateGPSPosition as jest.Mock).mockRejectedValue(
        new Error('Bus non-existent-bus not found')
      );

      const response = await request(app)
        .post('/api/gps/update')
        .send(gpsData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bus non-existent-bus not found');
    });
  });

  describe('GET /api/gps/live/:busId', () => {
    it('should return live position for existing bus', async () => {
      const mockPosition = {
        busId: 'bus-001',
        position: {
          lat: 48.8566,
          lng: 2.3522,
          speed: 50,
          timestamp: Date.now(),
        },
        status: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-123',
        routeId: 'route-456',
        passengersCount: 0,
        lastUpdate: new Date(),
      };

      (gpsService.getLivePosition as jest.Mock).mockResolvedValue(mockPosition);

      const response = await request(app)
        .get('/api/gps/live/bus-001')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          busId: 'bus-001',
        }),
      });
    });

    it('should return 404 when position not found', async () => {
      (gpsService.getLivePosition as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/gps/live/non-existent-bus')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('introuvable');
    });
  });

  describe('GET /api/gps/live', () => {
    it('should return all live positions', async () => {
      const mockPositions = [
        {
          busId: 'bus-001',
          position: { lat: 48.8566, lng: 2.3522, speed: 50, timestamp: Date.now() },
          status: BusLiveStatus.EN_ROUTE,
          driverId: 'driver-123',
          routeId: 'route-456',
          passengersCount: 0,
          lastUpdate: new Date(),
        },
        {
          busId: 'bus-002',
          position: { lat: 45.764, lng: 4.8357, speed: 30, timestamp: Date.now() },
          status: BusLiveStatus.EN_ROUTE,
          driverId: 'driver-456',
          routeId: 'route-789',
          passengersCount: 0,
          lastUpdate: new Date(),
        },
      ];

      (gpsService.getAllLivePositions as jest.Mock).mockResolvedValue(
        mockPositions
      );

      const response = await request(app).get('/api/gps/live').expect(200);

      expect(response.body).toEqual({
        success: true,
        count: 2,
        data: expect.arrayContaining([
          expect.objectContaining({ busId: 'bus-001' }),
          expect.objectContaining({ busId: 'bus-002' }),
        ]),
      });
    });

    it('should return empty array when no positions exist', async () => {
      (gpsService.getAllLivePositions as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/gps/live').expect(200);

      expect(response.body).toEqual({
        success: true,
        count: 0,
        data: [],
      });
    });
  });

  describe('GET /api/gps/history/:busId', () => {
    it('should return history for specific date', async () => {
      const mockHistory = [
        {
          busId: 'bus-001',
          position: { lat: 48.8566, lng: 2.3522, speed: 50, timestamp: Date.now() },
          timestamp: new Date('2024-01-15T10:00:00Z'),
        },
        {
          busId: 'bus-001',
          position: { lat: 48.8600, lng: 2.3550, speed: 55, timestamp: Date.now() },
          timestamp: new Date('2024-01-15T10:05:00Z'),
        },
      ];

      (gpsService.getHistoryForDay as jest.Mock).mockResolvedValue(mockHistory);

      const response = await request(app)
        .get('/api/gps/history/bus-001?date=2024-01-15')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        busId: 'bus-001',
        date: '2024-01-15',
        count: 2,
        data: expect.any(Array),
      });
    });

    it('should use today as default date', async () => {
      (gpsService.getHistoryForDay as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/gps/history/bus-001')
        .expect(200);

      const today = new Date().toISOString().split('T')[0];

      expect(response.body).toEqual({
        success: true,
        busId: 'bus-001',
        date: today,
        count: 0,
        data: [],
      });
    });
  });

  describe('POST /api/gps/calculate-eta', () => {
    it('should calculate ETA successfully', async () => {
      const etaData = {
        currentLat: 48.8566,
        currentLng: 2.3522,
        destLat: 48.8600,
        destLng: 2.3550,
        currentSpeed: 50,
      };

      (gpsService.calculateETA as jest.Mock).mockReturnValue(15);

      const response = await request(app)
        .post('/api/gps/calculate-eta')
        .send(etaData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          etaMinutes: 15,
          etaText: '15 minutes',
        },
      });
    });

    it('should handle speed = 0 case', async () => {
      const etaData = {
        currentLat: 48.8566,
        currentLng: 2.3522,
        destLat: 48.8600,
        destLng: 2.3550,
        currentSpeed: 0,
      };

      (gpsService.calculateETA as jest.Mock).mockReturnValue(-1);

      const response = await request(app)
        .post('/api/gps/calculate-eta')
        .send(etaData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          etaMinutes: -1,
          etaText: 'Impossible de calculer (vitesse = 0)',
        },
      });
    });

    it('should return 400 for missing parameters', async () => {
      const invalidData = {
        currentLat: 48.8566,
        // Missing other parameters
      };

      const response = await request(app)
        .post('/api/gps/calculate-eta')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Tous les paramètres sont requis');
    });
  });

  describe('Route coverage', () => {
    it('should handle all defined routes', async () => {
      // This test ensures all routes are properly registered
      const routes = [
        { method: 'post', path: '/api/gps/update' },
        { method: 'get', path: '/api/gps/live/test-bus' },
        { method: 'get', path: '/api/gps/live' },
        { method: 'get', path: '/api/gps/history/test-bus' },
        { method: 'post', path: '/api/gps/calculate-eta' },
      ];

      // Mock all service methods to prevent errors
      (gpsService.updateGPSPosition as jest.Mock).mockResolvedValue({});
      (gpsService.getLivePosition as jest.Mock).mockResolvedValue({});
      (gpsService.getAllLivePositions as jest.Mock).mockResolvedValue([]);
      (gpsService.getHistoryForDay as jest.Mock).mockResolvedValue([]);
      (gpsService.calculateETA as jest.Mock).mockReturnValue(10);

      for (const route of routes) {
        let req = request(app)[route.method as 'get' | 'post'](route.path);

        if (route.method === 'post') {
          req = req.send({
            busId: 'test',
            lat: 48.8566,
            lng: 2.3522,
            speed: 50,
            timestamp: Date.now(),
            currentLat: 48.8566,
            currentLng: 2.3522,
            destLat: 48.8600,
            destLng: 2.3550,
            currentSpeed: 50,
          });
        }

        const response = await req;

        // Should not return 404 (route not found)
        expect(response.status).not.toBe(404);
      }
    });
  });
});
