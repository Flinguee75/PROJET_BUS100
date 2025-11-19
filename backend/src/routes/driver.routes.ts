/**
 * Routes pour la gestion des chauffeurs
 */

import { Router } from 'express';
import driverController from '../controllers/driver.controller';

const router = Router();

// Routes CRUD
router.get('/', driverController.getAllDrivers.bind(driverController));
router.get('/expired-licenses', driverController.getExpiredLicenses.bind(driverController));
router.get('/bus/:busId', driverController.getDriverByBus.bind(driverController));
router.get('/:id', driverController.getDriverById.bind(driverController));
router.post('/', driverController.createDriver.bind(driverController));
router.patch('/:id', driverController.updateDriver.bind(driverController));
router.delete('/:id', driverController.deleteDriver.bind(driverController));

// Routes spécifiques
router.post('/:id/assign-bus', driverController.assignToBus.bind(driverController));
router.post('/:id/remove-bus', driverController.removeFromBus.bind(driverController));

export default router;

