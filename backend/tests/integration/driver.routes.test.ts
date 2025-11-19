/**
 * Tests d'intégration pour les routes Driver
 * Teste les endpoints API REST complets
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import driverRoutes from '../../src/routes/driver.routes';
import driverService from '../../src/services/driver.service';
import { UserRole } from '../../src/types/user.types';

// Mock du service
vi.mock('../../src/services/driver.service');

const app = express();
app.use(express.json());
app.use('/api/drivers', driverRoutes);

describe('Driver Routes Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/drivers', () => {
    it('crée un nouveau chauffeur avec des données valides', async () => {
      const mockDriver = {
        id: 'driver-123',
        email: 'driver@test.com',
        displayName: 'Chauffeur Test',
        phoneNumber: '+33612345678',
        role: UserRole.DRIVER,
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2026-12-31'),
        busId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(driverService.createDriver).mockResolvedValue(mockDriver);

      const response = await request(app)
        .post('/api/drivers')
        .send({
          email: 'driver@test.com',
          displayName: 'Chauffeur Test',
          phoneNumber: '+33612345678',
          licenseNumber: 'LIC123456',
          licenseExpiry: '2026-12-31T00:00:00.000Z',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id', 'driver-123');
      expect(response.body.data.email).toBe('driver@test.com');
    });

    it('retourne 422 si des champs requis manquent', async () => {
      const response = await request(app)
        .post('/api/drivers')
        .send({
          email: 'driver@test.com',
          // Manque displayName, phoneNumber, etc.
        });

      expect(response.status).toBe(422);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });
  });

  describe('GET /api/drivers', () => {
    it('retourne la liste de tous les chauffeurs', async () => {
      const mockDrivers = [
        {
          id: 'driver-1',
          email: 'driver1@test.com',
          displayName: 'Chauffeur 1',
          phoneNumber: '+33612345678',
          role: UserRole.DRIVER,
          licenseNumber: 'LIC111111',
          licenseExpiry: new Date('2026-12-31'),
          busId: 'bus-1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'driver-2',
          email: 'driver2@test.com',
          displayName: 'Chauffeur 2',
          phoneNumber: '+33612345679',
          role: UserRole.DRIVER,
          licenseNumber: 'LIC222222',
          licenseExpiry: new Date('2025-06-30'),
          busId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(driverService.getAllDrivers).mockResolvedValue(mockDrivers);

      const response = await request(app).get('/api/drivers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.count).toBe(2);
    });

    it('retourne uniquement les chauffeurs disponibles si available=true', async () => {
      const mockDrivers = [
        {
          id: 'driver-2',
          email: 'driver2@test.com',
          displayName: 'Chauffeur 2',
          phoneNumber: '+33612345679',
          role: UserRole.DRIVER,
          licenseNumber: 'LIC222222',
          licenseExpiry: new Date('2025-06-30'),
          busId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(driverService.getAvailableDrivers).mockResolvedValue(mockDrivers);

      const response = await request(app).get('/api/drivers?available=true');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(driverService.getAvailableDrivers).toHaveBeenCalled();
    });

    it('retourne une liste vide si aucun chauffeur', async () => {
      vi.mocked(driverService.getAllDrivers).mockResolvedValue([]);

      const response = await request(app).get('/api/drivers');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([]);
    });
  });

  describe('GET /api/drivers/:id', () => {
    it('retourne un chauffeur spécifique', async () => {
      const mockDriver = {
        id: 'driver-123',
        email: 'driver@test.com',
        displayName: 'Chauffeur Test',
        phoneNumber: '+33612345678',
        role: UserRole.DRIVER,
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2026-12-31'),
        busId: 'bus-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(driverService.getDriverById).mockResolvedValue(mockDriver);

      const response = await request(app).get('/api/drivers/driver-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('driver-123');
    });

    it('retourne 404 si le chauffeur n\'existe pas', async () => {
      vi.mocked(driverService.getDriverById).mockResolvedValue(null);

      const response = await request(app).get('/api/drivers/driver-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Driver not found');
    });
  });

  describe('GET /api/drivers/bus/:busId', () => {
    it('retourne le chauffeur assigné à un bus', async () => {
      const mockDriver = {
        id: 'driver-123',
        email: 'driver@test.com',
        displayName: 'Chauffeur Test',
        phoneNumber: '+33612345678',
        role: UserRole.DRIVER,
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2026-12-31'),
        busId: 'bus-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(driverService.getDriverByBus).mockResolvedValue(mockDriver);

      const response = await request(app).get('/api/drivers/bus/bus-1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBe('bus-1');
    });

    it('retourne 404 si aucun chauffeur assigné au bus', async () => {
      vi.mocked(driverService.getDriverByBus).mockResolvedValue(null);

      const response = await request(app).get('/api/drivers/bus/bus-999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/drivers/expired-licenses', () => {
    it('retourne les chauffeurs avec permis expiré', async () => {
      const mockDrivers = [
        {
          id: 'driver-expired',
          email: 'expired@test.com',
          displayName: 'Chauffeur Expiré',
          phoneNumber: '+33612345678',
          role: UserRole.DRIVER,
          licenseNumber: 'LIC999999',
          licenseExpiry: new Date('2020-01-01'),
          busId: null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(driverService.getDriversWithExpiredLicense).mockResolvedValue(mockDrivers);

      const response = await request(app).get('/api/drivers/expired-licenses');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
    });
  });

  describe('PATCH /api/drivers/:id', () => {
    it('met à jour un chauffeur existant', async () => {
      const mockUpdatedDriver = {
        id: 'driver-123',
        email: 'driver@test.com',
        displayName: 'Chauffeur Modifié',
        phoneNumber: '+33612345678',
        role: UserRole.DRIVER,
        licenseNumber: 'LIC999999',
        licenseExpiry: new Date('2027-12-31'),
        busId: 'bus-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(driverService.updateDriver).mockResolvedValue(mockUpdatedDriver);

      const response = await request(app)
        .patch('/api/drivers/driver-123')
        .send({
          displayName: 'Chauffeur Modifié',
          licenseNumber: 'LIC999999',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.displayName).toBe('Chauffeur Modifié');
    });

    it('retourne 404 si le chauffeur n\'existe pas', async () => {
      vi.mocked(driverService.updateDriver).mockRejectedValue(
        new Error('Driver with ID driver-inexistant not found')
      );

      const response = await request(app)
        .patch('/api/drivers/driver-inexistant')
        .send({ displayName: 'Test' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /api/drivers/:id', () => {
    it('supprime un chauffeur existant', async () => {
      vi.mocked(driverService.deleteDriver).mockResolvedValue(undefined);

      const response = await request(app).delete('/api/drivers/driver-123');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('deleted successfully');
    });

    it('retourne 404 si le chauffeur n\'existe pas', async () => {
      vi.mocked(driverService.deleteDriver).mockRejectedValue(
        new Error('Driver with ID driver-inexistant not found')
      );

      const response = await request(app).delete('/api/drivers/driver-inexistant');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/drivers/:id/assign-bus', () => {
    it('assigne un chauffeur à un bus', async () => {
      const mockDriver = {
        id: 'driver-123',
        email: 'driver@test.com',
        displayName: 'Chauffeur Test',
        phoneNumber: '+33612345678',
        role: UserRole.DRIVER,
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2026-12-31'),
        busId: 'bus-1',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(driverService.assignToBus).mockResolvedValue(mockDriver);

      const response = await request(app)
        .post('/api/drivers/driver-123/assign-bus')
        .send({
          busId: 'bus-1',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBe('bus-1');
    });

    it('retourne 400 si busId manque', async () => {
      const response = await request(app)
        .post('/api/drivers/driver-123/assign-bus')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/drivers/:id/remove-bus', () => {
    it('retire un chauffeur d\'un bus', async () => {
      const mockDriver = {
        id: 'driver-123',
        email: 'driver@test.com',
        displayName: 'Chauffeur Test',
        phoneNumber: '+33612345678',
        role: UserRole.DRIVER,
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2026-12-31'),
        busId: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      vi.mocked(driverService.removeFromBus).mockResolvedValue(mockDriver);

      const response = await request(app)
        .post('/api/drivers/driver-123/remove-bus');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.busId).toBeNull();
    });
  });
});

