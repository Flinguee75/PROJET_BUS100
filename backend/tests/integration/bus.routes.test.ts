/**
 * Tests d'intégration pour les routes Bus
 * Teste les endpoints API REST complets
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import busRoutes from '../../src/routes/bus.routes';
import busService from '../../src/services/bus.service';
import { BusStatus, BusMaintenanceStatus } from '../../src/types/bus.types';

// Mock du service
vi.mock('../../src/services/bus.service');

const app = express();
app.use(express.json());
app.use('/api/buses', busRoutes);

describe('Bus Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/buses', () => {
    it('crée un nouveau bus avec des données valides', async () => {
      const mockBus = {
        id: 'bus-123',
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes Sprinter',
        year: 2024,
        capacity: 50,
        status: BusStatus.ACTIVE,
        maintenanceStatus: BusMaintenanceStatus.OK,
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(busService.createBus).mockResolvedValue(mockBus);

      const response = await request(app)
        .post('/api/buses')
        .send({
          plateNumber: 'TU 123 TN 456',
          model: 'Mercedes Sprinter',
          year: 2024,
          capacity: 50,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'bus-123');
      expect(response.body.data.plateNumber).toBe('TU 123 TN 456');
    });

    it('retourne 400 si des champs requis manquent', async () => {
      const response = await request(app)
        .post('/api/buses')
        .send({
          plateNumber: 'TU 123 TN 456',
          // Manque model, year, capacity
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('retourne 400 en cas d\'erreur de création', async () => {
      vi.mocked(busService.createBus).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/buses')
        .send({
          plateNumber: 'TU 123 TN 456',
          model: 'Mercedes Sprinter',
          year: 2024,
          capacity: 50,
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/buses', () => {
    it('retourne la liste de tous les bus', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes',
          year: 2024,
          capacity: 50,
          status: BusStatus.ACTIVE,
          maintenanceStatus: BusMaintenanceStatus.OK,
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'bus-2',
          plateNumber: 'TU 222 TN 222',
          model: 'Volvo',
          year: 2023,
          capacity: 40,
          status: BusStatus.ACTIVE,
          maintenanceStatus: BusMaintenanceStatus.OK,
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(busService.getAllBuses).mockResolvedValue(mockBuses);

      const response = await request(app).get('/api/buses');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe('bus-1');
    });

    it('retourne les bus avec positions GPS si live=true', async () => {
      const mockBusesWithGPS = [
        {
          id: 'bus-1',
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes',
          year: 2024,
          capacity: 50,
          status: BusStatus.ACTIVE,
          maintenanceStatus: BusMaintenanceStatus.OK,
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentPosition: {
            lat: 36.8065,
            lng: 10.1815,
            speed: 45,
            timestamp: Date.now(),
          },
        },
      ];

      vi.mocked(busService.getBusesWithLivePosition).mockResolvedValue(
        mockBusesWithGPS
      );

      const response = await request(app).get('/api/buses?live=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data[0]).toHaveProperty('currentPosition');
      expect(busService.getBusesWithLivePosition).toHaveBeenCalled();
    });

    it('retourne une liste vide si aucun bus', async () => {
      vi.mocked(busService.getAllBuses).mockResolvedValue([]);

      const response = await request(app).get('/api/buses');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/buses/:busId', () => {
    it('retourne un bus spécifique', async () => {
      const mockBus = {
        id: 'bus-123',
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes',
        year: 2024,
        capacity: 50,
        status: BusStatus.ACTIVE,
        maintenanceStatus: BusMaintenanceStatus.OK,
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(busService.getBusById).mockResolvedValue(mockBus);

      const response = await request(app).get('/api/buses/bus-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('bus-123');
    });

    it('retourne 404 si le bus n\'existe pas', async () => {
      vi.mocked(busService.getBusById).mockResolvedValue(null);

      const response = await request(app).get('/api/buses/bus-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/buses/:busId', () => {
    it('met à jour un bus existant', async () => {
      const mockUpdatedBus = {
        id: 'bus-123',
        plateNumber: 'TU 999 TN 999',
        model: 'Mercedes',
        year: 2024,
        capacity: 60,
        status: BusStatus.ACTIVE,
        maintenanceStatus: BusMaintenanceStatus.OK,
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(busService.updateBus).mockResolvedValue(mockUpdatedBus);

      const response = await request(app)
        .put('/api/buses/bus-123')
        .send({
          plateNumber: 'TU 999 TN 999',
          capacity: 60,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.plateNumber).toBe('TU 999 TN 999');
      expect(response.body.data.capacity).toBe(60);
    });

    it('retourne 404 si le bus à mettre à jour n\'existe pas', async () => {
      vi.mocked(busService.updateBus).mockRejectedValue(
        new Error('Bus with ID bus-inexistant not found')
      );

      const response = await request(app)
        .put('/api/buses/bus-inexistant')
        .send({ capacity: 60 });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/buses/:busId', () => {
    it('supprime un bus existant', async () => {
      vi.mocked(busService.deleteBus).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/buses/bus-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('retourne 404 si le bus à supprimer n\'existe pas', async () => {
      vi.mocked(busService.deleteBus).mockRejectedValue(
        new Error('Bus with ID bus-inexistant not found')
      );

      const response = await request(app).delete('/api/buses/bus-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

