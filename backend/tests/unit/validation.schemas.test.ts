/**
 * Tests unitaires pour les schémas de validation Zod
 * Test tous les schémas de validation avec cas valides et invalides
 */

import {
  gpsPositionSchema,
  gpsUpdateSchema,
  locationSchema,
  busCreateSchema,
  busUpdateSchema,
  studentCreateSchema,
  userCreateSchema,
  notificationCreateSchema,
} from '../../src/utils/validation.schemas';

describe('Validation Schemas', () => {
  describe('gpsPositionSchema', () => {
    it('should validate correct GPS position', () => {
      const validData = {
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        heading: 180,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate GPS position without optional fields', () => {
      const validData = {
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid latitude (> 90)', () => {
      const invalidData = {
        lat: 95,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid latitude (< -90)', () => {
      const invalidData = {
        lat: -95,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude (> 180)', () => {
      const invalidData = {
        lat: 48.8566,
        lng: 185,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid longitude (< -180)', () => {
      const invalidData = {
        lat: 48.8566,
        lng: -185,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative speed', () => {
      const invalidData = {
        lat: 48.8566,
        lng: 2.3522,
        speed: -10,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject speed > 200', () => {
      const invalidData = {
        lat: 48.8566,
        lng: 2.3522,
        speed: 250,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid heading (> 360)', () => {
      const invalidData = {
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        heading: 400,
        timestamp: Date.now(),
      };

      const result = gpsPositionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject negative timestamp', () => {
      const invalidData = {
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: -1,
      };

      const result = gpsPositionSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('gpsUpdateSchema', () => {
    it('should validate correct GPS update', () => {
      const validData = {
        busId: 'bus-001',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        heading: 180,
        accuracy: 10,
        timestamp: Date.now(),
      };

      const result = gpsUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject empty busId', () => {
      const invalidData = {
        busId: '',
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = gpsUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject missing busId', () => {
      const invalidData = {
        lat: 48.8566,
        lng: 2.3522,
        speed: 50,
        timestamp: Date.now(),
      };

      const result = gpsUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('locationSchema', () => {
    it('should validate correct location', () => {
      const validData = {
        address: '123 Main Street, Paris',
        lat: 48.8566,
        lng: 2.3522,
        notes: 'Near the metro',
      };

      const result = locationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate location without notes', () => {
      const validData = {
        address: '123 Main Street',
        lat: 48.8566,
        lng: 2.3522,
      };

      const result = locationSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject address too short', () => {
      const invalidData = {
        address: '123',
        lat: 48.8566,
        lng: 2.3522,
      };

      const result = locationSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('busCreateSchema', () => {
    it('should validate correct bus creation', () => {
      const validData = {
        plateNumber: 'BUS-001',
        capacity: 50,
        model: 'Mercedes Sprinter',
        year: 2024,
      };

      const result = busCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid plate number format', () => {
      const invalidData = {
        plateNumber: 'bus@001',
        capacity: 50,
        model: 'Mercedes Sprinter',
        year: 2024,
      };

      const result = busCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject capacity < 10', () => {
      const invalidData = {
        plateNumber: 'BUS-001',
        capacity: 5,
        model: 'Mercedes Sprinter',
        year: 2024,
      };

      const result = busCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject capacity > 100', () => {
      const invalidData = {
        plateNumber: 'BUS-001',
        capacity: 150,
        model: 'Mercedes Sprinter',
        year: 2024,
      };

      const result = busCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject year < 2000', () => {
      const invalidData = {
        plateNumber: 'BUS-001',
        capacity: 50,
        model: 'Mercedes Sprinter',
        year: 1999,
      };

      const result = busCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject year > current year + 1', () => {
      const invalidData = {
        plateNumber: 'BUS-001',
        capacity: 50,
        model: 'Mercedes Sprinter',
        year: new Date().getFullYear() + 2,
      };

      const result = busCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('busUpdateSchema', () => {
    it('should validate correct bus update with all fields', () => {
      const validData = {
        plateNumber: 'BUS-002',
        capacity: 60,
        model: 'Iveco Daily',
        year: 2023,
        driverId: 'driver-123',
        routeId: 'route-456',
        status: 'active' as const,
        maintenanceStatus: 'ok' as const,
      };

      const result = busUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate partial bus update', () => {
      const validData = {
        capacity: 60,
        status: 'in_maintenance' as const,
      };

      const result = busUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate with null driverId', () => {
      const validData = {
        driverId: null,
      };

      const result = busUpdateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject invalid status', () => {
      const invalidData = {
        status: 'invalid_status',
      };

      const result = busUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid maintenance status', () => {
      const invalidData = {
        maintenanceStatus: 'bad',
      };

      const result = busUpdateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('studentCreateSchema', () => {
    it('should validate correct student creation', () => {
      const validData = {
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: '2010-05-15T00:00:00Z',
        grade: 'CM2',
        parentIds: ['parent-001', 'parent-002'],
        commune: 'Yopougon',
        quartier: 'Zone 5',
        locations: {
          morningPickup: {
            address: '123 Rue de Paris',
            lat: 48.8566,
            lng: 2.3522,
            notes: 'Devant la boulangerie',
          },
          eveningDropoff: {
            address: '456 Rue de Lyon',
            lat: 48.8600,
            lng: 2.3550,
          },
        },
        activeTrips: ['morning_outbound', 'evening_return'],
        specialNeeds: 'Allergies alimentaires',
      };

      const result = studentCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate student without special needs', () => {
      const validData = {
        firstName: 'Marie',
        lastName: 'Martin',
        dateOfBirth: new Date('2012-08-20'),
        grade: 'CE2',
        parentIds: ['parent-003'],
        commune: 'Cocody',
        quartier: 'Anoumabo',
        locations: {
          middayPickup: {
            address: '789 Avenue des Champs',
            lat: 48.8700,
            lng: 2.3600,
          },
          middayDropoff: {
            address: '101 Boulevard Voltaire',
            lat: 48.8650,
            lng: 2.3700,
          },
        },
        activeTrips: ['midday_outbound'],
      };

      const result = studentCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should reject firstName too short', () => {
      const invalidData = {
        firstName: 'J',
        lastName: 'Dupont',
        dateOfBirth: '2010-05-15T00:00:00Z',
        grade: 'CM2',
        parentIds: ['parent-001'],
        pickupLocation: {
          address: '123 Rue de Paris',
          lat: 48.8566,
          lng: 2.3522,
        },
        dropoffLocation: {
          address: '456 Rue de Lyon',
          lat: 48.8600,
          lng: 2.3550,
        },
      };

      const result = studentCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty parentIds array', () => {
      const invalidData = {
        firstName: 'Jean',
        lastName: 'Dupont',
        dateOfBirth: '2010-05-15T00:00:00Z',
        grade: 'CM2',
        parentIds: [],
        pickupLocation: {
          address: '123 Rue de Paris',
          lat: 48.8566,
          lng: 2.3522,
        },
        dropoffLocation: {
          address: '456 Rue de Lyon',
          lat: 48.8600,
          lng: 2.3550,
        },
      };

      const result = studentCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('userCreateSchema', () => {
    it('should validate correct user creation', () => {
      const validData = {
        email: 'john.doe@example.com',
        displayName: 'John Doe',
        phoneNumber: '+33612345678',
        role: 'parent' as const,
      };

      const result = userCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate all user roles', () => {
      const roles = ['admin', 'driver', 'parent'] as const;

      roles.forEach((role) => {
        const validData = {
          email: `user@example.com`,
          displayName: 'Test User',
          phoneNumber: '+33612345678',
          role,
        };

        const result = userCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid email', () => {
      const invalidData = {
        email: 'not-an-email',
        displayName: 'John Doe',
        phoneNumber: '+33612345678',
        role: 'parent' as const,
      };

      const result = userCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject displayName too short', () => {
      const invalidData = {
        email: 'john@example.com',
        displayName: 'J',
        phoneNumber: '+33612345678',
        role: 'parent' as const,
      };

      const result = userCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid phone number', () => {
      const invalidData = {
        email: 'john@example.com',
        displayName: 'John Doe',
        phoneNumber: 'abc', // Non-numeric phone number
        role: 'parent' as const,
      };

      const result = userCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid role', () => {
      const invalidData = {
        email: 'john@example.com',
        displayName: 'John Doe',
        phoneNumber: '+33612345678',
        role: 'superuser',
      };

      const result = userCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('notificationCreateSchema', () => {
    it('should validate correct notification creation', () => {
      const validData = {
        type: 'bus_arriving' as const,
        title: 'Bus en approche',
        message: 'Le bus arrive dans 5 minutes',
        recipientIds: ['parent-001', 'parent-002'],
        busId: 'bus-001',
        studentId: 'student-001',
        priority: 'high' as const,
        data: {
          eta: 5,
          location: 'Arrêt Mairie',
        },
      };

      const result = notificationCreateSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('should validate all notification types', () => {
      const types = [
        'bus_arriving',
        'bus_delayed',
        'bus_breakdown',
        'student_absent',
        'route_changed',
        'maintenance_due',
        'general',
      ] as const;

      types.forEach((type) => {
        const validData = {
          type,
          title: 'Test Notification',
          message: 'This is a test notification',
          recipientIds: ['user-001'],
          priority: 'medium' as const,
        };

        const result = notificationCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should validate all priority levels', () => {
      const priorities = ['low', 'medium', 'high', 'urgent'] as const;

      priorities.forEach((priority) => {
        const validData = {
          type: 'general' as const,
          title: 'Test',
          message: 'Test message',
          recipientIds: ['user-001'],
          priority,
        };

        const result = notificationCreateSchema.safeParse(validData);
        expect(result.success).toBe(true);
      });
    });

    it('should reject empty title', () => {
      const invalidData = {
        type: 'general' as const,
        title: '',
        message: 'Test message',
        recipientIds: ['user-001'],
        priority: 'medium' as const,
      };

      const result = notificationCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject title > 100 characters', () => {
      const invalidData = {
        type: 'general' as const,
        title: 'a'.repeat(101),
        message: 'Test message',
        recipientIds: ['user-001'],
        priority: 'medium' as const,
      };

      const result = notificationCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject message > 500 characters', () => {
      const invalidData = {
        type: 'general' as const,
        title: 'Test',
        message: 'a'.repeat(501),
        recipientIds: ['user-001'],
        priority: 'medium' as const,
      };

      const result = notificationCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject empty recipientIds array', () => {
      const invalidData = {
        type: 'general' as const,
        title: 'Test',
        message: 'Test message',
        recipientIds: [],
        priority: 'medium' as const,
      };

      const result = notificationCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid type', () => {
      const invalidData = {
        type: 'invalid_type',
        title: 'Test',
        message: 'Test message',
        recipientIds: ['user-001'],
        priority: 'medium' as const,
      };

      const result = notificationCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it('should reject invalid priority', () => {
      const invalidData = {
        type: 'general' as const,
        title: 'Test',
        message: 'Test message',
        recipientIds: ['user-001'],
        priority: 'critical',
      };

      const result = notificationCreateSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });
});
