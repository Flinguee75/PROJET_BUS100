import { TimeOfDay } from './route.types';
export interface Bus {
    id: string;
    busNumber: number;
    plateNumber: string;
    capacity: number;
    model: string;
    year: number;
    driverId: string | null;
    driverName?: string | null;
    escortId: string | null;
    escortName?: string | null;
    routeId: string | null;
    studentIds: string[];
    status: BusStatus;
    maintenanceStatus: BusMaintenanceStatus;
    assignedCommune?: string;
    assignedQuartiers?: string[];
    preferredDepartureTime?: string;
    schoolId: string | null;
    lastScan?: {
        studentId: string;
        studentName: string;
        timestamp: number;
        type: 'boarding' | 'alighting';
        location?: {
            lat: number;
            lng: number;
        };
    };
    currentTrip?: {
        tripType: TimeOfDay;
        routeId: string;
        startTime: number;
        scannedStudentIds: string[];
        totalStudentCount: number;
    };
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
    schoolId?: string | null;
}
export interface BusUpdateInput {
    busNumber?: number;
    plateNumber?: string;
    capacity?: number;
    model?: string;
    year?: number;
    driverId?: string | null;
    escortId?: string | null;
    routeId?: string | null;
    studentIds?: string[];
    status?: BusStatus;
    maintenanceStatus?: BusMaintenanceStatus;
    assignedCommune?: string;
    assignedQuartiers?: string[];
    preferredDepartureTime?: string;
    schoolId?: string | null;
}
//# sourceMappingURL=bus.types.d.ts.map