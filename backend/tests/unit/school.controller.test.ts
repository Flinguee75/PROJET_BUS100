/**
 * Tests unitaires pour School Controller
 * Test de la gestion des requêtes HTTP et validation
 */

import { SchoolController } from '../../src/controllers/school.controller';
import schoolService from '../../src/services/school.service';
import { Request, Response } from 'express';
import { ZodError } from 'zod';

// Mock School Service
jest.mock('../../src/services/school.service');

describe('SchoolController', () => {
  let controller: SchoolController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    controller = new SchoolController();

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

  describe('createSchool', () => {
    it('crée une école avec succès', async () => {
      const schoolData = {
        name: 'École Primaire Cocody',
        location: { lat: 5.3599, lng: -4.0083 },
        fleetSize: 5,
      };

      const mockSchool = {
        id: 'school-123',
        ...schoolData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (schoolService.createSchool as jest.Mock).mockResolvedValue(mockSchool);

      mockRequest.body = schoolData;

      await controller.createSchool(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(schoolService.createSchool).toHaveBeenCalledWith(schoolData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'École créée avec succès',
        data: mockSchool,
      });
    });

    it('retourne une erreur 422 pour données invalides', async () => {
      const invalidData = {
        name: '', // Nom vide
        location: { lat: 200, lng: -4.0083 }, // Latitude invalide
      };

      const zodError = new ZodError([
        {
          path: ['name'],
          message: 'Le nom de l\'école doit contenir au moins 2 caractères',
          code: 'too_small',
        },
        {
          path: ['location', 'lat'],
          message: 'Latitude invalide',
          code: 'too_big',
        },
      ]);

      mockRequest.body = invalidData;

      // Simuler une erreur de validation Zod
      jest.spyOn(require('zod'), 'z').mockImplementation(() => ({
        object: () => ({
          parse: () => {
            throw zodError;
          },
        }),
      }));

      await controller.createSchool(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(422);
    });
  });

  describe('getSchoolById', () => {
    it('récupère une école par ID avec succès', async () => {
      const mockSchool = {
        id: 'school-123',
        name: 'École Primaire Cocody',
        location: { lat: 5.3599, lng: -4.0083 },
        fleetSize: 5,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (schoolService.getSchoolById as jest.Mock).mockResolvedValue(mockSchool);

      mockRequest.params = { schoolId: 'school-123' };

      await controller.getSchoolById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(schoolService.getSchoolById).toHaveBeenCalledWith('school-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSchool,
      });
    });

    it('retourne 404 si l\'école n\'existe pas', async () => {
      (schoolService.getSchoolById as jest.Mock).mockResolvedValue(null);

      mockRequest.params = { schoolId: 'school-inexistant' };

      await controller.getSchoolById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'École introuvable',
      });
    });
  });

  describe('getAllSchools', () => {
    it('récupère toutes les écoles avec succès', async () => {
      const mockSchools = [
        {
          id: 'school-1',
          name: 'École 1',
          location: { lat: 5.3599, lng: -4.0083 },
          fleetSize: 3,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'school-2',
          name: 'École 2',
          location: { lat: 5.3600, lng: -4.0084 },
          fleetSize: 5,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (schoolService.getAllSchools as jest.Mock).mockResolvedValue(mockSchools);

      await controller.getAllSchools(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(schoolService.getAllSchools).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: mockSchools,
      });
    });
  });

  describe('updateSchool', () => {
    it('met à jour une école avec succès', async () => {
      const updateData = {
        name: 'École Primaire Cocody Modifiée',
        fleetSize: 6,
      };

      const mockUpdatedSchool = {
        id: 'school-123',
        name: 'École Primaire Cocody Modifiée',
        location: { lat: 5.3599, lng: -4.0083 },
        fleetSize: 6,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (schoolService.updateSchool as jest.Mock).mockResolvedValue(
        mockUpdatedSchool
      );

      mockRequest.params = { schoolId: 'school-123' };
      mockRequest.body = updateData;

      await controller.updateSchool(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(schoolService.updateSchool).toHaveBeenCalledWith(
        'school-123',
        updateData
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'École mise à jour avec succès',
        data: mockUpdatedSchool,
      });
    });

    it('retourne 404 si l\'école n\'existe pas', async () => {
      (schoolService.updateSchool as jest.Mock).mockRejectedValue(
        new Error('School school-inexistant not found')
      );

      mockRequest.params = { schoolId: 'school-inexistant' };
      mockRequest.body = { name: 'Nouveau nom' };

      await controller.updateSchool(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteSchool', () => {
    it('supprime une école avec succès', async () => {
      (schoolService.deleteSchool as jest.Mock).mockResolvedValue(undefined);

      mockRequest.params = { schoolId: 'school-123' };

      await controller.deleteSchool(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(schoolService.deleteSchool).toHaveBeenCalledWith('school-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'École supprimée avec succès',
      });
    });

    it('retourne 404 si l\'école n\'existe pas', async () => {
      (schoolService.deleteSchool as jest.Mock).mockRejectedValue(
        new Error('School school-inexistant not found')
      );

      mockRequest.params = { schoolId: 'school-inexistant' };

      await controller.deleteSchool(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
    });
  });

  describe('getSchoolFleet', () => {
    it('récupère la flotte d\'une école avec succès', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          busNumber: 1,
          plateNumber: 'TU 123 AB',
          schoolId: 'school-123',
        },
        {
          id: 'bus-2',
          busNumber: 2,
          plateNumber: 'TU 456 CD',
          schoolId: 'school-123',
        },
      ];

      (schoolService.getSchoolFleetCount as jest.Mock).mockResolvedValue(2);
      // Mock pour récupérer les bus (nécessitera une méthode dans le service)
      // Pour l'instant, on teste juste le comptage

      mockRequest.params = { schoolId: 'school-123' };

      await controller.getSchoolFleet(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(schoolService.getSchoolFleetCount).toHaveBeenCalledWith(
        'school-123'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });
});

