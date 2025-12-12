/**
 * Types pour la gestion des routes et zones géographiques
 * Système adapté pour Abidjan (Côte d'Ivoire)
 */

/**
 * Moments de la journée pour les trajets scolaires
 */
export enum TimeOfDay {
  MORNING_OUTBOUND = 'morning_outbound',      // Matin : maison → école
  MIDDAY_OUTBOUND = 'midday_outbound',        // Midi : école → maison (demi-pensionnaires)
  MIDDAY_RETURN = 'midday_return',            // Midi : maison → école (retour demi-pensionnaires)
  EVENING_RETURN = 'evening_return'           // Soir : école → maison
}

/**
 * Communes principales d'Abidjan
 */
export enum CommuneAbidjan {
  COCODY = 'Cocody',
  YOPOUGON = 'Yopougon',
  ABOBO = 'Abobo',
  ADJAME = 'Adjamé',
  PLATEAU = 'Plateau',
  MARCORY = 'Marcory',
  KOUMASSI = 'Koumassi',
  PORT_BOUET = 'Port-Bouët',
  TREICHVILLE = 'Treichville',
  ATTÉCOUBÉ = 'Attécoubé',
  BINGERVILLE = 'Bingerville',
  SONGON = 'Songon',
  ANYAMA = 'Anyama',
}

/**
 * Point de passage sur une route (arrêt)
 */
export interface RouteStop {
  id: string;
  name: string; // Nom du point (ex: "Carrefour Riviera", "École Sainte-Marie")
  address: string;
  location: {
    lat: number;
    lng: number;
  };
  order: number; // Ordre dans le parcours (1, 2, 3...)
  estimatedTimeMinutes: number; // Temps depuis le départ en minutes
  type: 'pickup' | 'dropoff' | 'both'; // Type d'arrêt
  quartier: string; // Quartier précis
  notes?: string; // Instructions spéciales
  activeTimeSlots: TimeOfDay[]; // Moments où cet arrêt est actif

  // Champs pour génération automatique
  studentId?: string; // ID de l'élève associé à cet arrêt
  estimatedArrivalTime?: string; // Heure d'arrivée absolue (ex: "07:15")
  relativeTimeMinutes?: number; // Temps depuis le départ en minutes (alias de estimatedTimeMinutes)
}

/**
 * Route complète (parcours d'un bus)
 */
export interface Route {
  id: string;
  name: string; // Ex: "Route Riviera-École"
  code: string; // Code court (ex: "R-RIV-001")
  description?: string;

  // Informations géographiques
  commune: CommuneAbidjan;
  quartiers: string[]; // Liste des quartiers desservis

  // Points de passage
  stops: RouteStop[];

  // Horaires pour les 4 périodes de la journée
  schedule: {
    morningOutbound?: {
      departure: string; // HH:mm (ex: "07:00")
      arrival: string;   // HH:mm (ex: "08:00")
    };
    middayOutbound?: {
      departure: string; // HH:mm (ex: "11:45")
      arrival: string;   // HH:mm (ex: "12:45")
    };
    middayReturn?: {
      departure: string; // HH:mm (ex: "13:00")
      arrival: string;   // HH:mm (ex: "14:00")
    };
    eveningReturn?: {
      departure: string; // HH:mm (ex: "15:30")
      arrival: string;   // HH:mm (ex: "16:30")
    };
  };

  // Métadonnées
  totalDistanceKm: number; // Distance totale en km
  estimatedDurationMinutes: number; // Durée estimée totale
  capacity: number; // Nombre max d'élèves sur cette route
  currentOccupancy: number; // Nombre actuel d'élèves

  // Assignations
  busId: string | null; // Bus assigné à cette route
  driverId: string | null; // Chauffeur assigné

  // Jours actifs
  activeDays: DayOfWeek[];

  // Statut
  isActive: boolean;

  // Champs pour génération automatique de routes
  isManual: boolean; // true = créée manuellement, false = auto-générée
  generatedAt?: Date; // Timestamp de génération (pour routes auto uniquement)
  isOptimized?: boolean; // true si API d'optimisation a réussi
  optimizationEngine?: string; // ex: "mapbox", "manual", "google"
  departureTime?: string; // Heure de départ fixe (ex: "07:00")

  createdAt: Date;
  updatedAt: Date;
}

