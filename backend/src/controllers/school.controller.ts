/**
 * School Controller - Gestion des requêtes HTTP pour les écoles
 * Responsabilité: Validation + Orchestration + Réponse HTTP
 * PAS de logique métier ici (elle est dans school.service.ts)
 */

import { Request, Response } from 'express';
import {
  schoolCreateSchema,
  schoolUpdateSchema,
} from '../utils/validation.schemas';
import schoolService from '../services/school.service';
import { ZodError } from 'zod';

export class SchoolController {
  /**
   * POST /api/schools
   * Crée une nouvelle école
   * Body: { name, location: {lat, lng}, fleetSize?, address?, contactEmail?, contactPhone? }
   */
  async createSchool(req: Request, res: Response): Promise<void> {
    try {
      // Validation stricte avec Zod
      const validatedData = schoolCreateSchema.parse(req.body);

      // Appel au service (logique métier)
      const result = await schoolService.createSchool(validatedData);

      // Réponse HTTP success
      res.status(201).json({
        success: true,
        message: 'École créée avec succès',
        data: result,
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
   * GET /api/schools/:schoolId
   * Récupère une école par son ID
   */
  async getSchoolById(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId } = req.params;

      if (!schoolId) {
        res.status(400).json({
          success: false,
          message: 'School ID requis',
        });
        return;
      }

      const school = await schoolService.getSchoolById(schoolId);

      if (!school) {
        res.status(404).json({
          success: false,
          message: 'École introuvable',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: school,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération',
      });
    }
  }

  /**
   * GET /api/schools
   * Récupère toutes les écoles actives
   */
  async getAllSchools(_req: Request, res: Response): Promise<void> {
    try {
      const schools = await schoolService.getAllSchools();

      res.status(200).json({
        success: true,
        data: schools,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération',
      });
    }
  }

  /**
   * PUT /api/schools/:schoolId
   * Met à jour une école existante
   * Body: { name?, location?, fleetSize?, address?, contactEmail?, contactPhone?, isActive? }
   */
  async updateSchool(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId } = req.params;

      if (!schoolId) {
        res.status(400).json({
          success: false,
          message: 'School ID requis',
        });
        return;
      }

      // Validation stricte avec Zod
      const validatedData = schoolUpdateSchema.parse(req.body);

      // Appel au service (logique métier)
      const result = await schoolService.updateSchool(schoolId, validatedData);

      // Réponse HTTP success
      res.status(200).json({
        success: true,
        message: 'École mise à jour avec succès',
        data: result,
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
        const statusCode = error.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
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
   * DELETE /api/schools/:schoolId
   * Supprime une école (soft delete)
   */
  async deleteSchool(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId } = req.params;

      if (!schoolId) {
        res.status(400).json({
          success: false,
          message: 'School ID requis',
        });
        return;
      }

      // Appel au service (logique métier)
      await schoolService.deleteSchool(schoolId);

      // Réponse HTTP success
      res.status(200).json({
        success: true,
        message: 'École supprimée avec succès',
      });
    } catch (error) {
      // Gestion erreurs métier
      if (error instanceof Error) {
        const statusCode = error.message.includes('not found') ? 404 : 400;
        res.status(statusCode).json({
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
   * GET /api/schools/:schoolId/fleet
   * Récupère la flotte (bus) d'une école
   */
  async getSchoolFleet(req: Request, res: Response): Promise<void> {
    try {
      const { schoolId } = req.params;

      if (!schoolId) {
        res.status(400).json({
          success: false,
          message: 'School ID requis',
        });
        return;
      }

      // Vérifier que l'école existe
      const school = await schoolService.getSchoolById(schoolId);
      if (!school) {
        res.status(404).json({
          success: false,
          message: 'École introuvable',
        });
        return;
      }

      // Compter les bus de l'école
      const fleetCount = await schoolService.getSchoolFleetCount(schoolId);

      res.status(200).json({
        success: true,
        data: {
          schoolId,
          schoolName: school.name,
          fleetCount,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de la flotte',
      });
    }
  }
}

// Export instance singleton
export default new SchoolController();
