export interface User {
    id: string;
    email: string;
    displayName: string;
    phoneNumber: string;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
    isActive: boolean;
}
export declare enum UserRole {
    ADMIN = "admin",
    DRIVER = "driver",
    ESCORT = "escort",
    PARENT = "parent"
}
export interface Driver extends User {
    role: UserRole.DRIVER;
    licenseNumber: string;
    licenseExpiry: Date;
    busId: string | null;
    photoUrl?: string;
}
export interface Escort extends User {
    role: UserRole.ESCORT;
    idCardNumber: string;
    busId: string | null;
    photoUrl?: string;
}
export interface Parent extends User {
    role: UserRole.PARENT;
    address: string;
    studentIds: string[];
    assignedBusIds?: string[];
}
export interface Admin extends User {
    role: UserRole.ADMIN;
    permissions: AdminPermission[];
}
export declare enum AdminPermission {
    MANAGE_BUSES = "manage_buses",
    MANAGE_DRIVERS = "manage_drivers",
    MANAGE_STUDENTS = "manage_students",
    MANAGE_ROUTES = "manage_routes",
    VIEW_REPORTS = "view_reports",
    SEND_NOTIFICATIONS = "send_notifications"
}
export interface UserCreateInput {
    email: string;
    displayName: string;
    phoneNumber: string;
    role: UserRole;
}
//# sourceMappingURL=user.types.d.ts.map