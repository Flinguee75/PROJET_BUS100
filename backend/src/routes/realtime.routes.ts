/**
 * Routes pour les endpoints en temps réel
 * Définit les routes pour les données de bus en temps réel
 */

import express from 'express';
import { RealtimeController } from '../controllers/realtime.controller';

const router = express.Router();
const realtimeController = new RealtimeController();

/**
 * GET /api/realtime/buses
 * Récupère tous les bus avec leurs données en temps réel
 */
router.get('/buses', (req, res) => realtimeController.getAllBusesRealtime(req, res));

/**
 * GET /api/realtime/statistics
 * Récupère les statistiques du dashboard
 */
router.get('/statistics', (req, res) => realtimeController.getBusStatistics(req, res));

/**
 * GET /api/realtime/buses/:busId
 * Récupère un bus spécifique avec ses données en temps réel
 */
router.get('/buses/:busId', (req, res) => realtimeController.getBusRealtime(req, res));

export default router;
