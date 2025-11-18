/**
 * GPS Routes - Définition des endpoints API GPS
 */

import { Router } from 'express';
import gpsController from '../controllers/gps.controller';

const router = Router();

/**
 * POST /api/gps/update
 * Met à jour la position GPS d'un bus
 * Utilisé par l'app mobile chauffeur
 */
router.post('/update', (req, res) => gpsController.updatePosition(req, res));

/**
 * GET /api/gps/live/:busId
 * Récupère la position live d'un bus spécifique
 */
router.get('/live/:busId', (req, res) => gpsController.getLivePosition(req, res));

/**
 * GET /api/gps/live
 * Récupère toutes les positions live de tous les bus
 * Utilisé par l'admin web
 */
router.get('/live', (req, res) => gpsController.getAllLivePositions(req, res));

/**
 * GET /api/gps/history/:busId
 * Récupère l'historique GPS d'un bus
 * Query param: ?date=YYYY-MM-DD (optionnel, défaut = aujourd'hui)
 */
router.get('/history/:busId', (req, res) => gpsController.getHistory(req, res));

/**
 * POST /api/gps/calculate-eta
 * Calcule le temps d'arrivée estimé
 */
router.post('/calculate-eta', (req, res) => gpsController.calculateETA(req, res));

export default router;
