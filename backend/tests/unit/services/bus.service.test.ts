/**
 * Tests unitaires pour BusService
 * Teste toutes les opérations CRUD sur les bus
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { BusService } from '../../../src/services/bus.service';
import { BusStatus, BusMaintenanceStatus } from '../../../src/types/bus.types';

// Mock Firestore
const mockAdd = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockCollection = jest.fn();

jest.mock('../../../src/config/firebase.config', () => ({
  db: {
    collection: vi.fn((name: string) => ({
      add: mockAdd,
      get: mockGet,
      doc: mockDoc,
    })),
  },
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

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
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
            routeId: null,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes Sprinter',
        year: 2024,
        capacity: 50,
      };

      const result = await busService.createBus(input);

      expect(result.driverId).toBeNull();
      expect(result.routeId).toBeNull();
      expect(result.maintenanceStatus).toBe(BusMaintenanceStatus.OK);
    });
  });

  describe('getAllBuses', () => {
    it('retourne une liste vide quand aucun bus', async () => {
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

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await busService.getAllBuses();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('bus-1');
      expect(result[1].id).toBe('bus-2');
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
});

