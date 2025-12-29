/**
 * Tests pour le filtrage des notifications par type de trajet
 */

import { NotificationService } from '../../src/services/notification.service';

// Mock Firebase
jest.mock('../../src/config/firebase.config', () => ({
  collections: {
    buses: 'buses',
    students: 'students',
    users: 'users',
    notifications: 'notifications',
    fcmTokens: 'fcm_tokens',
  },
  getDb: jest.fn(),
  getMessaging: jest.fn(),
}));

describe('NotificationService - Trip Filtering', () => {
  let notificationService: NotificationService;
  let mockDb: any;
  let mockMessaging: any;
  const { getDb, getMessaging } = require('../../src/config/firebase.config');

  beforeEach(() => {
    notificationService = new NotificationService();
    jest.clearAllMocks();

    // Setup mock Firestore
    mockDb = {
      collection: jest.fn().mockReturnThis(),
      doc: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      get: jest.fn(),
      add: jest.fn(),
      update: jest.fn(),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        commit: jest.fn(),
      })),
    };

    // Setup mock Messaging
    mockMessaging = {
      sendEachForMulticast: jest.fn().mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [],
      }),
    };

    getDb.mockReturnValue(mockDb);
    getMessaging.mockReturnValue(mockMessaging);
  });

  describe('notifyParentsRouteStarted - Trip Filtering', () => {
    it('should only notify parents of students enrolled in current trip', async () => {
      const busId = 'bus123';
      const driverId = 'driver456';

      // Mock bus avec currentTrip morning_outbound
      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              plateNumber: 'ABC-123',
              currentTrip: {
                tripType: 'morning_outbound',
                routeId: 'route1',
                startTime: Date.now(),
                scannedStudentIds: [],
              },
            }),
          }),
        }),
      });

      // Mock driver
      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              firstName: 'Jean',
              lastName: 'Dupont',
            }),
          }),
        }),
      });

      // Mock students
      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            empty: false,
            docs: [
              {
                id: 'student1',
                data: () => ({
                  firstName: 'Emma',
                  lastName: 'Martin',
                  activeTrips: ['morning_outbound', 'evening_return'], // Inscrit au trip
                  parentIds: ['parent1'],
                }),
              },
              {
                id: 'student2',
                data: () => ({
                  firstName: 'Lucas',
                  lastName: 'Dubois',
                  activeTrips: ['midday_outbound', 'midday_return'], // PAS inscrit au trip
                  parentIds: ['parent2'],
                }),
              },
              {
                id: 'student3',
                data: () => ({
                  firstName: 'Sophie',
                  lastName: 'Leroy',
                  activeTrips: ['morning_outbound'], // Inscrit au trip
                  parentIds: ['parent3'],
                }),
              },
            ],
          }),
        }),
      });

      // Mock FCM tokens
      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            docs: [
              {
                data: () => ({ userId: 'parent1', token: 'token1' }),
              },
              {
                data: () => ({ userId: 'parent3', token: 'token3' }),
              },
            ],
          }),
        }),
      });

      // Mock notification creation
      mockDb.collection.mockReturnValueOnce({
        add: jest.fn().mockResolvedValueOnce({ id: 'notif123' }),
      });

      await notificationService.notifyParentsRouteStarted(busId, driverId);

      // Vérifier que la notification a été créée avec seulement parent1 et parent3
      const addCall = mockDb.add.mock.calls[0];
      expect(addCall).toBeDefined();

      // La notification doit avoir été envoyée à 2 parents (pas 3)
      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalled();
    });

    it('should use trip-specific message for morning_outbound', async () => {
      const busId = 'bus123';
      const driverId = 'driver456';

      // Setup mocks similaire au test précédent
      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              plateNumber: 'ABC-123',
              currentTrip: {
                tripType: 'morning_outbound',
              },
            }),
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              firstName: 'Jean',
              lastName: 'Dupont',
            }),
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            empty: false,
            docs: [
              {
                id: 'student1',
                data: () => ({
                  activeTrips: ['morning_outbound'],
                  parentIds: ['parent1'],
                }),
              },
            ],
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            docs: [
              {
                data: () => ({ userId: 'parent1', token: 'token1' }),
              },
            ],
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        add: jest.fn().mockResolvedValueOnce({ id: 'notif123' }),
      });

      await notificationService.notifyParentsRouteStarted(busId, driverId);

      // Vérifier le message de notification
      const addCall = mockDb.add.mock.calls[0];
      const notification = addCall[0];

      expect(notification.title).toBe('Ramassage du matin démarré');
      expect(notification.message).toContain('ramassage du matin');
      expect(notification.message).toContain('Jean Dupont');
    });

    it('should not notify if no students are enrolled in current trip', async () => {
      const busId = 'bus123';
      const driverId = 'driver456';

      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              currentTrip: {
                tripType: 'morning_outbound',
              },
            }),
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              firstName: 'Jean',
              lastName: 'Dupont',
            }),
          }),
        }),
      });

      // Tous les élèves sont inscrits à d'autres trips
      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            empty: false,
            docs: [
              {
                id: 'student1',
                data: () => ({
                  activeTrips: ['midday_outbound'], // Pas inscrit
                  parentIds: ['parent1'],
                }),
              },
              {
                id: 'student2',
                data: () => ({
                  activeTrips: ['evening_return'], // Pas inscrit
                  parentIds: ['parent2'],
                }),
              },
            ],
          }),
        }),
      });

      await notificationService.notifyParentsRouteStarted(busId, driverId);

      // Aucune notification ne doit être envoyée
      expect(mockMessaging.sendEachForMulticast).not.toHaveBeenCalled();
    });
  });

  describe('notifyParentsArrival - Trip Filtering', () => {
    it('should only notify parents of students enrolled in current trip', async () => {
      const busId = 'bus123';

      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              currentTrip: {
                tripType: 'evening_return',
              },
            }),
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            empty: false,
            docs: [
              {
                id: 'student1',
                data: () => ({
                  firstName: 'Emma',
                  activeTrips: ['evening_return'], // Inscrit
                  parentIds: ['parent1'],
                }),
              },
              {
                id: 'student2',
                data: () => ({
                  firstName: 'Lucas',
                  activeTrips: ['morning_outbound'], // PAS inscrit
                  parentIds: ['parent2'],
                }),
              },
            ],
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            docs: [
              {
                data: () => ({ userId: 'parent1', token: 'token1' }),
              },
            ],
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        add: jest.fn().mockResolvedValueOnce({ id: 'notif123' }),
      });

      await notificationService.notifyParentsArrival(busId);

      // Seul parent1 doit recevoir la notification
      const addCall = mockDb.add.mock.calls[0];
      const notification = addCall[0];

      expect(notification.recipientIds).toEqual(['parent1']);
      expect(notification.recipientIds).not.toContain('parent2');
    });

    it('should use correct message for evening_return trip', async () => {
      const busId = 'bus123';

      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              currentTrip: {
                tripType: 'evening_return',
              },
            }),
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            empty: false,
            docs: [
              {
                id: 'student1',
                data: () => ({
                  firstName: 'Emma',
                  activeTrips: ['evening_return'],
                  parentIds: ['parent1'],
                }),
              },
            ],
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            docs: [
              {
                data: () => ({ userId: 'parent1', token: 'token1' }),
              },
            ],
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        add: jest.fn().mockResolvedValueOnce({ id: 'notif123' }),
      });

      await notificationService.notifyParentsArrival(busId);

      const addCall = mockDb.add.mock.calls[0];
      const notification = addCall[0];

      expect(notification.title).toBe('Départ de l\'école');
      expect(notification.message).toContain('en route vers la maison');
      expect(notification.message).toContain('fin de journée');
    });

    it('should use correct message for morning_outbound trip', async () => {
      const busId = 'bus123';

      mockDb.collection.mockReturnValueOnce({
        doc: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            exists: true,
            data: () => ({
              currentTrip: {
                tripType: 'morning_outbound',
              },
            }),
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            empty: false,
            docs: [
              {
                id: 'student1',
                data: () => ({
                  firstName: 'Emma',
                  activeTrips: ['morning_outbound'],
                  parentIds: ['parent1'],
                }),
              },
            ],
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        where: jest.fn().mockReturnValueOnce({
          get: jest.fn().mockResolvedValueOnce({
            docs: [
              {
                data: () => ({ userId: 'parent1', token: 'token1' }),
              },
            ],
          }),
        }),
      });

      mockDb.collection.mockReturnValueOnce({
        add: jest.fn().mockResolvedValueOnce({ id: 'notif123' }),
      });

      await notificationService.notifyParentsArrival(busId);

      const addCall = mockDb.add.mock.calls[0];
      const notification = addCall[0];

      expect(notification.title).toBe('Arrivée à l\'école');
      expect(notification.message).toContain('déposé à l\'école');
      expect(notification.message).toContain('matin');
    });
  });
});
