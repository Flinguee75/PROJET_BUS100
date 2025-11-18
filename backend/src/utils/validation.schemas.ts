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
  pickupLocation: locationSchema,
  dropoffLocation: locationSchema,
  specialNeeds: z.string().optional(),
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

// Types inférés depuis les schémas Zod
export type GPSPositionInput = z.infer<typeof gpsPositionSchema>;
export type GPSUpdateInput = z.infer<typeof gpsUpdateSchema>;
export type BusCreateInput = z.infer<typeof busCreateSchema>;
export type BusUpdateInput = z.infer<typeof busUpdateSchema>;
export type StudentCreateInput = z.infer<typeof studentCreateSchema>;
export type UserCreateInput = z.infer<typeof userCreateSchema>;
export type NotificationCreateInput = z.infer<typeof notificationCreateSchema>;
