/**
 * Contrôleur pour les endpoints en temps réel
 * Gère les requêtes HTTP pour les données de bus en temps réel
 */

import { Request, Response } from 'express';
import { RealtimeService } from '../services/realtime.service';

export class RealtimeController {
  private realtimeService: RealtimeService;

  constructor() {
    this.realtimeService = new RealtimeService();
  }

  /**
   * GET /api/realtime/buses
   * Récupère tous les bus avec leurs données en temps réel
   */
  async getAllBusesRealtime(_req: Request, res: Response): Promise<void> {
    try {
      const buses = await this.realtimeService.getAllBusesRealtimeData();

      res.status(200).json({
        success: true,
        data: buses,
        count: buses.length,
      });
    } catch (error) {
      console.error('Error in getAllBusesRealtime:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des données en temps réel',
        error: message,
      });
    }
  }

  /**
   * GET /api/realtime/statistics
   * Récupère les statistiques du dashboard
   */
  async getBusStatistics(_req: Request, res: Response): Promise<void> {
    try {
      const statistics = await this.realtimeService.getBusStatistics();

      res.status(200).json({
        success: true,
        data: statistics,
      });
    } catch (error) {
      console.error('Error in getBusStatistics:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: message,
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
          message: 'busId parameter is required',
        });
        return;
      }

      // Récupérer tous les bus et filtrer pour celui demandé
      const buses = await this.realtimeService.getAllBusesRealtimeData();
      const bus = buses.find((b) => b.id === busId);

      if (!bus) {
        res.status(404).json({
          success: false,
          message: `Bus ${busId} not found`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: bus,
      });
    } catch (error) {
      console.error('Error in getBusRealtime:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';

      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des données du bus',
        error: message,
      });
    }
  }
}
