/**
 * Tests unitaires pour AttendanceService
 * Teste les opérations de montée/descente et récupération d'historique
 */

import { describe, it, expect, beforeEach, vi } from '@jest/globals';
import { AttendanceService } from '../../../src/services/attendance.service';
import notificationService from '../../../src/services/notification.service';

// Mock Firestore
const mockAdd = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn();
const mockUpdate = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();
const mockLimit = jest.fn();

jest.mock('../../../src/config/firebase.config', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: mockAdd,
      get: mockGet,
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
      limit: mockLimit,
    })),
  })),
  collections: {
    students: 'students',
    attendance: 'attendance',
  },
}));

// Mock NotificationService
jest.mock('../../../src/services/notification.service', () => ({
  default: {
    notifyParentsOfStudent: jest.fn().mockResolvedValue({}),
  },
}));

describe('AttendanceService', () => {
  let attendanceService: AttendanceService;
  const mockToday = '2024-01-15';

  beforeEach(() => {
    jest.clearAllMocks();
    attendanceService = new AttendanceService();

    // Mock chaîné pour where
    mockWhere.mockReturnValue({
      get: mockGet,
      where: mockWhere,
      orderBy: mockOrderBy,
    });

    mockOrderBy.mockReturnValue({
      get: mockGet,
      orderBy: mockOrderBy,
      limit: mockLimit,
    });

    mockLimit.mockReturnValue({
      get: mockGet,
    });

    // Mock date pour avoir des tests déterministes
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${mockToday}T10:00:00.000Z`);
  });

  describe('boardStudent', () => {
    it('crée un nouveau record de montée pour un élève', async () => {
      // Arrange
      const mockStudentDoc = {
        id: 'student-001',
        exists: true,
        data: () => ({
          firstName: 'Aya',
          lastName: 'Kouassi',
          parentIds: ['parent-001'],
        }),
      };

      const mockDocRef = {
        id: 'attendance-001',
      };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockStudentDoc),
      });

      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      mockAdd.mockResolvedValue(mockDocRef);

      const event = {
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        timestamp: new Date('2024-01-15T08:30:00.000Z'),
        location: { lat: 5.36, lng: -4.008 },
        type: 'board' as const,
        notes: 'Montée normale',
      };

      // Act
      const result = await attendanceService.boardStudent(event);

      // Assert
      expect(result).toMatchObject({
        id: 'attendance-001',
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        status: 'boarded',
      });

      expect(mockAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          studentId: 'student-001',
          busId: 'bus-001',
          status: 'boarded',
        })
      );

      expect(notificationService.notifyParentsOfStudent).toHaveBeenCalledWith(
        'student-001',
        expect.objectContaining({ firstName: 'Aya' }),
        expect.any(Date),
        'board'
      );
    });

    it('met à jour un record existant pour une nouvelle montée', async () => {
      // Arrange
      const mockStudentDoc = {
        id: 'student-001',
        exists: true,
        data: () => ({
          firstName: 'Aya',
          lastName: 'Kouassi',
          parentIds: ['parent-001'],
        }),
      };

      const existingRecord = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: mockToday,
        status: 'completed', // Élève déjà descendu
        exitTime: new Date('2024-01-15T16:00:00.000Z'),
      };

      const mockExistingDoc = {
        id: 'attendance-001',
        data: () => existingRecord,
        ref: {
          update: mockUpdate,
        },
      };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockStudentDoc),
      });

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockExistingDoc],
      });

      mockUpdate.mockResolvedValue(true);

      const event = {
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        timestamp: new Date('2024-01-15T08:30:00.000Z'),
        location: { lat: 5.36, lng: -4.008 },
        type: 'board' as const,
      };

      // Act
      const result = await attendanceService.boardStudent(event);

      // Assert
      expect(result.status).toBe('boarded');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'boarded',
          boardingTime: expect.any(Date),
        })
      );
    });

    it('lance une erreur si l\'élève est déjà monté', async () => {
      // Arrange
      const mockStudentDoc = {
        id: 'student-001',
        exists: true,
        data: () => ({
          firstName: 'Aya',
          lastName: 'Kouassi',
          parentIds: ['parent-001'],
        }),
      };

      const existingRecord = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: mockToday,
        status: 'boarded', // Déjà monté
        boardingTime: new Date('2024-01-15T07:30:00.000Z'),
      };

      const mockExistingDoc = {
        id: 'attendance-001',
        data: () => existingRecord,
      };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockStudentDoc),
      });

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockExistingDoc],
      });

      const event = {
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        timestamp: new Date('2024-01-15T08:30:00.000Z'),
        type: 'board' as const,
      };

      // Act & Assert
      await expect(attendanceService.boardStudent(event)).rejects.toThrow(
        /already on the bus/
      );
    });

    it('lance une erreur si l\'élève n\'existe pas', async () => {
      // Arrange
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      });

      const event = {
        studentId: 'student-999',
        busId: 'bus-001',
        driverId: 'driver-001',
        timestamp: new Date(),
        type: 'board' as const,
      };

      // Act & Assert
      await expect(attendanceService.boardStudent(event)).rejects.toThrow(
        /not found/
      );
    });
  });

  describe('exitStudent', () => {
    it('enregistre la descente d\'un élève correctement', async () => {
      // Arrange
      const mockStudentDoc = {
        id: 'student-001',
        exists: true,
        data: () => ({
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          parentIds: ['parent-002'],
        }),
      };

      const existingRecord = {
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        date: mockToday,
        status: 'boarded',
        boardingTime: new Date('2024-01-15T07:30:00.000Z'),
      };

      const mockExistingDoc = {
        id: 'attendance-001',
        data: () => existingRecord,
        ref: {
          update: mockUpdate,
        },
      };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockStudentDoc),
      });

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockExistingDoc],
      });

      mockUpdate.mockResolvedValue(true);

      const event = {
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        timestamp: new Date('2024-01-15T16:00:00.000Z'),
        location: { lat: 5.32, lng: -4.03 },
        type: 'exit' as const,
      };

      // Act
      const result = await attendanceService.exitStudent(event);

      // Assert
      expect(result.status).toBe('completed');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          exitTime: expect.any(Date),
          status: 'completed',
        })
      );

      expect(notificationService.notifyParentsOfStudent).toHaveBeenCalledWith(
        'student-001',
        expect.objectContaining({ firstName: 'Ibrahim' }),
        expect.any(Date),
        'exit'
      );
    });

    it('lance une erreur si l\'élève n\'a pas de record de montée', async () => {
      // Arrange
      const mockStudentDoc = {
        id: 'student-001',
        exists: true,
        data: () => ({
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          parentIds: ['parent-002'],
        }),
      };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockStudentDoc),
      });

      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      const event = {
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        timestamp: new Date('2024-01-15T16:00:00.000Z'),
        type: 'exit' as const,
      };

      // Act & Assert
      await expect(attendanceService.exitStudent(event)).rejects.toThrow(
        /No boarding record found/
      );
    });

    it('lance une erreur si l\'élève n\'est pas actuellement dans le bus', async () => {
      // Arrange
      const mockStudentDoc = {
        id: 'student-001',
        exists: true,
        data: () => ({
          firstName: 'Ibrahim',
          lastName: 'Traoré',
          parentIds: ['parent-002'],
        }),
      };

      const existingRecord = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: mockToday,
        status: 'completed', // Déjà descendu
        exitTime: new Date('2024-01-15T15:00:00.000Z'),
      };

      const mockExistingDoc = {
        id: 'attendance-001',
        data: () => existingRecord,
      };

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockStudentDoc),
      });

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockExistingDoc],
      });

      const event = {
        studentId: 'student-001',
        busId: 'bus-001',
        driverId: 'driver-001',
        timestamp: new Date('2024-01-15T16:00:00.000Z'),
        type: 'exit' as const,
      };

      // Act & Assert
      await expect(attendanceService.exitStudent(event)).rejects.toThrow(
        /not currently on the bus/
      );
    });
  });

  describe('getStudentAttendance', () => {
    it('retourne l\'attendance d\'un élève pour une date donnée', async () => {
      // Arrange
      const mockRecord = {
        studentId: 'student-001',
        busId: 'bus-001',
        date: mockToday,
        status: 'boarded',
        boardingTime: new Date('2024-01-15T07:30:00.000Z'),
      };

      const mockDoc = {
        id: 'attendance-001',
        data: () => mockRecord,
      };

      mockGet.mockResolvedValue({
        empty: false,
        docs: [mockDoc],
      });

      // Act
      const result = await attendanceService.getStudentAttendance('student-001', mockToday);

      // Assert
      expect(result).toMatchObject({
        id: 'attendance-001',
        studentId: 'student-001',
        status: 'boarded',
      });
    });

    it('retourne null si aucun record n\'existe', async () => {
      // Arrange
      mockGet.mockResolvedValue({
        empty: true,
        docs: [],
      });

      // Act
      const result = await attendanceService.getStudentAttendance('student-999', mockToday);

      // Assert
      expect(result).toBeNull();
    });
  });

  describe('getStudentsOnBus', () => {
    it('retourne la liste des élèves actuellement dans le bus', async () => {
      // Arrange
      const mockAttendance = [
        {
          id: 'attendance-001',
          data: () => ({
            studentId: 'student-001',
            busId: 'bus-001',
            date: mockToday,
            status: 'boarded',
            boardingTime: new Date('2024-01-15T07:30:00.000Z'),
          }),
        },
        {
          id: 'attendance-002',
          data: () => ({
            studentId: 'student-002',
            busId: 'bus-001',
            date: mockToday,
            status: 'boarded',
            boardingTime: new Date('2024-01-15T07:35:00.000Z'),
          }),
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockAttendance,
      });

      // Mock student documents
      mockDoc.mockImplementation((studentId: string) => ({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            firstName: studentId === 'student-001' ? 'Aya' : 'Ibrahim',
            lastName: studentId === 'student-001' ? 'Kouassi' : 'Traoré',
          }),
        }),
      }));

      // Act
      const result = await attendanceService.getStudentsOnBus('bus-001');

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        studentId: 'student-001',
        studentName: 'Aya Kouassi',
        isOnBus: true,
      });
      expect(result[1]).toMatchObject({
        studentId: 'student-002',
        studentName: 'Ibrahim Traoré',
        isOnBus: true,
      });
    });

    it('retourne une liste vide si aucun élève n\'est dans le bus', async () => {
      // Arrange
      mockGet.mockResolvedValue({
        docs: [],
      });

      // Act
      const result = await attendanceService.getStudentsOnBus('bus-001');

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('countStudentsOnBus', () => {
    it('retourne le nombre d\'élèves dans le bus', async () => {
      // Arrange
      const mockAttendance = [
        {
          id: 'attendance-001',
          data: () => ({
            studentId: 'student-001',
            busId: 'bus-001',
            date: mockToday,
            status: 'boarded',
          }),
        },
        {
          id: 'attendance-002',
          data: () => ({
            studentId: 'student-002',
            busId: 'bus-001',
            date: mockToday,
            status: 'boarded',
          }),
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockAttendance,
      });

      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => ({
            firstName: 'Test',
            lastName: 'Student',
          }),
        }),
      });

      // Act
      const result = await attendanceService.countStudentsOnBus('bus-001');

      // Assert
      expect(result).toBe(2);
    });
  });

  describe('getStudentAttendanceHistory', () => {
    it('retourne l\'historique d\'attendance d\'un élève', async () => {
      // Arrange
      const mockHistory = [
        {
          id: 'attendance-001',
          data: () => ({
            studentId: 'student-001',
            busId: 'bus-001',
            date: '2024-01-15',
            status: 'completed',
          }),
        },
        {
          id: 'attendance-002',
          data: () => ({
            studentId: 'student-001',
            busId: 'bus-001',
            date: '2024-01-14',
            status: 'completed',
          }),
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockHistory,
      });

      // Act
      const result = await attendanceService.getStudentAttendanceHistory(
        'student-001',
        '2024-01-01',
        '2024-01-31'
      );

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0]).toMatchObject({
        id: 'attendance-001',
        studentId: 'student-001',
      });
    });
  });

  describe('getBusAttendanceHistory', () => {
    it('retourne l\'historique d\'attendance d\'un bus', async () => {
      // Arrange
      const mockHistory = [
        {
          id: 'attendance-001',
          data: () => ({
            studentId: 'student-001',
            busId: 'bus-001',
            date: '2024-01-15',
            status: 'completed',
          }),
        },
      ];

      mockGet.mockResolvedValue({
        docs: mockHistory,
      });

      // Act
      const result = await attendanceService.getBusAttendanceHistory(
        'bus-001',
        '2024-01-01',
        '2024-01-31'
      );

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        busId: 'bus-001',
      });
    });
  });
});