export enum DayOfWeek {
  MONDAY = 'monday',
  TUESDAY = 'tuesday',
  WEDNESDAY = 'wednesday',
  THURSDAY = 'thursday',
  FRIDAY = 'friday',
  SATURDAY = 'saturday',
  SUNDAY = 'sunday',
}

/**
 * Input pour créer une route
 */
export interface RouteCreateInput {
  name: string;
  code: string;
  description?: string;
  commune: CommuneAbidjan;
  quartiers: string[];
  stops: Omit<RouteStop, 'id'>[];
  schedule: {
    morningOutbound?: {
      departure: string;
      arrival: string;
    };
    middayOutbound?: {
      departure: string;
      arrival: string;
    };
    middayReturn?: {
      departure: string;
      arrival: string;
    };
    eveningReturn?: {
      departure: string;
      arrival: string;
    };
  };
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  capacity: number;
  activeDays: DayOfWeek[];
  isManual?: boolean; // Par défaut true si non spécifié
  departureTime?: string;
}

/**
 * Input pour mettre à jour une route
 */
export interface RouteUpdateInput {
  name?: string;
  code?: string;
  description?: string;
  commune?: CommuneAbidjan;
  quartiers?: string[];
  stops?: Omit<RouteStop, 'id'>[];
  schedule?: {
    morningOutbound?: {
      departure: string;
      arrival: string;
    };
    middayOutbound?: {
      departure: string;
      arrival: string;
    };
    middayReturn?: {
      departure: string;
      arrival: string;
    };
    eveningReturn?: {
      departure: string;
      arrival: string;
    };
  };
  totalDistanceKm?: number;
  estimatedDurationMinutes?: number;
  capacity?: number;
  currentOccupancy?: number;
  busId?: string | null;
  driverId?: string | null;
  activeDays?: DayOfWeek[];
  isActive?: boolean;
  isManual?: boolean;
  departureTime?: string;
}

/**
 * Quartiers par commune (base de données pour Abidjan)
 */
export const QUARTIERS_BY_COMMUNE: Record<CommuneAbidjan, string[]> = {
  [CommuneAbidjan.COCODY]: [
    'Riviera',
    'II Plateaux',
    'Angré',
    'Blockhaus',
    'Danga',
    'Faya',
    'Deux Plateaux',
    'Ambassades',
    'Cocody Centre',
    'Saint-Jean',
    'Bonoumin',
  ],
  [CommuneAbidjan.YOPOUGON]: [
    'Niangon',
    'Quartier Maroc',
    'Ananeraie',
    'Sideci',
    'Millionnaire',
    'Koweït',
    'Port Autonome',
    'Selmer',
  ],
  [CommuneAbidjan.ABOBO]: [
    'Abobo Gare',
    'Abobo-PK 18',
    'Abobo Baoulé',
    'Anonkoua',
    'Avocatier',
    'Agnissankoi',
  ],
  [CommuneAbidjan.ADJAME]: [
    'Adjamé Liberté',
    'Adjamé Bracodi',
    'Williamsville',
    'Aghien',
  ],
  [CommuneAbidjan.PLATEAU]: [
    'Plateau Centre',
    'Plateau Dokui',
    'Plateau Vallons',
  ],
  [CommuneAbidjan.MARCORY]: [
    'Marcory Zone 4',
    'Marcory Résidentiel',
    'Anoumambo',
    'Biétry',
  ],
  [CommuneAbidjan.KOUMASSI]: [
    'Koumassi Centre',
    'Remblais',
    'Grand Campement',
  ],
  [CommuneAbidjan.PORT_BOUET]: [
    'Zone 4',
    'Vridi',
    'Gonzague',
    'Aéroport',
  ],
  [CommuneAbidjan.TREICHVILLE]: [
    'Treichville Centre',
    'Zone 3',
    'Belleville',
  ],
  [CommuneAbidjan.ATTÉCOUBÉ]: [
    'Attécoubé Santé',
    'Attécoubé Locodjoro',
  ],
  [CommuneAbidjan.BINGERVILLE]: [
    'Bingerville Centre',
    'Akouédo',
  ],
  [CommuneAbidjan.SONGON]: [
    'Songon Village',
    'Songon-Agban',
  ],
  [CommuneAbidjan.ANYAMA]: [
    'Anyama Centre',
    'Anyama Village',
  ],
};

