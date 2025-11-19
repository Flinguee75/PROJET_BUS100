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
  routeId: z.string().nullable().optional(),
  status: z.enum(['active', 'inactive', 'in_maintenance', 'out_of_service']).optional(),
  maintenanceStatus: z.enum(['ok', 'warning', 'critical']).optional(),
});

/**
 * Schéma Student Create
 */
export const studentCreateSchema = z.object({
  firstName: z.string().min(2, 'Prénom trop court'),
  lastName: z.string().min(2, 'Nom trop court'),
  dateOfBirth: z.string().datetime().or(z.date()),
  grade: z.string().min(1),
  parentIds: z.array(z.string()).min(1, 'Au moins un parent requis'),
  commune: z.string().min(1, 'Commune requise').optional(),
  quartier: z.string().min(1, 'Quartier requis').optional(),
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
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
  pickupLocation: locationSchema.optional(),
  dropoffLocation: locationSchema.optional(),
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
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Numéro de téléphone invalide').optional(),
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
  role: z.enum(['admin', 'driver', 'parent']),
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
    'student_boarded',
    'student_exited',
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
 * Schéma Boarding Event
 * Validation pour montée/descente d'élève
 */
export const boardingEventSchema = z.object({
  studentId: z.string().min(1, 'Student ID requis'),
  busId: z.string().min(1, 'Bus ID requis'),
  driverId: z.string().min(1, 'Driver ID requis'),
  timestamp: z.number().positive().optional(), // Timestamp Unix optionnel (défaut: maintenant)
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
export type BoardingEventInput = z.infer<typeof boardingEventSchema>;
export type AttendanceQueryInput = z.infer<typeof attendanceQuerySchema>;
