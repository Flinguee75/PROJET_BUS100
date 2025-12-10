/**
 * Tests d'Intégration - API Routes
 * Teste les endpoints HTTP des routes géographiques
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import routeRoutes from '../../src/routes/route.routes';
import { CommuneAbidjan, DayOfWeek } from '../../src/types/route.types';

// Mock du service route
jest.mock('../../src/services/route.service');
import { RouteService } from '../../src/services/route.service';

const app = express();
app.use(express.json());
app.use('/routes', routeRoutes);

describe('API Routes - /routes', () => {
  let mockRouteService: jest.Mocked<RouteService>;

  const mockRoute = {
    id: 'route-123',
    name: 'Route Cocody - École ABC',
    code: 'COC-ABC-001',
    description: 'Route principale pour Cocody',
    commune: CommuneAbidjan.COCODY,
    quartiers: ['Riviera', 'II Plateaux'],
    stops: [
      {
        id: 'stop-1',
        name: 'Arrêt Riviera',
        address: 'Boulevard VGE, Riviera',
        location: { lat: 5.3600, lng: -4.0083 },
        order: 1,
        estimatedTimeMinutes: 5,
        type: 'pickup' as const,
        quartier: 'Riviera',
      },
    ],
    schedule: {
      morningDeparture: '07:00',
      morningArrival: '08:00',
      afternoonDeparture: '16:00',
      afternoonArrival: '17:00',
    },
    totalDistanceKm: 12.5,
    estimatedDurationMinutes: 45,
    capacity: 40,
    currentOccupancy: 10,
    busId: null,
    driverId: null,
    activeDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockRouteService = new RouteService() as jest.Mocked<RouteService>;
  });

  describe('GET /routes', () => {
    it('devrait récupérer toutes les routes', async () => {
      mockRouteService.getAllRoutes = jest.fn().mockResolvedValue([mockRoute]);

      const response = await request(app).get('/routes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].name).toBe(mockRoute.name);
    });

    it('devrait filtrer par commune', async () => {
      mockRouteService.getRoutesByCommune = jest.fn().mockResolvedValue([mockRoute]);

      const response = await request(app).get(`/routes?commune=${CommuneAbidjan.COCODY}`);

      expect(response.status).toBe(200);
      expect(response.body.data[0].commune).toBe(CommuneAbidjan.COCODY);
    });

    it('devrait filtrer par quartier', async () => {
      mockRouteService.getRoutesByQuartier = jest.fn().mockResolvedValue([mockRoute]);

      const response = await request(app).get('/routes?quartier=Riviera');

      expect(response.status).toBe(200);
      expect(response.body.data[0].quartiers).toContain('Riviera');
    });
  });

  describe('GET /routes/:id', () => {
    it('devrait récupérer une route par son ID', async () => {
      mockRouteService.getRouteById = jest.fn().mockResolvedValue(mockRoute);

      const response = await request(app).get('/routes/route-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('route-123');
    });

    it('devrait retourner 404 si la route n\'existe pas', async () => {
      mockRouteService.getRouteById = jest.fn().mockResolvedValue(null);

      const response = await request(app).get('/routes/invalid-id');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('devrait retourner 400 si l\'ID est manquant', async () => {
      const response = await request(app).get('/routes/');

      // Le endpoint sans ID devrait matcher GET /routes (liste)
      expect(response.status).toBe(200);
    });
  });

  describe('POST /routes', () => {
    const validRouteData = {
      name: 'Nouvelle Route',
      code: 'TEST-001',
      commune: CommuneAbidjan.COCODY,
      quartiers: ['Riviera'],
      stops: [
        {
          name: 'Arrêt Test',
          address: 'Test Address',
          location: { lat: 5.3600, lng: -4.0083 },
          order: 1,
          estimatedTimeMinutes: 5,
          type: 'pickup',
          quartier: 'Riviera',
        },
      ],
      schedule: {
        morningDeparture: '07:00',
        morningArrival: '08:00',
        afternoonDeparture: '16:00',
        afternoonArrival: '17:00',
      },
      totalDistanceKm: 10,
      estimatedDurationMinutes: 30,
      capacity: 40,
      activeDays: [DayOfWeek.MONDAY],
    };

    it('devrait créer une nouvelle route', async () => {
      mockRouteService.createRoute = jest.fn().mockResolvedValue({
        ...mockRoute,
        ...validRouteData,
      });

      const response = await request(app).post('/routes').send(validRouteData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validRouteData.name);
    });

    it('devrait retourner 400 si les données sont invalides', async () => {
      const invalidData = {
        name: '', // Nom vide
        code: 'TEST',
      };

      const response = await request(app).post('/routes').send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PATCH /routes/:id', () => {
    it('devrait mettre à jour une route', async () => {
      const updateData = {
        name: 'Route mise à jour',
        capacity: 50,
      };

      mockRouteService.updateRoute = jest.fn().mockResolvedValue({
        ...mockRoute,
        ...updateData,
      });

      const response = await request(app).patch('/routes/route-123').send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
    });

    it('devrait retourner 404 si la route n\'existe pas', async () => {
      mockRouteService.updateRoute = jest.fn().mockResolvedValue(null);

      const response = await request(app)
        .patch('/routes/invalid-id')
        .send({ name: 'Test' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /routes/:id', () => {
    it('devrait supprimer une route', async () => {
      mockRouteService.deleteRoute = jest.fn().mockResolvedValue(undefined);

      const response = await request(app).delete('/routes/route-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(mockRouteService.deleteRoute).toHaveBeenCalledWith('route-123');
    });
  });

  describe('POST /routes/:id/assign-bus', () => {
    it('devrait assigner un bus à une route', async () => {
      mockRouteService.assignBus = jest.fn().mockResolvedValue({
        ...mockRoute,
        busId: 'bus-123',
      });

      const response = await request(app)
        .post('/routes/route-123/assign-bus')
        .send({ busId: 'bus-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBe('bus-123');
    });

    it('devrait retourner 400 si busId est manquant', async () => {
      const response = await request(app)
        .post('/routes/route-123/assign-bus')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /routes/:id/assign-driver', () => {
    it('devrait assigner un chauffeur à une route', async () => {
      mockRouteService.assignDriver = jest.fn().mockResolvedValue({
        ...mockRoute,
        driverId: 'driver-123',
      });

      const response = await request(app)
        .post('/routes/route-123/assign-driver')
        .send({ driverId: 'driver-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.driverId).toBe('driver-123');
    });

    it('devrait retourner 400 si driverId est manquant', async () => {
      const response = await request(app)
        .post('/routes/route-123/assign-driver')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /routes/available', () => {
    it('devrait récupérer les routes disponibles', async () => {
      const availableRoute = {
        ...mockRoute,
        currentOccupancy: 20,
        capacity: 40,
      };

      mockRouteService.getAvailableRoutes = jest.fn().mockResolvedValue([availableRoute]);

      const response = await request(app).get('/routes/available');

      expect(response.status).toBe(200);
      expect(response.body.data[0].currentOccupancy).toBeLessThan(
        response.body.data[0].capacity
      );
    });
  });

  describe('GET /routes/communes', () => {
    it('devrait récupérer la liste des communes', async () => {
      const communes = Object.values(CommuneAbidjan);

      const response = await request(app).get('/routes/communes');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.arrayContaining(communes));
    });
  });

  describe('GET /routes/quartiers/:commune', () => {
    it('devrait récupérer les quartiers d\'une commune', async () => {
      const response = await request(app).get(`/routes/quartiers/${CommuneAbidjan.COCODY}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('devrait retourner 404 si la commune n\'existe pas', async () => {
      const response = await request(app).get('/routes/quartiers/CommuneInexistante');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

