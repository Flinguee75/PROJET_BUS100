/**
 * Types pour la gestion des écoles
 * Chaque école a un point GPS, un nombre de flotte, et un nom
 */

export interface School {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  fleetSize: number; // Nombre de bus dans la flotte
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface SchoolCreateInput {
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  fleetSize?: number; // Optionnel, sera calculé automatiquement
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export interface SchoolUpdateInput {
  name?: string;
  location?: {
    lat: number;
    lng: number;
  };
  fleetSize?: number;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  isActive?: boolean;
}

