/**
 * Routes pour la gestion de l'attendance (montée/descente des élèves)
 */

import { Router } from 'express';
import attendanceController from '../controllers/attendance.controller';

const router = Router();

// POST /api/attendance/board - Enregistrer montée d'élève
router.post('/board', attendanceController.boardStudent.bind(attendanceController));

// POST /api/attendance/exit - Enregistrer descente d'élève
router.post('/exit', attendanceController.exitStudent.bind(attendanceController));

// GET /api/attendance/student/:studentId - Attendance d'un élève aujourd'hui (ou date spécifique)
router.get(
  '/student/:studentId',
  attendanceController.getStudentAttendance.bind(attendanceController)
);

// GET /api/attendance/student/:studentId/history - Historique d'un élève
router.get(
  '/student/:studentId/history',
  attendanceController.getStudentAttendanceHistory.bind(attendanceController)
);

// GET /api/attendance/bus/:busId/students - Liste des élèves dans le bus
router.get('/bus/:busId/students', attendanceController.getStudentsOnBus.bind(attendanceController));

// GET /api/attendance/bus/:busId/count - Nombre d'élèves dans le bus
router.get(
  '/bus/:busId/count',
  attendanceController.countStudentsOnBus.bind(attendanceController)
);

// GET /api/attendance/bus/:busId/history - Historique d'attendance du bus
router.get(
  '/bus/:busId/history',
  attendanceController.getBusAttendanceHistory.bind(attendanceController)
);

export default router;
