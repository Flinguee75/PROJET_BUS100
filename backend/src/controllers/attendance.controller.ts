/**
 * Attendance Controller - Gestion des requêtes HTTP pour l'attendance
 * Endpoints pour enregistrer montée/descente et récupérer l'historique
 */

import { Request, Response } from 'express';
import attendanceService, { BoardingEvent } from '../services/attendance.service';
import { boardingEventSchema } from '../utils/validation.schemas';

export class AttendanceController {
  /**
   * POST /api/attendance/board
   * Enregistre la montée d'un élève dans le bus
   */
  async boardStudent(req: Request, res: Response): Promise<void> {
    try {
      // Validation avec Zod
      const validatedData = boardingEventSchema.parse(req.body);

      const event: BoardingEvent = {
        studentId: validatedData.studentId!,
        busId: validatedData.busId,
        driverId: validatedData.driverId,
        timestamp: new Date(validatedData.timestamp || Date.now()),
        location: validatedData.location,
        type: 'board',
        notes: validatedData.notes,
      };

      const record = await attendanceService.boardStudent(event);

      res.status(200).json({
        success: true,
        message: 'Student successfully boarded',
        data: record,
      });
    } catch (error: any) {
      console.error('Error in boardStudent:', error);

      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error.message.includes('already on the bus')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * POST /api/attendance/exit
   * Enregistre la descente d'un élève du bus
   */
  async exitStudent(req: Request, res: Response): Promise<void> {
    try {
      // Validation avec Zod
      const validatedData = boardingEventSchema.parse(req.body);

      const event: BoardingEvent = {
        studentId: validatedData.studentId!,
        busId: validatedData.busId,
        driverId: validatedData.driverId,
        timestamp: new Date(validatedData.timestamp || Date.now()),
        location: validatedData.location,
        type: 'exit',
        notes: validatedData.notes,
      };

      const record = await attendanceService.exitStudent(event);

      res.status(200).json({
        success: true,
        message: 'Student successfully exited',
        data: record,
      });
    } catch (error: any) {
      console.error('Error in exitStudent:', error);

      if (error.name === 'ZodError') {
        res.status(400).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error.message.includes('not currently on the bus') || error.message.includes('must board first')) {
        res.status(409).json({
          success: false,
          error: error.message,
        });
        return;
      }

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/attendance/student/:studentId
   * Récupère l'attendance d'un élève pour aujourd'hui (ou une date spécifique)
   */
  async getStudentAttendance(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { date } = req.query;

      const record = await attendanceService.getStudentAttendance(
        studentId!,
        date ? (date as string) : undefined
      );

      if (!record) {
        res.status(404).json({
          success: false,
          error: 'No attendance record found for this student on the specified date',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: record,
      });
    } catch (error: any) {
      console.error('Error in getStudentAttendance:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/attendance/bus/:busId/students
   * Récupère tous les élèves actuellement dans un bus
   */
  async getStudentsOnBus(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      const students = await attendanceService.getStudentsOnBus(busId!);

      res.status(200).json({
        success: true,
        data: {
          busId,
          studentCount: students.length,
          students,
        },
      });
    } catch (error: any) {
      console.error('Error in getStudentsOnBus:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/attendance/bus/:busId/history
   * Récupère l'historique d'attendance pour un bus
   */
  async getBusAttendanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate query parameters are required',
        });
        return;
      }

      const history = await attendanceService.getBusAttendanceHistory(
        busId!,
        startDate! as string,
        endDate! as string
      );

      res.status(200).json({
        success: true,
        data: {
          busId,
          startDate,
          endDate,
          recordCount: history.length,
          records: history,
        },
      });
    } catch (error: any) {
      console.error('Error in getBusAttendanceHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/attendance/student/:studentId/history
   * Récupère l'historique d'attendance pour un élève
   */
  async getStudentAttendanceHistory(req: Request, res: Response): Promise<void> {
    try {
      const { studentId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: 'startDate and endDate query parameters are required',
        });
        return;
      }

      const history = await attendanceService.getStudentAttendanceHistory(
        studentId!,
        startDate! as string,
        endDate! as string
      );

      res.status(200).json({
        success: true,
        data: {
          studentId,
          startDate,
          endDate,
          recordCount: history.length,
          records: history,
        },
      });
    } catch (error: any) {
      console.error('Error in getStudentAttendanceHistory:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }

  /**
   * GET /api/attendance/bus/:busId/count
   * Compte le nombre d'élèves actuellement dans un bus
   */
  async countStudentsOnBus(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      const count = await attendanceService.countStudentsOnBus(busId!);

      res.status(200).json({
        success: true,
        data: {
          busId,
          studentCount: count,
        },
      });
    } catch (error: any) {
      console.error('Error in countStudentsOnBus:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: error.message,
      });
    }
  }
}

export default new AttendanceController();
