/**
 * Tests d'intégration pour les routes School
 * Teste les endpoints API REST complets
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import schoolRoutes from '../../src/routes/school.routes';
import schoolService from '../../src/services/school.service';

// Mock du service
jest.mock('../../src/services/school.service');

const app = express();
app.use(express.json());
app.use('/api/schools', schoolRoutes);

describe('School Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/schools', () => {
    it('crée une nouvelle école avec des données valides', async () => {
      const mockSchool = {
        id: 'school-123',
        name: 'École Primaire Cocody',
        location: { lat: 5.3599, lng: -4.0083 },
        fleetSize: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(schoolService.createSchool).mockResolvedValue(mockSchool);

      const response = await request(app)
        .post('/api/schools')
        .send({
          name: 'École Primaire Cocody',
          location: { lat: 5.3599, lng: -4.0083 },
          fleetSize: 5,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'school-123');
      expect(response.body.data.name).toBe('École Primaire Cocody');
    });

    it('retourne 422 pour données invalides (nom trop court)', async () => {
      const response = await request(app)
        .post('/api/schools')
        .send({
          name: 'A', // Trop court
          location: { lat: 5.3599, lng: -4.0083 },
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
    });

    it('retourne 422 pour coordonnées GPS invalides', async () => {
      const response = await request(app)
        .post('/api/schools')
        .send({
          name: 'École Test',
          location: { lat: 200, lng: -4.0083 }, // Latitude invalide
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/schools/:schoolId', () => {
    it('récupère une école par ID avec succès', async () => {
      const mockSchool = {
        id: 'school-123',
        name: 'École Primaire Cocody',
        location: { lat: 5.3599, lng: -4.0083 },
        fleetSize: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(schoolService.getSchoolById).mockResolvedValue(mockSchool);

      const response = await request(app).get('/api/schools/school-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('school-123');
    });

    it('retourne 404 si l\'école n\'existe pas', async () => {
      jest.mocked(schoolService.getSchoolById).mockResolvedValue(null);

      const response = await request(app).get('/api/schools/school-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('École introuvable');
    });
  });

  describe('GET /api/schools', () => {
    it('retourne la liste de toutes les écoles actives', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'École 1',
          location: { lat: 5.3599, lng: -4.0083 },
          fleetSize: 3,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'school-2',
          name: 'École 2',
          location: { lat: 5.3600, lng: -4.0084 },
          fleetSize: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(schoolService.getAllSchools).mockResolvedValue(mockSchools);

      const response = await request(app).get('/api/schools');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });
  });

  describe('PUT /api/schools/:schoolId', () => {
    it('met à jour une école avec succès', async () => {
      const mockUpdatedSchool = {
        id: 'school-123',
        name: 'École Primaire Cocody Modifiée',
        location: { lat: 5.3600, lng: -4.0084 },
        fleetSize: 6,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(schoolService.updateSchool).mockResolvedValue(mockUpdatedSchool);

      const response = await request(app)
        .put('/api/schools/school-123')
        .send({
          name: 'École Primaire Cocody Modifiée',
          fleetSize: 6,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('École Primaire Cocody Modifiée');
    });

    it('retourne 404 si l\'école n\'existe pas', async () => {
      jest.mocked(schoolService.updateSchool).mockRejectedValue(
        new Error('School school-inexistant not found')
      );

      const response = await request(app)
        .put('/api/schools/school-inexistant')
        .send({
          name: 'Nouveau nom',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/schools/:schoolId', () => {
    it('supprime une école avec succès', async () => {
      jest.mocked(schoolService.deleteSchool).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/schools/school-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('École supprimée avec succès');
    });

    it('retourne 404 si l\'école n\'existe pas', async () => {
      jest.mocked(schoolService.deleteSchool).mockRejectedValue(
        new Error('School school-inexistant not found')
      );

      const response = await request(app).delete('/api/schools/school-inexistant');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/schools/:schoolId/fleet', () => {
    it('récupère la flotte d\'une école avec succès', async () => {
      const mockSchool = {
        id: 'school-123',
        name: 'École Primaire Cocody',
        location: { lat: 5.3599, lng: -4.0083 },
        fleetSize: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(schoolService.getSchoolById).mockResolvedValue(mockSchool);
      jest.mocked(schoolService.getSchoolFleetCount).mockResolvedValue(5);

      const response = await request(app).get('/api/schools/school-123/fleet');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.fleetCount).toBe(5);
      expect(response.body.data.schoolName).toBe('École Primaire Cocody');
    });

    it('retourne 404 si l\'école n\'existe pas', async () => {
      jest.mocked(schoolService.getSchoolById).mockResolvedValue(null);

      const response = await request(app).get('/api/schools/school-inexistant/fleet');

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('École introuvable');
    });
  });
});

