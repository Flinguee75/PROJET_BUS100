/**
 * Controller Realtime - Gestion des requêtes HTTP pour les données en temps réel
 * Thin controller : délègue la logique métier au service
 */

import { Request, Response } from 'express';
import realtimeService from '../services/realtime.service';

export class RealtimeController {
  /**
   * GET /api/realtime/buses
   * Récupère tous les bus avec leurs données en temps réel enrichies
   */
  async getAllBusesRealtime(_req: Request, res: Response): Promise<void> {
    try {
      const buses = await realtimeService.getAllBusesRealtime();
      res.status(200).json({
        success: true,
        data: buses,
        count: buses.length,
      });
    } catch (error) {
      console.error('Error fetching realtime buses:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch realtime bus data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/realtime/statistics
   * Récupère les statistiques globales des bus
   */
  async getBusStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await realtimeService.getBusStatistics();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Error fetching bus statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch bus statistics',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/realtime/buses/:busId
   * Récupère un bus spécifique avec ses données en temps réel
   */
  async getBusRealtime(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      const bus = await realtimeService.getBusRealtime(busId);

      if (!bus) {
        res.status(404).json({
          success: false,
          error: `Bus with ID ${busId} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: bus,
      });
    } catch (error) {
      console.error('Error fetching realtime bus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch realtime bus data',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new RealtimeController();
