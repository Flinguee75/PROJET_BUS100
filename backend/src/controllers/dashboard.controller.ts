/**
 * Contrôleur Dashboard - Gestion des endpoints du dashboard
 */

import { Request, Response } from 'express';
import dashboardService from '../services/dashboard.service';

export class DashboardController {
  /**
   * GET /api/dashboard/stats
   * Récupère les statistiques du dashboard
   */
  async getDashboardStats(_req: Request, res: Response): Promise<void> {
    try {
      const stats = await dashboardService.getDashboardStats();
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des stats:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des statistiques',
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    }
  }
}

export default new DashboardController();
