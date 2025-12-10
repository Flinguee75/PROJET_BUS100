/**
 * Tests Unitaires - RouteService
 * Teste la logique métier de gestion des routes
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { RouteService } from '../../src/services/route.service';
import { CommuneAbidjan, DayOfWeek } from '../../src/types/route.types';
import * as admin from 'firebase-admin';

// Mock Firestore
const mockCollection = jest.fn();
const mockAdd = jest.fn();
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockWhere = jest.fn();
const mockLimit = jest.fn();
const mockDoc = jest.fn();

jest.mock('../../src/config/firebase', () => ({
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
      const mockDocRef = {
        id: 'route-123',
      };

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
      mockDelete.mockResolvedValue(undefined);

      await routeService.deleteRoute('route-123');

      expect(mockDoc).toHaveBeenCalledWith('route-123');
      expect(mockDelete).toHaveBeenCalledTimes(1);
    });
  });
});

