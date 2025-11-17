import { NotificationCreateInput, NotificationType, NotificationPriority } from '../types';
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
export declare class NotificationService {
    createAndSend(data: NotificationCreateInput): Promise<Notification>;
    getNotificationsForUser(userId: string, limit?: number): Promise<Notification[]>;
    markAsRead(notificationId: string, userId: string): Promise<void>;
    registerFCMToken(userId: string, token: string, platform: 'ios' | 'android' | 'web'): Promise<void>;
    removeFCMToken(token: string): Promise<void>;
    private getFCMTokensForUsers;
    private sendPushNotifications;
    private cleanupInvalidTokens;
    notifyParentsOfStudent(studentId: string, title: string, message: string, type: NotificationType, priority?: NotificationPriority, data?: Record<string, any>): Promise<Notification>;
    getUnreadCount(userId: string): Promise<number>;
}
declare const _default: NotificationService;
export default _default;
//# sourceMappingURL=notification.service.d.ts.map