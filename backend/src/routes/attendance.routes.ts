/**
 * Attendance Routes - Définition des endpoints API pour l'attendance
 */

import { Router } from 'express';
import attendanceController from '../controllers/attendance.controller';

const router = Router();

/**
 * POST /api/attendance/scan
 * Scanne un élève (marque comme présent)
 * Utilisé par l'app mobile chauffeur
 */
router.post('/scan', (req, res) => attendanceController.scanStudent(req, res));

/**
 * POST /api/attendance/unscan
 * Dé-scanne un élève (marque comme absent)
 * Utilisé par l'app mobile chauffeur
 */
router.post('/unscan', (req, res) => attendanceController.unscanStudent(req, res));

export default router;
