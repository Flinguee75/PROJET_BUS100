/**
 * Controller Route - Gestion des requêtes HTTP pour les routes
 * Thin controller - toute la logique est dans le service
 */

import { Request, Response } from 'express';
import routeService from '../services/route.service';
import routeGenerationService from '../services/route-generation.service';
import { CommuneAbidjan, QUARTIERS_BY_COMMUNE } from '../types/route.types';
import { routeGenerationRequestSchema } from '../utils/validation.schemas';

export class RouteController {
  /**
   * GET /api/routes
   * Récupère toutes les routes avec filtres optionnels
   */
  async getAllRoutes(req: Request, res: Response): Promise<void> {
    try {
      const { commune, quartier, active } = req.query;

      let routes;
      if (commune && typeof commune === 'string') {
        routes = await routeService.getRoutesByCommune(commune as CommuneAbidjan);
      } else if (quartier && typeof quartier === 'string') {
        routes = await routeService.getRoutesByQuartier(quartier);
      } else if (active === 'true') {
        routes = await routeService.getActiveRoutes();
      } else {
        routes = await routeService.getAllRoutes();
      }

      res.status(200).json({
        success: true,
        data: routes,
        count: routes.length,
      });
    } catch (error) {
      console.error('Error fetching routes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch routes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/routes/available
   * Récupère les routes disponibles (avec places libres)
   */
  async getAvailableRoutes(_req: Request, res: Response): Promise<void> {
    try {
      const routes = await routeService.getAvailableRoutes();

      res.status(200).json({
        success: true,
        data: routes,
        count: routes.length,
      });
    } catch (error) {
      console.error('Error fetching available routes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch available routes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/routes/communes
   * Récupère la liste des communes d'Abidjan
   */
  async getCommunes(_req: Request, res: Response): Promise<void> {
    try {
      const communes = Object.values(CommuneAbidjan);

      res.status(200).json({
        success: true,
        data: communes,
        count: communes.length,
      });
    } catch (error) {
      console.error('Error fetching communes:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch communes',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/routes/quartiers/:commune
   * Récupère les quartiers d'une commune
   */
  async getQuartiersByCommune(req: Request, res: Response): Promise<void> {
    try {
      const { commune } = req.params;
      
      if (!commune) {
        res.status(400).json({
          success: false,
          error: 'Commune parameter is required',
        });
        return;
      }

      const quartiers = QUARTIERS_BY_COMMUNE[commune as CommuneAbidjan];
      
      if (!quartiers) {
        res.status(404).json({
          success: false,
          error: 'Commune not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: quartiers,
        count: quartiers.length,
      });
    } catch (error) {
      console.error('Error fetching quartiers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch quartiers',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/routes/:id
   * Récupère une route par son ID
   */
  async getRouteById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
        return;
      }

      const route = await routeService.getRouteById(id);

      if (!route) {
        res.status(404).json({
          success: false,
          error: 'Route not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: route,
      });
    } catch (error) {
      console.error('Error fetching route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/routes
   * Crée une nouvelle route
   */
  async createRoute(req: Request, res: Response): Promise<void> {
    try {
      // TODO: Ajouter validation Zod
      const route = await routeService.createRoute(req.body);

      res.status(201).json({
        success: true,
        data: route,
        message: 'Route created successfully',
      });
    } catch (error) {
      console.error('Error creating route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * PATCH /api/routes/:id
   * Met à jour une route
   */
  async updateRoute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
        return;
      }

      const route = await routeService.updateRoute(id, req.body);

      res.status(200).json({
        success: true,
        data: route,
        message: 'Route updated successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Route not found',
        });
        return;
      }

      console.error('Error updating route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * DELETE /api/routes/:id
   * Supprime une route (soft delete)
   */
  async deleteRoute(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
        return;
      }

      await routeService.deleteRoute(id);

      res.status(200).json({
        success: true,
        message: 'Route deleted successfully',
      });
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: 'Route not found',
        });
        return;
      }

      console.error('Error deleting route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/routes/:id/assign-bus
   * Assigne un bus à une route
   */
  async assignBus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { busId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
        return;
      }

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'busId is required',
        });
        return;
      }

      const route = await routeService.assignBus(id, busId);

      res.status(200).json({
        success: true,
        data: route,
        message: 'Bus assigned to route successfully',
      });
    } catch (error) {
      console.error('Error assigning bus to route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign bus to route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/routes/:id/remove-bus
   * Retire le bus d'une route
   */
  async removeBus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
        return;
      }

      const route = await routeService.removeBus(id);

      res.status(200).json({
        success: true,
        data: route,
        message: 'Bus removed from route successfully',
      });
    } catch (error) {
      console.error('Error removing bus from route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to remove bus from route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/routes/:id/assign-driver
   * Assigne un chauffeur à une route
   */
  async assignDriver(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { driverId } = req.body;

      if (!id) {
        res.status(400).json({
          success: false,
          error: 'Route ID is required',
        });
        return;
      }

      if (!driverId) {
        res.status(400).json({
          success: false,
          error: 'driverId is required',
        });
        return;
      }

      const route = await routeService.assignDriver(id, driverId);

      res.status(200).json({
        success: true,
        data: route,
        message: 'Driver assigned to route successfully',
      });
    } catch (error) {
      console.error('Error assigning driver to route:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to assign driver to route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/routes/generate/:busId
   * Génère automatiquement une route optimale pour un bus
   */
  async generateRouteForBus(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      // Valider le body
      const validationResult = routeGenerationRequestSchema.safeParse({
        busId,
        ...req.body,
      });

      if (!validationResult.success) {
        res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: validationResult.error.errors,
        });
        return;
      }

      const route = await routeGenerationService.generateRouteForBus(busId);

      res.status(200).json({
        success: true,
        data: route,
        message: 'Route generated successfully',
      });
    } catch (error) {
      console.error('Error generating route:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: 'Bus not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('No students')) {
          res.status(400).json({
            success: false,
            error: 'No students assigned to this bus',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to generate route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * POST /api/routes/regenerate/:busId
   * Force la régénération d'une route pour un bus
   */
  async regenerateRoute(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      const route = await routeGenerationService.regenerateRoute(busId);

      res.status(200).json({
        success: true,
        data: route,
        message: 'Route regenerated successfully',
      });
    } catch (error) {
      console.error('Error regenerating route:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: 'Bus not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('No students')) {
          res.status(400).json({
            success: false,
            error: 'No students assigned to this bus',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to regenerate route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/routes/by-bus/:busId
   * Récupère la route d'un bus spécifique
   */
  async getRouteByBus(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      const routes = await routeService.getAllRoutes();
      const busRoutes = routes.filter((r) => r.busId === busId && r.isActive);

      if (busRoutes.length === 0) {
        res.status(404).json({
          success: false,
          error: 'No route found for this bus',
        });
        return;
      }

      // Retourner la route auto-générée en priorité, sinon la première route manuelle
      const autoRoute = busRoutes.find((r) => !r.isManual);
      const route = autoRoute || busRoutes[0];

      res.status(200).json({
        success: true,
        data: route,
      });
    } catch (error) {
      console.error('Error fetching route by bus:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  /**
   * GET /api/routes/preview/:busId
   * Prévisualise une route sans la sauvegarder
   */
  async previewRoute(req: Request, res: Response): Promise<void> {
    try {
      const { busId } = req.params;

      if (!busId) {
        res.status(400).json({
          success: false,
          error: 'Bus ID is required',
        });
        return;
      }

      const route = await routeGenerationService.previewRoute(busId);

      res.status(200).json({
        success: true,
        data: route,
        message: 'Route preview generated',
      });
    } catch (error) {
      console.error('Error previewing route:', error);

      if (error instanceof Error) {
        if (error.message.includes('not found')) {
          res.status(404).json({
            success: false,
            error: 'Bus not found',
            message: error.message,
          });
          return;
        }

        if (error.message.includes('No students')) {
          res.status(400).json({
            success: false,
            error: 'No students assigned to this bus',
            message: error.message,
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        error: 'Failed to preview route',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new RouteController();

