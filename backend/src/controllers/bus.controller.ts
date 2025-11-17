/**
 * Controller Bus - Gestion des endpoints REST pour les bus
 * Orchestre les appels au BusService et gère les réponses HTTP
 */

import { Request, Response } from 'express';
import busService from '../services/bus.service';
import { BusCreateInput, BusUpdateInput } from '../types/bus.types';

export class BusController {
  /**
   * POST /api/buses
   * Crée un nouveau bus
   */
  async createBus(req: Request, res: Response): Promise<void> {
    try {
      const input: BusCreateInput = req.body;

      // Validation basique
      if (!input.plateNumber || !input.capacity || !input.model || !input.year) {
        res.status(400).json({
          success: false,
          error: 'Missing required fields: plateNumber, capacity, model, year',
        });
        return;
      }

      const bus = await busService.createBus(input);
      res.status(201).json({
        success: true,
        data: bus,
      });
    } catch (error: any) {
      console.error('Error creating bus:', error);
      res.status(400).json({
        success: false,
        error: error.message || 'Failed to create bus',
      });
    }
  }

  /**
   * GET /api/buses
   * Récupère tous les bus
   * Query params:
   * - live=true : Inclut les positions GPS en temps réel
   */
  async getAllBuses(req: Request, res: Response): Promise<void> {
    try {
      const includeLive = req.query.live === 'true';

      const buses = includeLive
        ? await busService.getBusesWithLivePosition()
        : await busService.getAllBuses();

      res.json({
        success: true,
        data: buses,
      });
    } catch (error: any) {
      console.error('Error fetching buses:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch buses',
      });
    }
  }

  /**
   * GET /api/buses/:busId
   * Récupère un bus spécifique par son ID
   */
  async getBusById(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      const bus = await busService.getBusById(busId);

      if (!bus) {
        res.status(404).json({
          success: false,
          error: `Bus with ID ${busId} not found`,
        });
        return;
      }

      res.json({
        success: true,
        data: bus,
      });
    } catch (error: any) {
      console.error('Error fetching bus:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to fetch bus',
      });
    }
  }

  /**
   * PUT /api/buses/:busId
   * Met à jour un bus existant
   */
  async updateBus(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;
      const input: BusUpdateInput = req.body;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      const bus = await busService.updateBus(busId, input);

      res.json({
        success: true,
        data: bus,
      });
    } catch (error: any) {
      console.error('Error updating bus:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(400).json({
          success: false,
          error: error.message || 'Failed to update bus',
        });
      }
    }
  }

  /**
   * DELETE /api/buses/:busId
   * Supprime un bus
   */
  async deleteBus(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      await busService.deleteBus(busId);

      res.json({
        success: true,
        message: `Bus with ID ${busId} deleted successfully`,
      });
    } catch (error: any) {
      console.error('Error deleting bus:', error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
      } else {
        res.status(500).json({
          success: false,
          error: error.message || 'Failed to delete bus',
        });
      }
    }
  }
}

export default new BusController();
