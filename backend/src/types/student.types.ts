/**
 * Types pour la gestion des étudiants
 */

import { TimeOfDay } from './route.types';

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  grade: string; // Niveau scolaire
  parentIds: string[]; // IDs des parents
  busId: string | null; // Bus assigné
  routeId: string | null; // Parcours assigné

  // Informations géographiques (Abidjan)
  commune: string; // Commune d'Abidjan (ex: "Cocody", "Yopougon")
  quartier: string; // Quartier précis (ex: "Riviera", "II Plateaux")

  // Locations selon le moment de la journée
  locations: {
    morningPickup?: Location; // Ramassage le matin
    middayDropoff?: Location; // Dépose à midi
    middayPickup?: Location; // Ramassage à midi
    eveningDropoff?: Location; // Dépose le soir
  };

  // Moments où l'élève utilise le bus
  activeTrips: TimeOfDay[];

  // Anciennes propriétés (deprecated mais conservées pour rétrocompatibilité)
  pickupLocation?: Location;
  dropoffLocation?: Location;

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
  commune?: string; // Commune pour cette adresse
  quartier?: string; // Quartier pour cette adresse
}

export interface StudentCreateInput {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  grade: string;
  parentIds: string[];
  commune: string; // Commune d'Abidjan
  quartier: string; // Quartier précis
  locations: {
    morningPickup?: Location;
    middayDropoff?: Location;
    middayPickup?: Location;
    eveningDropoff?: Location;
  };
  activeTrips: TimeOfDay[];
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
  locations?: {
    morningPickup?: Location;
    middayDropoff?: Location;
    middayPickup?: Location;
    eveningDropoff?: Location;
  };
  activeTrips?: TimeOfDay[];
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
