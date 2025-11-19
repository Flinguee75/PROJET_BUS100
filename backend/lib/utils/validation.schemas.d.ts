import { z } from 'zod';
export declare const gpsPositionSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
    speed: z.ZodNumber;
    heading: z.ZodOptional<z.ZodNumber>;
    accuracy: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
    speed: number;
    timestamp: number;
    heading?: number | undefined;
    accuracy?: number | undefined;
}, {
    lat: number;
    lng: number;
    speed: number;
    timestamp: number;
    heading?: number | undefined;
    accuracy?: number | undefined;
}>;
export declare const gpsUpdateSchema: z.ZodObject<{
    busId: z.ZodString;
    lat: z.ZodNumber;
    lng: z.ZodNumber;
    speed: z.ZodNumber;
    heading: z.ZodOptional<z.ZodNumber>;
    accuracy: z.ZodOptional<z.ZodNumber>;
    timestamp: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
    speed: number;
    timestamp: number;
    busId: string;
    heading?: number | undefined;
    accuracy?: number | undefined;
}, {
    lat: number;
    lng: number;
    speed: number;
    timestamp: number;
    busId: string;
    heading?: number | undefined;
    accuracy?: number | undefined;
}>;
export declare const locationSchema: z.ZodObject<{
    address: z.ZodString;
    lat: z.ZodNumber;
    lng: z.ZodNumber;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
    address: string;
    notes?: string | undefined;
}, {
    lat: number;
    lng: number;
    address: string;
    notes?: string | undefined;
}>;
export declare const busCreateSchema: z.ZodObject<{
    plateNumber: z.ZodString;
    capacity: z.ZodNumber;
    model: z.ZodString;
    year: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    plateNumber: string;
    capacity: number;
    model: string;
    year: number;
}, {
    plateNumber: string;
    capacity: number;
    model: string;
    year: number;
}>;
export declare const busUpdateSchema: z.ZodObject<{
    plateNumber: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodNumber>;
    model: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    driverId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    routeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "in_maintenance", "out_of_service"]>>;
    maintenanceStatus: z.ZodOptional<z.ZodEnum<["ok", "warning", "critical"]>>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "in_maintenance" | "out_of_service" | undefined;
    plateNumber?: string | undefined;
    capacity?: number | undefined;
    model?: string | undefined;
    year?: number | undefined;
    driverId?: string | null | undefined;
    routeId?: string | null | undefined;
    maintenanceStatus?: "ok" | "warning" | "critical" | undefined;
}, {
    status?: "active" | "inactive" | "in_maintenance" | "out_of_service" | undefined;
    plateNumber?: string | undefined;
    capacity?: number | undefined;
    model?: string | undefined;
    year?: number | undefined;
    driverId?: string | null | undefined;
    routeId?: string | null | undefined;
    maintenanceStatus?: "ok" | "warning" | "critical" | undefined;
}>;
export declare const studentCreateSchema: z.ZodObject<{
    firstName: z.ZodString;
    lastName: z.ZodString;
    dateOfBirth: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    grade: z.ZodString;
    parentIds: z.ZodArray<z.ZodString, "many">;
    commune: z.ZodOptional<z.ZodString>;
    quartier: z.ZodOptional<z.ZodString>;
    pickupLocation: z.ZodObject<{
        address: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    }, {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    }>;
    dropoffLocation: z.ZodObject<{
        address: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    }, {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    }>;
    specialNeeds: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    firstName: string;
    lastName: string;
    dateOfBirth: string | Date;
    grade: string;
    parentIds: string[];
    pickupLocation: {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    };
    dropoffLocation: {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    };
    commune?: string | undefined;
    quartier?: string | undefined;
    specialNeeds?: string | undefined;
}, {
    firstName: string;
    lastName: string;
    dateOfBirth: string | Date;
    grade: string;
    parentIds: string[];
    pickupLocation: {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    };
    dropoffLocation: {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    };
    commune?: string | undefined;
    quartier?: string | undefined;
    specialNeeds?: string | undefined;
}>;
export declare const studentUpdateSchema: z.ZodObject<{
    firstName: z.ZodOptional<z.ZodString>;
    lastName: z.ZodOptional<z.ZodString>;
    dateOfBirth: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    grade: z.ZodOptional<z.ZodString>;
    commune: z.ZodOptional<z.ZodString>;
    quartier: z.ZodOptional<z.ZodString>;
    busId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    routeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    pickupLocation: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    }, {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    }>>;
    dropoffLocation: z.ZodOptional<z.ZodObject<{
        address: z.ZodString;
        lat: z.ZodNumber;
        lng: z.ZodNumber;
        notes: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    }, {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    }>>;
    specialNeeds: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    busId?: string | null | undefined;
    routeId?: string | null | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dateOfBirth?: string | Date | undefined;
    grade?: string | undefined;
    commune?: string | undefined;
    quartier?: string | undefined;
    pickupLocation?: {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    } | undefined;
    dropoffLocation?: {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    } | undefined;
    specialNeeds?: string | undefined;
    isActive?: boolean | undefined;
}, {
    busId?: string | null | undefined;
    routeId?: string | null | undefined;
    firstName?: string | undefined;
    lastName?: string | undefined;
    dateOfBirth?: string | Date | undefined;
    grade?: string | undefined;
    commune?: string | undefined;
    quartier?: string | undefined;
    pickupLocation?: {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    } | undefined;
    dropoffLocation?: {
        lat: number;
        lng: number;
        address: string;
        notes?: string | undefined;
    } | undefined;
    specialNeeds?: string | undefined;
    isActive?: boolean | undefined;
}>;
export declare const driverCreateSchema: z.ZodObject<{
    email: z.ZodString;
    displayName: z.ZodString;
    phoneNumber: z.ZodString;
    licenseNumber: z.ZodString;
    licenseExpiry: z.ZodUnion<[z.ZodString, z.ZodDate]>;
    photoUrl: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    email: string;
    displayName: string;
    phoneNumber: string;
    licenseNumber: string;
    licenseExpiry: string | Date;
    photoUrl?: string | undefined;
}, {
    email: string;
    displayName: string;
    phoneNumber: string;
    licenseNumber: string;
    licenseExpiry: string | Date;
    photoUrl?: string | undefined;
}>;
export declare const driverUpdateSchema: z.ZodObject<{
    displayName: z.ZodOptional<z.ZodString>;
    phoneNumber: z.ZodOptional<z.ZodString>;
    licenseNumber: z.ZodOptional<z.ZodString>;
    licenseExpiry: z.ZodOptional<z.ZodUnion<[z.ZodString, z.ZodDate]>>;
    busId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    photoUrl: z.ZodOptional<z.ZodString>;
    isActive: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    busId?: string | null | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    phoneNumber?: string | undefined;
    licenseNumber?: string | undefined;
    licenseExpiry?: string | Date | undefined;
    photoUrl?: string | undefined;
}, {
    busId?: string | null | undefined;
    isActive?: boolean | undefined;
    displayName?: string | undefined;
    phoneNumber?: string | undefined;
    licenseNumber?: string | undefined;
    licenseExpiry?: string | Date | undefined;
    photoUrl?: string | undefined;
}>;
export declare const userCreateSchema: z.ZodObject<{
    email: z.ZodString;
    displayName: z.ZodString;
    phoneNumber: z.ZodString;
    role: z.ZodEnum<["admin", "driver", "parent"]>;
}, "strip", z.ZodTypeAny, {
    email: string;
    displayName: string;
    phoneNumber: string;
    role: "admin" | "driver" | "parent";
}, {
    email: string;
    displayName: string;
    phoneNumber: string;
    role: "admin" | "driver" | "parent";
}>;
export declare const notificationCreateSchema: z.ZodObject<{
    type: z.ZodEnum<["bus_arriving", "bus_delayed", "bus_breakdown", "student_absent", "route_changed", "maintenance_due", "general"]>;
    title: z.ZodString;
    message: z.ZodString;
    recipientIds: z.ZodArray<z.ZodString, "many">;
    busId: z.ZodOptional<z.ZodString>;
    studentId: z.ZodOptional<z.ZodString>;
    priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "bus_arriving" | "bus_delayed" | "bus_breakdown" | "student_absent" | "route_changed" | "maintenance_due" | "general";
    title: string;
    recipientIds: string[];
    priority: "low" | "medium" | "high" | "urgent";
    busId?: string | undefined;
    studentId?: string | undefined;
    data?: Record<string, unknown> | undefined;
}, {
    message: string;
    type: "bus_arriving" | "bus_delayed" | "bus_breakdown" | "student_absent" | "route_changed" | "maintenance_due" | "general";
    title: string;
    recipientIds: string[];
    priority: "low" | "medium" | "high" | "urgent";
    busId?: string | undefined;
    studentId?: string | undefined;
    data?: Record<string, unknown> | undefined;
}>;
export declare const coordinatesSchema: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
}, {
    lat: number;
    lng: number;
}>;
export declare const timeFormatSchema: z.ZodString;
export declare const routeGenerationRequestSchema: z.ZodObject<{
    busId: z.ZodString;
    departureTime: z.ZodOptional<z.ZodString>;
    autoRegenerate: z.ZodOptional<z.ZodBoolean>;
}, "strip", z.ZodTypeAny, {
    busId: string;
    departureTime?: string | undefined;
    autoRegenerate?: boolean | undefined;
}, {
    busId: string;
    departureTime?: string | undefined;
    autoRegenerate?: boolean | undefined;
}>;
export declare const mapboxWaypointSchema: z.ZodObject<{
    location: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
    name: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    location: [number, number];
    name?: string | undefined;
}, {
    location: [number, number];
    name?: string | undefined;
}>;
export declare const mapboxOptimizationResponseSchema: z.ZodObject<{
    code: z.ZodString;
    waypoints: z.ZodArray<z.ZodObject<{
        waypoint_index: z.ZodNumber;
        trips_index: z.ZodNumber;
        location: z.ZodTuple<[z.ZodNumber, z.ZodNumber], null>;
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        location: [number, number];
        name: string;
        waypoint_index: number;
        trips_index: number;
    }, {
        location: [number, number];
        name: string;
        waypoint_index: number;
        trips_index: number;
    }>, "many">;
    trips: z.ZodArray<z.ZodObject<{
        geometry: z.ZodAny;
        legs: z.ZodArray<z.ZodObject<{
            summary: z.ZodString;
            duration: z.ZodNumber;
            distance: z.ZodNumber;
            steps: z.ZodArray<z.ZodAny, "many">;
        }, "strip", z.ZodTypeAny, {
            summary: string;
            duration: number;
            distance: number;
            steps: any[];
        }, {
            summary: string;
            duration: number;
            distance: number;
            steps: any[];
        }>, "many">;
        duration: z.ZodNumber;
        distance: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        legs: {
            summary: string;
            duration: number;
            distance: number;
            steps: any[];
        }[];
        duration: number;
        distance: number;
        geometry?: any;
    }, {
        legs: {
            summary: string;
            duration: number;
            distance: number;
            steps: any[];
        }[];
        duration: number;
        distance: number;
        geometry?: any;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    code: string;
    waypoints: {
        location: [number, number];
        name: string;
        waypoint_index: number;
        trips_index: number;
    }[];
    trips: {
        legs: {
            summary: string;
            duration: number;
            distance: number;
            steps: any[];
        }[];
        duration: number;
        distance: number;
        geometry?: any;
    }[];
}, {
    code: string;
    waypoints: {
        location: [number, number];
        name: string;
        waypoint_index: number;
        trips_index: number;
    }[];
    trips: {
        legs: {
            summary: string;
            duration: number;
            distance: number;
            steps: any[];
        }[];
        duration: number;
        distance: number;
        geometry?: any;
    }[];
}>;
export declare const mapboxDirectionsResponseSchema: z.ZodObject<{
    routes: z.ZodArray<z.ZodObject<{
        duration: z.ZodNumber;
        distance: z.ZodNumber;
        legs: z.ZodArray<z.ZodObject<{
            duration: z.ZodNumber;
            distance: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            duration: number;
            distance: number;
        }, {
            duration: number;
            distance: number;
        }>, "many">;
    }, "strip", z.ZodTypeAny, {
        legs: {
            duration: number;
            distance: number;
        }[];
        duration: number;
        distance: number;
    }, {
        legs: {
            duration: number;
            distance: number;
        }[];
        duration: number;
        distance: number;
    }>, "many">;
}, "strip", z.ZodTypeAny, {
    routes: {
        legs: {
            duration: number;
            distance: number;
        }[];
        duration: number;
        distance: number;
    }[];
}, {
    routes: {
        legs: {
            duration: number;
            distance: number;
        }[];
        duration: number;
        distance: number;
    }[];
}>;
export declare const busUpdateWithAutoGenSchema: z.ZodObject<{
    plateNumber: z.ZodOptional<z.ZodString>;
    capacity: z.ZodOptional<z.ZodNumber>;
    model: z.ZodOptional<z.ZodString>;
    year: z.ZodOptional<z.ZodNumber>;
    driverId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    routeId: z.ZodOptional<z.ZodNullable<z.ZodString>>;
    status: z.ZodOptional<z.ZodEnum<["active", "inactive", "in_maintenance", "out_of_service"]>>;
    maintenanceStatus: z.ZodOptional<z.ZodEnum<["ok", "warning", "critical"]>>;
} & {
    assignedCommune: z.ZodOptional<z.ZodString>;
    assignedQuartiers: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    preferredDepartureTime: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "active" | "inactive" | "in_maintenance" | "out_of_service" | undefined;
    plateNumber?: string | undefined;
    capacity?: number | undefined;
    model?: string | undefined;
    year?: number | undefined;
    driverId?: string | null | undefined;
    routeId?: string | null | undefined;
    maintenanceStatus?: "ok" | "warning" | "critical" | undefined;
    assignedCommune?: string | undefined;
    assignedQuartiers?: string[] | undefined;
    preferredDepartureTime?: string | undefined;
}, {
    status?: "active" | "inactive" | "in_maintenance" | "out_of_service" | undefined;
    plateNumber?: string | undefined;
    capacity?: number | undefined;
    model?: string | undefined;
    year?: number | undefined;
    driverId?: string | null | undefined;
    routeId?: string | null | undefined;
    maintenanceStatus?: "ok" | "warning" | "critical" | undefined;
    assignedCommune?: string | undefined;
    assignedQuartiers?: string[] | undefined;
    preferredDepartureTime?: string | undefined;
}>;
export declare const boardingEventSchema: z.ZodObject<{
    busId: z.ZodString;
    studentId: z.ZodString;
    driverId: z.ZodString;
    eventType: z.ZodEnum<["board", "exit"]>;
    timestamp: z.ZodOptional<z.ZodNumber>;
    location: z.ZodOptional<z.ZodObject<{
        lat: z.ZodNumber;
        lng: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        lat: number;
        lng: number;
    }, {
        lat: number;
        lng: number;
    }>>;
    notes: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    busId: string;
    driverId: string;
    studentId: string;
    eventType: "board" | "exit";
    timestamp?: number | undefined;
    notes?: string | undefined;
    location?: {
        lat: number;
        lng: number;
    } | undefined;
}, {
    busId: string;
    driverId: string;
    studentId: string;
    eventType: "board" | "exit";
    timestamp?: number | undefined;
    notes?: string | undefined;
    location?: {
        lat: number;
        lng: number;
    } | undefined;
}>;
export declare const attendanceQuerySchema: z.ZodObject<{
    startDate: z.ZodString;
    endDate: z.ZodString;
}, "strip", z.ZodTypeAny, {
    startDate: string;
    endDate: string;
}, {
    startDate: string;
    endDate: string;
}>;
export type GPSPositionInput = z.infer<typeof gpsPositionSchema>;
export type GPSUpdateInput = z.infer<typeof gpsUpdateSchema>;
export type BusCreateInput = z.infer<typeof busCreateSchema>;
export type BusUpdateInput = z.infer<typeof busUpdateSchema>;
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
export type DriverCreateInput = z.infer<typeof driverCreateSchema>;
export type DriverUpdateInput = z.infer<typeof driverUpdateSchema>;
export type RouteGenerationRequest = z.infer<typeof routeGenerationRequestSchema>;
export type MapboxWaypoint = z.infer<typeof mapboxWaypointSchema>;
export type MapboxOptimizationResponse = z.infer<typeof mapboxOptimizationResponseSchema>;
export type MapboxDirectionsResponse = z.infer<typeof mapboxDirectionsResponseSchema>;
export type BusUpdateWithAutoGen = z.infer<typeof busUpdateWithAutoGenSchema>;
//# sourceMappingURL=validation.schemas.d.ts.map