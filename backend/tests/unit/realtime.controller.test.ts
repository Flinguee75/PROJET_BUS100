/**
 * Tests unitaires pour RealtimeController
 * Test des réponses HTTP et de la gestion des erreurs
 */

import { Request, Response } from 'express';
import { RealtimeController } from '../../src/controllers/realtime.controller';
import realtimeService from '../../src/services/realtime.service';
import { BusStatus } from '../../src/types/bus.types';
import { BusLiveStatus } from '../../src/types/gps.types';

// Mock du service
jest.mock('../../src/services/realtime.service');

describe('RealtimeController', () => {
  let controller: RealtimeController;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new RealtimeController();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockReq = {};
    mockRes = {
      status: mockStatus,
      json: mockJson,
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBusesRealtime', () => {
    it('should return all buses with 200 status', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          plateNumber: 'CI 1001 AB 11',
          capacity: 35,
          model: 'Mercedes',
          year: 2021,
          status: BusStatus.ACTIVE,
          currentPosition: {
            lat: 5.3473,
            lng: -3.9875,
            speed: 35,
            timestamp: Date.now(),
          },
          liveStatus: BusLiveStatus.EN_ROUTE,
          driver: {
            id: 'driver-1',
            name: 'Kouassi Jean',
            phone: '+225 07 12 34 56 78',
          },
          route: {
            id: 'route-1',
            name: 'Cocody → Plateau',
            fromZone: 'Cocody',
            toZone: 'Plateau',
          },
          passengersCount: 25,
          currentZone: 'Cocody',
          lastUpdate: new Date(),
          isActive: true,
        },
      ];

      (realtimeService.getAllBusesRealtime as jest.Mock).mockResolvedValue(mockBuses);

      await controller.getAllBusesRealtime(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockBuses,
        count: 1,
      });
    });

    it('should return 500 on service error', async () => {
      (realtimeService.getAllBusesRealtime as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await controller.getAllBusesRealtime(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch realtime bus data',
        message: 'Database error',
      });
    });
  });

  describe('getBusStatistics', () => {
    it('should return statistics with 200 status', async () => {
      const mockStats = {
        total: 5,
        active: 3,
        inactive: 2,
        enRoute: 2,
        stopped: 1,
        totalPassengers: 75,
      };

      (realtimeService.getBusStatistics as jest.Mock).mockResolvedValue(mockStats);

      await controller.getBusStatistics(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockStats,
      });
    });

    it('should return 500 on service error', async () => {
      (realtimeService.getBusStatistics as jest.Mock).mockRejectedValue(
        new Error('Stats calculation failed')
      );

      await controller.getBusStatistics(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch bus statistics',
        message: 'Stats calculation failed',
      });
    });
  });

  describe('getBusRealtime', () => {
    it('should return bus data with 200 status when found', async () => {
      const mockBus = {
        id: 'bus-1',
        plateNumber: 'CI 1001 AB 11',
        capacity: 35,
        model: 'Mercedes',
        year: 2021,
        status: BusStatus.ACTIVE,
        currentPosition: {
          lat: 5.3473,
          lng: -3.9875,
          speed: 35,
          timestamp: Date.now(),
        },
        liveStatus: BusLiveStatus.EN_ROUTE,
        driver: {
          id: 'driver-1',
          name: 'Kouassi Jean',
          phone: '+225 07 12 34 56 78',
        },
        route: null,
        passengersCount: 25,
        currentZone: 'Cocody',
        lastUpdate: new Date(),
        isActive: true,
      };

      mockReq.params = { busId: 'bus-1' };
      (realtimeService.getBusRealtime as jest.Mock).mockResolvedValue(mockBus);

      await controller.getBusRealtime(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockBus,
      });
    });

    it('should return 404 when bus not found', async () => {
      mockReq.params = { busId: 'non-existent' };
      (realtimeService.getBusRealtime as jest.Mock).mockResolvedValue(null);

      await controller.getBusRealtime(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Bus with ID non-existent not found',
      });
    });

    it('should return 400 when busId is missing', async () => {
      mockReq.params = {};

      await controller.getBusRealtime(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Bus ID is required',
      });
    });

    it('should return 500 on service error', async () => {
      mockReq.params = { busId: 'bus-1' };
      (realtimeService.getBusRealtime as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await controller.getBusRealtime(mockReq as Request, mockRes as Response);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        error: 'Failed to fetch realtime bus data',
        message: 'Database error',
      });
    });
  });
});
