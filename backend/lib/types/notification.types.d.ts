export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    recipientIds: string[];
    busId?: string;
    studentId?: string;
    priority: NotificationPriority;
    sentAt: Date;
    readBy: string[];
    data?: Record<string, unknown>;
}
export declare enum NotificationType {
    BUS_ARRIVING = "bus_arriving",
    BUS_DELAYED = "bus_delayed",
    BUS_BREAKDOWN = "bus_breakdown",
    STUDENT_ABSENT = "student_absent",
    ROUTE_CHANGED = "route_changed",
    MAINTENANCE_DUE = "maintenance_due",
    GENERAL = "general"
}
export declare enum NotificationPriority {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    URGENT = "urgent"
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
//# sourceMappingURL=notification.types.d.ts.map