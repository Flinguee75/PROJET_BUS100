/**
 * Notification Service - Logique métier pour les notifications
 * Gère l'envoi de notifications push via FCM et le stockage des notifications
 */

import { getDb, getMessaging, collections } from '../config/firebase.config';
import {
  NotificationCreateInput,
  NotificationType,
  NotificationPriority,
} from '../types';

export interface Notification {
  id?: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientIds: string[];
  priority: NotificationPriority;
  data?: Record<string, any>;
  read: boolean;
  sentAt: Date;
  readAt?: Date;
}

export interface FCMToken {
  userId: string;
  token: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
  lastUsedAt: Date;
}

export class NotificationService {
  /**
   * Crée et envoie une notification
   * - Stocke dans Firestore
   * - Envoie push notification via FCM aux utilisateurs connectés
   */
  async createAndSend(data: NotificationCreateInput): Promise<Notification> {
    const db = getDb();

    // Créer la notification dans Firestore
    const notification: Notification = {
      type: data.type,
      title: data.title,
      message: data.message,
      recipientIds: data.recipientIds,
      priority: data.priority,
      data: data.data,
      read: false,
      sentAt: new Date(),
    };

    const docRef = await db.collection(collections.notifications).add(notification);
    notification.id = docRef.id;

    // Envoyer push notifications aux utilisateurs qui ont des tokens FCM
    await this.sendPushNotifications(data.recipientIds, {
      title: data.title,
      body: data.message,
      data: {
        notificationId: docRef.id,
        type: data.type,
        ...data.data,
      },
      priority: data.priority,
    });

    return notification;
  }

  /**
   * Récupère les notifications pour un utilisateur
   */
  async getNotificationsForUser(
    userId: string,
    limit: number = 50
  ): Promise<Notification[]> {
    const db = getDb();

    const snapshot = await db
      .collection(collections.notifications)
      .where('recipientIds', 'array-contains', userId)
      .orderBy('sentAt', 'desc')
      .limit(limit)
      .get();

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    } as Notification));
  }

  /**
   * Marque une notification comme lue
   */
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    const db = getDb();
    const docRef = db.collection(collections.notifications).doc(notificationId);

    const doc = await docRef.get();
    if (!doc.exists) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    const notification = doc.data() as Notification;
    if (!notification.recipientIds.includes(userId)) {
      throw new Error(`User ${userId} is not a recipient of this notification`);
    }

    await docRef.update({
      read: true,
      readAt: new Date(),
    });
  }

  /**
   * Enregistre un token FCM pour un utilisateur
   */
  async registerFCMToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web'
  ): Promise<void> {
    const db = getDb();

    const fcmToken: FCMToken = {
      userId,
      token,
      platform,
      createdAt: new Date(),
      lastUsedAt: new Date(),
    };

    // Utiliser le token comme ID pour éviter les doublons
    await db.collection(collections.fcmTokens).doc(token).set(fcmToken);
  }

  /**
   * Supprime un token FCM (déconnexion)
   */
  async removeFCMToken(token: string): Promise<void> {
    const db = getDb();
    await db.collection(collections.fcmTokens).doc(token).delete();
  }

  /**
   * Récupère tous les tokens FCM pour une liste d'utilisateurs
   */
  private async getFCMTokensForUsers(userIds: string[]): Promise<string[]> {
    if (userIds.length === 0) {
      return [];
    }

    const db = getDb();
    const tokens: string[] = [];

    // Firestore limite 'in' à 10 éléments, donc on fait des requêtes par batch
    const batchSize = 10;
    for (let i = 0; i < userIds.length; i += batchSize) {
      const batch = userIds.slice(i, i + batchSize);
      const snapshot = await db
        .collection(collections.fcmTokens)
        .where('userId', 'in', batch)
        .get();

      snapshot.docs.forEach((doc) => {
        const tokenData = doc.data() as FCMToken;
        tokens.push(tokenData.token);
      });
    }

    return tokens;
  }

  /**
   * Envoie des notifications push via FCM
   */
  private async sendPushNotifications(
    userIds: string[],
    payload: {
      title: string;
      body: string;
      data?: Record<string, any>;
      priority: NotificationPriority;
    }
  ): Promise<void> {
    const tokens = await this.getFCMTokensForUsers(userIds);

    if (tokens.length === 0) {
      console.log('⚠️ Aucun token FCM trouvé pour les utilisateurs');
      return;
    }

    const messaging = getMessaging();

    // Mapper la priorité vers la priorité FCM
    const fcmPriority =
      payload.priority === NotificationPriority.URGENT ||
      payload.priority === NotificationPriority.HIGH
        ? 'high'
        : 'normal';

    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      tokens,
      android: {
        priority: fcmPriority as 'high' | 'normal',
      },
      apns: {
        headers: {
          'apns-priority': fcmPriority === 'high' ? '10' : '5',
        },
      },
    };

    try {
      const response = await messaging.sendEachForMulticast(message);
      console.log(
        `✅ Notifications envoyées: ${response.successCount}/${tokens.length}`
      );

      // Supprimer les tokens invalides
      if (response.failureCount > 0) {
        await this.cleanupInvalidTokens(response, tokens);
      }
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi des notifications:', error);
      throw new Error('Failed to send push notifications');
    }
  }

  /**
   * Nettoie les tokens FCM invalides
   */
  private async cleanupInvalidTokens(
    response: any,
    tokens: string[]
  ): Promise<void> {
    const db = getDb();
    const batch = db.batch();

    response.responses.forEach((resp: any, idx: number) => {
      if (!resp.success) {
        const errorCode = resp.error?.code;
        // Supprimer les tokens invalides ou non enregistrés
        if (
          errorCode === 'messaging/invalid-registration-token' ||
          errorCode === 'messaging/registration-token-not-registered'
        ) {
          const tokenRef = db.collection(collections.fcmTokens).doc(tokens[idx]!);
          batch.delete(tokenRef);
        }
      }
    });

    await batch.commit();
    console.log(`🧹 Tokens invalides supprimés`);
  }

  /**
   * Envoie une notification aux parents d'un élève
   */
  async notifyParentsOfStudent(
    studentId: string,
    title: string,
    message: string,
    type: NotificationType,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
    data?: Record<string, any>
  ): Promise<Notification> {
    const db = getDb();

    // Récupérer l'élève pour obtenir les IDs des parents
    const studentDoc = await db.collection(collections.students).doc(studentId).get();

    if (!studentDoc.exists) {
      throw new Error(`Student ${studentId} not found`);
    }

    const student = studentDoc.data();
    if (!student || !student.parentIds || student.parentIds.length === 0) {
      throw new Error(`Student ${studentId} has no parents`);
    }

    return this.createAndSend({
      type,
      title,
      message,
      recipientIds: student.parentIds,
      priority,
      data: {
        studentId,
        ...data,
      },
    });
  }

  /**
   * Compte les notifications non lues pour un utilisateur
   */
  async getUnreadCount(userId: string): Promise<number> {
    const db = getDb();

    const snapshot = await db
      .collection(collections.notifications)
      .where('recipientIds', 'array-contains', userId)
      .where('read', '==', false)
      .get();

    return snapshot.size;
  }
}

export default new NotificationService();
