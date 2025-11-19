/**
 * Route Controller - Gestion des trajets de bus
 * Endpoints pour démarrer/arrêter les trajets
 */

import { Request, Response } from 'express';
import notificationService from '../services/notification.service';
import { getDb, collections } from '../config/firebase.config';

export class RouteController {
  /**
   * Démarrer un trajet - Envoie une notification à tous les parents
   * POST /api/routes/start
   */
  async startRoute(req: Request, res: Response): Promise<void> {
    try {
      const { busId, driverId } = req.body;

      if (!busId || !driverId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID and Driver ID are required',
        });
        return;
      }

      // Mettre à jour le statut du bus
      const db = getDb();
      await db.collection(collections.buses).doc(busId).update({
        status: 'en_route',
        updatedAt: new Date(),
      });

      // Envoyer les notifications aux parents
      await notificationService.notifyParentsRouteStarted(busId, driverId);

      res.status(200).json({
        success: true,
        message: 'Route started and parents notified',
        data: {
          busId,
          driverId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('❌ Error starting route:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to start route',
      });
    }
  }

  /**
   * Arrêter un trajet
   * POST /api/routes/stop
   */
  async stopRoute(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.body;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      // Mettre à jour le statut du bus
      const db = getDb();
      await db.collection(collections.buses).doc(busId).update({
        status: 'hors_service',
        updatedAt: new Date(),
      });

      res.status(200).json({
        success: true,
        message: 'Route stopped',
        data: {
          busId,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: any) {
      console.error('❌ Error stopping route:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Failed to stop route',
      });
    }
  }
}

export default new RouteController();
