/**
 * Types pour le système de notifications
 */

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  recipientIds: string[]; // IDs des utilisateurs destinataires
  busId?: string;
  studentId?: string;
  priority: NotificationPriority;
  sentAt: Date;
  readBy: string[]; // IDs des utilisateurs ayant lu
  data?: Record<string, unknown>; // Données additionnelles
}

export enum NotificationType {
  BUS_ARRIVING = 'bus_arriving', // Bus proche
  BUS_DELAYED = 'bus_delayed', // Retard
  BUS_BREAKDOWN = 'bus_breakdown', // Panne
  STUDENT_ABSENT = 'student_absent', // Élève absent
  STUDENT_BOARDED = 'student_boarded', // Élève monté dans le bus
  STUDENT_EXITED = 'student_exited', // Élève descendu du bus
  ROUTE_CHANGED = 'route_changed', // Changement de parcours
  MAINTENANCE_DUE = 'maintenance_due', // Maintenance requise
  GENERAL = 'general', // Notification générale
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export interface NotificationCreateInput {
  type: NotificationType;
  title: string;
  message: string;
  recipientIds: string[];
  busId?: string;
  studentId?: string;
  priority: NotificationPriority;
  data?: Record<string, unknown>;
}

export interface FCMToken {
  userId: string;
  token: string;
  deviceId: string;
  platform: 'ios' | 'android' | 'web';
  createdAt: Date;
  lastUsed: Date;
}
