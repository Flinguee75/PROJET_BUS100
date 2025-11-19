/**
 * Routes pour la gestion des trajets de bus
 */

import { Router } from 'express';
import routeController from '../controllers/route.controller';

const router = Router();

// POST /api/routes/start - Démarrer un trajet
router.post('/start', routeController.startRoute.bind(routeController));

// POST /api/routes/stop - Arrêter un trajet
router.post('/stop', routeController.stopRoute.bind(routeController));

export default router;
