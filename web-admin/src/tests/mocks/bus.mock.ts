/**
 * Données de test pour les bus
 */

import { Bus, GPSPosition, DashboardStats } from '@/types/bus';

export const mockGPSPosition: GPSPosition = {
  lat: 47.2184,
  lng: -1.5536,
  speed: 45.5,
  timestamp: Date.now(),
};

export const mockBus: Bus = {
  id: 'bus-001',
  immatriculation: 'TN 12-345-67',
  chauffeur: 'Jean Dupont',
  chauffeurId: 'driver-001',
  capacite: 50,
  itineraire: 'École Primaire St-Jean',
  status: 'EN_ROUTE',
  statusLabel: 'EN ROUTE',
  currentPosition: mockGPSPosition,
  lastGPSUpdate: '07:40 AM',
  maintenanceStatus: 85,
};

export const mockBuses: Bus[] = [
  mockBus,
  {
    ...mockBus,
    id: 'bus-002',
    immatriculation: 'TN 23-456-78',
    chauffeur: 'Marie Martin',
    chauffeurId: 'driver-002',
    itineraire: 'Lycée Al-Farabi',
    status: 'EN_RETARD',
    statusLabel: 'EN RETARD',
    maintenanceStatus: 72,
    currentPosition: {
      ...mockGPSPosition,
      lat: 47.2284,
      lng: -1.5636,
    },
  },
  {
    ...mockBus,
    id: 'bus-003',
    immatriculation: 'TN 34-567-89',
    chauffeur: 'Pierre Dubois',
    chauffeurId: 'driver-003',
    itineraire: 'Collège Beauleu',
    status: 'A_L_ARRET',
    statusLabel: "À L'ARRÊT",
    maintenanceStatus: 90,
    currentPosition: {
      ...mockGPSPosition,
      lat: 47.2084,
      lng: -1.5436,
      speed: 0,
    },
  },
];

export const mockDashboardStats: DashboardStats = {
  busActifs: 125,
  busTotaux: 150,
  elevesTransportes: 8500,
  busEnRetard: 3,
  totalTrajets: 120,
  alertesMaintenance: 7,

  // Nouvelles métriques opérationnelles
  retardsCritiques: 1,
  retardsGraves: 2,
  busImmobilises: 5,
  busDisponibles: 145,
  tauxValidation: 95,
  elevesNonScannes: 425,

  // État détaillé du service
  busEnRoute: 100,
  busArrives: 20,
  busNonPartis: 5,
  busEnAttente: 15,

  // Métriques de performance
  retardMoyen: 3.5,
  tauxPonctualite: 96.5,
  tempsTrajetMoyen: 28,
  tempsTrajetPrevu: 25,
};

