/**
 * Controller Maintenance - Gestion des endpoints REST pour les maintenances
 * Orchestre les appels au MaintenanceService et gère les réponses HTTP
 */

import { Request, Response } from 'express';
import maintenanceService from '../services/maintenance.service';
import {
  MaintenanceCreateInput,
  MaintenanceUpdateInput,
  MaintenanceFilter,
} from '../types/maintenance.types';

export class MaintenanceController {
  /**
   * POST /api/maintenances
   * Crée un nouveau rapport de maintenance
   */
  async createMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const input: MaintenanceCreateInput = req.body;

      // Validation basique
      if (!input.busId || !input.type || !input.severity || !input.title || !input.description || !input.reportedBy) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: busId, type, severity, title, description, reportedBy',
        });
        return;
      }

      // Convertir les dates si présentes
      if (input.scheduledDate) {
        input.scheduledDate = new Date(input.scheduledDate);
      }

      const maintenance = await maintenanceService.createMaintenance(input);
      res.status(201).json({
        success: true,
        data: maintenance,
      });
    } catch (error: any) {
      console.error('Error creating maintenance:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create maintenance',
      });
    }
  }

  /**
   * GET /api/maintenances
   * Récupère toutes les maintenances avec filtres optionnels
   * Query params:
   * - busId: Filtrer par bus
   * - status: Filtrer par statut
   * - severity: Filtrer par sévérité
   * - type: Filtrer par type
   */
  async getAllMaintenances(req: Request, res: Response): Promise<void> {
    try {
      const filter: MaintenanceFilter = {
        busId: req.query.busId as string | undefined,
        status: req.query.status as any,
        severity: req.query.severity as any,
        type: req.query.type as any,
      };

      // Nettoyer les valeurs undefined
      Object.keys(filter).forEach(
        (key) => filter[key as keyof MaintenanceFilter] === undefined && delete filter[key as keyof MaintenanceFilter]
      );

      const maintenances = await maintenanceService.getAllMaintenances(
        Object.keys(filter).length > 0 ? filter : undefined
      );

      res.json({
        success: true,
        data: maintenances,
      });
    } catch (error: any) {
      console.error('Error fetching maintenances:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch maintenances',
      });
    }
  }

  /**
   * GET /api/maintenances/active
   * Récupère les maintenances actives (non complétées et non annulées)
   */
  async getActiveMaintenances(_req: Request, res: Response): Promise<void> {
    try {
      const maintenances = await maintenanceService.getActiveMaintenances();

      res.json({
        success: true,
        data: maintenances,
      });
    } catch (error: any) {
      console.error('Error fetching active maintenances:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch active maintenances',
      });
    }
  }

  /**
   * GET /api/maintenances/:maintenanceId
   * Récupère une maintenance spécifique par son ID
   */
  async getMaintenanceById(req: Request, res: Response): Promise<void> {
    try {
      const { maintenanceId } = req.params;

      if (!maintenanceId) {
        res.status(400).json({
          success: false,
          error: 'Maintenance ID is required',
        });
        return;
      }

      const maintenance = await maintenanceService.getMaintenanceById(maintenanceId);

      if (!maintenance) {
        res.status(404).json({
          success: false,
          error: `Maintenance with ID ${maintenanceId} not found`,
        });
        return;
      }

      res.json({
        success: true,
        data: maintenance,
      });
    } catch (error: any) {
      console.error('Error fetching maintenance:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch maintenance',
      });
    }
  }

  /**
   * PUT /api/maintenances/:maintenanceId
   * Met à jour une maintenance existante
   */
  async updateMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { maintenanceId } = req.params;
      const input: MaintenanceUpdateInput = req.body;

      if (!maintenanceId) {
        res.status(400).json({
          success: false,
          error: 'Maintenance ID is required',
        });
        return;
      }

      // Convertir les dates si présentes
      if (input.scheduledDate) {
        input.scheduledDate = new Date(input.scheduledDate);
      }
      if (input.completedDate) {
        input.completedDate = new Date(input.completedDate);
      }

      const maintenance = await maintenanceService.updateMaintenance(maintenanceId, input);

      res.json({
        success: true,
        data: maintenance,
      });
    } catch (error: any) {
      console.error('Error updating maintenance:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message || 'Failed to update maintenance',
        });
      }
    }
  }

  /**
   * DELETE /api/maintenances/:maintenanceId
   * Supprime une maintenance
   */
  async deleteMaintenance(req: Request, res: Response): Promise<void> {
    try {
      const { maintenanceId } = req.params;

      if (!maintenanceId) {
        res.status(400).json({
          success: false,
          error: 'Maintenance ID is required',
        });
        return;
      }

      await maintenanceService.deleteMaintenance(maintenanceId);

      res.json({
        success: true,
        message: `Maintenance with ID ${maintenanceId} deleted successfully`,
      });
    } catch (error: any) {
      console.error('Error deleting maintenance:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to delete maintenance',
        });
      }
    }
  }

  /**
   * GET /api/maintenances/bus/:busId
   * Récupère toutes les maintenances d'un bus spécifique
   */
  async getMaintenancesByBusId(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      const maintenances = await maintenanceService.getMaintenancesByBusId(busId);

      res.json({
        success: true,
        data: maintenances,
      });
    } catch (error: any) {
      console.error('Error fetching bus maintenances:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch bus maintenances',
      });
    }
  }
}

export default new MaintenanceController();
