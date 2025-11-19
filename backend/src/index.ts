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
// Note: Firebase Functions mappe /projet-bus-60a3f/europe-west4/api/... vers /... dans Express
// Exemple: /projet-bus-60a3f/europe-west4/api/dashboard/stats -> /dashboard/stats
app.use('/api/gps', gpsRoutes);
app.use('/api/buses', busRoutes);
app.use('/api/realtime', realtimeRoutes);
// Firebase Functions enlève /projet-bus-60a3f/europe-west4/api
app.use('/dashboard', dashboardRoutes);

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
