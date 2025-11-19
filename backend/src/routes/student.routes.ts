/**
 * Routes pour la gestion des élèves
 */

import { Router } from 'express';
import studentController from '../controllers/student.controller';

const router = Router();

// Routes CRUD
router.get('/', studentController.getAllStudents.bind(studentController));
router.get('/:id', studentController.getStudentById.bind(studentController));
router.post('/', studentController.createStudent.bind(studentController));
router.patch('/:id', studentController.updateStudent.bind(studentController));
router.delete('/:id', studentController.deleteStudent.bind(studentController));

// Routes spécifiques
router.post('/:id/assign-bus', studentController.assignToBus.bind(studentController));
router.post('/:id/remove-bus', studentController.removeFromBus.bind(studentController));

export default router;

