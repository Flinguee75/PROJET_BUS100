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
    type: z.ZodEnum<["bus_arriving", "bus_delayed", "bus_breakdown", "student_absent", "student_boarded", "student_exited", "route_changed", "maintenance_due", "general"]>;
    title: z.ZodString;
    message: z.ZodString;
    recipientIds: z.ZodArray<z.ZodString, "many">;
    busId: z.ZodOptional<z.ZodString>;
    studentId: z.ZodOptional<z.ZodString>;
    priority: z.ZodEnum<["low", "medium", "high", "urgent"]>;
    data: z.ZodOptional<z.ZodRecord<z.ZodString, z.ZodUnknown>>;
}, "strip", z.ZodTypeAny, {
    message: string;
    type: "bus_arriving" | "bus_delayed" | "bus_breakdown" | "student_absent" | "student_boarded" | "student_exited" | "route_changed" | "maintenance_due" | "general";
    title: string;
    recipientIds: string[];
    priority: "low" | "medium" | "high" | "urgent";
    busId?: string | undefined;
    studentId?: string | undefined;
    data?: Record<string, unknown> | undefined;
}, {
    message: string;
    type: "bus_arriving" | "bus_delayed" | "bus_breakdown" | "student_absent" | "student_boarded" | "student_exited" | "route_changed" | "maintenance_due" | "general";
    title: string;
    recipientIds: string[];
    priority: "low" | "medium" | "high" | "urgent";
    busId?: string | undefined;
    studentId?: string | undefined;
    data?: Record<string, unknown> | undefined;
}>;
export declare const boardingEventSchema: z.ZodObject<{
    studentId: z.ZodString;
    busId: z.ZodString;
    driverId: z.ZodString;
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
export type BoardingEventInput = z.infer<typeof boardingEventSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
//# sourceMappingURL=validation.schemas.d.ts.map