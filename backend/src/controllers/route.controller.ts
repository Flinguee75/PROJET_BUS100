/**
 * Route Controller - Gestion des requêtes HTTP pour les routes
 * Responsabilité: Validation + Orchestration + Réponse HTTP
 * PAS de logique métier ici (elle est dans route.service.ts)
 */

import { Request, Response } from 'express';
import { routeStartSchema } from '../utils/validation.schemas';
import routeService from '../services/route.service';
import { ZodError } from 'zod';

export class RouteController {
  /**
   * POST /api/routes/start
   * Lance une course pour un bus
   * Body: { busId, driverId }
   */
  async startRoute(req: Request, res: Response): Promise<void> {
    try {
      // Validation stricte avec Zod
      const validatedData = routeStartSchema.parse(req.body);
      const { busId, driverId } = validatedData;

      // Appel au service (logique métier)
      await routeService.startRoute(busId, driverId);

      // Réponse HTTP success
      res.status(200).json({
        success: true,
        message: 'Course démarrée avec succès',
        data: {
          busId,
          driverId,
          status: 'en_route',
        },
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
   * GET /api/routes/:busId/students
   * Récupère la liste des élèves d'un bus dans l'ordre défini
   * Query params: date (optionnel, format YYYY-MM-DD, défaut: aujourd'hui)
   */
  async getRouteStudents(req: Request, res: Response): Promise<void> {
    try {
      const busId = req.params.busId;
      if (!busId || typeof busId !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Bus ID requis',
        });
        return;
      }

      const dateParam = req.query.date;
      const defaultDate = new Date().toISOString().split('T')[0];
      const date = (typeof dateParam === 'string' && dateParam) ? dateParam : defaultDate;

      // Validation du format de date
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        res.status(422).json({
          success: false,
          message: 'Format de date invalide. Utilisez YYYY-MM-DD',
        });
        return;
      }

      // Appel au service (logique métier)
      // busId est garanti d'être défini après la vérification ci-dessus
      const students = await routeService.getRouteStudents(busId, date);

      // Réponse HTTP success
      res.status(200).json({
        success: true,
        message: 'Liste des élèves récupérée avec succès',
        data: {
          busId,
          date,
          students,
          total: students.length,
        },
      });
    } catch (error) {
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
}

export default new RouteController();

