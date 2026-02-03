// @ts-nocheck
/**
 * Tests unitaires pour RouteService (startRoute, getRouteStudents)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RouteService } from '../../src/services/route.service';
import { BusLiveStatus } from '../../src/types';

jest.mock('../../src/config/firebase.config', () => ({
  getDb: jest.fn(),
  collections: {
    buses: 'buses',
    gpsLive: 'gps_live',
    routes: 'routes',
    students: 'students',
    attendance: 'attendance',
  },
}));

describe('RouteService', () => {
  let service: RouteService;
  let mockDb: any;
  const { getDb, collections } = require('../../src/config/firebase.config');

  beforeEach(() => {
    service = new RouteService();
    jest.clearAllMocks();

    mockDb = {
      collection: jest.fn(),
    };
    getDb.mockReturnValue(mockDb);
  });

  describe('startRoute', () => {
    it('updates gps_live when bus exists and driver is assigned', async () => {
      const busDoc = {
        exists: true,
        data: () => ({ driverId: 'driver-1', schoolId: 'school-1' }),
      };
      const gpsDoc = {
        exists: true,
      };

      const update = jest.fn().mockResolvedValue(undefined);
      const set = jest.fn().mockResolvedValue(undefined);

      mockDb.collection.mockImplementation((name: string) => {
        if (name === collections.buses) {
          return { doc: jest.fn(() => ({ get: jest.fn().mockResolvedValue(busDoc) })) };
        }
        if (name === collections.gpsLive) {
          return {
            doc: jest.fn(() => ({
              get: jest.fn().mockResolvedValue(gpsDoc),
              update,
              set,
            })),
          };
        }
        return {};
      });

      await service.startRoute('bus-1', 'driver-1');

      expect(update).toHaveBeenCalledWith({
        liveStatus: BusLiveStatus.EN_ROUTE,
        updatedAt: expect.any(Number),
      });
      expect(set).not.toHaveBeenCalled();
    });
  });

  describe('getRouteStudents', () => {
    it('returns ordered students with scan status', async () => {
      const busDoc = {
        exists: true,
        data: () => ({ routeId: 'route-1' }),
      };
      const routeDoc = {
        exists: true,
        data: () => ({ studentOrder: ['student-2', 'student-1'] }),
      };
      const studentsSnapshot = {
        forEach: (cb: any) => {
          [
            { id: 'student-1', data: () => ({ firstName: 'Awa', lastName: 'Kone' }) },
            { id: 'student-2', data: () => ({ firstName: 'Jean', lastName: 'Doe' }) },
          ].forEach(cb);
        },
      };
      const attendanceSnapshot = {
        forEach: (cb: any) => {
          [
            {
              data: () => ({ studentId: 'student-1', morningStatus: 'present' }),
            },
          ].forEach(cb);
        },
      };

      mockDb.collection.mockImplementation((name: string) => {
        if (name === collections.buses) {
          return { doc: jest.fn(() => ({ get: jest.fn().mockResolvedValue(busDoc) })) };
        }
        if (name === collections.routes) {
          return { doc: jest.fn(() => ({ get: jest.fn().mockResolvedValue(routeDoc) })) };
        }
        if (name === collections.students) {
          return {
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(studentsSnapshot),
          };
        }
        if (name === collections.attendance) {
          return {
            where: jest.fn().mockReturnThis(),
            get: jest.fn().mockResolvedValue(attendanceSnapshot),
          };
        }
        return {};
      });

      const result = await service.getRouteStudents('bus-1', '2024-01-15');

      expect(result).toHaveLength(2);
      expect(result[0]?.id).toBe('student-2');
      expect(result[1]?.id).toBe('student-1');
      expect(result[1]?.scanned).toBe(true);
    });
  });
});
