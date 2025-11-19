/**
 * Tests d'intégration pour les routes Attendance
 * Teste les endpoints API REST complets pour montée/descente
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import attendanceRoutes from '../../src/routes/attendance.routes';
import attendanceService from '../../src/services/attendance.service';

// Mock du service
jest.mock('../../src/services/attendance.service');

const app = express();
app.use(express.json());
app.use('/api/attendance', attendanceRoutes);

describe('Attendance Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/attendance/board', () => {
    it('enregistre la montée d\'un élève avec des données valides', async () => {
      const mockRecord = {
        id: 'attendance-001',
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        date: '2024-01-15',
        boardingTime: new Date('2024-01-15T08:30:00.000Z'),
        boardingLocation: { lat: 5.36, lng: -4.008 },
        status: 'boarded' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (attendanceService.boardStudent as jest.MockedFunction<typeof attendanceService.boardStudent>).mockResolvedValue(mockRecord);

      const response = await request(app)
        .post('/api/attendance/board')
        .send({
          studentId: 'student-001',
          busId: 'bus-001',
          driverId: 'driver-001',
          timestamp: 1705311000000,
          location: { lat: 5.36, lng: -4.008 },
          notes: 'Montée normale',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student successfully boarded');
      expect(response.body.data).toHaveProperty('id', 'attendance-001');
      expect(response.body.data.status).toBe('boarded');
    });

    it('retourne 400 si des champs requis manquent', async () => {
      const response = await request(app)
        .post('/api/attendance/board')
        .send({
          studentId: 'student-001',
          // Manque busId et driverId
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    it('retourne 409 si l\'élève est déjà dans le bus', async () => {
      (attendanceService.boardStudent as jest.MockedFunction<typeof attendanceService.boardStudent>).mockRejectedValue(
        new Error('Student student-001 is already on the bus')
      );

      const response = await request(app)
        .post('/api/attendance/board')
        .send({
          studentId: 'student-001',
          busId: 'bus-001',
          driverId: 'driver-001',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already on the bus');
    });

    it('retourne 404 si l\'élève n\'existe pas', async () => {
      (attendanceService.boardStudent as jest.MockedFunction<typeof attendanceService.boardStudent>).mockRejectedValue(
        new Error('Student student-999 not found')
      );

      const response = await request(app)
        .post('/api/attendance/board')
        .send({
          studentId: 'student-999',
          busId: 'bus-001',
          driverId: 'driver-001',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('POST /api/attendance/exit', () => {
    it('enregistre la descente d\'un élève avec des données valides', async () => {
      const mockRecord = {
        id: 'attendance-001',
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        date: '2024-01-15',
        boardingTime: new Date('2024-01-15T08:30:00.000Z'),
        exitTime: new Date('2024-01-15T16:00:00.000Z'),
        exitLocation: { lat: 5.32, lng: -4.03 },
        status: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (attendanceService.exitStudent as jest.MockedFunction<typeof attendanceService.exitStudent>).mockResolvedValue(mockRecord);

      const response = await request(app)
        .post('/api/attendance/exit')
        .send({
          studentId: 'student-001',
          busId: 'bus-001',
          driverId: 'driver-001',
          timestamp: 1705338000000,
          location: { lat: 5.32, lng: -4.03 },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Student successfully exited');
      expect(response.body.data.status).toBe('completed');
    });

    it('retourne 409 si l\'élève n\'est pas dans le bus', async () => {
      (attendanceService.exitStudent as jest.MockedFunction<typeof attendanceService.exitStudent>).mockRejectedValue(
        new Error('Student student-001 is not currently on the bus')
      );

      const response = await request(app)
        .post('/api/attendance/exit')
        .send({
          studentId: 'student-001',
          busId: 'bus-001',
          driverId: 'driver-001',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not currently on the bus');
    });

    it('retourne 409 si aucun record de montée n\'existe', async () => {
      (attendanceService.exitStudent as jest.MockedFunction<typeof attendanceService.exitStudent>).mockRejectedValue(
        new Error('No boarding record found for student student-001 today. Student must board first.')
      );

      const response = await request(app)
        .post('/api/attendance/exit')
        .send({
          studentId: 'student-001',
          busId: 'bus-001',
          driverId: 'driver-001',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('must board first');
    });
  });

  describe('GET /api/attendance/student/:studentId', () => {
    it('retourne l\'attendance d\'un élève pour aujourd\'hui', async () => {
      const mockRecord = {
        id: 'attendance-001',
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        date: '2024-01-15',
        status: 'boarded' as const,
        boardingTime: new Date('2024-01-15T08:30:00.000Z'),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (attendanceService.getStudentAttendance as jest.MockedFunction<typeof attendanceService.getStudentAttendance>).mockResolvedValue(mockRecord);

      const response = await request(app).get('/api/attendance/student/student-001');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.studentId).toBe('student-001');
      expect(response.body.data.status).toBe('boarded');
    });

    it('retourne 404 si aucun record n\'existe', async () => {
      (attendanceService.getStudentAttendance as jest.MockedFunction<typeof attendanceService.getStudentAttendance>).mockResolvedValue(null);

      const response = await request(app).get('/api/attendance/student/student-999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('No attendance record found');
    });

    it('accepte un paramètre de date optionnel', async () => {
      const mockRecord = {
        id: 'attendance-001',
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        date: '2024-01-10',
        status: 'completed' as const,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (attendanceService.getStudentAttendance as jest.MockedFunction<typeof attendanceService.getStudentAttendance>).mockResolvedValue(mockRecord);

      const response = await request(app).get('/api/attendance/student/student-001?date=2024-01-10');

      expect(response.status).toBe(200);
      expect(response.body.data.date).toBe('2024-01-10');
    });
  });

  describe('GET /api/attendance/bus/:busId/students', () => {
    it('retourne la liste des élèves dans le bus', async () => {
      const mockStudents = [
        {
          studentId: 'student-001',
          studentName: 'Aya Kouassi',
          isOnBus: true,
          boardingTime: new Date('2024-01-15T08:30:00.000Z'),
        },
        {
          studentId: 'student-002',
          studentName: 'Ibrahim Traoré',
          isOnBus: true,
          boardingTime: new Date('2024-01-15T08:35:00.000Z'),
        },
      ];

      (attendanceService.getStudentsOnBus as jest.MockedFunction<typeof attendanceService.getStudentsOnBus>).mockResolvedValue(mockStudents);

      const response = await request(app).get('/api/attendance/bus/bus-001/students');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBe('bus-001');
      expect(response.body.data.studentCount).toBe(2);
      expect(response.body.data.students).toHaveLength(2);
      expect(response.body.data.students[0].studentName).toBe('Aya Kouassi');
    });

    it('retourne une liste vide si aucun élève n\'est dans le bus', async () => {
      (attendanceService.getStudentsOnBus as jest.MockedFunction<typeof attendanceService.getStudentsOnBus>).mockResolvedValue([]);

      const response = await request(app).get('/api/attendance/bus/bus-001/students');

      expect(response.status).toBe(200);
      expect(response.body.data.studentCount).toBe(0);
      expect(response.body.data.students).toEqual([]);
    });
  });

  describe('GET /api/attendance/bus/:busId/count', () => {
    it('retourne le nombre d\'élèves dans le bus', async () => {
      (attendanceService.countStudentsOnBus as jest.MockedFunction<typeof attendanceService.countStudentsOnBus>).mockResolvedValue(5);

      const response = await request(app).get('/api/attendance/bus/bus-001/count');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBe('bus-001');
      expect(response.body.data.studentCount).toBe(5);
    });

    it('retourne 0 si aucun élève n\'est dans le bus', async () => {
      (attendanceService.countStudentsOnBus as jest.MockedFunction<typeof attendanceService.countStudentsOnBus>).mockResolvedValue(0);

      const response = await request(app).get('/api/attendance/bus/bus-001/count');

      expect(response.status).toBe(200);
      expect(response.body.data.studentCount).toBe(0);
    });
  });

  describe('GET /api/attendance/bus/:busId/history', () => {
    it('retourne l\'historique d\'attendance du bus', async () => {
      const mockHistory = [
        {
          id: 'attendance-001',
          studentId: 'student-001',
          busId: 'bus-001',
          driverId: 'driver-001',
          date: '2024-01-15',
          status: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'attendance-002',
          studentId: 'student-002',
          busId: 'bus-001',
          driverId: 'driver-001',
          date: '2024-01-14',
          status: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (attendanceService.getBusAttendanceHistory as jest.MockedFunction<typeof attendanceService.getBusAttendanceHistory>).mockResolvedValue(mockHistory);

      const response = await request(app).get(
        '/api/attendance/bus/bus-001/history?startDate=2024-01-01&endDate=2024-01-31'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBe('bus-001');
      expect(response.body.data.recordCount).toBe(2);
      expect(response.body.data.records).toHaveLength(2);
    });

    it('retourne 400 si startDate ou endDate manquent', async () => {
      const response = await request(app).get('/api/attendance/bus/bus-001/history');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('startDate and endDate');
    });
  });

  describe('GET /api/attendance/student/:studentId/history', () => {
    it('retourne l\'historique d\'attendance de l\'élève', async () => {
      const mockHistory = [
        {
          id: 'attendance-001',
          studentId: 'student-001',
          busId: 'bus-001',
          driverId: 'driver-001',
          date: '2024-01-15',
          status: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'attendance-002',
          studentId: 'student-001',
          busId: 'bus-001',
          driverId: 'driver-001',
          date: '2024-01-14',
          status: 'completed' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (attendanceService.getStudentAttendanceHistory as jest.MockedFunction<typeof attendanceService.getStudentAttendanceHistory>).mockResolvedValue(mockHistory);

      const response = await request(app).get(
        '/api/attendance/student/student-001/history?startDate=2024-01-01&endDate=2024-01-31'
      );

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.studentId).toBe('student-001');
      expect(response.body.data.recordCount).toBe(2);
    });

    it('retourne 400 si startDate ou endDate manquent', async () => {
      const response = await request(app).get('/api/attendance/student/student-001/history');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });
});
