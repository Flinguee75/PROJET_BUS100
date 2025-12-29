/**
 * Route Routes - Définition des endpoints API pour les routes
 */

import { Router } from 'express';
import routeController from '../controllers/route.controller';

const router = Router();

/**
 * POST /api/routes/start
 * Lance une course pour un bus
 * Utilisé par l'app mobile chauffeur
 */
router.post('/start', (req, res) => routeController.startRoute(req, res));

/**
 * GET /api/routes/:busId/students
 * Récupère la liste des élèves d'un bus dans l'ordre défini
 * Query params: date (optionnel, format YYYY-MM-DD)
 */
router.get('/:busId/students', (req, res) => routeController.getRouteStudents(req, res));

export default router;
