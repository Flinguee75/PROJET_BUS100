/**
 * Types pour la gestion des étudiants
 */

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  grade: string; // Niveau scolaire
  parentIds: string[]; // IDs des parents
  busId: string | null; // Bus assigné
  routeId: string | null; // Parcours assigné
  pickupLocation: Location;
  dropoffLocation: Location;
  photoUrl?: string;
  specialNeeds?: string; // Besoins spéciaux
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Location {
  address: string;
  lat: number;
  lng: number;
  notes?: string; // Instructions spéciales
}

export interface StudentCreateInput {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  grade: string;
  parentIds: string[];
  pickupLocation: Location;
  dropoffLocation: Location;
  specialNeeds?: string;
}

export interface StudentUpdateInput {
  firstName?: string;
  lastName?: string;
  dateOfBirth?: Date;
  grade?: string;
  busId?: string | null;
  routeId?: string | null;
  pickupLocation?: Location;
  dropoffLocation?: Location;
  specialNeeds?: string;
  isActive?: boolean;
}

export enum AttendanceStatus {
  PRESENT = 'present',
  ABSENT = 'absent',
  LATE = 'late',
  EXCUSED = 'excused',
}

export interface AttendanceRecord {
  studentId: string;
  date: Date;
  morningStatus: AttendanceStatus;
  eveningStatus: AttendanceStatus;
  busId: string;
  notes?: string;
}
