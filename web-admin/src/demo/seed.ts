/**
 * Données de départ (seed) du MODE DÉMO.
 *
 * Définit une école, sa flotte de bus, leurs chauffeurs et leurs élèves, ainsi
 * que la trajectoire (courbe de Bézier) que chaque bus emprunte vers l'école.
 *
 * Toutes les coordonnées gravitent autour d'Abidjan (Côte d'Ivoire).
 */

import type { School } from '@/types/school';
import { UserRole, type User } from '@/types/auth';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface DemoStudentSeed {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  /** Position relative sur la trajectoire (0 = départ, 1 = école). */
  stopT: number;
  /** Décalage latéral du domicile par rapport à la route (degrés). */
  sideOffset: number;
}

export interface DemoBusSeed {
  id: string;
  number: string;
  plateNumber: string;
  model: string;
  year: number;
  capacity: number;
  driver: { id: string; name: string; phone: string };
  route: { id: string; name: string; fromZone: string; toZone: string };
  tripType: string;
  tripLabel: string;
  /** Point de départ de la tournée (quartier). */
  start: LatLng;
  /** Courbure de la route (décalage perpendiculaire du point de contrôle). */
  curve: number;
  /** Vitesse de progression par tick (fraction du trajet). Plus petit = plus lent. */
  speedFactor: number;
  /** Avancement initial (0..1) pour étaler les bus au démarrage. */
  initialProgress: number;
  /** État initial particulier. */
  initialState?: 'arrived';
  students: DemoStudentSeed[];
}

/** Localisation de l'école (centre de la carte). */
export const DEMO_SCHOOL_LOCATION: LatLng = {
  lat: 5.351861,
  lng: -3.953921,
};

export const DEMO_SCHOOL: School = {
  id: 'demo-school',
  name: 'École Internationale d’Abidjan',
  location: DEMO_SCHOOL_LOCATION,
  fleetSize: 5,
  address: 'Boulevard de la Paix, Cocody, Abidjan',
  contactEmail: 'contact@demo-ecole.ci',
  contactPhone: '+225 27 22 00 00 00',
  createdAt: new Date('2024-01-01T08:00:00Z'),
  updatedAt: new Date(),
  isActive: true,
};

export const DEMO_USER: User = {
  uid: 'demo-admin',
  email: 'demo@demo-ecole.ci',
  displayName: 'Administration (Démo)',
  role: UserRole.SCHOOL_ADMIN,
  schoolId: DEMO_SCHOOL.id,
};

/** Type de tournée commun à la démo (ramassage du matin). */
const MORNING = 'morning_outbound';

const students = (
  busPrefix: string,
  names: Array<[string, string, string]>
): DemoStudentSeed[] =>
  names.map(([firstName, lastName, grade], index) => {
    const count = names.length;
    return {
      id: `${busPrefix}-s${index + 1}`,
      firstName,
      lastName,
      grade,
      // Arrêts répartis entre 12% et 86% du trajet (le dernier avant l'école).
      stopT: 0.12 + (index / Math.max(1, count - 1)) * 0.74,
      sideOffset: (index % 2 === 0 ? 1 : -1) * 0.0006,
    };
  });

