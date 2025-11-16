/**
 * Types pour les utilisateurs du système
 * Gère les parents, chauffeurs, et administrateurs
 */

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

export enum UserRole {
  ADMIN = 'admin',
  DRIVER = 'driver',
  PARENT = 'parent',
}

export interface Driver extends User {
  role: UserRole.DRIVER;
  licenseNumber: string; // Numéro de permis
  licenseExpiry: Date; // Date d'expiration du permis
  busId: string | null; // Bus assigné
  photoUrl?: string;
}

export interface Parent extends User {
  role: UserRole.PARENT;
  address: string;
  studentIds: string[]; // Liste des enfants
}

export interface Admin extends User {
  role: UserRole.ADMIN;
  permissions: AdminPermission[];
}

export enum AdminPermission {
  MANAGE_BUSES = 'manage_buses',
  MANAGE_DRIVERS = 'manage_drivers',
  MANAGE_STUDENTS = 'manage_students',
  MANAGE_ROUTES = 'manage_routes',
  VIEW_REPORTS = 'view_reports',
  SEND_NOTIFICATIONS = 'send_notifications',
}

export interface UserCreateInput {
  email: string;
  displayName: string;
  phoneNumber: string;
  role: UserRole;
}
