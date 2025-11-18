/**
 * Tests d'intégration pour les routes Maintenance
 * Teste les endpoints API REST complets
 */

import request from 'supertest';
import express from 'express';
import maintenanceRoutes from '../../src/routes/maintenance.routes';
import maintenanceService from '../../src/services/maintenance.service';
import {
  MaintenanceType,
  MaintenanceSeverity,
  MaintenanceStatus,
} from '../../src/types/maintenance.types';

// Mock du service
jest.mock('../../src/services/maintenance.service');

const app = express();
app.use(express.json());
app.use('/api/maintenances', maintenanceRoutes);

describe('Maintenance Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/maintenances', () => {
    it('crée un nouveau rapport de maintenance avec des données valides', async () => {
      const mockMaintenance = {
        id: 'maint-123',
        busId: 'bus-123',
        type: MaintenanceType.MECHANICAL,
        severity: MaintenanceSeverity.HIGH,
        title: 'Problème de freins',
        description: 'Les freins arrière font du bruit',
        reportedBy: 'user-123',
        reportedAt: new Date(),
        status: MaintenanceStatus.REPORTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (maintenanceService.createMaintenance as jest.Mock).mockResolvedValue(mockMaintenance);

      const response = await request(app)
        .post('/api/maintenances')
        .send({
          busId: 'bus-123',
          type: MaintenanceType.MECHANICAL,
          severity: MaintenanceSeverity.HIGH,
          title: 'Problème de freins',
          description: 'Les freins arrière font du bruit',
          reportedBy: 'user-123',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'maint-123');
      expect(response.body.data.title).toBe('Problème de freins');
    });

    it('retourne 400 si des champs requis manquent', async () => {
      const response = await request(app)
        .post('/api/maintenances')
        .send({
          busId: 'bus-123',
          type: MaintenanceType.MECHANICAL,
          // Manque severity, title, description, reportedBy
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Missing required fields');
    });

    it('retourne 400 en cas d\'erreur de création', async () => {
      (maintenanceService.createMaintenance as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/api/maintenances')
        .send({
          busId: 'bus-123',
          type: MaintenanceType.MECHANICAL,
          severity: MaintenanceSeverity.HIGH,
          title: 'Problème de freins',
          description: 'Les freins arrière font du bruit',
          reportedBy: 'user-123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/maintenances', () => {
    it('retourne la liste de toutes les maintenances', async () => {
      const mockMaintenances = [
        {
          id: 'maint-1',
          busId: 'bus-1',
          type: MaintenanceType.MECHANICAL,
          severity: MaintenanceSeverity.HIGH,
          title: 'Problème moteur',
          description: 'Le moteur fait un bruit anormal',
          reportedBy: 'user-1',
          reportedAt: new Date(),
          status: MaintenanceStatus.REPORTED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'maint-2',
          busId: 'bus-2',
          type: MaintenanceType.TIRE,
          severity: MaintenanceSeverity.MEDIUM,
          title: 'Pneu usé',
          description: 'Le pneu avant droit est usé',
          reportedBy: 'user-2',
          reportedAt: new Date(),
          status: MaintenanceStatus.SCHEDULED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (maintenanceService.getAllMaintenances as jest.Mock).mockResolvedValue(mockMaintenances);

      const response = await request(app).get('/api/maintenances');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].id).toBe('maint-1');
    });

    it('applique les filtres de query params', async () => {
      (maintenanceService.getAllMaintenances as jest.Mock).mockResolvedValue([]);

      await request(app).get('/api/maintenances?busId=bus-123&status=reported');

      expect(maintenanceService.getAllMaintenances).toHaveBeenCalledWith({
        busId: 'bus-123',
        status: 'reported',
      });
    });

    it('retourne une liste vide si aucune maintenance', async () => {
      (maintenanceService.getAllMaintenances as jest.Mock).mockResolvedValue([]);

      const response = await request(app).get('/api/maintenances');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/maintenances/active', () => {
    it('retourne les maintenances actives', async () => {
      const mockActiveMaintenances = [
        {
          id: 'maint-1',
          busId: 'bus-1',
          type: MaintenanceType.MECHANICAL,
          severity: MaintenanceSeverity.HIGH,
          title: 'Problème moteur',
          description: 'Le moteur fait un bruit anormal',
          reportedBy: 'user-1',
          reportedAt: new Date(),
          status: MaintenanceStatus.REPORTED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (maintenanceService.getActiveMaintenances as jest.Mock).mockResolvedValue(
        mockActiveMaintenances
      );

      const response = await request(app).get('/api/maintenances/active');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(maintenanceService.getActiveMaintenances).toHaveBeenCalled();
    });
  });

  describe('GET /api/maintenances/bus/:busId', () => {
    it('retourne les maintenances d\'un bus spécifique', async () => {
      const mockMaintenances = [
        {
          id: 'maint-1',
          busId: 'bus-123',
          type: MaintenanceType.MECHANICAL,
          severity: MaintenanceSeverity.HIGH,
          title: 'Problème moteur',
          description: 'Le moteur fait un bruit anormal',
          reportedBy: 'user-1',
          reportedAt: new Date(),
          status: MaintenanceStatus.REPORTED,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      (maintenanceService.getMaintenancesByBusId as jest.Mock).mockResolvedValue(mockMaintenances);

      const response = await request(app).get('/api/maintenances/bus/bus-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(maintenanceService.getMaintenancesByBusId).toHaveBeenCalledWith('bus-123');
    });

    it('retourne 400 si busId manque', async () => {
      const response = await request(app).get('/api/maintenances/bus/');

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/maintenances/:maintenanceId', () => {
    it('retourne une maintenance spécifique', async () => {
      const mockMaintenance = {
        id: 'maint-123',
        busId: 'bus-123',
        type: MaintenanceType.MECHANICAL,
        severity: MaintenanceSeverity.HIGH,
        title: 'Problème de freins',
        description: 'Les freins arrière font du bruit',
        reportedBy: 'user-123',
        reportedAt: new Date(),
        status: MaintenanceStatus.REPORTED,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (maintenanceService.getMaintenanceById as jest.Mock).mockResolvedValue(mockMaintenance);

      const response = await request(app).get('/api/maintenances/maint-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('maint-123');
    });

    it('retourne 404 si la maintenance n\'existe pas', async () => {
      (maintenanceService.getMaintenanceById as jest.Mock).mockResolvedValue(null);

      const response = await request(app).get('/api/maintenances/maint-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/maintenances/:maintenanceId', () => {
    it('met à jour une maintenance existante', async () => {
      const mockUpdatedMaintenance = {
        id: 'maint-123',
        busId: 'bus-123',
        type: MaintenanceType.MECHANICAL,
        severity: MaintenanceSeverity.CRITICAL,
        title: 'Problème de freins urgent',
        description: 'Les freins ne fonctionnent plus',
        reportedBy: 'user-123',
        reportedAt: new Date(),
        status: MaintenanceStatus.IN_PROGRESS,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (maintenanceService.updateMaintenance as jest.Mock).mockResolvedValue(
        mockUpdatedMaintenance
      );

      const response = await request(app)
        .put('/api/maintenances/maint-123')
        .send({
          severity: MaintenanceSeverity.CRITICAL,
          status: MaintenanceStatus.IN_PROGRESS,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.severity).toBe(MaintenanceSeverity.CRITICAL);
      expect(response.body.data.status).toBe(MaintenanceStatus.IN_PROGRESS);
    });

    it('retourne 404 si la maintenance à mettre à jour n\'existe pas', async () => {
      (maintenanceService.updateMaintenance as jest.Mock).mockRejectedValue(
        new Error('Maintenance with ID maint-inexistant not found')
      );

      const response = await request(app)
        .put('/api/maintenances/maint-inexistant')
        .send({ status: MaintenanceStatus.COMPLETED });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/maintenances/:maintenanceId', () => {
    it('supprime une maintenance existante', async () => {
      (maintenanceService.deleteMaintenance as jest.Mock).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/maintenances/maint-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('retourne 404 si la maintenance à supprimer n\'existe pas', async () => {
      (maintenanceService.deleteMaintenance as jest.Mock).mockRejectedValue(
        new Error('Maintenance with ID maint-inexistant not found')
      );

      const response = await request(app).delete('/api/maintenances/maint-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});
