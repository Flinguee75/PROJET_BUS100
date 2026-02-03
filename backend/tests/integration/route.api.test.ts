/**
 * Tests d'Intégration - API Routes
 * Couvre les endpoints existants: start route et récupération élèves
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import routeRoutes from '../../src/routes/route.routes';
import routeService from '../../src/services/route.service';

jest.mock('../../src/services/route.service');

const app = express();
app.use(express.json());
app.use('/routes', routeRoutes);

describe('API Routes - /routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /routes/start', () => {
    it('démarre une course avec des données valides', async () => {
      jest.mocked(routeService.startRoute).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/routes/start')
        .send({ busId: 'bus-123', driverId: 'driver-123' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        busId: 'bus-123',
        driverId: 'driver-123',
        status: 'en_route',
      });
    });

    it('retourne 422 si les données sont invalides', async () => {
      const response = await request(app)
        .post('/routes/start')
        .send({ busId: '' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
    });

    it('retourne 400 en cas d\'erreur métier', async () => {
      jest.mocked(routeService.startRoute).mockRejectedValue(
        new Error('Bus bus-123 not found')
      );

      const response = await request(app)
        .post('/routes/start')
        .send({ busId: 'bus-123', driverId: 'driver-123' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bus bus-123 not found');
    });
  });

  describe('GET /routes/:busId/students', () => {
    it('retourne la liste des élèves du bus', async () => {
      const students = [
        {
          id: 'student-1',
          firstName: 'Awa',
          lastName: 'Kone',
          grade: 'CM1',
          scanned: true,
          morningStatus: 'present' as const,
          eveningStatus: 'absent' as const,
        },
      ];

      jest.mocked(routeService.getRouteStudents).mockResolvedValue(students);

      const response = await request(app)
        .get('/routes/bus-123/students')
        .query({ date: '2024-01-15' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toMatchObject({
        busId: 'bus-123',
        date: '2024-01-15',
        total: 1,
      });
      expect(response.body.data.students).toHaveLength(1);
    });

    it('retourne 422 si le format de date est invalide', async () => {
      const response = await request(app)
        .get('/routes/bus-123/students')
        .query({ date: '15-01-2024' });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Format de date invalide');
    });

    it('retourne 400 en cas d\'erreur métier', async () => {
      jest.mocked(routeService.getRouteStudents).mockRejectedValue(
        new Error('Bus bus-123 not found')
      );

      const response = await request(app)
        .get('/routes/bus-123/students')
        .query({ date: '2024-01-15' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bus bus-123 not found');
    });
  });
});
