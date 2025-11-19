/**
 * Routes Realtime - Endpoints pour les données en temps réel
 */

import { Router } from 'express';
import realtimeController from '../controllers/realtime.controller';

const router = Router();

/**
 * GET /api/realtime/buses
 * Récupère tous les bus avec données en temps réel
 */
router.get('/buses', (req, res) => realtimeController.getAllBusesRealtime(req, res));

/**
 * GET /api/realtime/statistics
 * Récupère les statistiques globales
 */
router.get('/statistics', (req, res) => realtimeController.getBusStatistics(req, res));

/**
 * GET /api/realtime/buses/:busId
 * Récupère un bus spécifique avec données en temps réel
 */
router.get('/buses/:busId', (req, res) => realtimeController.getBusRealtime(req, res));

export default router;
