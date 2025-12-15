/**
 * Tests d'intégration pour Route Routes
 * Test des endpoints API pour démarrer une course et récupérer la liste des élèves
 */

import request from 'supertest';
import express, { Express } from 'express';
import routeRoutes from '../../src/routes/route.routes';
import routeService from '../../src/services/route.service';

// Mock Route Service
jest.mock('../../src/services/route.service');

describe('Route Routes Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/routes', routeRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/routes/start', () => {
    it('should start a route successfully', async () => {
      (routeService.startRoute as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app)
        .post('/api/routes/start')
        .send({
          busId: 'bus-001',
          driverId: 'driver-001',
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Course démarrée avec succès',
        data: {
          busId: 'bus-001',
          driverId: 'driver-001',
          status: 'en_route',
        },
      });

      expect(routeService.startRoute).toHaveBeenCalledWith('bus-001', 'driver-001');
    });

    it('should return 422 for invalid data', async () => {
      const invalidData = {
        busId: '', // Empty busId
        driverId: 'driver-001',
      };

      const response = await request(app)
        .post('/api/routes/start')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 400 when bus not found', async () => {
      (routeService.startRoute as jest.Mock).mockRejectedValue(
        new Error('Bus bus-999 not found')
      );

      const response = await request(app)
        .post('/api/routes/start')
        .send({
          busId: 'bus-999',
          driverId: 'driver-001',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bus bus-999 not found');
    });

    it('should return 400 when driver not assigned to bus', async () => {
      (routeService.startRoute as jest.Mock).mockRejectedValue(
        new Error('Driver driver-999 is not assigned to bus bus-001')
      );

      const response = await request(app)
        .post('/api/routes/start')
        .send({
          busId: 'bus-001',
          driverId: 'driver-999',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not assigned');
    });
  });

  describe('GET /api/routes/:busId/students', () => {
    it('should return list of students for a bus', async () => {
      const mockStudents = [
        {
          id: 'student-001',
          firstName: 'Aya',
          lastName: 'Kouassi',
          photoUrl: 'https://example.com/photo.jpg',
          grade: 'CE1',
          scanned: false,
        },
        {
          id: 'student-002',
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          photoUrl: null,
          grade: 'CE2',
          scanned: true,
          morningStatus: 'present' as const,
        },
      ];

      (routeService.getRouteStudents as jest.Mock).mockResolvedValue(mockStudents);

      const response = await request(app)
        .get('/api/routes/bus-001/students')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Liste des élèves récupérée avec succès',
        data: {
          busId: 'bus-001',
          date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          students: mockStudents,
          total: 2,
        },
      });

      expect(routeService.getRouteStudents).toHaveBeenCalledWith(
        'bus-001',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      );
    });

    it('should accept date query parameter', async () => {
      const mockStudents: any[] = [];

      (routeService.getRouteStudents as jest.Mock).mockResolvedValue(mockStudents);

      const response = await request(app)
        .get('/api/routes/bus-001/students?date=2024-01-15')
        .expect(200);

      expect(response.body.data.date).toBe('2024-01-15');
      expect(routeService.getRouteStudents).toHaveBeenCalledWith('bus-001', '2024-01-15');
    });

    it('should return 422 for invalid date format', async () => {
      const response = await request(app)
        .get('/api/routes/bus-001/students?date=invalid-date')
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Format de date invalide. Utilisez YYYY-MM-DD');
    });

    it('should return 400 when bus not found', async () => {
      (routeService.getRouteStudents as jest.Mock).mockRejectedValue(
        new Error('Bus bus-999 not found')
      );

      const response = await request(app)
        .get('/api/routes/bus-999/students')
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bus bus-999 not found');
    });

    it('should return empty array when bus has no students', async () => {
      (routeService.getRouteStudents as jest.Mock).mockResolvedValue([]);

      const response = await request(app)
        .get('/api/routes/bus-001/students')
        .expect(200);

      expect(response.body.data.students).toEqual([]);
      expect(response.body.data.total).toBe(0);
    });
  });
});
