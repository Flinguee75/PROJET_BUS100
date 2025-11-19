/**
 * Routes pour la gestion des routes (itinéraires) et des trajets (start/stop)
 * Combine CRUD des routes + contrôle temps réel des trajets + génération automatique
 */

import { Router } from 'express';
import routeController from '../controllers/route.controller';

const router = Router();

// ========================================
// PARTIE 1: Routes de contrôle temps réel (start/stop)
// Ces routes doivent être définies AVANT les routes avec :id
// ========================================

// POST /api/routes/start - Démarrer un trajet
router.post('/start', routeController.startRoute.bind(routeController));

// POST /api/routes/stop - Arrêter un trajet
router.post('/stop', routeController.stopRoute.bind(routeController));

// ========================================
// PARTIE 2: Routes utilitaires (doivent venir AVANT les routes avec :id)
// ========================================

router.get('/available', routeController.getAvailableRoutes.bind(routeController));
router.get('/communes', routeController.getCommunes.bind(routeController));
router.get('/quartiers/:commune', routeController.getQuartiersByCommune.bind(routeController));

// ========================================
// PARTIE 3: Routes de génération automatique (AVANT :id)
// ========================================

router.post('/generate/:busId', routeController.generateRouteForBus.bind(routeController));
router.post('/regenerate/:busId', routeController.regenerateRoute.bind(routeController));
router.get('/by-bus/:busId', routeController.getRouteByBus.bind(routeController));
router.get('/preview/:busId', routeController.previewRoute.bind(routeController));

// ========================================
// PARTIE 4: Routes CRUD des itinéraires
// ========================================

router.get('/', routeController.getAllRoutes.bind(routeController));
router.get('/:id', routeController.getRouteById.bind(routeController));
router.post('/', routeController.createRoute.bind(routeController));
router.patch('/:id', routeController.updateRoute.bind(routeController));
router.delete('/:id', routeController.deleteRoute.bind(routeController));

// ========================================
// PARTIE 5: Routes spécifiques d'assignation
// ========================================

router.post('/:id/assign-bus', routeController.assignBus.bind(routeController));
router.post('/:id/remove-bus', routeController.removeBus.bind(routeController));
router.post('/:id/assign-driver', routeController.assignDriver.bind(routeController));

export default router;
