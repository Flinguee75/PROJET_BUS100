/**
 * Tests unitaires pour GPS Controller
 * Test de la gestion des requêtes HTTP et validation
 */

import { GPSController } from '../../src/controllers/gps.controller';
import gpsService from '../../src/services/gps.service';
import { BusLiveStatus } from '../../src/types';
import { Request, Response } from 'express';

// Mock GPS Service
jest.mock('../../src/services/gps.service');

describe('GPSController', () => {
  let controller: GPSController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new GPSController();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });

    mockRequest = {
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    jest.clearAllMocks();
  });

  describe('updatePosition', () => {
    it('should update GPS position successfully', async () => {
      const gpsData = {
        busId: 'bus-001',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        heading: 180,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const mockResult = {
        busId: 'bus-001',
        position: {
          lat: 48.8566,
          lng: 2.3522,
          speed: 50,
          heading: 180,
          accuracy: 10,
          timestamp: gpsData.timestamp,
        },
        status: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-123',
        routeId: 'route-456',
        passengersCount: 0,
        lastUpdate: new Date(),
      };

      (gpsService.updateGPSPosition as jest.Mock).mockResolvedValue(mockResult);

      mockRequest.body = gpsData;

      await controller.updatePosition(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(gpsService.updateGPSPosition).toHaveBeenCalledWith(gpsData);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Position GPS mise à jour',
        data: mockResult,
      });
    });

    it('should return 422 for invalid data', async () => {
      mockRequest.body = {
        busId: 'bus-001',
        lat: 95, // Invalid latitude
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      await controller.updatePosition(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(422);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Données invalides',
        errors: expect.any(Array),
      });
    });

    it('should return 400 for business logic errors', async () => {
      const gpsData = {
        busId: 'non-existent-bus',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      (gpsService.updateGPSPosition as jest.Mock).mockRejectedValue(
        new Error('Bus non-existent-bus not found')
      );

      mockRequest.body = gpsData;

      await controller.updatePosition(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Bus non-existent-bus not found',
      });
    });

    it('should return 500 for unknown errors', async () => {
      const gpsData = {
        busId: 'bus-001',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      (gpsService.updateGPSPosition as jest.Mock).mockRejectedValue(
        'Unknown error'
      );

      mockRequest.body = gpsData;

      await controller.updatePosition(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur serveur',
      });
    });
  });

  describe('getLivePosition', () => {
    it('should return live position for existing bus', async () => {
      const mockPosition = {
        busId: 'bus-001',
        position: {
          lat: 48.8566,
          lng: 2.3522,
          speed: 50,
          timestamp: Date.now(),
        },
        status: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-123',
        routeId: 'route-456',
        passengersCount: 0,
        lastUpdate: new Date(),
      };

      (gpsService.getLivePosition as jest.Mock).mockResolvedValue(mockPosition);

      mockRequest.params = { busId: 'bus-001' };

      await controller.getLivePosition(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(gpsService.getLivePosition).toHaveBeenCalledWith('bus-001');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockPosition,
      });
    });

    it('should return 400 when busId is missing', async () => {
      mockRequest.params = {};

      await controller.getLivePosition(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Bus ID requis',
      });
    });

    it('should return 404 when position not found', async () => {
      (gpsService.getLivePosition as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { busId: 'non-existent-bus' };

      await controller.getLivePosition(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Position du bus non-existent-bus introuvable',
      });
    });

    it('should return 500 for server errors', async () => {
      (gpsService.getLivePosition as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.params = { busId: 'bus-001' };

      await controller.getLivePosition(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de la récupération',
      });
    });
  });

  describe('getAllLivePositions', () => {
    it('should return all live positions', async () => {
      const mockPositions = [
        {
          busId: 'bus-001',
          position: { lat: 48.8566, lng: 2.3522, speed: 50, timestamp: Date.now() },
          status: BusLiveStatus.EN_ROUTE,
          driverId: 'driver-123',
          routeId: 'route-456',
          passengersCount: 0,
          lastUpdate: new Date(),
        },
        {
          busId: 'bus-002',
          position: { lat: 45.764, lng: 4.8357, speed: 30, timestamp: Date.now() },
          status: BusLiveStatus.EN_ROUTE,
          driverId: 'driver-456',
          routeId: 'route-789',
          passengersCount: 0,
          lastUpdate: new Date(),
        },
      ];

      (gpsService.getAllLivePositions as jest.Mock).mockResolvedValue(
        mockPositions
      );

      await controller.getAllLivePositions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(gpsService.getAllLivePositions).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockPositions,
      });
    });

    it('should return empty array when no positions exist', async () => {
      (gpsService.getAllLivePositions as jest.Mock).mockResolvedValue([]);

      await controller.getAllLivePositions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: [],
      });
    });

    it('should return 500 for server errors', async () => {
      (gpsService.getAllLivePositions as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await controller.getAllLivePositions(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors de la récupération',
      });
    });
  });

  describe('getHistory', () => {
    it('should return history for specific date', async () => {
      const mockHistory = [
        {
          busId: 'bus-001',
          position: { lat: 48.8566, lng: 2.3522, speed: 50, timestamp: Date.now() },
          timestamp: new Date(),
        },
        {
          busId: 'bus-001',
          position: { lat: 48.8600, lng: 2.3550, speed: 55, timestamp: Date.now() },
          timestamp: new Date(),
        },
      ];

      (gpsService.getHistoryForDay as jest.Mock).mockResolvedValue(mockHistory);

      mockRequest.params = { busId: 'bus-001' };
      mockRequest.query = { date: '2024-01-15' };

      await controller.getHistory(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(gpsService.getHistoryForDay).toHaveBeenCalledWith(
        'bus-001',
        expect.any(Date)
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        busId: 'bus-001',
        date: '2024-01-15',
        count: 2,
        data: mockHistory,
      });
    });

    it('should use today as default date when not provided', async () => {
      (gpsService.getHistoryForDay as jest.Mock).mockResolvedValue([]);

      mockRequest.params = { busId: 'bus-001' };
      mockRequest.query = {};

      await controller.getHistory(
        mockRequest as Request,
        mockResponse as Response
      );

      const today = new Date().toISOString().split('T')[0];

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        busId: 'bus-001',
        date: today,
        count: 0,
        data: [],
      });
    });

    it('should return 400 when busId is missing', async () => {
      mockRequest.params = {};
      mockRequest.query = { date: '2024-01-15' };

      await controller.getHistory(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Bus ID requis',
      });
    });

    it('should return 500 for server errors', async () => {
      (gpsService.getHistoryForDay as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      mockRequest.params = { busId: 'bus-001' };
      mockRequest.query = { date: '2024-01-15' };

      await controller.getHistory(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: "Erreur lors de la récupération de l'historique",
      });
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA successfully', async () => {
      const etaData = {
        currentLat: 48.8566,
        currentLng: 2.3522,
        destLat: 48.8600,
        destLng: 2.3550,
        currentSpeed: 50,
      };

      (gpsService.calculateETA as jest.Mock).mockReturnValue(15);

      mockRequest.body = etaData;

      await controller.calculateETA(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(gpsService.calculateETA).toHaveBeenCalledWith(
        48.8566,
        2.3522,
        48.8600,
        2.3550,
        50
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          etaMinutes: 15,
          etaText: '15 minutes',
        },
      });
    });

    it('should handle ETA -1 (speed = 0)', async () => {
      const etaData = {
        currentLat: 48.8566,
        currentLng: 2.3522,
        destLat: 48.8600,
        destLng: 2.3550,
        currentSpeed: 0,
      };

      (gpsService.calculateETA as jest.Mock).mockReturnValue(-1);

      mockRequest.body = etaData;

      await controller.calculateETA(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: {
          etaMinutes: -1,
          etaText: 'Impossible de calculer (vitesse = 0)',
        },
      });
    });

    it('should return 400 when parameters are missing', async () => {
      mockRequest.body = {
        currentLat: 48.8566,
        // Missing other parameters
      };

      await controller.calculateETA(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Tous les paramètres sont requis',
      });
    });

    it('should return 400 when currentLat is undefined', async () => {
      mockRequest.body = {
        currentLng: 2.3522,
        destLat: 48.8600,
        destLng: 2.3550,
        currentSpeed: 50,
      };

      await controller.calculateETA(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 400 when currentSpeed is undefined', async () => {
      mockRequest.body = {
        currentLat: 48.8566,
        currentLng: 2.3522,
        destLat: 48.8600,
        destLng: 2.3550,
      };

      await controller.calculateETA(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });

    it('should return 500 for server errors', async () => {
      const etaData = {
        currentLat: 48.8566,
        currentLng: 2.3522,
        destLat: 48.8600,
        destLng: 2.3550,
        currentSpeed: 50,
      };

      (gpsService.calculateETA as jest.Mock).mockImplementation(() => {
        throw new Error('Calculation error');
      });

      mockRequest.body = etaData;

      await controller.calculateETA(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Erreur lors du calcul ETA',
      });
    });
  });
});
