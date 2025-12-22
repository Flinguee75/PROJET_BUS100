/**
 * Attendance Controller - Gestion des requêtes HTTP pour l'attendance
 * Responsabilité: Validation + Orchestration + Réponse HTTP
 * PAS de logique métier ici (elle est dans attendance.service.ts)
 */

import { Request, Response } from 'express';
import { attendanceScanSchema, attendanceUnscanSchema } from '../utils/validation.schemas';
import attendanceService from '../services/attendance.service';
import { ZodError } from 'zod';

export class AttendanceController {
  /**
   * POST /api/attendance/scan
   * Scanne un élève (marque comme présent)
   * Body: { studentId, busId, date, type, driverId, location? }
   */
  async scanStudent(req: Request, res: Response): Promise<void> {
    try {
      // Validation stricte avec Zod
      const validatedData = attendanceScanSchema.parse(req.body);

      // Appel au service (logique métier)
      await attendanceService.scanStudent(validatedData);

      // Réponse HTTP success
      res.status(200).json({
        success: true,
        message: 'Élève scanné avec succès',
        data: {
          studentId: validatedData.studentId,
          busId: validatedData.busId,
          date: validatedData.date,
          type: validatedData.type,
        },
      });
    } catch (error) {
      // Gestion erreurs validation
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors,
        });
        return;
      }

      // Gestion erreurs métier
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Erreur inconnue
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      });
    }
  }

  /**
   * POST /api/attendance/unscan
   * Dé-scanne un élève (marque comme absent)
   * Body: { studentId, busId, date, driverId }
   */
  async unscanStudent(req: Request, res: Response): Promise<void> {
    try {
      // Validation stricte avec Zod
      const validatedData = attendanceUnscanSchema.parse(req.body);

      // Appel au service (logique métier)
      await attendanceService.unscanStudent(validatedData);

      // Réponse HTTP success
      res.status(200).json({
        success: true,
        message: 'Élève dé-scanné avec succès',
        data: {
          studentId: validatedData.studentId,
          busId: validatedData.busId,
          date: validatedData.date,
        },
      });
    } catch (error) {
      // Gestion erreurs validation
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          message: 'Données invalides',
          errors: error.errors,
        });
        return;
      }

      // Gestion erreurs métier
      if (error instanceof Error) {
        res.status(400).json({
          success: false,
          message: error.message,
        });
        return;
      }

      // Erreur inconnue
      res.status(500).json({
        success: false,
        message: 'Erreur serveur',
      });
    }
  }
}

export default new AttendanceController();











