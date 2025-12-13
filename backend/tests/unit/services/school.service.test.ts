/**
 * Tests unitaires pour SchoolService
 * Teste toutes les opérations CRUD sur les écoles
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { SchoolService } from '../../../src/services/school.service';
import { SchoolCreateInput, SchoolUpdateInput } from '../../../src/types/school.types';

// Mock Firestore
// @ts-ignore - Mock types
const mockAdd = jest.fn();
// @ts-ignore - Mock types
const mockGet = jest.fn();
// @ts-ignore - Mock types
const mockDoc = jest.fn();
// @ts-ignore - Mock types
const mockSet = jest.fn();
// @ts-ignore - Mock types
const mockUpdate = jest.fn();
// @ts-ignore - Mock types
const mockDelete = jest.fn();
// @ts-ignore - Mock types
const mockWhere = jest.fn();

jest.mock('../../../src/config/firebase.config', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn((collectionName: string) => {
      if (collectionName === 'schools') {
        return {
          add: mockAdd,
          doc: mockDoc,
          where: mockWhere,
        };
      }
      if (collectionName === 'buses') {
        return {
          where: mockWhere,
        };
      }
      return {};
    }),
  })),
  collections: {
    schools: 'schools',
    buses: 'buses',
  },
}));

describe('SchoolService', () => {
  let schoolService: SchoolService;

  beforeEach(() => {
    jest.clearAllMocks();
    schoolService = new SchoolService();
  });

  describe('createSchool', () => {
    it('crée une nouvelle école avec succès', async () => {
      const mockDocRef: any = {
        id: 'school-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'school-123',
          data: () => ({
            name: 'École Primaire Cocody',
            location: { lat: 5.3599, lng: -4.0083 },
            fleetSize: 5,
            isActive: true,
            createdAt: { toDate: () => new Date('2024-01-01') },
            updatedAt: { toDate: () => new Date('2024-01-01') },
          }),
        }),
      };

      // @ts-ignore - Mock return value
      mockAdd.mockResolvedValue(mockDocRef);

      const input: SchoolCreateInput = {
        name: 'École Primaire Cocody',
        location: { lat: 5.3599, lng: -4.0083 },
        fleetSize: 5,
      };

      const result = await schoolService.createSchool(input);

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'school-123');
      expect(result.name).toBe(input.name);
      expect(result.location).toEqual(input.location);
      expect(result.fleetSize).toBe(5);
      expect(result.isActive).toBe(true);
    });

    it('calcule automatiquement fleetSize si non fourni', async () => {
      const mockDocRef: any = {
        id: 'school-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'school-123',
          data: () => ({
            name: 'École Primaire Cocody',
            location: { lat: 5.3599, lng: -4.0083 },
            fleetSize: 0, // Calculé automatiquement
            isActive: true,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
      };

      // Mock pour compter les bus
      const mockBusesSnapshot: any = {
        size: 3,
      };
      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockBusesSnapshot),
      });

      // @ts-ignore - Mock return value
      mockAdd.mockResolvedValue(mockDocRef);

      const input: SchoolCreateInput = {
        name: 'École Primaire Cocody',
        location: { lat: 5.3599, lng: -4.0083 },
        // fleetSize non fourni
      };

      const result = await schoolService.createSchool(input);

      expect(mockAdd).toHaveBeenCalled();
      expect(result.fleetSize).toBeDefined();
    });

    it('valide les coordonnées GPS', async () => {
      const input: SchoolCreateInput = {
        name: 'École Test',
        location: { lat: 5.3599, lng: -4.0083 },
      };

      const mockDocRef: any = {
        id: 'school-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'school-123',
          data: () => ({
            ...input,
            fleetSize: 0,
            isActive: true,
            createdAt: { toDate: () => new Date() },
            updatedAt: { toDate: () => new Date() },
          }),
        }),
      };

      // @ts-ignore - Mock return value
      mockAdd.mockResolvedValue(mockDocRef);

      await schoolService.createSchool(input);

      const callArgs = mockAdd.mock.calls[0][0];
      expect(callArgs.location.lat).toBeGreaterThanOrEqual(-90);
      expect(callArgs.location.lat).toBeLessThanOrEqual(90);
      expect(callArgs.location.lng).toBeGreaterThanOrEqual(-180);
      expect(callArgs.location.lng).toBeLessThanOrEqual(180);
    });
  });

  describe('getSchoolById', () => {
    it('récupère une école par ID avec succès', async () => {
      const mockSchoolDoc: any = {
        exists: true,
        id: 'school-123',
        data: () => ({
          name: 'École Primaire Cocody',
          location: { lat: 5.3599, lng: -4.0083 },
          fleetSize: 5,
          isActive: true,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      // @ts-ignore - Mock return value
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSchoolDoc),
      });

      const result = await schoolService.getSchoolById('school-123');

      expect(mockDoc).toHaveBeenCalledWith('school-123');
      expect(result).not.toBeNull();
      expect(result?.id).toBe('school-123');
      expect(result?.name).toBe('École Primaire Cocody');
    });

    it('retourne null si l\'école n\'existe pas', async () => {
      const mockSchoolDoc: any = {
        exists: false,
      };

      // @ts-ignore - Mock return value
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSchoolDoc),
      });

      const result = await schoolService.getSchoolById('school-inexistant');

      expect(result).toBeNull();
    });
  });

  describe('getAllSchools', () => {
    it('récupère toutes les écoles actives', async () => {
      const mockSnapshot: any = {
        docs: [
          {
            id: 'school-1',
            data: () => ({
              name: 'École 1',
              location: { lat: 5.3599, lng: -4.0083 },
              fleetSize: 3,
              isActive: true,
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
            }),
          },
          {
            id: 'school-2',
            data: () => ({
              name: 'École 2',
              location: { lat: 5.3600, lng: -4.0084 },
              fleetSize: 5,
              isActive: true,
              createdAt: { toDate: () => new Date() },
              updatedAt: { toDate: () => new Date() },
            }),
          },
        ],
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSnapshot),
      });

      const result = await schoolService.getAllSchools();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('school-1');
      expect(result[1].id).toBe('school-2');
    });

    it('retourne un tableau vide si aucune école', async () => {
      const mockSnapshot: any = {
        docs: [],
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSnapshot),
      });

      const result = await schoolService.getAllSchools();

      expect(result).toEqual([]);
    });
  });

  describe('updateSchool', () => {
    it('met à jour une école avec succès', async () => {
      const mockSchoolDoc: any = {
        exists: true,
        id: 'school-123',
        data: () => ({
          name: 'École Primaire Cocody',
          location: { lat: 5.3599, lng: -4.0083 },
          fleetSize: 5,
          isActive: true,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      const mockUpdatedDoc: any = {
        exists: true,
        id: 'school-123',
        data: () => ({
          name: 'École Primaire Cocody Modifiée',
          location: { lat: 5.3600, lng: -4.0084 },
          fleetSize: 6,
          isActive: true,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-02') },
        }),
      };

      // @ts-ignore - Mock return value
      mockDoc.mockReturnValue({
        get: jest.fn()
          .mockResolvedValueOnce(mockSchoolDoc)
          .mockResolvedValueOnce(mockUpdatedDoc),
        update: mockUpdate,
      });

      // @ts-ignore - Mock return value
      mockUpdate.mockResolvedValue(undefined);

      const updateData: SchoolUpdateInput = {
        name: 'École Primaire Cocody Modifiée',
        location: { lat: 5.3600, lng: -4.0084 },
        fleetSize: 6,
      };

      const result = await schoolService.updateSchool('school-123', updateData);

      expect(mockUpdate).toHaveBeenCalled();
      expect(result).not.toBeNull();
      expect(result?.name).toBe('École Primaire Cocody Modifiée');
      expect(result?.location.lat).toBe(5.3600);
    });

    it('lance une erreur si l\'école n\'existe pas', async () => {
      const mockSchoolDoc: any = {
        exists: false,
      };

      // @ts-ignore - Mock return value
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSchoolDoc),
      });

      const updateData: SchoolUpdateInput = {
        name: 'Nouveau nom',
      };

      await expect(
        schoolService.updateSchool('school-inexistant', updateData)
      ).rejects.toThrow('School school-inexistant not found');
    });
  });

  describe('deleteSchool', () => {
    it('supprime une école (soft delete) avec succès', async () => {
      const mockSchoolDoc: any = {
        exists: true,
        id: 'school-123',
        data: () => ({
          name: 'École Primaire Cocody',
          location: { lat: 5.3599, lng: -4.0083 },
          fleetSize: 5,
          isActive: true,
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-01') },
        }),
      };

      // @ts-ignore - Mock return value
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSchoolDoc),
        update: mockUpdate,
      });

      // @ts-ignore - Mock return value
      mockUpdate.mockResolvedValue(undefined);

      await schoolService.deleteSchool('school-123');

      expect(mockUpdate).toHaveBeenCalledWith({
        isActive: false,
        updatedAt: expect.any(Object),
      });
    });

    it('lance une erreur si l\'école n\'existe pas', async () => {
      const mockSchoolDoc: any = {
        exists: false,
      };

      // @ts-ignore - Mock return value
      mockDoc.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSchoolDoc),
      });

      await expect(schoolService.deleteSchool('school-inexistant')).rejects.toThrow(
        'School school-inexistant not found'
      );
    });
  });

  describe('getSchoolFleetCount', () => {
    it('compte correctement le nombre de bus d\'une école', async () => {
      const mockSnapshot: any = {
        size: 5,
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSnapshot),
      });

      const count = await schoolService.getSchoolFleetCount('school-123');

      expect(mockWhere).toHaveBeenCalledWith('schoolId', '==', 'school-123');
      expect(count).toBe(5);
    });

    it('retourne 0 si l\'école n\'a pas de bus', async () => {
      const mockSnapshot: any = {
        size: 0,
      };

      mockWhere.mockReturnValue({
        get: jest.fn().mockResolvedValue(mockSnapshot),
      });

      const count = await schoolService.getSchoolFleetCount('school-123');

      expect(count).toBe(0);
    });
  });
});

