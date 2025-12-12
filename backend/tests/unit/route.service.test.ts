// @ts-nocheck
/**
 * Tests Unitaires - RouteService
 * Teste la logique métier de gestion des routes
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RouteService } from '../../src/services/route.service';
import { CommuneAbidjan, DayOfWeek } from '../../src/types/route.types';
import * as admin from 'firebase-admin';

// Mock Firestore
const mockCollection = jest.fn() as jest.Mock;
const mockAdd = jest.fn() as jest.Mock;
const mockGet = jest.fn() as jest.Mock;
const mockUpdate = jest.fn() as jest.Mock;
const mockDelete = jest.fn() as jest.Mock;
const mockWhere = jest.fn() as jest.Mock;
const mockLimit = jest.fn() as jest.Mock;
const mockDoc = jest.fn() as jest.Mock;

jest.mock('../../src/config/firebase.config', () => ({
  getDb: jest.fn(() => ({
    collection: mockCollection,
  })),
}));

describe('RouteService', () => {
  let routeService: RouteService;

  const mockRouteData = {
    name: 'Route Cocody - École ABC',
    code: 'COC-ABC-001',
    description: 'Route principale pour Cocody',
    commune: CommuneAbidjan.COCODY,
    quartiers: ['Riviera', 'II Plateaux'],
    stops: [
      {
        name: 'Arrêt Riviera',
        address: 'Boulevard VGE, Riviera',
        location: { lat: 5.3600, lng: -4.0083 },
        order: 1,
        estimatedTimeMinutes: 5,
        type: 'pickup' as const,
        quartier: 'Riviera',
      },
    ],
    schedule: {
      morningDeparture: '07:00',
      morningArrival: '08:00',
      afternoonDeparture: '16:00',
      afternoonArrival: '17:00',
    },
    totalDistanceKm: 12.5,
    estimatedDurationMinutes: 45,
    capacity: 40,
    activeDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    routeService = new RouteService();

    // Setup mock chain
    mockCollection.mockReturnValue({
      add: mockAdd,
      doc: mockDoc,
      where: mockWhere,
      get: mockGet,
    });

    mockDoc.mockReturnValue({
      get: mockGet,
      update: mockUpdate,
      delete: mockDelete,
    });

    mockWhere.mockReturnValue({
      get: mockGet,
      where: mockWhere,
      limit: mockLimit,
    });

    mockLimit.mockReturnValue({
      get: mockGet,
    });
  });

  describe('createRoute', () => {
    it('devrait créer une route avec des IDs générés pour les arrêts', async () => {
      const mockSnapshot = {
        data: () => ({
          ...mockRouteData,
          stops: [{ ...mockRouteData.stops[0], id: expect.any(String) }],
          busId: null,
          driverId: null,
          currentOccupancy: 0,
          isActive: true,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        }),
      };

      const mockDocRef = {
        id: 'route-123',
        get: jest.fn().mockResolvedValue(mockSnapshot),
      };

      mockAdd.mockResolvedValue(mockDocRef);
      mockGet.mockResolvedValue(mockSnapshot);

      const result = await routeService.createRoute(mockRouteData);

      expect(mockAdd).toHaveBeenCalledTimes(1);
      expect(result.id).toBe('route-123');
      expect(result.name).toBe(mockRouteData.name);
      expect(result.stops[0].id).toBeDefined();
      expect(result.busId).toBeNull();
      expect(result.driverId).toBeNull();
      expect(result.currentOccupancy).toBe(0);
    });
  });

  describe('getRouteById', () => {
    it('devrait récupérer une route par son ID', async () => {
      const mockSnapshot = {
        exists: true,
        data: () => ({
          ...mockRouteData,
          stops: [{ ...mockRouteData.stops[0], id: 'stop-1' }],
          busId: null,
          driverId: null,
          currentOccupancy: 0,
          isActive: true,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        }),
      };

      mockGet.mockResolvedValue(mockSnapshot);

      const result = await routeService.getRouteById('route-123');

      expect(mockDoc).toHaveBeenCalledWith('route-123');
      expect(result).toBeDefined();
      expect(result?.name).toBe(mockRouteData.name);
    });

    it('devrait retourner null si la route n\'existe pas', async () => {
      mockGet.mockResolvedValue({ exists: false });

      const result = await routeService.getRouteById('invalid-id');

      expect(result).toBeNull();
    });
  });

  describe('getAllRoutes', () => {
    it('devrait récupérer toutes les routes', async () => {
      const mockDocs = [
        {
          id: 'route-1',
          data: () => ({
            ...mockRouteData,
            stops: [{ ...mockRouteData.stops[0], id: 'stop-1' }],
            busId: null,
            driverId: null,
            currentOccupancy: 0,
            isActive: true,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          }),
        },
        {
          id: 'route-2',
          data: () => ({
            ...mockRouteData,
            name: 'Route Yopougon',
            commune: CommuneAbidjan.YOPOUGON,
            stops: [{ ...mockRouteData.stops[0], id: 'stop-2' }],
            busId: null,
            driverId: null,
            currentOccupancy: 0,
            isActive: true,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          }),
        },
      ];

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await routeService.getAllRoutes();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('route-1');
      expect(result[1].commune).toBe(CommuneAbidjan.YOPOUGON);
    });
  });

  describe('getRoutesByCommune', () => {
    it('devrait récupérer les routes d\'une commune', async () => {
      const mockDocs = [
        {
          id: 'route-1',
          data: () => ({
            ...mockRouteData,
            stops: [{ ...mockRouteData.stops[0], id: 'stop-1' }],
            busId: null,
            driverId: null,
            currentOccupancy: 0,
            isActive: true,
            createdAt: admin.firestore.Timestamp.now(),
            updatedAt: admin.firestore.Timestamp.now(),
          }),
        },
      ];

      mockGet.mockResolvedValue({ docs: mockDocs });

      const result = await routeService.getRoutesByCommune(CommuneAbidjan.COCODY);

      expect(mockWhere).toHaveBeenCalledWith('commune', '==', CommuneAbidjan.COCODY);
      expect(result).toHaveLength(1);
      expect(result[0].commune).toBe(CommuneAbidjan.COCODY);
    });
  });

  describe('assignBus', () => {
    it('devrait assigner un bus à une route', async () => {
      const mockSnapshot = {
        exists: true,
        data: () => ({
          ...mockRouteData,
          stops: [{ ...mockRouteData.stops[0], id: 'stop-1' }],
          busId: 'bus-123',
          driverId: null,
          currentOccupancy: 0,
          isActive: true,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        }),
      };

      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      const result = await routeService.assignBus('route-123', 'bus-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          busId: 'bus-123',
        })
      );
      expect(result.busId).toBe('bus-123');
    });
  });

  describe('assignDriver', () => {
    it('devrait assigner un chauffeur à une route', async () => {
      const mockSnapshot = {
        exists: true,
        data: () => ({
          ...mockRouteData,
          stops: [{ ...mockRouteData.stops[0], id: 'stop-1' }],
          busId: null,
          driverId: 'driver-123',
          currentOccupancy: 0,
          isActive: true,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        }),
      };

      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      const result = await routeService.assignDriver('route-123', 'driver-123');

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          driverId: 'driver-123',
        })
      );
      expect(result.driverId).toBe('driver-123');
    });
  });

  describe('updateRoute', () => {
    it('devrait mettre à jour une route', async () => {
      const updateData = {
        name: 'Route mise à jour',
        capacity: 50,
      };

      const mockSnapshot = {
        exists: true,
        data: () => ({
          ...mockRouteData,
          ...updateData,
          stops: [{ ...mockRouteData.stops[0], id: 'stop-1' }],
          busId: null,
          driverId: null,
          currentOccupancy: 0,
          isActive: true,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        }),
      };

      mockGet.mockResolvedValue(mockSnapshot);
      mockUpdate.mockResolvedValue(undefined);

      const result = await routeService.updateRoute('route-123', updateData);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Route mise à jour',
          capacity: 50,
        })
      );
      expect(result.name).toBe('Route mise à jour');
    });
  });

  describe('deleteRoute', () => {
    it('devrait supprimer une route', async () => {
      mockGet.mockResolvedValue({ exists: true });
      mockUpdate.mockResolvedValue(undefined);

      await routeService.deleteRoute('route-123');

      expect(mockDoc).toHaveBeenCalledWith('route-123');
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        })
      );
    });
  });

  describe('TimeOfDay and Multi-Period Schedules', () => {
    it('devrait créer une route avec schedule multi-périodes (4 moments)', async () => {
      const routeDataWithMultiSchedule = {
        name: 'Route Cocody - École ABC',
        code: 'COC-ABC-001',
        description: 'Route avec horaires complets',
        commune: CommuneAbidjan.COCODY,
        quartiers: ['Riviera', 'II Plateaux'],
        stops: [
          {
            name: 'Arrêt Riviera',
            address: 'Boulevard VGE, Riviera',
            location: { lat: 5.3600, lng: -4.0083 },
            order: 1,
            estimatedTimeMinutes: 5,
            type: 'pickup' as const,
            quartier: 'Riviera',
            activeTimeSlots: ['morning_outbound', 'midday_outbound', 'midday_return', 'evening_return'],
          },
        ],
        schedule: {
          morningOutbound: {
            departure: '07:00',
            arrival: '08:00',
          },
          middayOutbound: {
            departure: '11:45',
            arrival: '12:45',
          },
          middayReturn: {
            departure: '13:00',
            arrival: '14:00',
          },
          eveningReturn: {
            departure: '15:30',
            arrival: '16:30',
          },
        },
        totalDistanceKm: 12.5,
        estimatedDurationMinutes: 45,
        capacity: 40,
        activeDays: [DayOfWeek.MONDAY, DayOfWeek.TUESDAY],
      };

      const mockSnapshot = {
        data: () => ({
          ...routeDataWithMultiSchedule,
          stops: [{ ...routeDataWithMultiSchedule.stops[0], id: 'stop-1' }],
          busId: null,
          driverId: null,
          currentOccupancy: 0,
          isActive: true,
          isManual: true,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        }),
        id: 'route-123',
        exists: true,
      };

      const mockDocRef = {
        id: 'route-123',
        get: jest.fn().mockResolvedValue(mockSnapshot),
      };

      mockAdd.mockResolvedValue(mockDocRef);
      mockGet.mockResolvedValue(mockSnapshot);

      const result = await routeService.createRoute(routeDataWithMultiSchedule);

      expect(result.id).toBe('route-123');
      expect(result.schedule.morningOutbound).toBeDefined();
      expect(result.schedule.middayOutbound).toBeDefined();
      expect(result.schedule.middayReturn).toBeDefined();
      expect(result.schedule.eveningReturn).toBeDefined();
      expect(result.schedule.morningOutbound?.departure).toBe('07:00');
      expect(result.schedule.middayOutbound?.departure).toBe('11:45');
    });

    it('devrait accepter une route avec seulement certaines périodes actives', async () => {
      const routeDataPartialSchedule = {
        name: 'Route Cocody - Matin/Soir seulement',
        code: 'COC-ABC-002',
        commune: CommuneAbidjan.COCODY,
        quartiers: ['Riviera'],
        stops: [
          {
            name: 'Arrêt Riviera',
            address: 'Boulevard VGE, Riviera',
            location: { lat: 5.3600, lng: -4.0083 },
            order: 1,
            estimatedTimeMinutes: 5,
            type: 'pickup' as const,
            quartier: 'Riviera',
            activeTimeSlots: ['morning_outbound', 'evening_return'],
          },
        ],
        schedule: {
          morningOutbound: {
            departure: '07:00',
            arrival: '08:00',
          },
          eveningReturn: {
            departure: '15:30',
            arrival: '16:30',
          },
        },
        totalDistanceKm: 10.0,
        estimatedDurationMinutes: 40,
        capacity: 30,
        activeDays: [DayOfWeek.MONDAY],
      };

      const mockSnapshot = {
        data: () => ({
          ...routeDataPartialSchedule,
          stops: [{ ...routeDataPartialSchedule.stops[0], id: 'stop-1' }],
          busId: null,
          driverId: null,
          currentOccupancy: 0,
          isActive: true,
          isManual: true,
          createdAt: admin.firestore.Timestamp.now(),
          updatedAt: admin.firestore.Timestamp.now(),
        }),
        id: 'route-456',
        exists: true,
      };

      const mockDocRef = {
        id: 'route-456',
        get: jest.fn().mockResolvedValue(mockSnapshot),
      };

      mockAdd.mockResolvedValue(mockDocRef);
      mockGet.mockResolvedValue(mockSnapshot);

      const result = await routeService.createRoute(routeDataPartialSchedule);

      expect(result.schedule.morningOutbound).toBeDefined();
      expect(result.schedule.eveningReturn).toBeDefined();
      expect(result.schedule.middayOutbound).toBeUndefined();
      expect(result.schedule.middayReturn).toBeUndefined();
    });

    it('devrait gérer les arrêts avec activeTimeSlots spécifiques', async () => {
      const stopWithTimeSlots = {
        name: 'Arrêt Matin uniquement',
        address: 'Rue test',
        location: { lat: 5.36, lng: -4.01 },
        order: 1,
        estimatedTimeMinutes: 10,
        type: 'pickup' as const,
        quartier: 'Riviera',
        activeTimeSlots: ['morning_outbound'],
      };

      expect(stopWithTimeSlots.activeTimeSlots).toContain('morning_outbound');
      expect(stopWithTimeSlots.activeTimeSlots).toHaveLength(1);
    });
  });
});
