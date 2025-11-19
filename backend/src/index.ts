/**
 * Point d'entrée principal - Firebase Functions
 * Configuration Express + API Routes + WebSocket
 */

import { onRequest } from 'firebase-functions/v2/https';
import express from 'express';
import cors from 'cors';

// Import routes
import gpsRoutes from './routes/gps.routes';
import busRoutes from './routes/bus.routes';
import dashboardRoutes from './routes/dashboard.routes';
import realtimeRoutes from './routes/realtime.routes';
import studentRoutes from './routes/student.routes';
import driverRoutes from './routes/driver.routes';
import maintenanceRoutes from './routes/maintenance.routes';
import attendanceRoutes from './routes/attendance.routes';

// Import WebSocket manager
import websocketManager from './utils/websocket.manager';

// Initialisation Express
const app = express();

// Middleware
app.use(cors({ origin: true })); // CORS pour tous les origins en dev
app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'Transport Scolaire API',
    timestamp: new Date().toISOString(),
    websocketClients: websocketManager.getClientsCount(),
  });
});

// API Routes
// Note: Firebase Functions exporte cette fonction sous le nom 'api', donc elle est accessible via /api
// Les routes Express sont ensuite ajoutées après ce préfixe
// Exemple: Cloud Function 'api' + route Express '/buses' = URL finale '/api/buses'
app.use('/gps', gpsRoutes);
app.use('/buses', busRoutes);
app.use('/realtime', realtimeRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/students', studentRoutes);
app.use('/drivers', driverRoutes);
app.use('/maintenances', maintenanceRoutes);
app.use('/attendance', attendanceRoutes);

// Route 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.path,
  });
});

// Error handling middleware
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('❌ Erreur serveur:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Export Firebase Function
// Accessible via: https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api
// Configuration: région europe-west4 (RGPD compliance), max instances: 10 (cost control)
export const api = onRequest(
  {
    region: 'europe-west4',
    maxInstances: 10,
    timeoutSeconds: 60,
    memory: '256MiB',
    cors: true,
  },
  app
);

// Initialisation WebSocket (en local uniquement, pas sur Cloud Functions)
// En production, utiliser Firebase Realtime Database ou Firestore listeners
if (process.env.FUNCTIONS_EMULATOR === 'true') {
  websocketManager.initialize(8080);
  console.log('🚀 Mode Emulator: WebSocket activé sur port 8080');
}

// Export fonction de test
export { helloWorld } from './test-function';

// Export trigger de création d'utilisateur
export { onUserCreated } from './triggers/user-created.trigger';
