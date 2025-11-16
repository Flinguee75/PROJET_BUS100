/**
 * WebSocket Manager - Broadcast temps réel des positions GPS
 * Permet aux clients (web, mobile) de recevoir les mises à jour en temps réel
 */

import { WebSocket, WebSocketServer } from 'ws';
import { GPSLiveData } from '../types';

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Set<WebSocket> = new Set();

  /**
   * Initialise le serveur WebSocket
   */
  initialize(port: number = 8080): void {
    this.wss = new WebSocketServer({ port });

    this.wss.on('connection', (ws: WebSocket) => {
      console.log('🔌 Nouveau client WebSocket connecté');
      this.clients.add(ws);

      // Message de bienvenue
      ws.send(
        JSON.stringify({
          type: 'connected',
          message: 'Connecté au serveur GPS',
        })
      );

      // Gérer déconnexion
      ws.on('close', () => {
        console.log('🔌 Client WebSocket déconnecté');
        this.clients.delete(ws);
      });

      // Gérer erreurs
      ws.on('error', (error) => {
        console.error('❌ Erreur WebSocket:', error);
        this.clients.delete(ws);
      });
    });

    console.log(`✅ Serveur WebSocket démarré sur port ${port}`);
  }

  /**
   * Broadcast une mise à jour GPS à tous les clients connectés
   */
  broadcastGPSUpdate(data: GPSLiveData): void {
    if (this.clients.size === 0) {
      return; // Pas de clients, pas de broadcast
    }

    const message = JSON.stringify({
      type: 'gps_update',
      data,
      timestamp: new Date().toISOString(),
    });

    this.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });

    console.log(
      `📡 Broadcast GPS update pour bus ${data.busId} à ${this.clients.size} clients`
    );
  }

  /**
   * Ferme toutes les connexions WebSocket
   */
  close(): void {
    this.clients.forEach((client) => {
      client.close();
    });
    this.wss?.close();
    console.log('🔌 Serveur WebSocket fermé');
  }

  /**
   * Retourne le nombre de clients connectés
   */
  getClientsCount(): number {
    return this.clients.size;
  }
}

export default new WebSocketManager();
