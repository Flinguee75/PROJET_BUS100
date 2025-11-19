/**
 * Tests d'intégration pour les routes Student
 * Teste les endpoints API REST complets
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import studentRoutes from '../../src/routes/student.routes';
import studentService from '../../src/services/student.service';

// Mock du service
jest.mock('../../src/services/student.service');

const app = express();
app.use(express.json());
app.use('/api/students', studentRoutes);

describe('Student Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/students', () => {
    it('crée un nouvel élève avec des données valides', async () => {
      const mockStudent = {
        id: 'student-123',
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15'),
        grade: 'CM2',
        parentIds: ['parent-1'],
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: null,
        routeId: null,
        pickupLocation: {
          address: '123 Rue de Test',
          lat: 36.8065,
          lng: 10.1815,
        },
        dropoffLocation: {
          address: '456 Avenue Test',
          lat: 36.8165,
          lng: 10.1915,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(studentService.createStudent).mockResolvedValue(mockStudent);

      const response = await request(app)
        .post('/api/students')
        .send({
          firstName: 'Jean',
          lastName: 'Dupont',
          dateOfBirth: '2010-05-15T00:00:00.000Z',
          grade: 'CM2',
          parentIds: ['parent-1'],
          commune: 'Cocody',
          quartier: 'Riviera',
          pickupLocation: {
            address: '123 Rue de Test',
            lat: 36.8065,
            lng: 10.1815,
          },
          dropoffLocation: {
            address: '456 Avenue Test',
            lat: 36.8165,
            lng: 10.1915,
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'student-123');
      expect(response.body.data.firstName).toBe('Jean');
    });

    it('retourne 422 si des champs requis manquent', async () => {
      const response = await request(app)
        .post('/api/students')
        .send({
          firstName: 'Jean',
          // Manque lastName, dateOfBirth, etc.
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /api/students', () => {
    it('retourne la liste de tous les élèves', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          dateOfBirth: new Date('2010-05-15'),
          grade: 'CM2',
          parentIds: ['parent-1'],
          commune: 'Cocody',
          quartier: 'Riviera',
          busId: null,
          routeId: null,
          pickupLocation: {
            address: '123 Rue Test',
            lat: 36.8065,
            lng: 10.1815,
          },
          dropoffLocation: {
            address: '456 Avenue Test',
            lat: 36.8165,
            lng: 10.1915,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(studentService.getAllStudents).mockResolvedValue(mockStudents);

      const response = await request(app).get('/api/students');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.count).toBe(1);
    });

    it('retourne les élèves d\'un parent spécifique', async () => {
      const mockStudents = [
        {
          id: 'student-1',
          firstName: 'Jean',
          lastName: 'Dupont',
          dateOfBirth: new Date('2010-05-15'),
          grade: 'CM2',
          parentIds: ['parent-1'],
          commune: 'Cocody',
          quartier: 'Riviera',
          busId: null,
          routeId: null,
          pickupLocation: {
            address: '123 Rue Test',
            lat: 36.8065,
            lng: 10.1815,
          },
          dropoffLocation: {
            address: '456 Avenue Test',
            lat: 36.8165,
            lng: 10.1915,
          },
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      jest.mocked(studentService.getStudentsByParent).mockResolvedValue(mockStudents);

      const response = await request(app).get('/api/students?parentId=parent-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(studentService.getStudentsByParent).toHaveBeenCalledWith('parent-1');
    });

    it('retourne une liste vide si aucun élève', async () => {
      jest.mocked(studentService.getAllStudents).mockResolvedValue([]);

      const response = await request(app).get('/api/students');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/students/:id', () => {
    it('retourne un élève spécifique', async () => {
      const mockStudent = {
        id: 'student-123',
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15'),
        grade: 'CM2',
        parentIds: ['parent-1'],
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        pickupLocation: {
          address: '123 Rue Test',
          lat: 36.8065,
          lng: 10.1815,
        },
        dropoffLocation: {
          address: '456 Avenue Test',
          lat: 36.8165,
          lng: 10.1915,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(studentService.getStudentById).mockResolvedValue(mockStudent);

      const response = await request(app).get('/api/students/student-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('student-123');
    });

    it('retourne 404 si l\'élève n\'existe pas', async () => {
      jest.mocked(studentService.getStudentById).mockResolvedValue(null);

      const response = await request(app).get('/api/students/student-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Student not found');
    });
  });

  describe('PATCH /api/students/:id', () => {
    it('met à jour un élève existant', async () => {
      const mockUpdatedStudent = {
        id: 'student-123',
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15'),
        grade: 'CM1', // Mis à jour
        parentIds: ['parent-1'],
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        pickupLocation: {
          address: '123 Rue Test',
          lat: 36.8065,
          lng: 10.1815,
        },
        dropoffLocation: {
          address: '456 Avenue Test',
          lat: 36.8165,
          lng: 10.1915,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(studentService.updateStudent).mockResolvedValue(mockUpdatedStudent);

      const response = await request(app)
        .patch('/api/students/student-123')
        .send({
          grade: 'CM1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.grade).toBe('CM1');
    });

    it('retourne 404 si l\'élève n\'existe pas', async () => {
      jest.mocked(studentService.updateStudent).mockRejectedValue(
        new Error('Student with ID student-inexistant not found')
      );

      const response = await request(app)
        .patch('/api/students/student-inexistant')
        .send({ grade: 'CM1' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/students/:id', () => {
    it('supprime un élève existant', async () => {
      jest.mocked(studentService.deleteStudent).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/students/student-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('retourne 404 si l\'élève n\'existe pas', async () => {
      jest.mocked(studentService.deleteStudent).mockRejectedValue(
        new Error('Student with ID student-inexistant not found')
      );

      const response = await request(app).delete('/api/students/student-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/students/:id/assign-bus', () => {
    it('assigne un élève à un bus', async () => {
      const mockStudent = {
        id: 'student-123',
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15'),
        grade: 'CM2',
        parentIds: ['parent-1'],
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        pickupLocation: {
          address: '123 Rue Test',
          lat: 36.8065,
          lng: 10.1815,
        },
        dropoffLocation: {
          address: '456 Avenue Test',
          lat: 36.8165,
          lng: 10.1915,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(studentService.assignToBus).mockResolvedValue(mockStudent);

      const response = await request(app)
        .post('/api/students/student-123/assign-bus')
        .send({
          busId: 'bus-1',
          routeId: 'route-1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBe('bus-1');
    });

    it('retourne 400 si busId ou routeId manque', async () => {
      const response = await request(app)
        .post('/api/students/student-123/assign-bus')
        .send({
          busId: 'bus-1',
          // Manque routeId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/students/:id/remove-bus', () => {
    it('retire un élève d\'un bus', async () => {
      const mockStudent = {
        id: 'student-123',
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15'),
        grade: 'CM2',
        parentIds: ['parent-1'],
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: null,
        routeId: null,
        pickupLocation: {
          address: '123 Rue Test',
          lat: 36.8065,
          lng: 10.1815,
        },
        dropoffLocation: {
          address: '456 Avenue Test',
          lat: 36.8165,
          lng: 10.1915,
        },
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      jest.mocked(studentService.removeFromBus).mockResolvedValue(mockStudent);

      const response = await request(app)
        .post('/api/students/student-123/remove-bus');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBeNull();
    });
  });
});

