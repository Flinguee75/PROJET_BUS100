/**
 * Controller Driver - Gestion des requêtes HTTP pour les chauffeurs
 * Thin controller - toute la logique est dans le service
 */

import { Request, Response } from 'express';
import driverService from '../services/driver.service';
import {
  driverCreateSchema,
  driverUpdateSchema,
} from '../utils/validation.schemas';
import { ZodError } from 'zod';

export class DriverController {
  /**
   * GET /api/drivers
   * Récupère tous les chauffeurs ou les chauffeurs disponibles
   */
  async getAllDrivers(_req: Request, res: Response): Promise<void> {
    try {
      const { available } = _req.query;

      let drivers;
      if (available === 'true') {
        drivers = await driverService.getAvailableDrivers();
      } else {
        drivers = await driverService.getAllDrivers();
      }

      res.status(200).json({
        success: true,
        data: drivers,
        count: drivers.length,
      });
    } catch (error) {
      console.error('Error fetching drivers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch drivers',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/drivers/:id
   * Récupère un chauffeur par son ID
   */
  async getDriverById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Driver ID is required',
        });
        return;
      }
      const driver = await driverService.getDriverById(id);

      if (!driver) {
        res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: driver,
      });
    } catch (error) {
      console.error('Error fetching driver:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch driver',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/drivers/bus/:busId
   * Récupère le chauffeur assigné à un bus
   */
  async getDriverByBus(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;
      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }
      const driver = await driverService.getDriverByBus(busId);

      if (!driver) {
        res.status(404).json({
          success: false,
          error: 'No driver assigned to this bus',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: driver,
      });
    } catch (error) {
      console.error('Error fetching driver by bus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch driver',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/drivers/expired-licenses
   * Récupère les chauffeurs avec permis expiré
   */
  async getExpiredLicenses(_req: Request, res: Response): Promise<void> {
    try {
      const drivers = await driverService.getDriversWithExpiredLicense();

      res.status(200).json({
        success: true,
        data: drivers,
        count: drivers.length,
      });
    } catch (error) {
      console.error('Error fetching expired licenses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch expired licenses',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/drivers
   * Crée un nouveau chauffeur
   */
  async createDriver(req: Request, res: Response): Promise<void> {
    try {
      // Validation avec Zod
      const validatedData = driverCreateSchema.parse(req.body);

      const driver = await driverService.createDriver(validatedData);

      res.status(201).json({
        success: true,
        data: driver,
        message: 'Driver created successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Error creating driver:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create driver',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/drivers/:id
   * Met à jour un chauffeur
   */
  async updateDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Driver ID is required',
        });
        return;
      }

      // Validation avec Zod
      const validatedData = driverUpdateSchema.parse(req.body);

      const driver = await driverService.updateDriver(id, validatedData);

      res.status(200).json({
        success: true,
        data: driver,
        message: 'Driver updated successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
        return;
      }

      console.error('Error updating driver:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update driver',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/drivers/:id
   * Supprime un chauffeur (soft delete)
   */
  async deleteDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Driver ID is required',
        });
        return;
      }
      await driverService.deleteDriver(id);

      res.status(200).json({
        success: true,
        message: 'Driver deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
        return;
      }

      console.error('Error deleting driver:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete driver',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/drivers/:id/assign-bus
   * Assigne un chauffeur à un bus
   */
  async assignToBus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Driver ID is required',
        });
        return;
      }

      const { busId } = req.body;
      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'busId is required',
        });
        return;
      }

      const driver = await driverService.assignToBus(id, busId);

      res.status(200).json({
        success: true,
        data: driver,
        message: 'Driver assigned to bus successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
        return;
      }

      console.error('Error assigning driver to bus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign driver to bus',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/drivers/:id/remove-bus
   * Retire un chauffeur d'un bus
   */
  async removeFromBus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Driver ID is required',
        });
        return;
      }
      const driver = await driverService.removeFromBus(id);

      res.status(200).json({
        success: true,
        data: driver,
        message: 'Driver removed from bus successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Driver not found',
        });
        return;
      }

      console.error('Error removing driver from bus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove driver from bus',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new DriverController();

