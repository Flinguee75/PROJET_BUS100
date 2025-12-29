/**
 * Schémas de validation Zod
 * Validation stricte de toutes les entrées API
 */

import { z } from 'zod';

/**
 * Schéma GPS Position
 * Valide les coordonnées GPS et métadonnées
 */
export const gpsPositionSchema = z.object({
  lat: z.number().min(-90).max(90), // Latitude valide
  lng: z.number().min(-180).max(180), // Longitude valide
  speed: z.number().min(0).max(200), // Vitesse en km/h (max 200)
  heading: z.number().min(0).max(360).optional(), // Direction optionnelle
  accuracy: z.number().min(0).optional(), // Précision en mètres
  timestamp: z.number().positive(), // Timestamp Unix obligatoire
});

/**
 * Schéma GPS Update
 * Validation pour mise à jour position bus
 */
export const gpsUpdateSchema = z.object({
  busId: z.string().min(1, 'Bus ID requis'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  speed: z.number().min(0).max(200),
  heading: z.number().min(0).max(360).optional(),
  accuracy: z.number().min(0).optional(),
  timestamp: z.number().positive(),
});

/**
 * Schéma Location
 * Validation pour adresses et coordonnées
 */
export const locationSchema = z.object({
  address: z.string().min(5, 'Adresse trop courte'),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  notes: z.string().optional(),
});

/**
 * Schéma Bus Create
 */
export const busCreateSchema = z.object({
  plateNumber: z
    .string()
    .min(1, 'Numéro de plaque requis')
    .regex(/^[A-Z0-9-]+$/, 'Format de plaque invalide'),
  capacity: z.number().int().min(10).max(100),
  model: z.string().min(1),
  year: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear() + 1),
});

/**
 * Schéma Bus Update
 */
export const busUpdateSchema = z.object({
  plateNumber: z
    .string()
    .regex(/^[A-Z0-9-]+$/, 'Format de plaque invalide')
    .optional(),
  capacity: z.number().int().min(10).max(100).optional(),
  model: z.string().min(1).optional(),
  year: z
    .number()
    .int()
    .min(2000)
    .max(new Date().getFullYear() + 1)
    .optional(),
  driverId: z.string().nullable().optional(),
  escortId: z.string().nullable().optional(),
  routeId: z.string().nullable().optional(),
  studentIds: z.array(z.string()).optional(),
  status: z.enum(['active', 'inactive', 'in_maintenance', 'out_of_service']).optional(),
  maintenanceStatus: z.enum(['ok', 'warning', 'critical']).optional(),
});

/**
 * Schéma TimeOfDay
 */
export const timeOfDaySchema = z.enum([
  'morning_outbound',
  'midday_outbound',
  'midday_return',
  'evening_return',
]);

/**
 * Schéma Student Create
 */
export const studentCreateSchema = z.object({
  firstName: z.string().min(2, 'Prénom trop court'),
  lastName: z.string().min(2, 'Nom trop court'),
  dateOfBirth: z.string().datetime().or(z.date()),
  grade: z.string().min(1),
  parentIds: z.array(z.string()).min(1, 'Au moins un parent requis'),
  commune: z.string().min(1, 'Commune requise'),
  quartier: z.string().min(1, 'Quartier requis'),
  locations: z.object({
    morningPickup: locationSchema.optional(),
    middayDropoff: locationSchema.optional(),
    middayPickup: locationSchema.optional(),
    eveningDropoff: locationSchema.optional(),
  }),
  activeTrips: z.array(timeOfDaySchema),
  specialNeeds: z.string().optional(),
});

/**
 * Schéma Student Update
 */
