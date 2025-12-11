export interface Bus {
    id: string;
    busNumber: number;
    plateNumber: string;
    capacity: number;
    model: string;
    year: number;
    driverId: string | null;
    driverName?: string | null;
    routeId: string | null;
    status: BusStatus;
    maintenanceStatus: BusMaintenanceStatus;
    assignedCommune?: string;
    assignedQuartiers?: string[];
    preferredDepartureTime?: string;
    createdAt: Date;
    updatedAt: Date;
}
export declare enum BusStatus {
    ACTIVE = "active",
    INACTIVE = "inactive",
    IN_MAINTENANCE = "in_maintenance",
    OUT_OF_SERVICE = "out_of_service"
}
export declare enum BusMaintenanceStatus {
    OK = "ok",
    WARNING = "warning",
    CRITICAL = "critical"
}
export interface BusCreateInput {
    busNumber: number;
    plateNumber: string;
    capacity: number;
    model: string;
    year: number;
}
export interface BusUpdateInput {
    busNumber?: number;
    plateNumber?: string;
    capacity?: number;
    model?: string;
    year?: number;
    driverId?: string | null;
    routeId?: string | null;
    status?: BusStatus;
    maintenanceStatus?: BusMaintenanceStatus;
    assignedCommune?: string;
    assignedQuartiers?: string[];
    preferredDepartureTime?: string;
}
//# sourceMappingURL=bus.types.d.ts.map