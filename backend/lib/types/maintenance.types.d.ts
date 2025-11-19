export interface Maintenance {
    id: string;
    busId: string;
    type: MaintenanceType;
    severity: MaintenanceSeverity;
    title: string;
    description: string;
    reportedBy: string;
    reportedAt: Date;
    status: MaintenanceStatus;
    scheduledDate?: Date;
    completedDate?: Date;
    cost?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum MaintenanceType {
    MECHANICAL = "mechanical",
    ELECTRICAL = "electrical",
    TIRE = "tire",
    BODY = "body",
    SAFETY = "safety",
    CLEANING = "cleaning",
    INSPECTION = "inspection",
    OTHER = "other"
}
export declare enum MaintenanceSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export declare enum MaintenanceStatus {
    REPORTED = "reported",
    SCHEDULED = "scheduled",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    CANCELLED = "cancelled"
}
export interface MaintenanceCreateInput {
    busId: string;
    type: MaintenanceType;
    severity: MaintenanceSeverity;
    title: string;
    description: string;
    reportedBy: string;
    scheduledDate?: Date;
    cost?: number;
    notes?: string;
}
export interface MaintenanceUpdateInput {
    type?: MaintenanceType;
    severity?: MaintenanceSeverity;
    title?: string;
    description?: string;
    status?: MaintenanceStatus;
    scheduledDate?: Date;
    completedDate?: Date;
    cost?: number;
    notes?: string;
}
export interface MaintenanceFilter {
    busId?: string;
    status?: MaintenanceStatus;
    severity?: MaintenanceSeverity;
    type?: MaintenanceType;
}
//# sourceMappingURL=maintenance.types.d.ts.map