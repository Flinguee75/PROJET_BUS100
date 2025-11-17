/**
 * Bus Routes - Définition des endpoints API pour les bus
 * Routes CRUD complètes pour la gestion des bus
 */

import { Router } from 'express';
import busController from '../controllers/bus.controller';

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

