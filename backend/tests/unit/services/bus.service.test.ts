/**
 * Tests unitaires pour BusService
 * Teste toutes les opérations CRUD sur les bus
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BusService } from '../../../src/services/bus.service';
import { BusStatus, BusMaintenanceStatus } from '../../../src/types/bus.types';

// Mock Firestore
// @ts-ignore - Mock types
const mockAdd = jest.fn();
// @ts-ignore - Mock types
const mockGet = jest.fn();
// @ts-ignore - Mock types
const mockDoc = jest.fn();

jest.mock('../../../src/config/firebase.config', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: mockAdd,
      get: mockGet,
      doc: mockDoc,
      where: jest.fn(() => ({
        get: mockGet,
      })),
    })),
  })),
}));

describe('BusService', () => {
  let busService: BusService;

  beforeEach(() => {
    jest.clearAllMocks();
    busService = new BusService();
  });

  describe('createBus', () => {
    it('crée un nouveau bus avec succès', async () => {
      const mockDocRef: any = {
        id: 'bus-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'bus-123',
          data: () => ({
            plateNumber: 'TU 123 TN 456',
            model: 'Mercedes Sprinter',
            year: 2024,
            capacity: 50,
            status: BusStatus.ACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
          }),
          createTime: { toDate: () => new Date('2024-01-01') },
          updateTime: { toDate: () => new Date('2024-01-01') },
        }),
      };

      // @ts-ignore - Mock return value
      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        busNumber: 1,
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes Sprinter',
        year: 2024,
        capacity: 50,
      };

      const result = await busService.createBus(input);

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'bus-123');
      expect(result.plateNumber).toBe(input.plateNumber);
      expect(result.status).toBe(BusStatus.ACTIVE);
    });

    it('initialise les valeurs par défaut correctement', async () => {
      const mockDocRef: any = {
        id: 'bus-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'bus-123',
          data: () => ({
            plateNumber: 'TU 123 TN 456',
            model: 'Mercedes Sprinter',
            year: 2024,
            capacity: 50,
            status: BusStatus.ACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
            driverId: null,
            escortId: null,
            routeId: null,
            studentIds: [],
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      // @ts-ignore - Mock return value
      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        busNumber: 1,
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes Sprinter',
        year: 2024,
        capacity: 50,
      };

      const result = await busService.createBus(input);

      expect(result.driverId).toBeNull();
      expect(result.escortId).toBeNull();
      expect(result.routeId).toBeNull();
      expect(result.studentIds).toEqual([]);
      expect(result.maintenanceStatus).toBe(BusMaintenanceStatus.OK);
    });
  });

  describe('getAllBuses', () => {
    it('retourne une liste vide quand aucun bus', async () => {
      // @ts-ignore - Mock return value
      mockGet.mockResolvedValue({
        docs: [],
      });

      const result = await busService.getAllBuses();

      expect(result).toEqual([]);
      expect(mockGet).toHaveBeenCalled();
    });

    it('retourne tous les bus existants', async () => {
      const mockDocs = [
        {
          id: 'bus-1',
          data: () => ({
            plateNumber: 'TU 111 TN 111',
            model: 'Mercedes',
            year: 2024,
            capacity: 50,
            status: BusStatus.ACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
        {
          id: 'bus-2',
          data: () => ({
            plateNumber: 'TU 222 TN 222',
            model: 'Volvo',
            year: 2023,
            capacity: 40,
            status: BusStatus.ACTIVE,
            maintenanceStatus: BusMaintenanceStatus.OK,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
      ];

      // @ts-ignore - Mock return value
      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await busService.getAllBuses();

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('bus-1');
      expect(result[1]!.id).toBe('bus-2');
    });
  });

  describe('getBusById', () => {
    it('retourne null si le bus n\'existe pas', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any).mockResolvedValue({
          exists: false,
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await busService.getBusById('bus-inexistant');

      expect(result).toBeNull();
    });

    it('retourne le bus s\'il existe', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any).mockResolvedValue({
          exists: true,
          id: 'bus-123',
          data: () => ({
            plateNumber: 'TU 123 TN 456',
            model: 'Mercedes',
            year: 2024,
            capacity: 50,
            status: BusStatus.ACTIVE,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await busService.getBusById('bus-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('bus-123');
      expect(result?.plateNumber).toBe('TU 123 TN 456');
    });
  });

  describe('updateBus', () => {
    it('met à jour un bus existant', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({ exists: true }) // Première vérification
          .mockResolvedValueOnce({
            // Après update
            exists: true,
            id: 'bus-123',
            data: () => ({
              plateNumber: 'TU 999 TN 999',
              model: 'Mercedes',
              year: 2024,
              capacity: 60,
              status: BusStatus.ACTIVE,
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const updateData = {
        plateNumber: 'TU 999 TN 999',
        capacity: 60,
      };

      const result = await busService.updateBus('bus-123', updateData);

      expect(mockDocRef.update).toHaveBeenCalled();
      expect(result.plateNumber).toBe('TU 999 TN 999');
      expect(result.capacity).toBe(60);
    });

    it('lance une erreur si le bus n\'existe pas', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any).mockResolvedValue({ exists: false }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(
        busService.updateBus('bus-inexistant', { capacity: 60 })
      ).rejects.toThrow('Bus with ID bus-inexistant not found');
    });
  });

  describe('deleteBus', () => {
    it('supprime un bus existant', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any).mockResolvedValue({ exists: true }),
        delete: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await busService.deleteBus('bus-123');

      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('lance une erreur si le bus n\'existe pas', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any).mockResolvedValue({ exists: false }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(busService.deleteBus('bus-inexistant')).rejects.toThrow(
        'Bus with ID bus-inexistant not found'
      );
    });
  });

  describe('Bus escort and students management', () => {
    it('permet d\'assigner un convoyeur à un bus', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({ exists: true })
          .mockResolvedValueOnce({
            exists: true,
            id: 'bus-123',
            data: () => ({
              plateNumber: 'TU 123 TN 456',
              model: 'Mercedes',
              year: 2024,
              capacity: 50,
              status: BusStatus.ACTIVE,
              escortId: 'escort-456',
              driverId: null,
              routeId: null,
              studentIds: [],
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await busService.updateBus('bus-123', {
        escortId: 'escort-456',
      });

      expect(result.escortId).toBe('escort-456');
      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('permet d\'assigner une liste d\'élèves à un bus', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({ exists: true })
          .mockResolvedValueOnce({
            exists: true,
            id: 'bus-123',
            data: () => ({
              plateNumber: 'TU 123 TN 456',
              model: 'Mercedes',
              year: 2024,
              capacity: 50,
              status: BusStatus.ACTIVE,
              escortId: null,
              driverId: null,
              routeId: null,
              studentIds: ['student-1', 'student-2', 'student-3'],
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await busService.updateBus('bus-123', {
        studentIds: ['student-1', 'student-2', 'student-3'],
      });

      expect(result.studentIds).toEqual(['student-1', 'student-2', 'student-3']);
      expect(result.studentIds).toHaveLength(3);
    });

    it('permet d\'assigner chauffeur, convoyeur et élèves en une seule opération', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({ exists: true })
          .mockResolvedValueOnce({
            exists: true,
            id: 'bus-123',
            data: () => ({
              plateNumber: 'TU 123 TN 456',
              model: 'Mercedes',
              year: 2024,
              capacity: 50,
              status: BusStatus.ACTIVE,
              driverId: 'driver-789',
              escortId: 'escort-456',
              routeId: 'route-001',
              studentIds: ['student-1', 'student-2'],
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await busService.updateBus('bus-123', {
        driverId: 'driver-789',
        escortId: 'escort-456',
        routeId: 'route-001',
        studentIds: ['student-1', 'student-2'],
      });

      expect(result.driverId).toBe('driver-789');
      expect(result.escortId).toBe('escort-456');
      expect(result.routeId).toBe('route-001');
      expect(result.studentIds).toEqual(['student-1', 'student-2']);
    });
  });
});

