/**
 * Routes pour la gestion des routes géographiques
 */

import { Router } from 'express';
import routeController from '../controllers/route.controller';

const router = Router();

// Routes utilitaires (doivent venir AVANT les routes avec :id)
router.get('/available', routeController.getAvailableRoutes.bind(routeController));
router.get('/communes', routeController.getCommunes.bind(routeController));
router.get('/quartiers/:commune', routeController.getQuartiersByCommune.bind(routeController));

// Routes CRUD
router.get('/', routeController.getAllRoutes.bind(routeController));
router.get('/:id', routeController.getRouteById.bind(routeController));
router.post('/', routeController.createRoute.bind(routeController));
router.patch('/:id', routeController.updateRoute.bind(routeController));
router.delete('/:id', routeController.deleteRoute.bind(routeController));

// Routes spécifiques d'assignation
router.post('/:id/assign-bus', routeController.assignBus.bind(routeController));
router.post('/:id/remove-bus', routeController.removeBus.bind(routeController));
router.post('/:id/assign-driver', routeController.assignDriver.bind(routeController));

export default router;

