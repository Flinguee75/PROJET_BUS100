// @ts-nocheck
/**
 * Tests unitaires pour AttendanceService (scan/unscan)
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { AttendanceService } from '../../../src/services/attendance.service';
import { getDb, collections } from '../../../src/config/firebase.config';

jest.mock('../../../src/config/firebase.config', () => ({
  getDb: jest.fn(),
  collections: {
    buses: 'buses',
    students: 'students',
    attendance: 'attendance',
  },
}));

describe('AttendanceService', () => {
  let attendanceService: AttendanceService;
  let mockDb: any;
  let mockBusDoc: any;
  let mockStudentDoc: any;
  let attendanceCollection: any;

  beforeEach(() => {
    attendanceService = new AttendanceService();

    mockBusDoc = {
      exists: true,
      data: () => ({
        driverId: 'driver-1',
        currentTrip: { scannedStudentIds: [] },
      }),
      update: jest.fn().mockResolvedValue(undefined as any),
    };

    mockStudentDoc = {
      exists: true,
      data: () => ({
        busId: 'bus-1',
        firstName: 'Awa',
        lastName: 'Kone',
      }),
    };

    attendanceCollection = {
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      get: jest.fn().mockResolvedValue({ empty: true, docs: [] } as any),
      add: jest.fn().mockResolvedValue(undefined as any),
    };

    mockDb = {
      collection: jest.fn((name: string) => {
        if (name === collections.buses) {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockBusDoc as any),
              update: mockBusDoc.update,
            })),
          };
        }
        if (name === collections.students) {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(mockStudentDoc as any),
            })),
          };
        }
        if (name === collections.attendance) {
          return attendanceCollection;
        }
        return {};
      }),
    };

    (getDb as jest.Mock).mockReturnValue(mockDb);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('scanStudent', () => {
    it('creates an attendance record when none exists', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9); // morning

      await attendanceService.scanStudent({
        studentId: 'student-1',
        busId: 'bus-1',
        date: '2024-01-15',
        type: 'boarding',
        driverId: 'driver-1',
        location: { lat: 5.3, lng: -4.0 },
      });

      expect(attendanceCollection.add).toHaveBeenCalled();
      expect(mockBusDoc.update).toHaveBeenCalled();
    });

    it('updates existing attendance record', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(16); // evening

      const mockDocRef = {
        ref: { update: jest.fn().mockResolvedValue(undefined as any) },
      };

      attendanceCollection.get.mockResolvedValueOnce({
        empty: false,
        docs: [mockDocRef],
      } as any);

      await attendanceService.scanStudent({
        studentId: 'student-1',
        busId: 'bus-1',
        date: '2024-01-15',
        type: 'boarding',
        driverId: 'driver-1',
      });

      expect(mockDocRef.ref.update).toHaveBeenCalledWith(
        expect.objectContaining({
          eveningStatus: 'present',
        })
      );
    });

    it('throws when bus is missing', async () => {
      mockBusDoc.exists = false;

      await expect(
        attendanceService.scanStudent({
          studentId: 'student-1',
          busId: 'bus-1',
          date: '2024-01-15',
          type: 'boarding',
          driverId: 'driver-1',
        })
      ).rejects.toThrow('Bus bus-1 not found');
    });
  });

  describe('unscanStudent', () => {
    it('marks attendance as absent', async () => {
      jest.spyOn(Date.prototype, 'getHours').mockReturnValue(9); // morning

      const mockDocRef = {
        ref: { update: jest.fn().mockResolvedValue(undefined as any) },
      };

      attendanceCollection.get.mockResolvedValueOnce({
        empty: false,
        docs: [mockDocRef],
      } as any);

      await attendanceService.unscanStudent({
        studentId: 'student-1',
        busId: 'bus-1',
        date: '2024-01-15',
        driverId: 'driver-1',
      });

      expect(mockDocRef.ref.update).toHaveBeenCalledWith(
        expect.objectContaining({
          morningStatus: 'absent',
        })
      );
    });
  });
});
