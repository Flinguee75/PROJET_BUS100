/**
 * Tests unitaires pour Notification Service
 * Test de la logique métier des notifications et FCM
 */

import { NotificationService } from '../../src/services/notification.service';
import { collections } from '../../src/config/firebase.config';
import { NotificationType, NotificationPriority } from '../../src/types/notification.types';

// Mock Firebase
jest.mock('../../src/config/firebase.config', () => ({
  collections: {
    buses: 'buses',
    students: 'students',
    drivers: 'drivers',
    parents: 'parents',
    admins: 'admins',
    gpsLive: 'gps_live',
    gpsHistory: 'gps_history',
    notifications: 'notifications',
    routes: 'routes',
    attendance: 'attendance',
    fcmTokens: 'fcm_tokens',
  },
  getDb: jest.fn(),
  getAuth: jest.fn(),
  getMessaging: jest.fn(),
  getStorage: jest.fn(),
}));

describe('NotificationService', () => {
  let notificationService: NotificationService;
  let mockDb: any;
  let mockMessaging: any;
  const { getDb, getMessaging } = require('../../src/config/firebase.config');

  beforeEach(() => {
    notificationService = new NotificationService();
    jest.clearAllMocks();

    // Setup mock Firestore
    mockDb = {
      collection: jest.fn(() => ({
        doc: jest.fn(() => ({
          get: jest.fn(),
          set: jest.fn(),
          update: jest.fn(),
          delete: jest.fn(),
        })),
        add: jest.fn(),
        where: jest.fn(),
        orderBy: jest.fn(),
        limit: jest.fn(),
        get: jest.fn(),
      })),
      batch: jest.fn(() => ({
        delete: jest.fn(),
        commit: jest.fn(),
      })),
    };

    // Setup mock Messaging
    mockMessaging = {
      sendEachForMulticast: jest.fn(),
    };

    getDb.mockReturnValue(mockDb);
    getMessaging.mockReturnValue(mockMessaging);
  });

  describe('createAndSend', () => {
    it('should create and send notification successfully', async () => {
      const mockDocRef = { id: 'notif-123' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      const mockWhere = jest.fn().mockReturnThis();
      const mockGet = jest.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              userId: 'user-1',
              token: 'fcm-token-1',
              platform: 'ios',
            }),
          },
        ],
      });

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.notifications) {
          return { add: mockAdd };
        }
        if (name === collections.fcmTokens) {
          return {
            where: mockWhere,
            get: mockGet,
          };
        }
        return {};
      });

      mockDb.collection = mockCollection;
      mockMessaging.sendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [],
      });

      const input = {
        type: NotificationType.BUS_ARRIVING,
        title: 'Bus arrivant',
        message: 'Le bus arrive dans 5 minutes',
        recipientIds: ['user-1'],
        priority: NotificationPriority.MEDIUM,
      };

      const result = await notificationService.createAndSend(input);

      expect(result.id).toBe('notif-123');
      expect(result.title).toBe(input.title);
      expect(result.message).toBe(input.message);
      expect(result.read).toBe(false);
      expect(mockAdd).toHaveBeenCalled();
      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalled();
    });

    it('should create notification with additional data', async () => {
      const mockDocRef = { id: 'notif-456' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);

      mockDb.collection = jest.fn(() => ({
        add: mockAdd,
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({ docs: [] }),
      }));

      mockMessaging.sendEachForMulticast.mockResolvedValue({
        successCount: 0,
        failureCount: 0,
        responses: [],
      });

      const input = {
        type: NotificationType.STUDENT_ABSENT,
        title: 'Absence',
        message: 'Votre enfant est absent',
        recipientIds: ['parent-1'],
        priority: NotificationPriority.URGENT,
        data: {
          studentId: 'student-123',
          date: '2024-01-15',
        },
      };

      const result = await notificationService.createAndSend(input);

      expect(result.data).toEqual(input.data);
      expect(result.priority).toBe('urgent');
    });
  });

  describe('getNotificationsForUser', () => {
    it('should get notifications for user', async () => {
      const mockNotifications = [
        {
          id: 'notif-1',
          type: NotificationType.BUS_ARRIVING,
          title: 'Bus arrivant',
          message: 'Le bus arrive',
          recipientIds: ['user-1'],
          priority: NotificationPriority.MEDIUM,
          read: false,
          sentAt: new Date(),
        },
        {
          id: 'notif-2',
          type: NotificationType.BUS_DELAYED,
          title: 'Retard',
          message: 'Le bus a du retard',
          recipientIds: ['user-1'],
          priority: NotificationPriority.URGENT,
          read: true,
          sentAt: new Date(),
        },
      ];

      const mockDocs = mockNotifications.map((notif) => ({
        id: notif.id,
        data: () => {
          const { id, ...rest } = notif;
          return rest;
        },
      }));

      const mockGet = jest.fn().mockResolvedValue({ docs: mockDocs });
      const mockLimit = jest.fn(() => ({ get: mockGet }));
      const mockOrderBy = jest.fn(() => ({ limit: mockLimit }));
      const mockWhere = jest.fn(() => ({ orderBy: mockOrderBy }));
      const mockCollection = jest.fn(() => ({ where: mockWhere }));

      mockDb.collection = mockCollection;

      const result = await notificationService.getNotificationsForUser('user-1');

      expect(result).toHaveLength(2);
      expect(result[0]!.id).toBe('notif-1');
      expect(mockWhere).toHaveBeenCalledWith('recipientIds', 'array-contains', 'user-1');
      expect(mockOrderBy).toHaveBeenCalledWith('sentAt', 'desc');
      expect(mockLimit).toHaveBeenCalledWith(50);
    });

    it('should respect custom limit', async () => {
      const mockGet = jest.fn().mockResolvedValue({ docs: [] });
      const mockLimit = jest.fn(() => ({ get: mockGet }));
      const mockOrderBy = jest.fn(() => ({ limit: mockLimit }));
      const mockWhere = jest.fn(() => ({ orderBy: mockOrderBy }));
      const mockCollection = jest.fn(() => ({ where: mockWhere }));

      mockDb.collection = mockCollection;

      await notificationService.getNotificationsForUser('user-1', 10);

      expect(mockLimit).toHaveBeenCalledWith(10);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      const mockUpdate = jest.fn().mockResolvedValue(undefined);
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          recipientIds: ['user-1', 'user-2'],
          read: false,
        }),
      });

      const mockDoc = jest.fn(() => ({
        get: mockGet,
        update: mockUpdate,
      }));

      const mockCollection = jest.fn(() => ({ doc: mockDoc }));
      mockDb.collection = mockCollection;

      await notificationService.markAsRead('notif-123', 'user-1');

      expect(mockUpdate).toHaveBeenCalledWith({
        read: true,
        readAt: expect.any(Date),
      });
    });

    it('should throw error when notification not found', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: false,
      });

      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));
      mockDb.collection = mockCollection;

      await expect(
        notificationService.markAsRead('notif-999', 'user-1')
      ).rejects.toThrow('Notification notif-999 not found');
    });

    it('should throw error when user is not a recipient', async () => {
      const mockGet = jest.fn().mockResolvedValue({
        exists: true,
        data: () => ({
          recipientIds: ['user-2', 'user-3'],
        }),
      });

      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));
      mockDb.collection = mockCollection;

      await expect(
        notificationService.markAsRead('notif-123', 'user-1')
      ).rejects.toThrow('User user-1 is not a recipient of this notification');
    });
  });

  describe('registerFCMToken', () => {
    it('should register FCM token', async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      const mockDoc = jest.fn(() => ({ set: mockSet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));

      mockDb.collection = mockCollection;

      await notificationService.registerFCMToken('user-1', 'fcm-token-123', 'ios');

      expect(mockDoc).toHaveBeenCalledWith('fcm-token-123');
      expect(mockSet).toHaveBeenCalledWith({
        userId: 'user-1',
        token: 'fcm-token-123',
        platform: 'ios',
        createdAt: expect.any(Date),
        lastUsedAt: expect.any(Date),
      });
    });

    it('should support all platforms', async () => {
      const mockSet = jest.fn().mockResolvedValue(undefined);
      const mockDoc = jest.fn(() => ({ set: mockSet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));

      mockDb.collection = mockCollection;

      await notificationService.registerFCMToken('user-1', 'token-1', 'android');
      await notificationService.registerFCMToken('user-2', 'token-2', 'web');
      await notificationService.registerFCMToken('user-3', 'token-3', 'ios');

      expect(mockSet).toHaveBeenCalledTimes(3);
    });
  });

  describe('removeFCMToken', () => {
    it('should remove FCM token', async () => {
      const mockDelete = jest.fn().mockResolvedValue(undefined);
      const mockDoc = jest.fn(() => ({ delete: mockDelete }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));

      mockDb.collection = mockCollection;

      await notificationService.removeFCMToken('fcm-token-123');

      expect(mockDoc).toHaveBeenCalledWith('fcm-token-123');
      expect(mockDelete).toHaveBeenCalled();
    });
  });

  describe('notifyParentsOfStudent', () => {
    it('should notify parents of student', async () => {
      const mockStudentData = {
        firstName: 'Jean',
        lastName: 'Dupont',
        parentIds: ['parent-1', 'parent-2'],
      };

      const mockStudentDoc = {
        exists: true,
        data: () => mockStudentData,
      };

      const mockGet = jest.fn().mockResolvedValue(mockStudentDoc);
      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockAdd = jest.fn().mockResolvedValue({ id: 'notif-123' });

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.students) {
          return { doc: mockDoc };
        }
        if (name === collections.notifications) {
          return { add: mockAdd };
        }
        return {
          where: jest.fn().mockReturnThis(),
          get: jest.fn().mockResolvedValue({ docs: [] }),
        };
      });

      mockDb.collection = mockCollection;
      mockMessaging.sendEachForMulticast.mockResolvedValue({
        successCount: 0,
        failureCount: 0,
      });

      const result = await notificationService.notifyParentsOfStudent(
        'student-123',
        'Test Title',
        'Test Message',
        'student_absent' as NotificationType,
        'urgent' as NotificationPriority,
        { reason: 'sick' }
      );

      expect(result.recipientIds).toEqual(['parent-1', 'parent-2']);
      expect(result.data).toEqual({
        studentId: 'student-123',
        reason: 'sick',
      });
      expect(mockAdd).toHaveBeenCalled();
    });

    it('should throw error when student not found', async () => {
      const mockGet = jest.fn().mockResolvedValue({ exists: false });
      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));

      mockDb.collection = mockCollection;

      await expect(
        notificationService.notifyParentsOfStudent(
          'student-999',
          'Title',
          'Message',
          'student_absent' as NotificationType
        )
      ).rejects.toThrow('Student student-999 not found');
    });

    it('should throw error when student has no parents', async () => {
      const mockStudentDoc = {
        exists: true,
        data: () => ({
          firstName: 'Jean',
          parentIds: [],
        }),
      };

      const mockGet = jest.fn().mockResolvedValue(mockStudentDoc);
      const mockDoc = jest.fn(() => ({ get: mockGet }));
      const mockCollection = jest.fn(() => ({ doc: mockDoc }));

      mockDb.collection = mockCollection;

      await expect(
        notificationService.notifyParentsOfStudent(
          'student-123',
          'Title',
          'Message',
          'student_absent' as NotificationType
        )
      ).rejects.toThrow('Student student-123 has no parents');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      const mockSnapshot = { size: 5 };
      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockWhere2 = jest.fn(() => ({ get: mockGet }));
      const mockWhere1 = jest.fn(() => ({ where: mockWhere2 }));
      const mockCollection = jest.fn(() => ({ where: mockWhere1 }));

      mockDb.collection = mockCollection;

      const count = await notificationService.getUnreadCount('user-1');

      expect(count).toBe(5);
      expect(mockWhere1).toHaveBeenCalledWith('recipientIds', 'array-contains', 'user-1');
      expect(mockWhere2).toHaveBeenCalledWith('read', '==', false);
    });

    it('should return 0 when no unread notifications', async () => {
      const mockSnapshot = { size: 0 };
      const mockGet = jest.fn().mockResolvedValue(mockSnapshot);
      const mockWhere2 = jest.fn(() => ({ get: mockGet }));
      const mockWhere1 = jest.fn(() => ({ where: mockWhere2 }));
      const mockCollection = jest.fn(() => ({ where: mockWhere1 }));

      mockDb.collection = mockCollection;

      const count = await notificationService.getUnreadCount('user-1');

      expect(count).toBe(0);
    });
  });

  describe('FCM Push Notifications', () => {
    it('should send push notifications with high priority for urgent', async () => {
      const mockDocRef = { id: 'notif-123' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      const mockWhere = jest.fn().mockReturnThis();
      const mockGet = jest.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              userId: 'user-1',
              token: 'fcm-token-1',
              platform: 'ios',
            }),
          },
        ],
      });

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.notifications) {
          return { add: mockAdd };
        }
        return { where: mockWhere, get: mockGet };
      });

      mockDb.collection = mockCollection;
      mockMessaging.sendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [],
      });

      await notificationService.createAndSend({
        type: NotificationType.BUS_DELAYED,
        title: 'Retard',
        message: 'Bus retardé',
        recipientIds: ['user-1'],
        priority: NotificationPriority.URGENT,
      });

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalledWith(
        expect.objectContaining({
          android: { priority: 'high' },
          apns: { headers: { 'apns-priority': '10' } },
        })
      );
    });

    it('should handle FCM send failures gracefully', async () => {
      const mockDocRef = { id: 'notif-123' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      const mockWhere = jest.fn().mockReturnThis();
      const mockGet = jest.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              userId: 'user-1',
              token: 'invalid-token',
              platform: 'ios',
            }),
          },
        ],
      });

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.notifications) {
          return { add: mockAdd };
        }
        return { where: mockWhere, get: mockGet };
      });

      mockDb.collection = mockCollection;
      mockMessaging.sendEachForMulticast.mockRejectedValue(
        new Error('FCM Error')
      );

      await expect(
        notificationService.createAndSend({
          type: NotificationType.BUS_ARRIVING,
          title: 'Test',
          message: 'Test',
          recipientIds: ['user-1'],
          priority: NotificationPriority.MEDIUM,
        })
      ).rejects.toThrow('Failed to send push notifications');
    });

    it('should not send push when no FCM tokens found', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockDocRef = { id: 'notif-123' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      const mockWhere = jest.fn().mockReturnThis();
      const mockGet = jest.fn().mockResolvedValue({ docs: [] });

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.notifications) {
          return { add: mockAdd };
        }
        return { where: mockWhere, get: mockGet };
      });

      mockDb.collection = mockCollection;

      await notificationService.createAndSend({
        type: NotificationType.BUS_ARRIVING,
        title: 'Test',
        message: 'Test',
        recipientIds: ['user-1'],
        priority: NotificationPriority.MEDIUM,
      });

      expect(mockMessaging.sendEachForMulticast).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        '⚠️ Aucun token FCM trouvé pour les utilisateurs'
      );

      consoleSpy.mockRestore();
    });

    it('should cleanup invalid FCM tokens after failures', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      const mockDocRef = { id: 'notif-123' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      const mockWhere = jest.fn().mockReturnThis();
      const mockGet = jest.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              userId: 'user-1',
              token: 'invalid-token-1',
              platform: 'ios',
            }),
          },
          {
            data: () => ({
              userId: 'user-2',
              token: 'invalid-token-2',
              platform: 'android',
            }),
          },
        ],
      });

      const mockBatchDelete = jest.fn();
      const mockBatchCommit = jest.fn().mockResolvedValue(undefined);
      const mockBatch = {
        delete: mockBatchDelete,
        commit: mockBatchCommit,
      };

      const mockDoc = jest.fn(() => ({ delete: jest.fn() }));

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.notifications) {
          return { add: mockAdd };
        }
        if (name === collections.fcmTokens) {
          return {
            where: mockWhere,
            get: mockGet,
            doc: mockDoc,
          };
        }
        return {};
      });

      mockDb.collection = mockCollection;
      mockDb.batch = jest.fn(() => mockBatch);

      mockMessaging.sendEachForMulticast.mockResolvedValue({
        successCount: 0,
        failureCount: 2,
        responses: [
          {
            success: false,
            error: { code: 'messaging/invalid-registration-token' },
          },
          {
            success: false,
            error: { code: 'messaging/registration-token-not-registered' },
          },
        ],
      });

      await notificationService.createAndSend({
        type: NotificationType.BUS_ARRIVING,
        title: 'Test',
        message: 'Test',
        recipientIds: ['user-1', 'user-2'],
        priority: NotificationPriority.MEDIUM,
      });

      expect(mockBatchDelete).toHaveBeenCalledTimes(2);
      expect(mockBatchCommit).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('🧹 Tokens invalides supprimés');

      consoleSpy.mockRestore();
    });

    it('should handle empty recipient list gracefully', async () => {
      const mockDocRef = { id: 'notif-123' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);

      mockDb.collection = jest.fn(() => ({ add: mockAdd }));

      const result = await notificationService.createAndSend({
        type: NotificationType.GENERAL,
        title: 'Broadcast',
        message: 'Test message',
        recipientIds: [],
        priority: NotificationPriority.LOW,
      });

      expect(result.id).toBe('notif-123');
      expect(mockMessaging.sendEachForMulticast).not.toHaveBeenCalled();
    });

    it('should send notification without data field', async () => {
      const mockDocRef = { id: 'notif-789' };
      const mockAdd = jest.fn().mockResolvedValue(mockDocRef);
      const mockWhere = jest.fn().mockReturnThis();
      const mockGet = jest.fn().mockResolvedValue({
        docs: [
          {
            data: () => ({
              userId: 'user-1',
              token: 'fcm-token-1',
              platform: 'ios',
            }),
          },
        ],
      });

      const mockCollection = jest.fn((name: string) => {
        if (name === collections.notifications) {
          return { add: mockAdd };
        }
        return { where: mockWhere, get: mockGet };
      });

      mockDb.collection = mockCollection;
      mockMessaging.sendEachForMulticast.mockResolvedValue({
        successCount: 1,
        failureCount: 0,
        responses: [],
      });

      await notificationService.createAndSend({
        type: NotificationType.GENERAL,
        title: 'Test Notification',
        message: 'Test message without data',
        recipientIds: ['user-1'],
        priority: NotificationPriority.LOW,
        // No data field
      });

      expect(mockMessaging.sendEachForMulticast).toHaveBeenCalled();
      const messageSent = mockMessaging.sendEachForMulticast.mock.calls[0]![0];
      expect(messageSent.data).toBeDefined();
      expect(messageSent.notification.title).toBe('Test Notification');
    });
  });
});
