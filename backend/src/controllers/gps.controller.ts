/**
 * GPS Controller - Gestion des requêtes HTTP pour le tracking GPS
 * Responsabilité: Validation + Orchestration + Réponse HTTP
 * PAS de logique métier ici (elle est dans gps.service.ts)
 */

import { Request, Response } from 'express';
import { gpsUpdateSchema } from '../utils/validation.schemas';
import gpsService from '../services/gps.service';
import { ZodError } from 'zod';

export class GPSController {
  /**
   * POST /api/gps/update
   * Met à jour la position GPS d'un bus
   * Body: { busId, lat, lng, speed, heading?, accuracy?, timestamp }
   */
  async updatePosition(req: Request, res: Response): Promise<void> {
    try {
      // Validation stricte avec Zod
      const validatedData = gpsUpdateSchema.parse(req.body);

      // Appel au service (logique métier)
      const result = await gpsService.updateGPSPosition(validatedData);

      // Réponse HTTP success
      res.status(200).json({
        success: true,
        message: 'Position GPS mise à jour',
        data: result,
      });
    } catch (error) {
      // Gestion erreurs validation
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors,
        });
        return;
      }

      // Gestion erreurs métier
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Erreur inconnue
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      });
    }
  }

  /**
   * GET /api/gps/live/:busId
   * Récupère la position live d'un bus spécifique
   */
  async getLivePosition(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          message: 'Bus ID requis',
        });
        return;
      }

      const position = await gpsService.getLivePosition(busId);

      if (!position) {
        res.status(404).json({
          success: false,
          message: `Position du bus ${busId} introuvable`,
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: position,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération',
      });
    }
  }

  /**
   * GET /api/gps/live
   * Récupère toutes les positions live
   */
  async getAllLivePositions(_req: Request, res: Response): Promise<void> {
    try {
      const positions = await gpsService.getAllLivePositions();

      res.status(200).json({
        success: true,
        count: positions.length,
        data: positions,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération',
      });
    }
  }

  /**
   * GET /api/gps/history/:busId
   * Récupère l'historique GPS d'un bus
   * Query params: date (format YYYY-MM-DD)
   */
  async getHistory(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;
      const { date } = req.query;

      if (!busId) {
        res.status(400).json({
          success: false,
          message: 'Bus ID requis',
        });
        return;
      }

      // Date par défaut = aujourd'hui
      const targetDate = date ? new Date(date as string) : new Date();

      const history = await gpsService.getHistoryForDay(busId, targetDate);

      res.status(200).json({
        success: true,
        busId,
        date: targetDate.toISOString().split('T')[0],
        count: history.length,
        data: history,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'historique',
      });
    }
  }

  /**
   * POST /api/gps/calculate-eta
   * Calcule l'ETA entre position actuelle et destination
   * Body: { currentLat, currentLng, destLat, destLng, currentSpeed }
   */
  async calculateETA(req: Request, res: Response): Promise<void> {
    try {
      const { currentLat, currentLng, destLat, destLng, currentSpeed } =
        req.body;

      // Validation simple
      if (
        currentLat === undefined ||
        currentLng === undefined ||
        destLat === undefined ||
        destLng === undefined ||
        currentSpeed === undefined
      ) {
        res.status(400).json({
          success: false,
          message: 'Tous les paramètres sont requis',
        });
        return;
      }

      const etaMinutes = gpsService.calculateETA(
        currentLat,
        currentLng,
        destLat,
        destLng,
        currentSpeed
      );

      res.status(200).json({
        success: true,
        data: {
          etaMinutes,
          etaText:
            etaMinutes === -1
              ? 'Impossible de calculer (vitesse = 0)'
              : `${etaMinutes} minutes`,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul ETA',
      });
    }
  }
}

export default new GPSController();
