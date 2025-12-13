/**
 * Types pour le modèle School
 */

export interface SchoolLocation {
  lat: number;
  lng: number;
}

export interface School {
  id: string;
  name: string;
  location: SchoolLocation;
  fleetSize: number;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

