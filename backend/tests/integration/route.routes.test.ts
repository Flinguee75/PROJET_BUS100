/**
 * Tests d'intégration pour les routes /api/routes
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import routeRoutes from '../../src/routes/route.routes';
import notificationService from '../../src/services/notification.service';

// Mock des services
jest.mock('../../src/services/notification.service');
jest.mock('../../src/config/firebase.config', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        update: jest.fn().mockResolvedValue(true),
      })),
    })),
  })),
  collections: {
    buses: 'buses',
  },
}));

// Créer une app Express pour les tests
const app = express();
app.use(express.json());
app.use('/api/routes', routeRoutes);

describe('Route Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/routes/start', () => {
    it('devrait démarrer un trajet avec succès', async () => {
      (notificationService.notifyParentsRouteStarted as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/routes/start')
        .send({
          busId: 'bus-001',
          driverId: 'driver-001',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Route started and parents notified');
      expect(response.body.data).toMatchObject({
        busId: 'bus-001',
        driverId: 'driver-001',
      });
      expect(notificationService.notifyParentsRouteStarted).toHaveBeenCalledWith(
        'bus-001',
        'driver-001'
      );
    });

    it('devrait retourner 400 si busId est manquant', async () => {
      const response = await request(app)
        .post('/api/routes/start')
        .send({
          driverId: 'driver-001',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Bus ID and Driver ID are required');
    });

    it('devrait retourner 400 si driverId est manquant', async () => {
      const response = await request(app)
        .post('/api/routes/start')
        .send({
          busId: 'bus-001',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Bus ID and Driver ID are required');
    });

    it('devrait retourner 400 si le body est vide', async () => {
      const response = await request(app).post('/api/routes/start').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Bus ID and Driver ID are required');
    });

    it('devrait retourner 500 si la notification échoue', async () => {
      (notificationService.notifyParentsRouteStarted as jest.Mock).mockRejectedValue(
        new Error('Failed to send notifications')
      );

      const response = await request(app)
        .post('/api/routes/start')
        .send({
          busId: 'bus-001',
          driverId: 'driver-001',
        });

      expect(response.status).toBe(500);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Failed to send notifications');
    });
  });

  describe('POST /api/routes/stop', () => {
    it('devrait arrêter un trajet avec succès', async () => {
      const response = await request(app)
        .post('/api/routes/stop')
        .send({
          busId: 'bus-001',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Route stopped');
      expect(response.body.data).toMatchObject({
        busId: 'bus-001',
      });
    });

    it('devrait retourner 400 si busId est manquant', async () => {
      const response = await request(app).post('/api/routes/stop').send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Bus ID is required');
    });
  });
});
