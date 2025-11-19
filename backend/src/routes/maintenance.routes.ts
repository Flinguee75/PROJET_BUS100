/**
 * Maintenance Routes - Définition des endpoints API pour les maintenances
 * Routes CRUD complètes pour la gestion des maintenances des bus
 */

import { Router } from 'express';
import maintenanceController from '../controllers/maintenance.controller';

const router = Router();

/**
 * GET /api/maintenances/active
 * Récupère les maintenances actives (non complétées et non annulées)
 * IMPORTANT: Doit venir AVANT la route /:maintenanceId générique
 */
router.get('/active', (req, res) => maintenanceController.getActiveMaintenances(req, res));

/**
 * GET /api/maintenances/bus/:busId
 * Récupère toutes les maintenances d'un bus spécifique
 * IMPORTANT: Doit venir AVANT la route /:maintenanceId générique
 */
router.get('/bus/:busId', (req, res) => maintenanceController.getMaintenancesByBusId(req, res));

/**
 * POST /api/maintenances
 * Crée un nouveau rapport de maintenance
 */
router.post('/', (req, res) => maintenanceController.createMaintenance(req, res));

/**
 * GET /api/maintenances
 * Récupère toutes les maintenances avec filtres optionnels
 * Query params: ?busId=xxx&status=xxx&severity=xxx&type=xxx
 */
router.get('/', (req, res) => maintenanceController.getAllMaintenances(req, res));

/**
 * GET /api/maintenances/:maintenanceId
 * Récupère une maintenance spécifique
 */
router.get('/:maintenanceId', (req, res) => maintenanceController.getMaintenanceById(req, res));

/**
 * PUT /api/maintenances/:maintenanceId
 * Met à jour une maintenance existante
 */
router.put('/:maintenanceId', (req, res) => maintenanceController.updateMaintenance(req, res));

/**
 * DELETE /api/maintenances/:maintenanceId
 * Supprime une maintenance
 */
router.delete('/:maintenanceId', (req, res) => maintenanceController.deleteMaintenance(req, res));

export default router;
