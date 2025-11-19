/**
 * Controller Student - Gestion des requêtes HTTP pour les élèves
 * Thin controller - toute la logique est dans le service
 */

import { Request, Response } from 'express';
import studentService from '../services/student.service';
import {
  studentCreateSchema,
  studentUpdateSchema,
} from '../utils/validation.schemas';
import { ZodError } from 'zod';

export class StudentController {
  /**
   * GET /api/students
   * Récupère tous les élèves ou les élèves d'un parent/bus
   */
  async getAllStudents(req: Request, res: Response): Promise<void> {
    try {
      const { parentId, busId } = req.query;

      let students;
      if (parentId && typeof parentId === 'string') {
        students = await studentService.getStudentsByParent(parentId);
      } else if (busId && typeof busId === 'string') {
        students = await studentService.getStudentsByBus(busId);
      } else {
        students = await studentService.getAllStudents();
      }

      res.status(200).json({
        success: true,
        data: students,
        count: students.length,
      });
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch students',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/students/:id
   * Récupère un élève par son ID
   */
  async getStudentById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Student ID is required',
        });
        return;
      }
      const student = await studentService.getStudentById(id);

      if (!student) {
        res.status(404).json({
          success: false,
          error: 'Student not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: student,
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch student',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/students
   * Crée un nouvel élève
   */
  async createStudent(req: Request, res: Response): Promise<void> {
    try {
      // Validation avec Zod
      const validatedData = studentCreateSchema.parse(req.body);

      // Convertir dateOfBirth en Date si c'est une string
      const inputData = {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth instanceof Date 
          ? validatedData.dateOfBirth 
          : new Date(validatedData.dateOfBirth),
      };

      const student = await studentService.createStudent(inputData);

      res.status(201).json({
        success: true,
        data: student,
        message: 'Student created successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      console.error('Error creating student:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create student',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/students/:id
   * Met à jour un élève
   */
  async updateStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Student ID is required',
        });
        return;
      }

      // Validation avec Zod
      const validatedData = studentUpdateSchema.parse(req.body);

      // Convertir dateOfBirth en Date si présent et c'est une string
      const inputData = {
        ...validatedData,
        dateOfBirth: validatedData.dateOfBirth
          ? validatedData.dateOfBirth instanceof Date
            ? validatedData.dateOfBirth
            : new Date(validatedData.dateOfBirth)
          : undefined,
      };

      const student = await studentService.updateStudent(id, inputData);

      res.status(200).json({
        success: true,
        data: student,
        message: 'Student updated successfully',
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(422).json({
          success: false,
          error: 'Validation error',
          details: error.errors,
        });
        return;
      }

      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Student not found',
        });
        return;
      }

      console.error('Error updating student:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update student',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/students/:id
   * Supprime un élève (soft delete)
   */
  async deleteStudent(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Student ID is required',
        });
        return;
      }
      await studentService.deleteStudent(id);

      res.status(200).json({
        success: true,
        message: 'Student deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Student not found',
        });
        return;
      }

      console.error('Error deleting student:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete student',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/students/:id/assign-bus
   * Assigne un élève à un bus
   */
  async assignToBus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Student ID is required',
        });
        return;
      }

      const { busId, routeId } = req.body;
      if (!busId || !routeId) {
        res.status(400).json({
          success: false,
          error: 'busId and routeId are required',
        });
        return;
      }

      const student = await studentService.assignToBus(id, busId, routeId);

      res.status(200).json({
        success: true,
        data: student,
        message: 'Student assigned to bus successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Student not found',
        });
        return;
      }

      console.error('Error assigning student to bus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign student to bus',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/students/:id/remove-bus
   * Retire un élève d'un bus
   */
  async removeFromBus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Student ID is required',
        });
        return;
      }
      const student = await studentService.removeFromBus(id);

      res.status(200).json({
        success: true,
        data: student,
        message: 'Student removed from bus successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Student not found',
        });
        return;
      }

      console.error('Error removing student from bus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove student from bus',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new StudentController();