export const studentUpdateSchema = z.object({
  firstName: z.string().min(2, 'Prénom trop court').optional(),
  lastName: z.string().min(2, 'Nom trop court').optional(),
  dateOfBirth: z.string().datetime().or(z.date()).optional(),
  grade: z.string().min(1).optional(),
  commune: z.string().min(1).optional(),
  quartier: z.string().min(1).optional(),
  busId: z.string().nullable().optional(),
  routeId: z.string().nullable().optional(),
  locations: z
    .object({
      morningPickup: locationSchema.optional(),
      middayDropoff: locationSchema.optional(),
      middayPickup: locationSchema.optional(),
      eveningDropoff: locationSchema.optional(),
    })
    .optional(),
  activeTrips: z.array(timeOfDaySchema).optional(),
  specialNeeds: z.string().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schéma Driver Create
 */
export const driverCreateSchema = z.object({
  email: z.string().email('Email invalide'),
  displayName: z.string().min(2, 'Nom trop court'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide'),
  licenseNumber: z.string().min(5, 'Numéro de permis invalide'),
  licenseExpiry: z.string().datetime().or(z.date()),
  photoUrl: z.string().url().optional(),
});

/**
 * Schéma Driver Update
 */
export const driverUpdateSchema = z.object({
  displayName: z.string().min(2, 'Nom trop court').optional(),
  phoneNumber: z
    .string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide')
    .optional(),
  licenseNumber: z.string().min(5, 'Numéro de permis invalide').optional(),
  licenseExpiry: z.string().datetime().or(z.date()).optional(),
  busId: z.string().nullable().optional(),
  photoUrl: z.string().url().optional(),
  isActive: z.boolean().optional(),
});

/**
 * Schéma User Create
 */
export const userCreateSchema = z.object({
  email: z.string().email('Email invalide'),
  displayName: z.string().min(2, 'Nom trop court'),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide'),
  role: z.enum(['admin', 'driver', 'escort', 'parent']),
});

/**
 * Schéma Notification Create
 */
export const notificationCreateSchema = z.object({
  type: z.enum([
    'bus_arriving',
    'bus_delayed',
    'bus_breakdown',
    'student_absent',
    'route_changed',
    'maintenance_due',
    'general',
  ]),
  title: z.string().min(1).max(100),
  message: z.string().min(1).max(500),
  recipientIds: z.array(z.string()).min(1),
  busId: z.string().optional(),
  studentId: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  data: z.record(z.unknown()).optional(),
});

/**
 * Schéma pour coordonnées valides (lat/lng)
 */
export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Schéma pour heure au format HH:mm
 */
export const timeFormatSchema = z
  .string()
  .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format HH:mm attendu');

/**
 * Schéma pour Route Generation Request
 */
export const routeGenerationRequestSchema = z.object({
  busId: z.string().min(1, 'Bus ID requis'),
  departureTime: timeFormatSchema.optional(),
  autoRegenerate: z.boolean().optional(),
});

/**
 * Schéma pour Mapbox Waypoint
 */
export const mapboxWaypointSchema = z.object({
  location: z.tuple([z.number(), z.number()]), // [lng, lat]
  name: z.string().optional(),
});

/**
 * Schéma pour Mapbox Optimization Response
 */
export const mapboxOptimizationResponseSchema = z.object({
  code: z.string(),
  waypoints: z.array(
    z.object({
      waypoint_index: z.number(),
      trips_index: z.number(),
      location: z.tuple([z.number(), z.number()]),
      name: z.string(),
    })
  ),
  trips: z.array(
    z.object({
      geometry: z.any(),
      legs: z.array(
        z.object({
          summary: z.string(),
          duration: z.number(),
          distance: z.number(),
          steps: z.array(z.any()),
        })
      ),
      duration: z.number(),
      distance: z.number(),
    })
  ),
});

/**
 * Schéma pour Mapbox Directions Response
 */
export const mapboxDirectionsResponseSchema = z.object({
  routes: z.array(
    z.object({
      duration: z.number(),
      distance: z.number(),
      legs: z.array(
        z.object({
          duration: z.number(),
          distance: z.number(),
        })
      ),
    })
  ),
});

/**
 * Schéma Bus Update avec champs pour génération automatique
 */
export const busUpdateWithAutoGenSchema = busUpdateSchema.extend({
  assignedCommune: z.string().optional(),
  assignedQuartiers: z.array(z.string()).optional(),
  preferredDepartureTime: timeFormatSchema.optional(),
});

/**
 * Schéma Boarding Event
 * Validation pour événements de montée/descente d'élèves
 */
export const boardingEventSchema = z.object({
  busId: z.string().min(1, 'Bus ID requis'),
  studentId: z.string().min(1, 'Student ID requis'),
  driverId: z.string().min(1, 'Driver ID requis'),
  eventType: z.enum(['board', 'exit'], {
    required_error: 'Event type requis (board ou exit)',
  }),
  timestamp: z.number().positive().optional(), // Timestamp Unix optionnel (généré par défaut)
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
  notes: z.string().max(500).optional(),
});

/**
 * Schéma Attendance Query
 * Validation pour requêtes d'historique
 */
export const attendanceQuerySchema = z.object({
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
});

/**
 * Schéma Route Start
 * Validation pour démarrer une course
 */
export const routeStartSchema = z.object({
  busId: z.string().min(1, 'Bus ID requis'),
  driverId: z.string().min(1, 'Driver ID requis'),
});

/**
 * Schéma Attendance Scan
 * Validation pour scanner un élève
 */
export const attendanceScanSchema = z.object({
  studentId: z.string().min(1, 'Student ID requis'),
  busId: z.string().min(1, 'Bus ID requis'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  type: z.enum(['boarding', 'alighting'], {
    required_error: 'Type requis (boarding ou alighting)',
  }),
  driverId: z.string().min(1, 'Driver ID requis'),
  location: z
    .object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
    .optional(),
});

/**
 * Schéma Attendance Unscan
 * Validation pour dé-scanner un élève
 */
export const attendanceUnscanSchema = z.object({
  studentId: z.string().min(1, 'Student ID requis'),
  busId: z.string().min(1, 'Bus ID requis'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format date invalide (YYYY-MM-DD)'),
  driverId: z.string().min(1, 'Driver ID requis'),
});

/**
 * Schéma School Location
 * Validation pour coordonnées GPS d'une école
 */
export const schoolLocationSchema = z.object({
  lat: z.number().min(-90).max(90, 'Latitude invalide'),
  lng: z.number().min(-180).max(180, 'Longitude invalide'),
});

/**
 * Schéma School Create
 * Validation pour création d'une école
 */
export const schoolCreateSchema = z.object({
  name: z.string().min(2, "Le nom de l'école doit contenir au moins 2 caractères").max(100),
  location: schoolLocationSchema,
  fleetSize: z.number().int().min(0).optional(),
  address: z.string().max(200).optional(),
  contactEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional(),
});

/**
 * Schéma School Update
 * Validation pour mise à jour d'une école
 */
export const schoolUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  location: schoolLocationSchema.optional(),
  fleetSize: z.number().int().min(0).optional(),
  address: z.string().max(200).optional().or(z.literal('')),
  contactEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
  isActive: z.boolean().optional(),
});

// Types inférés depuis les schémas Zod
export type GPSPositionInput = z.infer<typeof gpsPositionSchema>;
export type GPSUpdateInput = z.infer<typeof gpsUpdateSchema>;
export type BusCreateInput = z.infer<typeof busCreateSchema>;
export type BusUpdateInput = z.infer<typeof busUpdateSchema>;
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type StudentUpdateInput = z.infer<typeof studentUpdateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
export type DriverCreateInput = z.infer<typeof driverCreateSchema>;
export type DriverUpdateInput = z.infer<typeof driverUpdateSchema>;
export type RouteGenerationRequest = z.infer<typeof routeGenerationRequestSchema>;
export type MapboxWaypoint = z.infer<typeof mapboxWaypointSchema>;
export type MapboxOptimizationResponse = z.infer<typeof mapboxOptimizationResponseSchema>;
export type MapboxDirectionsResponse = z.infer<typeof mapboxDirectionsResponseSchema>;
export type BusUpdateWithAutoGen = z.infer<typeof busUpdateWithAutoGenSchema>;
export type SchoolCreateInput = z.infer<typeof schoolCreateSchema>;
export type SchoolUpdateInput = z.infer<typeof schoolUpdateSchema>;
