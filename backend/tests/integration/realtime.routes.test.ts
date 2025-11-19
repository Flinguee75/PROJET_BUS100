/**
 * Tests d'intégration pour les routes Realtime
 * Test des endpoints HTTP complets
 */

import request from 'supertest';
import express from 'express';
import realtimeRoutes from '../../src/routes/realtime.routes';
import realtimeService from '../../src/services/realtime.service';
import { BusStatus } from '../../src/types/bus.types';
import { BusLiveStatus } from '../../src/types/gps.types';

// Mock du service
jest.mock('../../src/services/realtime.service');

// Setup Express app pour les tests
const app = express();
app.use(express.json());
app.use('/api/realtime', realtimeRoutes);

describe('Realtime Routes Integration Tests', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/realtime/buses', () => {
    it('should return 200 with array of buses', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          plateNumber: 'CI 1001 AB 11',
          capacity: 35,
          model: 'Mercedes Sprinter',
          year: 2021,
          status: BusStatus.ACTIVE,
          currentPosition: {
            lat: 5.3473,
            lng: -3.9875,
            speed: 35,
            heading: 90,
            accuracy: 10,
            timestamp: Date.now(),
          },
          liveStatus: BusLiveStatus.EN_ROUTE,
          driver: {
            id: 'driver-1',
            name: 'Kouassi Jean',
            phone: '+225 07 12 34 56 78',
          },
          route: {
            id: 'route-1',
            name: 'Cocody → Plateau',
            fromZone: 'Cocody',
            toZone: 'Plateau',
          },
          passengersCount: 25,
          currentZone: 'Cocody',
          lastUpdate: new Date(),
          isActive: true,
        },
        {
          id: 'bus-2',
          plateNumber: 'CI 1002 AB 12',
          capacity: 35,
          model: 'Toyota Coaster',
          year: 2022,
          status: BusStatus.INACTIVE,
          currentPosition: null,
          liveStatus: null,
          driver: null,
          route: null,
          passengersCount: 0,
          currentZone: null,
          lastUpdate: null,
          isActive: false,
        },
      ];

      (realtimeService.getAllBusesRealtime as jest.Mock).mockResolvedValue(mockBuses);

      const response = await request(app).get('/api/realtime/buses').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.arrayContaining([
          expect.objectContaining({
            id: 'bus-1',
            isActive: true,
            passengersCount: 25,
          }),
          expect.objectContaining({
            id: 'bus-2',
            isActive: false,
            passengersCount: 0,
          }),
        ]),
        count: 2,
      });

      expect(realtimeService.getAllBusesRealtime).toHaveBeenCalledTimes(1);
    });

    it('should return 200 with empty array when no buses exist', async () => {
      (realtimeService.getAllBusesRealtime as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/realtime/buses').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0,
      });
    });

    it('should return 500 on service error', async () => {
      (realtimeService.getAllBusesRealtime as jest.Mock).mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app).get('/api/realtime/buses').expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch realtime bus data',
      });
    });
  });

  describe('GET /api/realtime/statistics', () => {
    it('should return 200 with bus statistics', async () => {
      const mockStats = {
        total: 8,
        active: 6,
        inactive: 2,
        enRoute: 5,
        stopped: 1,
        totalPassengers: 150,
      };

      (realtimeService.getBusStatistics as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app).get('/api/realtime/statistics').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats,
      });

      expect(realtimeService.getBusStatistics).toHaveBeenCalledTimes(1);
    });

    it('should return 500 on service error', async () => {
      (realtimeService.getBusStatistics as jest.Mock).mockRejectedValue(
        new Error('Stats calculation failed')
      );

      const response = await request(app).get('/api/realtime/statistics').expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch bus statistics',
      });
    });
  });

  describe('GET /api/realtime/buses/:busId', () => {
    it('should return 200 with specific bus data', async () => {
      const mockBus = {
        id: 'bus-1',
        plateNumber: 'CI 1001 AB 11',
        capacity: 35,
        model: 'Mercedes Sprinter',
        year: 2021,
        status: BusStatus.ACTIVE,
        currentPosition: {
          lat: 5.3473,
          lng: -3.9875,
          speed: 35,
          heading: 90,
          accuracy: 10,
          timestamp: Date.now(),
        },
        liveStatus: BusLiveStatus.EN_ROUTE,
        driver: {
          id: 'driver-1',
          name: 'Kouassi Jean',
          phone: '+225 07 12 34 56 78',
        },
        route: {
          id: 'route-1',
          name: 'Cocody → Plateau',
          fromZone: 'Cocody',
          toZone: 'Plateau',
        },
        passengersCount: 25,
        currentZone: 'Cocody',
        lastUpdate: new Date(),
        isActive: true,
      };

      (realtimeService.getBusRealtime as jest.Mock).mockResolvedValue(mockBus);

      const response = await request(app).get('/api/realtime/buses/bus-1').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'bus-1',
          plateNumber: 'CI 1001 AB 11',
          isActive: true,
        }),
      });

      expect(realtimeService.getBusRealtime).toHaveBeenCalledWith('bus-1');
    });

    it('should return 404 when bus not found', async () => {
      (realtimeService.getBusRealtime as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/realtime/buses/non-existent').expect(404);

      expect(response.body).toEqual({
        success: false,
        error: 'Bus with ID non-existent not found',
      });
    });

    it('should return 500 on service error', async () => {
      (realtimeService.getBusRealtime as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app).get('/api/realtime/buses/bus-1').expect(500);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Failed to fetch realtime bus data',
      });
    });
  });

  describe('Route validation', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/realtime/unknown').expect(404);

      // Express default 404 handling
      expect(response.status).toBe(404);
    });
  });
});
