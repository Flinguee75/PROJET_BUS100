/**
 * Tests unitaires pour DriverService
 * Teste toutes les opérations CRUD sur les chauffeurs
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { DriverService } from '../../../src/services/driver.service';
import { UserRole } from '../../../src/types/user.types';

// Mock Firestore
const mockAdd = vi.fn();
const mockGet = vi.fn();
const mockDoc = vi.fn();
const mockUpdate = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

vi.mock('../../../src/config/firebase.config', () => ({
  getDb: vi.fn(() => ({
    collection: vi.fn(() => ({
      add: mockAdd,
      get: mockGet,
      doc: mockDoc,
      where: mockWhere,
    })),
  })),
}));

describe('DriverService', () => {
  let driverService: DriverService;

  beforeEach(() => {
    vi.clearAllMocks();
    driverService = new DriverService();
    
    // Mock chaîné pour where et limit
    mockWhere.mockReturnValue({
      get: mockGet,
      where: mockWhere,
      limit: mockLimit,
    });
    mockLimit.mockReturnValue({
      get: mockGet,
    });
  });

  describe('createDriver', () => {
    it('crée un nouveau chauffeur avec succès', async () => {
      const mockDocRef = {
        id: 'driver-123',
        get: vi.fn().mockResolvedValue({
          id: 'driver-123',
          data: () => ({
            email: 'driver@test.com',
            displayName: 'Chauffeur Test',
            phoneNumber: '+33612345678',
            role: UserRole.DRIVER,
            licenseNumber: 'LIC123456',
            licenseExpiry: { toDate: () => new Date('2026-12-31') },
            busId: null,
            isActive: true,
          }),
          createTime: { toDate: () => new Date('2024-01-01') },
          updateTime: { toDate: () => new Date('2024-01-01') },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        email: 'driver@test.com',
        displayName: 'Chauffeur Test',
        phoneNumber: '+33612345678',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2026-12-31'),
      };

      const result = await driverService.createDriver(input);

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'driver-123');
      expect(result.email).toBe('driver@test.com');
      expect(result.role).toBe(UserRole.DRIVER);
      expect(result.isActive).toBe(true);
    });

    it('initialise busId à null par défaut', async () => {
      const mockDocRef = {
        id: 'driver-123',
        get: vi.fn().mockResolvedValue({
          id: 'driver-123',
          data: () => ({
            email: 'driver@test.com',
            displayName: 'Chauffeur Test',
            phoneNumber: '+33612345678',
            role: UserRole.DRIVER,
            licenseNumber: 'LIC123456',
            licenseExpiry: { toDate: () => new Date('2026-12-31') },
            busId: null,
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        email: 'driver@test.com',
        displayName: 'Chauffeur Test',
        phoneNumber: '+33612345678',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2026-12-31'),
      };

      const result = await driverService.createDriver(input);

      expect(result.busId).toBeNull();
    });
  });

  describe('getAllDrivers', () => {
    it('retourne une liste vide quand aucun chauffeur', async () => {
      mockGet.mockResolvedValue({
        docs: [],
      });

      const result = await driverService.getAllDrivers();

      expect(result).toEqual([]);
      expect(mockWhere).toHaveBeenCalledWith('role', '==', UserRole.DRIVER);
    });

    it('retourne tous les chauffeurs existants', async () => {
      const mockDocs = [
        {
          id: 'driver-1',
          data: () => ({
            email: 'driver1@test.com',
            displayName: 'Chauffeur 1',
            phoneNumber: '+33612345678',
            role: UserRole.DRIVER,
            licenseNumber: 'LIC111111',
            licenseExpiry: { toDate: () => new Date('2026-12-31') },
            busId: 'bus-1',
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
        {
          id: 'driver-2',
          data: () => ({
            email: 'driver2@test.com',
            displayName: 'Chauffeur 2',
            phoneNumber: '+33612345679',
            role: UserRole.DRIVER,
            licenseNumber: 'LIC222222',
            licenseExpiry: { toDate: () => new Date('2025-06-30') },
            busId: null,
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
      ];

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await driverService.getAllDrivers();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('driver-1');
      expect(result[1].id).toBe('driver-2');
    });
  });

  describe('getDriverById', () => {
    it('retourne null si le chauffeur n\'existe pas', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: false,
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await driverService.getDriverById('driver-inexistant');

      expect(result).toBeNull();
    });

    it('retourne null si l\'utilisateur n\'est pas un chauffeur', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'user-123',
          data: () => ({
            email: 'admin@test.com',
            displayName: 'Admin',
            phoneNumber: '+33612345678',
            role: UserRole.ADMIN, // Pas un chauffeur
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await driverService.getDriverById('user-123');

      expect(result).toBeNull();
    });

    it('retourne le chauffeur s\'il existe', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'driver-123',
          data: () => ({
            email: 'driver@test.com',
            displayName: 'Chauffeur Test',
            phoneNumber: '+33612345678',
            role: UserRole.DRIVER,
            licenseNumber: 'LIC123456',
            licenseExpiry: { toDate: () => new Date('2026-12-31') },
            busId: 'bus-1',
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await driverService.getDriverById('driver-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('driver-123');
      expect(result?.email).toBe('driver@test.com');
    });
  });

  describe('getAvailableDrivers', () => {
    it('retourne uniquement les chauffeurs sans bus assigné', async () => {
      const mockDocs = [
        {
          id: 'driver-2',
          data: () => ({
            email: 'driver2@test.com',
            displayName: 'Chauffeur 2',
            phoneNumber: '+33612345679',
            role: UserRole.DRIVER,
            licenseNumber: 'LIC222222',
            licenseExpiry: { toDate: () => new Date('2025-06-30') },
            busId: null,
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
      ];

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await driverService.getAvailableDrivers();

      expect(result).toHaveLength(1);
      expect(result[0].busId).toBeNull();
      expect(mockWhere).toHaveBeenCalledWith('busId', '==', null);
    });
  });

  describe('updateDriver', () => {
    it('met à jour un chauffeur existant', async () => {
      const mockDocRef = {
        get: vi.fn()
          .mockResolvedValueOnce({
            exists: true,
            data: () => ({ role: UserRole.DRIVER }),
          })
          .mockResolvedValueOnce({
            exists: true,
            id: 'driver-123',
            data: () => ({
              email: 'driver@test.com',
              displayName: 'Chauffeur Modifié',
              phoneNumber: '+33612345678',
              role: UserRole.DRIVER,
              licenseNumber: 'LIC999999',
              licenseExpiry: { toDate: () => new Date('2027-12-31') },
              busId: 'bus-1',
              isActive: true,
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: vi.fn().mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const updateData = {
        displayName: 'Chauffeur Modifié',
        licenseNumber: 'LIC999999',
        busId: 'bus-1',
      };

      const result = await driverService.updateDriver('driver-123', updateData);

      expect(mockDocRef.update).toHaveBeenCalled();
      expect(result.displayName).toBe('Chauffeur Modifié');
      expect(result.busId).toBe('bus-1');
    });

    it('lance une erreur si le chauffeur n\'existe pas', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({ exists: false }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(
        driverService.updateDriver('driver-inexistant', { displayName: 'Test' })
      ).rejects.toThrow('Driver with ID driver-inexistant not found');
    });

    it('lance une erreur si l\'utilisateur n\'est pas un chauffeur', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ role: UserRole.ADMIN }),
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(
        driverService.updateDriver('user-123', { displayName: 'Test' })
      ).rejects.toThrow('User user-123 is not a driver');
    });
  });

  describe('deleteDriver', () => {
    it('marque un chauffeur comme inactif (soft delete)', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          data: () => ({ role: UserRole.DRIVER }),
        }),
        update: vi.fn().mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await driverService.deleteDriver('driver-123');

      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('lance une erreur si le chauffeur n\'existe pas', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({ exists: false }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(
        driverService.deleteDriver('driver-inexistant')
      ).rejects.toThrow('Driver with ID driver-inexistant not found');
    });
  });

  describe('assignToBus', () => {
    it('assigne un chauffeur à un bus', async () => {
      const mockDocRef = {
        get: vi.fn()
          .mockResolvedValueOnce({
            exists: true,
            data: () => ({ role: UserRole.DRIVER }),
          })
          .mockResolvedValueOnce({
            exists: true,
            id: 'driver-123',
            data: () => ({
              email: 'driver@test.com',
              displayName: 'Chauffeur Test',
              phoneNumber: '+33612345678',
              role: UserRole.DRIVER,
              licenseNumber: 'LIC123456',
              licenseExpiry: { toDate: () => new Date('2026-12-31') },
              busId: 'bus-1',
              isActive: true,
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: vi.fn().mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await driverService.assignToBus('driver-123', 'bus-1');

      expect(result.busId).toBe('bus-1');
    });
  });

  describe('removeFromBus', () => {
    it('retire un chauffeur d\'un bus', async () => {
      const mockDocRef = {
        get: vi.fn()
          .mockResolvedValueOnce({
            exists: true,
            data: () => ({ role: UserRole.DRIVER }),
          })
          .mockResolvedValueOnce({
            exists: true,
            id: 'driver-123',
            data: () => ({
              email: 'driver@test.com',
              displayName: 'Chauffeur Test',
              phoneNumber: '+33612345678',
              role: UserRole.DRIVER,
              licenseNumber: 'LIC123456',
              licenseExpiry: { toDate: () => new Date('2026-12-31') },
              busId: null,
              isActive: true,
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: vi.fn().mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await driverService.removeFromBus('driver-123');

      expect(result.busId).toBeNull();
    });
  });

  describe('isLicenseExpired', () => {
    it('retourne true si le permis est expiré', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'driver-123',
          data: () => ({
            email: 'driver@test.com',
            displayName: 'Chauffeur Test',
            phoneNumber: '+33612345678',
            role: UserRole.DRIVER,
            licenseNumber: 'LIC123456',
            licenseExpiry: { toDate: () => new Date('2020-01-01') }, // Expiré
            busId: null,
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await driverService.isLicenseExpired('driver-123');

      expect(result).toBe(true);
    });

    it('retourne false si le permis est valide', async () => {
      const mockDocRef = {
        get: vi.fn().mockResolvedValue({
          exists: true,
          id: 'driver-123',
          data: () => ({
            email: 'driver@test.com',
            displayName: 'Chauffeur Test',
            phoneNumber: '+33612345678',
            role: UserRole.DRIVER,
            licenseNumber: 'LIC123456',
            licenseExpiry: { toDate: () => new Date('2030-01-01') }, // Valide
            busId: null,
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await driverService.isLicenseExpired('driver-123');

      expect(result).toBe(false);
    });
  });
});

