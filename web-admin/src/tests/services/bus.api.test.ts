/**
 * Tests pour le service API Bus
 * Teste les appels API pour la gestion des bus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

// Créer l'instance mockée réutilisable avec vi.hoisted pour qu'elle soit disponible dans vi.mock
const mockAxiosInstance = vi.hoisted(() => ({
  interceptors: {
    request: {
      use: vi.fn(),
      eject: vi.fn(),
    },
    response: {
      use: vi.fn(),
      eject: vi.fn(),
    },
  },
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
}));

// Mock axios AVANT tous les imports
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => mockAxiosInstance),
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      patch: vi.fn(),
      delete: vi.fn(),
    },
  };
});

// Mock Firebase auth pour éviter les erreurs
vi.mock('@/services/firebase', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

import axios from 'axios';
import * as busApi from '@/services/bus.api';

const mockedAxios = vi.mocked(axios, true);

describe('Bus API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createBus', () => {
    it('crée un bus avec succès', async () => {
      const mockBus = {
        id: 'bus-123',
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes Sprinter',
        year: 2024,
        capacity: 50,
        status: 'active',
        maintenanceStatus: 'ok',
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockBus,
        },
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const input = {
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes Sprinter',
        year: 2024,
        capacity: 50,
      };

      const result = await busApi.createBus(input);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/buses', input);
      expect(result).toEqual(mockBus);
    });

    it('lance une erreur en cas d\'échec', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'Invalid data',
          },
        },
      };

      mockAxiosInstance.post.mockRejectedValue(errorResponse);

      const input = {
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes',
        year: 2024,
        capacity: 50,
      };

      await expect(busApi.createBus(input)).rejects.toThrow('Invalid data');
    });

    it('lance une erreur générique si pas de message d\'erreur', async () => {
      mockAxiosInstance.post.mockRejectedValue(new Error('Network error'));

      const input = {
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes',
        year: 2024,
        capacity: 50,
      };

      await expect(busApi.createBus(input)).rejects.toThrow(
        'Impossible de créer le bus'
      );
    });
  });

  describe('getAllBuses', () => {
    it('récupère tous les bus sans positions GPS', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes',
          year: 2024,
          capacity: 50,
          status: 'active',
          maintenanceStatus: 'ok',
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const mockResponse = {
        data: {
          success: true,
          data: mockBuses,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await busApi.getAllBuses(false);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/buses', {
        params: { live: false },
      });
      expect(result).toEqual(mockBuses);
    });

    it('récupère tous les bus avec positions GPS', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes',
          year: 2024,
          capacity: 50,
          status: 'active',
          maintenanceStatus: 'ok',
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          currentPosition: {
            lat: 36.8065,
            lng: 10.1815,
            speed: 45,
            timestamp: Date.now(),
          },
        },
      ];

      const mockResponse = {
        data: {
          success: true,
          data: mockBuses,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await busApi.getAllBuses(true);

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/buses', {
        params: { live: true },
      });
      expect(result[0]).toHaveProperty('currentPosition');
    });

    it('lance une erreur en cas d\'échec', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'Database error',
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(errorResponse);

      await expect(busApi.getAllBuses()).rejects.toThrow('Database error');
    });
  });

  describe('getBusById', () => {
    it('récupère un bus spécifique', async () => {
      const mockBus = {
        id: 'bus-123',
        plateNumber: 'TU 123 TN 456',
        model: 'Mercedes',
        year: 2024,
        capacity: 50,
        status: 'active',
        maintenanceStatus: 'ok',
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockBus,
        },
      };

      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await busApi.getBusById('bus-123');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/api/buses/bus-123');
      expect(result).toEqual(mockBus);
    });

    it('lance une erreur si le bus n\'existe pas', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'Bus not found',
          },
        },
      };

      mockAxiosInstance.get.mockRejectedValue(errorResponse);

      await expect(busApi.getBusById('bus-inexistant')).rejects.toThrow(
        'Bus not found'
      );
    });
  });

  describe('updateBus', () => {
    it('met à jour un bus avec succès', async () => {
      const mockUpdatedBus = {
        id: 'bus-123',
        plateNumber: 'TU 999 TN 999',
        model: 'Mercedes',
        year: 2024,
        capacity: 60,
        status: 'active',
        maintenanceStatus: 'ok',
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockResponse = {
        data: {
          success: true,
          data: mockUpdatedBus,
        },
      };

      mockAxiosInstance.put.mockResolvedValue(mockResponse);

      const updateData = {
        plateNumber: 'TU 999 TN 999',
        capacity: 60,
      };

      const result = await busApi.updateBus('bus-123', updateData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith(
        '/api/buses/bus-123',
        updateData
      );
      expect(result.plateNumber).toBe('TU 999 TN 999');
      expect(result.capacity).toBe(60);
    });

    it('lance une erreur en cas d\'échec', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'Update failed',
          },
        },
      };

      mockAxiosInstance.put.mockRejectedValue(errorResponse);

      await expect(
        busApi.updateBus('bus-123', { capacity: 60 })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('deleteBus', () => {
    it('supprime un bus avec succès', async () => {
      const mockResponse = {
        data: {
          success: true,
          message: 'Bus deleted',
        },
      };

      mockAxiosInstance.delete.mockResolvedValue(mockResponse);

      await busApi.deleteBus('bus-123');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/api/buses/bus-123');
    });

    it('lance une erreur en cas d\'échec', async () => {
      const errorResponse = {
        response: {
          data: {
            error: 'Bus not found',
          },
        },
      };

      mockAxiosInstance.delete.mockRejectedValue(errorResponse);

      await expect(busApi.deleteBus('bus-inexistant')).rejects.toThrow(
        'Bus not found'
      );
    });
  });
});

