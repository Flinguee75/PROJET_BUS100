/**
 * School Routes - Définition des endpoints API pour les écoles
 * Routes CRUD complètes pour la gestion des écoles
 */

import { Router } from 'express';
import schoolController from '../controllers/school.controller';

const router = Router();

/**
 * POST /api/schools
 * Crée une nouvelle école
 */
router.post('/', (req, res) => schoolController.createSchool(req, res));

/**
 * GET /api/schools
 * Récupère toutes les écoles actives
 */
router.get('/', (req, res) => schoolController.getAllSchools(req, res));

/**
 * GET /api/schools/:schoolId/fleet
 * Récupère la flotte (nombre de bus) d'une école
 * IMPORTANT: Doit venir AVANT la route /:schoolId générique
 */
router.get('/:schoolId/fleet', (req, res) => schoolController.getSchoolFleet(req, res));

/**
 * GET /api/schools/:schoolId
 * Récupère une école spécifique
 */
router.get('/:schoolId', (req, res) => schoolController.getSchoolById(req, res));

/**
 * PUT /api/schools/:schoolId
 * Met à jour une école existante
 */
router.put('/:schoolId', (req, res) => schoolController.updateSchool(req, res));

/**
 * DELETE /api/schools/:schoolId
 * Supprime une école (soft delete)
 */
router.delete('/:schoolId', (req, res) => schoolController.deleteSchool(req, res));

export default router;
