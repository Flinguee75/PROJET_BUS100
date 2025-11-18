/**
 * Routes Dashboard - Endpoints pour le dashboard
 */

import { Router } from 'express';
import dashboardController from '../controllers/dashboard.controller';

const router = Router();

// GET /api/dashboard/stats - Statistiques du dashboard
router.get('/stats', (req, res) => dashboardController.getDashboardStats(req, res));

export default router;