export const DEMO_BUSES: DemoBusSeed[] = [
  {
    id: 'demo-bus-12',
    number: 'BUS-12',
    plateNumber: '4521 AB 01',
    model: 'Toyota Coaster',
    year: 2021,
    capacity: 30,
    driver: { id: 'drv-12', name: 'Koffi Kouassi', phone: '+225 07 01 02 03 04' },
    route: { id: 'route-cocody', name: 'Ligne Cocody', fromZone: 'Cocody', toZone: 'École' },
    tripType: MORNING,
    tripLabel: 'Ramassage matin',
    start: { lat: 5.351861 + 0.019, lng: -3.953921 + 0.013 },
    curve: 0.004,
    speedFactor: 1,
    initialProgress: 0.1,
    students: students('demo-bus-12', [
      ['Awa', 'Diomandé', 'CE2'],
      ['Yann', 'Aka', 'CM1'],
      ['Fatou', 'Bamba', 'CE1'],
      ['Loïc', 'Gnagne', 'CM2'],
      ['Aminata', 'Sangaré', 'CE2'],
      ['Junior', 'Kassi', 'CM1'],
    ]),
  },
  {
    id: 'demo-bus-07',
    number: 'BUS-07',
    plateNumber: '1187 CD 01',
    model: 'Mercedes Sprinter',
    year: 2022,
    capacity: 22,
    driver: { id: 'drv-07', name: 'Aya N’Guessan', phone: '+225 07 05 06 07 08' },
    route: { id: 'route-plateau', name: 'Ligne Plateau', fromZone: 'Plateau', toZone: 'École' },
    tripType: MORNING,
    tripLabel: 'Ramassage matin',
    start: { lat: 5.351861 + 0.023, lng: -3.953921 - 0.003 },
    curve: -0.0035,
    speedFactor: 1.15,
    initialProgress: 0.33,
    students: students('demo-bus-07', [
      ['Marie', 'Koffi', 'CP'],
      ['Ismaël', 'Ouattara', 'CE1'],
      ['Grace', 'Yao', 'CE2'],
      ['Cédric', 'Tanoh', 'CM1'],
      ['Salimata', 'Cissé', 'CP'],
    ]),
  },
  {
    id: 'demo-bus-23',
    number: 'BUS-23',
    plateNumber: '9043 EF 01',
    model: 'Toyota Hiace',
    year: 2020,
    capacity: 18,
    driver: { id: 'drv-23', name: 'Ibrahim Touré', phone: '+225 07 09 10 11 12' },
    route: { id: 'route-marcory', name: 'Ligne Marcory', fromZone: 'Marcory', toZone: 'École' },
    tripType: MORNING,
    tripLabel: 'Ramassage matin',
    start: { lat: 5.351861 - 0.021, lng: -3.953921 + 0.005 },
    curve: 0.0045,
    speedFactor: 0.92,
    initialProgress: 0.55,
    students: students('demo-bus-23', [
      ['Kévin', 'Brou', 'CM2'],
      ['Nadia', 'Koné', 'CE1'],
      ['Olivier', 'Assi', 'CE2'],
      ['Mariam', 'Doumbia', 'CM1'],
      ['Eric', 'Konan', 'CP'],
      ['Linda', 'Adjoua', 'CE1'],
    ]),
  },
  {
    id: 'demo-bus-31',
    number: 'BUS-31',
    plateNumber: '6678 GH 01',
    model: 'Toyota Coaster',
    year: 2019,
    capacity: 30,
    driver: { id: 'drv-31', name: 'Mariam Koné', phone: '+225 07 13 14 15 16' },
    route: { id: 'route-yopougon', name: 'Ligne Yopougon', fromZone: 'Yopougon', toZone: 'École' },
    tripType: MORNING,
    tripLabel: 'Ramassage matin',
    // Bus en retard : départ plus loin, vitesse plus faible.
    start: { lat: 5.351861 + 0.007, lng: -3.953921 - 0.03 },
    curve: 0.006,
    speedFactor: 0.55,
    initialProgress: 0.22,
    students: students('demo-bus-31', [
      ['Hervé', 'Gbagbo', 'CE2'],
      ['Rokia', 'Fofana', 'CM1'],
      ['Steve', 'Allou', 'CE1'],
      ['Naomi', 'Zamblé', 'CM2'],
      ['Patrick', 'Yapi', 'CP'],
    ]),
  },
  {
    id: 'demo-bus-45',
    number: 'BUS-45',
    plateNumber: '3390 IJ 01',
    model: 'Mercedes Sprinter',
    year: 2023,
    capacity: 22,
    driver: { id: 'drv-45', name: 'Yao Brou', phone: '+225 07 17 18 19 20' },
    route: { id: 'route-treichville', name: 'Ligne Treichville', fromZone: 'Treichville', toZone: 'École' },
    tripType: MORNING,
    tripLabel: 'Ramassage matin',
    start: { lat: 5.351861 - 0.013, lng: -3.953921 + 0.017 },
    curve: -0.004,
    speedFactor: 1.05,
    initialProgress: 1,
    // Ce bus est déjà arrivé à l'école au démarrage (illustre l'état "arrivé").
    initialState: 'arrived',
    students: students('demo-bus-45', [
      ['Sarah', 'Méité', 'CM1'],
      ['Jonas', 'Kouadio', 'CE2'],
      ['Inès', 'Traoré', 'CP'],
      ['David', 'Ehouman', 'CE1'],
    ]),
  },
];
