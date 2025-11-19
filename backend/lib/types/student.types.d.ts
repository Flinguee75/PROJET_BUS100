export interface Student {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    grade: string;
    parentIds: string[];
    busId: string | null;
    routeId: string | null;
    commune: string;
    quartier: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    photoUrl?: string;
    specialNeeds?: string;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export interface Location {
    address: string;
    lat: number;
    lng: number;
    notes?: string;
    commune?: string;
    quartier?: string;
}
export interface StudentCreateInput {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    grade: string;
    parentIds: string[];
    commune: string;
    quartier: string;
    pickupLocation: Location;
    dropoffLocation: Location;
    specialNeeds?: string;
}
export interface StudentUpdateInput {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: Date;
    grade?: string;
    commune?: string;
    quartier?: string;
    busId?: string | null;
    routeId?: string | null;
    pickupLocation?: Location;
    dropoffLocation?: Location;
    specialNeeds?: string;
    isActive?: boolean;
}
export declare enum AttendanceStatus {
    PRESENT = "present",
    ABSENT = "absent",
    LATE = "late",
    EXCUSED = "excused"
}
export interface AttendanceRecord {
    studentId: string;
    date: Date;
    morningStatus: AttendanceStatus;
    eveningStatus: AttendanceStatus;
    busId: string;
    notes?: string;
}
//# sourceMappingURL=student.types.d.ts.map