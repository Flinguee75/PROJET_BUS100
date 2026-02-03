/**
 * Tests d'intégration pour les routes Realtime
 * Test des endpoints HTTP complets
 */

import request from 'supertest';
import express from 'express';
import realtimeRoutes from '../../src/routes/realtime.routes';
import { RealtimeService } from '../../src/services/realtime.service';
import { BusStatus } from '../../src/types/bus.types';
import { BusLiveStatus } from '../../src/types/gps.types';

// Setup Express app pour les tests
const app = express();
app.use(express.json());
app.use('/api/realtime', realtimeRoutes);

describe('Realtime Routes Integration Tests', () => {
  const mockGetAll = jest.spyOn(RealtimeService.prototype, 'getAllBusesRealtimeData');
  const mockGetStats = jest.spyOn(RealtimeService.prototype, 'getBusStatistics');

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/realtime/buses', () => {
    it('should return 200 with array of buses', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          number: 'BUS-01',
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
          currentZone: null,
          lastUpdate: new Date().toISOString(),
          isActive: true,
        },
        {
          id: 'bus-2',
          number: 'BUS-02',
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

      mockGetAll.mockResolvedValue(mockBuses);

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

      expect(mockGetAll).toHaveBeenCalledTimes(1);
    });

    it('should return 200 with empty array when no buses exist', async () => {
      mockGetAll.mockResolvedValue([]);

      const response = await request(app).get('/api/realtime/buses').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: [],
        count: 0,
      });
    });

    it('should return 500 on service error', async () => {
      mockGetAll.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app).get('/api/realtime/buses').expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Erreur lors de la récupération des données en temps réel',
        error: 'Database connection failed',
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

      mockGetStats.mockResolvedValue(mockStats);

      const response = await request(app).get('/api/realtime/statistics').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStats,
      });

      expect(mockGetStats).toHaveBeenCalledTimes(1);
    });

    it('should return 500 on service error', async () => {
      mockGetStats.mockRejectedValue(new Error('Stats calculation failed'));

      const response = await request(app).get('/api/realtime/statistics').expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: 'Stats calculation failed',
      });
    });
  });

  describe('GET /api/realtime/buses/:busId', () => {
    it('should return 200 with specific bus data', async () => {
      const mockBus = {
        id: 'bus-1',
        number: 'BUS-01',
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
        driver: null,
        route: null,
        passengersCount: 25,
        currentZone: null,
        lastUpdate: new Date().toISOString(),
        isActive: true,
      };

      mockGetAll.mockResolvedValue([mockBus]);

      const response = await request(app).get('/api/realtime/buses/bus-1').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: expect.objectContaining({
          id: 'bus-1',
          plateNumber: 'CI 1001 AB 11',
          isActive: true,
        }),
      });

      expect(mockGetAll).toHaveBeenCalledTimes(1);
    });

    it('should return 404 when bus not found', async () => {
      mockGetAll.mockResolvedValue([]);

      const response = await request(app).get('/api/realtime/buses/non-existent').expect(404);

      expect(response.body).toEqual({
        success: false,
        message: 'Bus non-existent not found',
      });
    });

    it('should return 500 on service error', async () => {
      mockGetAll.mockRejectedValue(new Error('Database error'));

      const response = await request(app).get('/api/realtime/buses/bus-1').expect(500);

      expect(response.body).toMatchObject({
        success: false,
        message: 'Erreur lors de la récupération des données du bus',
        error: 'Database error',
      });
    });
  });

  describe('Route validation', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/api/realtime/unknown').expect(404);

      expect(response.status).toBe(404);
    });
  });
});
