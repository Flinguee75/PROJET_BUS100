// @ts-nocheck
/**
 * Tests unitaires pour StudentService
 * Teste toutes les opérations CRUD sur les élèves
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { StudentService } from '../../../src/services/student.service';

// Mock Firestore helpers
const mockAdd = jest.fn() as jest.Mock;
const mockGet = jest.fn() as jest.Mock;
const mockDoc = jest.fn() as jest.Mock;
const mockUpdate = jest.fn() as jest.Mock;
const mockWhere = jest.fn() as jest.Mock;

jest.mock('../../../src/config/firebase.config', () => ({
  getDb: jest.fn(() => ({
    collection: jest.fn(() => ({
      add: mockAdd,
      get: mockGet,
      doc: mockDoc,
      where: mockWhere,
    })),
  })),
}));

describe('StudentService', () => {
  let studentService: StudentService;

  beforeEach(() => {
    jest.clearAllMocks();
    studentService = new StudentService();

    // Mock chaîné pour where
    mockWhere.mockReturnValue({
      get: mockGet,
      where: mockWhere,
    });
  });

  describe('createStudent', () => {
    it('crée un nouvel élève avec succès', async () => {
      const mockDocRef = {
        id: 'student-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'student-123',
          data: () => ({
            firstName: 'Jean',
            lastName: 'Dupont',
            dateOfBirth: { toDate: () => new Date('2010-05-15') },
            grade: 'CM2',
            parentIds: ['parent-1'],
            busId: null,
            routeId: null,
            pickupLocation: {
              address: '123 Rue de Test',
              lat: 36.8065,
              lng: 10.1815,
            },
            dropoffLocation: {
              address: '456 Avenue Test',
              lat: 36.8165,
              lng: 10.1915,
            },
            isActive: true,
          }),
          createTime: { toDate: () => new Date('2024-01-01') },
          updateTime: { toDate: () => new Date('2024-01-01') },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15'),
        grade: 'CM2',
        parentIds: ['parent-1'],
        commune: 'Cocody',
        quartier: 'Riviera',
        pickupLocation: {
          address: '123 Rue de Test',
          lat: 36.8065,
          lng: 10.1815,
        },
        dropoffLocation: {
          address: '456 Avenue Test',
          lat: 36.8165,
          lng: 10.1915,
        },
      };

      const result = await studentService.createStudent(input);

      expect(mockAdd).toHaveBeenCalled();
      expect(result).toHaveProperty('id', 'student-123');
      expect(result.firstName).toBe('Jean');
      expect(result.lastName).toBe('Dupont');
      expect(result.isActive).toBe(true);
    });

    it('initialise les valeurs par défaut correctement', async () => {
      const mockDocRef = {
        id: 'student-123',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'student-123',
          data: () => ({
            firstName: 'Marie',
            lastName: 'Martin',
            dateOfBirth: { toDate: () => new Date('2011-03-20') },
            grade: 'CE2',
            parentIds: ['parent-2'],
            busId: null,
            routeId: null,
            pickupLocation: {
              address: '789 Rue Test',
              lat: 36.8065,
              lng: 10.1815,
            },
            dropoffLocation: {
              address: '789 Rue Test',
              lat: 36.8065,
              lng: 10.1815,
            },
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        firstName: 'Marie',
        lastName: 'Martin',
        dateOfBirth: new Date('2011-03-20'),
        grade: 'CE2',
        parentIds: ['parent-2'],
        commune: 'Yopougon',
        quartier: 'Niangon',
        pickupLocation: {
          address: '789 Rue Test',
          lat: 36.8065,
          lng: 10.1815,
        },
        dropoffLocation: {
          address: '789 Rue Test',
          lat: 36.8065,
          lng: 10.1815,
        },
      };

      const result = await studentService.createStudent(input);

      expect(result.busId).toBeNull();
      expect(result.routeId).toBeNull();
      expect(result.isActive).toBe(true);
    });
  });

  describe('getAllStudents', () => {
    it('retourne une liste vide quand aucun élève', async () => {
      mockGet.mockResolvedValue({
        docs: [],
      });

      const result = await studentService.getAllStudents();

      expect(result).toEqual([]);
      expect(mockGet).toHaveBeenCalled();
    });

    it('retourne tous les élèves existants', async () => {
      const mockDocs = [
        {
          id: 'student-1',
          data: () => ({
            firstName: 'Jean',
            lastName: 'Dupont',
            dateOfBirth: { toDate: () => new Date('2010-05-15') },
            grade: 'CM2',
            parentIds: ['parent-1'],
            busId: null,
            routeId: null,
            pickupLocation: { address: 'Test 1', lat: 36.8065, lng: 10.1815 },
            dropoffLocation: { address: 'Test 1', lat: 36.8065, lng: 10.1815 },
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
        {
          id: 'student-2',
          data: () => ({
            firstName: 'Marie',
            lastName: 'Martin',
            dateOfBirth: { toDate: () => new Date('2011-03-20') },
            grade: 'CE2',
            parentIds: ['parent-2'],
            busId: null,
            routeId: null,
            pickupLocation: { address: 'Test 2', lat: 36.8065, lng: 10.1815 },
            dropoffLocation: { address: 'Test 2', lat: 36.8065, lng: 10.1815 },
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
      ];

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await studentService.getAllStudents();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('student-1');
      expect(result[1].id).toBe('student-2');
    });
  });

  describe('getStudentById', () => {
    it('retourne null si l\'élève n\'existe pas', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({
          exists: false,
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await studentService.getStudentById('student-inexistant');

      expect(result).toBeNull();
    });

    it('retourne l\'élève s\'il existe', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({
          exists: true,
          id: 'student-123',
          data: () => ({
            firstName: 'Jean',
            lastName: 'Dupont',
            dateOfBirth: { toDate: () => new Date('2010-05-15') },
            grade: 'CM2',
            parentIds: ['parent-1'],
            busId: 'bus-1',
            routeId: 'route-1',
            pickupLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
            dropoffLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await studentService.getStudentById('student-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('student-123');
      expect(result?.firstName).toBe('Jean');
    });
  });

  describe('getStudentsByParent', () => {
    it('retourne les élèves d\'un parent', async () => {
      const mockDocs = [
        {
          id: 'student-1',
          data: () => ({
            firstName: 'Jean',
            lastName: 'Dupont',
            dateOfBirth: { toDate: () => new Date('2010-05-15') },
            grade: 'CM2',
            parentIds: ['parent-1'],
            busId: null,
            routeId: null,
            pickupLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
            dropoffLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
      ];

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await studentService.getStudentsByParent('parent-1');

      expect(result).toHaveLength(1);
      expect(result[0].parentIds).toContain('parent-1');
      expect(mockWhere).toHaveBeenCalledWith('parentIds', 'array-contains', 'parent-1');
    });
  });

  describe('getStudentsByBus', () => {
    it('retourne les élèves d\'un bus', async () => {
      const mockDocs = [
        {
          id: 'student-1',
          data: () => ({
            firstName: 'Jean',
            lastName: 'Dupont',
            dateOfBirth: { toDate: () => new Date('2010-05-15') },
            grade: 'CM2',
            parentIds: ['parent-1'],
            busId: 'bus-1',
            routeId: 'route-1',
            pickupLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
            dropoffLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        },
      ];

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await studentService.getStudentsByBus('bus-1');

      expect(result).toHaveLength(1);
      expect(result[0].busId).toBe('bus-1');
      expect(mockWhere).toHaveBeenCalledWith('busId', '==', 'bus-1');
    });
  });

  describe('updateStudent', () => {
    it('met à jour un élève existant', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({ exists: true })
          .mockResolvedValueOnce({
            exists: true,
            id: 'student-123',
            data: () => ({
              firstName: 'Jean',
              lastName: 'Dupont',
              dateOfBirth: { toDate: () => new Date('2010-05-15') },
              grade: 'CM1',
              parentIds: ['parent-1'],
              busId: 'bus-1',
              routeId: 'route-1',
              pickupLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
              dropoffLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
              isActive: true,
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const updateData = {
        grade: 'CM1',
        busId: 'bus-1',
        routeId: 'route-1',
      };

      const result = await studentService.updateStudent('student-123', updateData);

      expect(mockDocRef.update).toHaveBeenCalled();
      expect(result.grade).toBe('CM1');
      expect(result.busId).toBe('bus-1');
    });

    it('lance une erreur si l\'élève n\'existe pas', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({ exists: false }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(
        studentService.updateStudent('student-inexistant', { grade: 'CM1' })
      ).rejects.toThrow('Student with ID student-inexistant not found');
    });
  });

  describe('deleteStudent', () => {
    it('marque un élève comme inactif (soft delete)', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({ exists: true }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await studentService.deleteStudent('student-123');

      expect(mockDocRef.update).toHaveBeenCalled();
    });

    it('lance une erreur si l\'élève n\'existe pas', async () => {
      const mockDocRef = {
        get: (jest.fn() as any).mockResolvedValue({ exists: false }),
      };

      mockDoc.mockReturnValue(mockDocRef);

      await expect(
        studentService.deleteStudent('student-inexistant')
      ).rejects.toThrow('Student with ID student-inexistant not found');
    });
  });

  describe('assignToBus', () => {
    it('assigne un élève à un bus et une route', async () => {
      const mockDocRef: any = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({ exists: true })
          .mockResolvedValueOnce({
            exists: true,
            id: 'student-123',
            data: () => ({
              firstName: 'Jean',
              lastName: 'Dupont',
              dateOfBirth: { toDate: () => new Date('2010-05-15') },
              grade: 'CM2',
              parentIds: ['parent-1'],
              busId: 'bus-1',
              routeId: 'route-1',
              pickupLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
              dropoffLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
              isActive: true,
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await studentService.assignToBus('student-123', 'bus-1', 'route-1');

      expect(result.busId).toBe('bus-1');
      expect(result.routeId).toBe('route-1');
    });
  });

  describe('removeFromBus', () => {
    it('retire un élève d\'un bus', async () => {
      const baseStudentData = {
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: { toDate: () => new Date('2010-05-15') },
        grade: 'CM2',
        parentIds: ['parent-1'],
        busId: 'bus-1',
        routeId: 'route-1',
        pickupLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
        dropoffLocation: { address: 'Test', lat: 36.8065, lng: 10.1815 },
        isActive: true,
      };

      const mockDocRef: any = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({
            exists: true,
            id: 'student-123',
            data: () => baseStudentData,
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          })
          .mockResolvedValueOnce({ exists: true })
          .mockResolvedValueOnce({
            exists: true,
            id: 'student-123',
            data: () => ({
              ...baseStudentData,
              busId: null,
              routeId: null,
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await studentService.removeFromBus('student-123');

      expect(result.busId).toBeNull();
      expect(result.routeId).toBeNull();
    });
  });

  describe('Multi-location and activeTrips management', () => {
    it('crée un élève avec plusieurs locations selon le moment', async () => {
      const mockDocRef = {
        id: 'student-multi-loc',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'student-multi-loc',
          data: () => ({
            firstName: 'Sophie',
            lastName: 'Martin',
            dateOfBirth: { toDate: () => new Date('2012-03-10') },
            grade: 'CE2',
            parentIds: ['parent-1'],
            commune: 'Cocody',
            quartier: 'Riviera',
            locations: {
              morningPickup: {
                address: '123 Rue Riviera',
                lat: 5.3600,
                lng: -4.0083,
              },
              middayDropoff: {
                address: '456 Rue II Plateaux',
                lat: 5.3650,
                lng: -4.0100,
              },
              middayPickup: {
                address: '456 Rue II Plateaux',
                lat: 5.3650,
                lng: -4.0100,
              },
              eveningDropoff: {
                address: '789 Rue Angré',
                lat: 5.3700,
                lng: -4.0120,
              },
            },
            activeTrips: ['morning_outbound', 'midday_outbound', 'midday_return', 'evening_return'],
            busId: null,
            routeId: null,
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        firstName: 'Sophie',
        lastName: 'Martin',
        dateOfBirth: new Date('2012-03-10'),
        grade: 'CE2',
        parentIds: ['parent-1'],
        commune: 'Cocody',
        quartier: 'Riviera',
        locations: {
          morningPickup: {
            address: '123 Rue Riviera',
            lat: 5.3600,
            lng: -4.0083,
          },
          middayDropoff: {
            address: '456 Rue II Plateaux',
            lat: 5.3650,
            lng: -4.0100,
          },
          middayPickup: {
            address: '456 Rue II Plateaux',
            lat: 5.3650,
            lng: -4.0100,
          },
          eveningDropoff: {
            address: '789 Rue Angré',
            lat: 5.3700,
            lng: -4.0120,
          },
        },
        activeTrips: ['morning_outbound', 'midday_outbound', 'midday_return', 'evening_return'],
      };

      const result = await studentService.createStudent(input as any);

      expect(result.locations.morningPickup).toBeDefined();
      expect(result.locations.middayDropoff).toBeDefined();
      expect(result.locations.middayPickup).toBeDefined();
      expect(result.locations.eveningDropoff).toBeDefined();
      expect(result.activeTrips).toHaveLength(4);
      expect(result.activeTrips).toContain('morning_outbound');
      expect(result.activeTrips).toContain('evening_return');
    });

    it('crée un élève avec seulement matin et soir (pas de trajet midi)', async () => {
      const mockDocRef = {
        id: 'student-morning-evening',
        get: (jest.fn() as any).mockResolvedValue({
          id: 'student-morning-evening',
          data: () => ({
            firstName: 'Pierre',
            lastName: 'Durand',
            dateOfBirth: { toDate: () => new Date('2011-07-20') },
            grade: 'CM1',
            parentIds: ['parent-2'],
            commune: 'Yopougon',
            quartier: 'Niangon',
            locations: {
              morningPickup: {
                address: '100 Rue Niangon',
                lat: 5.3500,
                lng: -4.0500,
              },
              eveningDropoff: {
                address: '100 Rue Niangon',
                lat: 5.3500,
                lng: -4.0500,
              },
            },
            activeTrips: ['morning_outbound', 'evening_return'],
            busId: null,
            routeId: null,
            isActive: true,
          }),
          createTime: { toDate: () => new Date() },
          updateTime: { toDate: () => new Date() },
        }),
      };

      mockAdd.mockResolvedValue(mockDocRef);

      const input = {
        firstName: 'Pierre',
        lastName: 'Durand',
        dateOfBirth: new Date('2011-07-20'),
        grade: 'CM1',
        parentIds: ['parent-2'],
        commune: 'Yopougon',
        quartier: 'Niangon',
        locations: {
          morningPickup: {
            address: '100 Rue Niangon',
            lat: 5.3500,
            lng: -4.0500,
          },
          eveningDropoff: {
            address: '100 Rue Niangon',
            lat: 5.3500,
            lng: -4.0500,
          },
        },
        activeTrips: ['morning_outbound', 'evening_return'],
      };

      const result = await studentService.createStudent(input as any);

      expect(result.locations.morningPickup).toBeDefined();
      expect(result.locations.eveningDropoff).toBeDefined();
      expect(result.locations.middayDropoff).toBeUndefined();
      expect(result.locations.middayPickup).toBeUndefined();
      expect(result.activeTrips).toHaveLength(2);
      expect(result.activeTrips).toContain('morning_outbound');
      expect(result.activeTrips).toContain('evening_return');
      expect(result.activeTrips).not.toContain('midday_outbound');
    });

    it('met à jour les activeTrips d\'un élève', async () => {
      const mockDocRef = {
        get: (jest.fn() as any)
          .mockResolvedValueOnce({ exists: true })
          .mockResolvedValueOnce({
            exists: true,
            id: 'student-123',
            data: () => ({
              firstName: 'Marie',
              lastName: 'Kouassi',
              dateOfBirth: { toDate: () => new Date('2013-02-14') },
              grade: 'CP',
              parentIds: ['parent-3'],
              commune: 'Cocody',
              quartier: 'Riviera',
              locations: {
                morningPickup: {
                  address: '200 Rue test',
                  lat: 5.36,
                  lng: -4.01,
                },
              },
              activeTrips: ['morning_outbound', 'evening_return', 'midday_outbound'],
              busId: null,
              routeId: null,
              isActive: true,
            }),
            createTime: { toDate: () => new Date() },
            updateTime: { toDate: () => new Date() },
          }),
        update: (jest.fn() as any).mockResolvedValue(undefined),
      };

      mockDoc.mockReturnValue(mockDocRef);

      const result = await studentService.updateStudent('student-123', {
        activeTrips: ['morning_outbound', 'evening_return', 'midday_outbound'],
      });

      expect(result.activeTrips).toHaveLength(3);
      expect(result.activeTrips).toContain('midday_outbound');
    });
  });
});
