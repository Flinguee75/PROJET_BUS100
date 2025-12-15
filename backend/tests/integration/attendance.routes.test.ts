/**
 * Tests d'intégration pour Attendance Routes
 * Test des endpoints API pour scanner et dé-scanner des élèves
 */

import request from 'supertest';
import express, { Express } from 'express';
import attendanceRoutes from '../../src/routes/attendance.routes';
import attendanceService from '../../src/services/attendance.service';

// Mock Attendance Service
jest.mock('../../src/services/attendance.service');

describe('Attendance Routes Integration Tests', () => {
  let app: Express;

  beforeAll(() => {
    // Setup Express app with routes
    app = express();
    app.use(express.json());
    app.use('/api/attendance', attendanceRoutes);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/attendance/scan', () => {
    it('should scan a student successfully (boarding)', async () => {
      (attendanceService.scanStudent as jest.Mock).mockResolvedValue(undefined);

      const scanData = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: '2024-01-15',
        type: 'boarding' as const,
        driverId: 'driver-001',
        location: {
          lat: 5.36,
          lng: -4.008,
        },
      };

      const response = await request(app)
        .post('/api/attendance/scan')
        .send(scanData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Élève scanné avec succès',
        data: {
          studentId: 'student-001',
          busId: 'bus-001',
          date: '2024-01-15',
          type: 'boarding',
        },
      });

      expect(attendanceService.scanStudent).toHaveBeenCalledWith(scanData);
    });

    it('should scan a student successfully (alighting)', async () => {
      (attendanceService.scanStudent as jest.Mock).mockResolvedValue(undefined);

      const scanData = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: '2024-01-15',
        type: 'alighting' as const,
        driverId: 'driver-001',
      };

      const response = await request(app)
        .post('/api/attendance/scan')
        .send(scanData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.type).toBe('alighting');
    });

    it('should return 422 for invalid data', async () => {
      const invalidData = {
        studentId: '', // Empty studentId
        busId: 'bus-001',
        date: '2024-01-15',
        type: 'boarding',
        driverId: 'driver-001',
      };

      const response = await request(app)
        .post('/api/attendance/scan')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 422 for invalid date format', async () => {
      const invalidData = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: 'invalid-date',
        type: 'boarding',
        driverId: 'driver-001',
      };

      const response = await request(app)
        .post('/api/attendance/scan')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
    });

    it('should return 400 when bus not found', async () => {
      (attendanceService.scanStudent as jest.Mock).mockRejectedValue(
        new Error('Bus bus-999 not found')
      );

      const response = await request(app)
        .post('/api/attendance/scan')
        .send({
          studentId: 'student-001',
          busId: 'bus-999',
          date: '2024-01-15',
          type: 'boarding',
          driverId: 'driver-001',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bus bus-999 not found');
    });

    it('should return 400 when student not found', async () => {
      (attendanceService.scanStudent as jest.Mock).mockRejectedValue(
        new Error('Student student-999 not found')
      );

      const response = await request(app)
        .post('/api/attendance/scan')
        .send({
          studentId: 'student-999',
          busId: 'bus-001',
          date: '2024-01-15',
          type: 'boarding',
          driverId: 'driver-001',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Student student-999 not found');
    });

    it('should return 400 when driver not assigned to bus', async () => {
      (attendanceService.scanStudent as jest.Mock).mockRejectedValue(
        new Error('Driver driver-999 is not assigned to bus bus-001')
      );

      const response = await request(app)
        .post('/api/attendance/scan')
        .send({
          studentId: 'student-001',
          busId: 'bus-001',
          date: '2024-01-15',
          type: 'boarding',
          driverId: 'driver-999',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not assigned');
    });

    it('should accept optional location parameter', async () => {
      (attendanceService.scanStudent as jest.Mock).mockResolvedValue(undefined);

      const scanData = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: '2024-01-15',
        type: 'boarding' as const,
        driverId: 'driver-001',
        location: {
          lat: 5.36,
          lng: -4.008,
        },
      };

      await request(app)
        .post('/api/attendance/scan')
        .send(scanData)
        .expect(200);

      expect(attendanceService.scanStudent).toHaveBeenCalledWith(scanData);
    });
  });

  describe('POST /api/attendance/unscan', () => {
    it('should unscan a student successfully', async () => {
      (attendanceService.unscanStudent as jest.Mock).mockResolvedValue(undefined);

      const unscanData = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: '2024-01-15',
        driverId: 'driver-001',
      };

      const response = await request(app)
        .post('/api/attendance/unscan')
        .send(unscanData)
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        message: 'Élève dé-scanné avec succès',
        data: {
          studentId: 'student-001',
          busId: 'bus-001',
          date: '2024-01-15',
        },
      });

      expect(attendanceService.unscanStudent).toHaveBeenCalledWith(unscanData);
    });

    it('should return 422 for invalid data', async () => {
      const invalidData = {
        studentId: '', // Empty studentId
        busId: 'bus-001',
        date: '2024-01-15',
        driverId: 'driver-001',
      };

      const response = await request(app)
        .post('/api/attendance/unscan')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
      expect(response.body.errors).toBeDefined();
    });

    it('should return 422 for invalid date format', async () => {
      const invalidData = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: 'invalid-date',
        driverId: 'driver-001',
      };

      const response = await request(app)
        .post('/api/attendance/unscan')
        .send(invalidData)
        .expect(422);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Données invalides');
    });

    it('should return 400 when bus not found', async () => {
      (attendanceService.unscanStudent as jest.Mock).mockRejectedValue(
        new Error('Bus bus-999 not found')
      );

      const response = await request(app)
        .post('/api/attendance/unscan')
        .send({
          studentId: 'student-001',
          busId: 'bus-999',
          date: '2024-01-15',
          driverId: 'driver-001',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Bus bus-999 not found');
    });

    it('should return 400 when driver not assigned to bus', async () => {
      (attendanceService.unscanStudent as jest.Mock).mockRejectedValue(
        new Error('Driver driver-999 is not assigned to bus bus-001')
      );

      const response = await request(app)
        .post('/api/attendance/unscan')
        .send({
          studentId: 'student-001',
          busId: 'bus-001',
          date: '2024-01-15',
          driverId: 'driver-999',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not assigned');
    });
  });
});
