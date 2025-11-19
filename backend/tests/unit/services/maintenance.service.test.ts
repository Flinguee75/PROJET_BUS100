/**
 * Tests unitaires pour MaintenanceService
 * Teste toutes les opérations CRUD sur les maintenances
 */

import { MaintenanceService } from '../../../src/services/maintenance.service';
import {
  MaintenanceType,
  MaintenanceSeverity,
  MaintenanceStatus,
} from '../../../src/types/maintenance.types';

// Mock Firestore
const mockAdd = jest.fn();
const mockGet = jest.fn();
const mockDoc = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockWhere = jest.fn();
const mockOrderBy = jest.fn();

jest.mock('../../../src/config/firebase.config', () => ({
  getDb: () => ({
    collection: jest.fn(() => ({
      add: mockAdd,
      get: mockGet,
      doc: mockDoc,
      where: mockWhere,
      orderBy: mockOrderBy,
    })),
  }),
}));

describe('MaintenanceService', () => {
  let maintenanceService: MaintenanceService;

  beforeEach(() => {
    jest.clearAllMocks();
    maintenanceService = new MaintenanceService();

    // Reset mock chain
    mockWhere.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      get: mockGet,
    });
    mockOrderBy.mockReturnValue({
      where: mockWhere,
      orderBy: mockOrderBy,
      get: mockGet,
    });
  });

  describe('createMaintenance', () => {
    it('crée un nouveau rapport de maintenance avec succès', async () => {
      const now = new Date();
      const mockDocRef = {
        id: 'maint-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'maint-123',
          data: () => ({
            busId: 'bus-123',
            type: MaintenanceType.MECHANICAL,
            severity: MaintenanceSeverity.HIGH,
            title: 'Problème de freins',
            description: 'Les freins arrière font du bruit',
            reportedBy: 'user-123',
            status: MaintenanceStatus.REPORTED,
            reportedAt: { toDate: () => now },
          }),
          createTime: { toDate: () => now },
          updateTime: { toDate: () => now },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        busId: 'bus-123',
        type: MaintenanceType.MECHANICAL,
        severity: MaintenanceSeverity.HIGH,
        title: 'Problème de freins',
        description: 'Les freins arrière font du bruit',
        reportedBy: 'user-123',
      };

      const result = await maintenanceService.createMaintenance(input);

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'maint-123');
      expect(result.title).toBe(input.title);
      expect(result.status).toBe(MaintenanceStatus.REPORTED);
    });

    it('initialise le statut à REPORTED par défaut', async () => {
      const now = new Date();
      const mockDocRef = {
        id: 'maint-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'maint-123',
          data: () => ({
            busId: 'bus-123',
            type: MaintenanceType.ELECTRICAL,
            severity: MaintenanceSeverity.LOW,
            title: 'Lumière cassée',
            description: 'Une lumière intérieure ne fonctionne plus',
            reportedBy: 'user-123',
            status: MaintenanceStatus.REPORTED,
            reportedAt: { toDate: () => now },
          }),
          createTime: { toDate: () => now },
          updateTime: { toDate: () => now },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        busId: 'bus-123',
        type: MaintenanceType.ELECTRICAL,
        severity: MaintenanceSeverity.LOW,
        title: 'Lumière cassée',
        description: 'Une lumière intérieure ne fonctionne plus',
        reportedBy: 'user-123',
      };

      const result = await maintenanceService.createMaintenance(input);

      expect(result.status).toBe(MaintenanceStatus.REPORTED);
    });
  });

  describe('getAllMaintenances', () => {
    it('retourne une liste vide quand aucune maintenance', async () => {
      mockGet.mockResolvedValue({
        docs: [],
      });

      const result = await maintenanceService.getAllMaintenances();

      expect(result).toEqual([]);
      expect(mockOrderBy).toHaveBeenCalledWith('reportedAt', 'desc');
    });

    it('retourne toutes les maintenances existantes', async () => {
      const now = new Date();
      const mockDocs = [
        {
          id: 'maint-1',
          data: () => ({
            busId: 'bus-1',
            type: MaintenanceType.MECHANICAL,
            severity: MaintenanceSeverity.HIGH,
            title: 'Problème moteur',
            description: 'Le moteur fait un bruit anormal',
            reportedBy: 'user-1',
            status: MaintenanceStatus.REPORTED,
            reportedAt: { toDate: () => now },
          }),
          createTime: { toDate: () => now },
          updateTime: { toDate: () => now },
        },
        {
          id: 'maint-2',
          data: () => ({
            busId: 'bus-2',
            type: MaintenanceType.TIRE,
            severity: MaintenanceSeverity.MEDIUM,
            title: 'Pneu usé',
            description: 'Le pneu avant droit est usé',
            reportedBy: 'user-2',
            status: MaintenanceStatus.SCHEDULED,
            reportedAt: { toDate: () => now },
          }),
          createTime: { toDate: () => now },
          updateTime: { toDate: () => now },
        },
      ];

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await maintenanceService.getAllMaintenances();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('maint-1');
      expect(result[1].id).toBe('maint-2');
    });

    it('filtre par busId correctement', async () => {
      mockGet.mockResolvedValue({ docs: [] });

      await maintenanceService.getAllMaintenances({ busId: 'bus-123' });

      expect(mockWhere).toHaveBeenCalledWith('busId', '==', 'bus-123');
    });

    it('filtre par status correctement', async () => {
      mockGet.mockResolvedValue({ docs: [] });

      await maintenanceService.getAllMaintenances({
        status: MaintenanceStatus.IN_PROGRESS,
      });

      expect(mockWhere).toHaveBeenCalledWith('status', '==', MaintenanceStatus.IN_PROGRESS);
    });
  });

  describe('getMaintenanceById', () => {
    it('retourne null si la maintenance n\'existe pas', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({
          exists: false,
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await maintenanceService.getMaintenanceById('maint-inexistant');

      expect(result).toBeNull();
    });

    it('retourne la maintenance si elle existe', async () => {
      const now = new Date();
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({
          exists: true,
          id: 'maint-123',
          data: () => ({
            busId: 'bus-123',
            type: MaintenanceType.MECHANICAL,
            severity: MaintenanceSeverity.HIGH,
            title: 'Problème de freins',
            description: 'Les freins arrière font du bruit',
            reportedBy: 'user-123',
            status: MaintenanceStatus.REPORTED,
            reportedAt: { toDate: () => now },
          }),
          createTime: { toDate: () => now },
          updateTime: { toDate: () => now },
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await maintenanceService.getMaintenanceById('maint-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('maint-123');
      expect(result?.title).toBe('Problème de freins');
    });
  });

  describe('updateMaintenance', () => {
    it('met à jour une maintenance existante', async () => {
      const now = new Date();
      const mockDocRef = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({ exists: true }) // Première vérification
          .mockResolvedValueOnce({
            // Après update
            exists: true,
            id: 'maint-123',
            data: () => ({
              busId: 'bus-123',
              type: MaintenanceType.MECHANICAL,
              severity: MaintenanceSeverity.CRITICAL,
              title: 'Problème de freins urgent',
              description: 'Les freins ne fonctionnent plus',
              reportedBy: 'user-123',
              status: MaintenanceStatus.IN_PROGRESS,
              reportedAt: { toDate: () => now },
            }),
            createTime: { toDate: () => now },
            updateTime: { toDate: () => now },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const updateData = {
        severity: MaintenanceSeverity.CRITICAL,
        title: 'Problème de freins urgent',
        status: MaintenanceStatus.IN_PROGRESS,
      };

      const result = await maintenanceService.updateMaintenance('maint-123', updateData);

      expect(mockDocRef.update).toHaveBeenCalled();
      expect(result.severity).toBe(MaintenanceSeverity.CRITICAL);
      expect(result.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it('lance une erreur si la maintenance n\'existe pas', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({ exists: false }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(
        maintenanceService.updateMaintenance('maint-inexistant', { status: MaintenanceStatus.COMPLETED })
      ).rejects.toThrow('Maintenance with ID maint-inexistant not found');
    });
  });

  describe('deleteMaintenance', () => {
    it('supprime une maintenance existante', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({ exists: true }),
        delete: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await maintenanceService.deleteMaintenance('maint-123');

      expect(mockDocRef.delete).toHaveBeenCalled();
    });

    it('lance une erreur si la maintenance n\'existe pas', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({ exists: false }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(
        maintenanceService.deleteMaintenance('maint-inexistant')
      ).rejects.toThrow('Maintenance with ID maint-inexistant not found');
    });
  });

  describe('getMaintenancesByBusId', () => {
    it('appelle getAllMaintenances avec le filtre busId', async () => {
      const spy = jest.spyOn(maintenanceService, 'getAllMaintenances');
      mockGet.mockResolvedValue({ docs: [] });

      await maintenanceService.getMaintenancesByBusId('bus-123');

      expect(spy).toHaveBeenCalledWith({ busId: 'bus-123' });
    });
  });

  describe('getActiveMaintenances', () => {
    it('retourne uniquement les maintenances actives', async () => {
      const now = new Date();
      const mockDocs = [
        {
          id: 'maint-1',
          data: () => ({
            busId: 'bus-1',
            type: MaintenanceType.MECHANICAL,
            severity: MaintenanceSeverity.HIGH,
            title: 'Problème moteur',
            description: 'Le moteur fait un bruit anormal',
            reportedBy: 'user-1',
            status: MaintenanceStatus.REPORTED,
            reportedAt: { toDate: () => now },
          }),
          createTime: { toDate: () => now },
          updateTime: { toDate: () => now },
        },
      ];

      const mockQuery = {
        orderBy: jest.fn().mockReturnValue({
          get: (jest.fn() as any).mockResolvedValue({ docs: mockDocs }),
        }),
      };

      mockWhere.mockReturnValue(mockQuery);

      const result = await maintenanceService.getActiveMaintenances();

      expect(result).toHaveLength(1);
      expect(mockWhere).toHaveBeenCalledWith('status', 'in', [
        MaintenanceStatus.REPORTED,
        MaintenanceStatus.SCHEDULED,
        MaintenanceStatus.IN_PROGRESS,
      ]);
    });
  });
});
