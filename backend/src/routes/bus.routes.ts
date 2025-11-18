/**
 * Bus Routes - Définition des endpoints API pour les bus
 * Routes CRUD complètes pour la gestion des bus
 */

import { Router } from 'express';
import busController from '../controllers/bus.controller';
import gpsController from '../controllers/gps.controller';

const router = Router();

/**
 * POST /api/buses
 * Crée un nouveau bus
 */
router.post('/', (req, res) => busController.createBus(req, res));

/**
 * GET /api/buses
 * Récupère tous les bus
 * Query params: ?live=true pour inclure les positions GPS
 */
router.get('/', (req, res) => busController.getAllBuses(req, res));

/**
 * GET /api/buses/:busId/position
 * Alias pour /api/gps/live/:busId - Récupère la position GPS actuelle d'un bus
 * Cette route permet la compatibilité avec le frontend
 * IMPORTANT: Doit venir AVANT la route /:busId générique
 */
router.get('/:busId/position', (req, res) => gpsController.getLivePosition(req, res));

/**
 * GET /api/buses/:busId/history
 * Alias pour /api/gps/history/:busId - Récupère l'historique GPS d'un bus
 * Query params: ?date=YYYY-MM-DD (optionnel, par défaut aujourd'hui)
 * Cette route permet la compatibilité avec le frontend
 * IMPORTANT: Doit venir AVANT la route /:busId générique
 */
router.get('/:busId/history', (req, res) => gpsController.getHistory(req, res));

/**
 * GET /api/buses/:busId
 * Récupère un bus spécifique
 */
router.get('/:busId', (req, res) => busController.getBusById(req, res));

/**
 * PUT /api/buses/:busId
 * Met à jour un bus existant
 */
router.put('/:busId', (req, res) => busController.updateBus(req, res));

/**
 * DELETE /api/buses/:busId
 * Supprime un bus
 */
router.delete('/:busId', (req, res) => busController.deleteBus(req, res));

export default router;
