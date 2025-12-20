/**
 * Tests unitaires pour WebSocket Manager
 * Test de la gestion des connexions WebSocket et broadcasting
 */

import WebSocketManager from '../../src/utils/websocket.manager';
import { WebSocket, WebSocketServer } from 'ws';
import { BusLiveStatus } from '../../src/types';

// Mock ws module
jest.mock('ws', () => {
  const actualWs = jest.requireActual('ws');
  return {
    ...actualWs,
    WebSocketServer: jest.fn(),
  };
});

describe('WebSocketManager', () => {
  let mockWss: any;
  let mockWs: any;
  let connectionCallback: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Clean up any existing connections first
    try {
      WebSocketManager.close();
    } catch (e) {
      // Ignore errors during cleanup
    }

    // Setup mock WebSocket
    mockWs = {
      send: jest.fn(),
      close: jest.fn(),
      readyState: WebSocket.OPEN,
      on: jest.fn(),
    };

    // Setup mock WebSocketServer
    mockWss = {
      on: jest.fn((event, callback) => {
        if (event === 'connection') {
          connectionCallback = callback;
        }
      }),
      close: jest.fn(),
    };

    (WebSocketServer as any).mockImplementation(() => mockWss);
  });

  afterEach(() => {
    // Clean up any existing connections
    try {
      WebSocketManager.close();
    } catch (e) {
      // Ignore errors during cleanup
    }
  });

  describe('initialize', () => {
    it('should initialize WebSocket server on default port', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      WebSocketManager.initialize();

      expect(WebSocketServer).toHaveBeenCalledWith({ port: 8181 });
      expect(mockWss.on).toHaveBeenCalledWith('connection', expect.any(Function));
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Serveur WebSocket démarré sur port 8181'
      );

      consoleSpy.mockRestore();
    });

    it('should initialize WebSocket server on custom port', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      WebSocketManager.initialize(3000);

      expect(WebSocketServer).toHaveBeenCalledWith({ port: 3000 });
      expect(consoleSpy).toHaveBeenCalledWith(
        '✅ Serveur WebSocket démarré sur port 3000'
      );

      consoleSpy.mockRestore();
    });

    it('should handle client connection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      WebSocketManager.initialize();

      // Simulate client connection
      connectionCallback(mockWs);

      expect(mockWs.send).toHaveBeenCalledWith(
        JSON.stringify({
          type: 'connected',
          message: 'Connecté au serveur GPS',
        })
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        '🔌 Nouveau client WebSocket connecté'
      );

      consoleSpy.mockRestore();
    });

    it('should setup close event handler', () => {
      WebSocketManager.initialize();

      // Simulate client connection
      connectionCallback(mockWs);

      expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should setup error event handler', () => {
      WebSocketManager.initialize();

      // Simulate client connection
      connectionCallback(mockWs);

      expect(mockWs.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    it('should handle client disconnection', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      WebSocketManager.initialize();

      // Simulate client connection
      connectionCallback(mockWs);

      // Get the close callback
      const closeCallback = mockWs.on.mock.calls.find(
        (call: any) => call[0] === 'close'
      )[1];

      // Simulate client disconnection
      closeCallback();

      expect(consoleSpy).toHaveBeenCalledWith(
        '🔌 Client WebSocket déconnecté'
      );

      consoleSpy.mockRestore();
    });

    it('should handle client error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      WebSocketManager.initialize();

      // Simulate client connection
      connectionCallback(mockWs);

      // Get the error callback
      const errorCallback = mockWs.on.mock.calls.find(
        (call: any) => call[0] === 'error'
      )[1];

      const testError = new Error('Test error');

      // Simulate client error
      errorCallback(testError);

      expect(consoleSpy).toHaveBeenCalledWith('❌ Erreur WebSocket:', testError);

      consoleSpy.mockRestore();
    });

    it('should handle server error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      let serverErrorCallback: any;

      // Setup mock to capture server error handler
      mockWss.on = jest.fn((event, callback) => {
        if (event === 'connection') {
          connectionCallback = callback;
        } else if (event === 'error') {
          serverErrorCallback = callback;
        }
      });

      WebSocketManager.initialize(8080);

      // Simulate server error
      const serverError = new Error('EADDRINUSE: address already in use');
      serverErrorCallback(serverError);

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Erreur serveur WebSocket sur port 8080:',
        serverError.message
      );

      consoleSpy.mockRestore();
    });

    it('should handle initialization failure', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      // Mock WebSocketServer to throw error
      (WebSocketServer as any).mockImplementation(() => {
        throw new Error('Failed to initialize');
      });

      WebSocketManager.initialize(9999);

      expect(consoleSpy).toHaveBeenCalledWith(
        '❌ Impossible de démarrer WebSocket sur port 9999:',
        expect.any(Error)
      );

      consoleSpy.mockRestore();

      // Restore normal mock for other tests
      (WebSocketServer as any).mockImplementation(() => mockWss);
    });
  });

  describe('broadcastGPSUpdate', () => {
    it('should broadcast GPS update to all connected clients', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      WebSocketManager.initialize();

      // Simulate multiple client connections
      const mockWs1 = { ...mockWs, readyState: WebSocket.OPEN, send: jest.fn() };
      const mockWs2 = { ...mockWs, readyState: WebSocket.OPEN, send: jest.fn() };

      connectionCallback(mockWs1);
      connectionCallback(mockWs2);

      const gpsData = {
        busId: 'bus-001',
        position: {
          lat: 48.8566,
          lng: 2.3522,
          speed: 50,
          timestamp: Date.now(),
        },
        status: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-123',
        routeId: 'route-456',
        passengersCount: 0,
        lastUpdate: new Date(),
      };

      WebSocketManager.broadcastGPSUpdate(gpsData);

      // Both clients should receive the message
      expect(mockWs1.send).toHaveBeenCalled();
      expect(mockWs2.send).toHaveBeenCalled();

      // Verify message content
      const sentMessage1 = JSON.parse(mockWs1.send.mock.calls[1][0]);
      expect(sentMessage1.type).toBe('gps_update');
      expect(sentMessage1.data.busId).toBe('bus-001');

      consoleSpy.mockRestore();
    });

    it('should not broadcast when no clients connected', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      WebSocketManager.initialize();

      const gpsData = {
        busId: 'bus-001',
        position: {
          lat: 48.8566,
          lng: 2.3522,
          speed: 50,
          timestamp: Date.now(),
        },
        status: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-123',
        routeId: null,
        passengersCount: 0,
        lastUpdate: new Date(),
      };

      WebSocketManager.broadcastGPSUpdate(gpsData);

      // No broadcast message should be logged
      const broadcastLogs = consoleSpy.mock.calls.filter((call) =>
        call[0].includes('📡 Broadcast GPS update')
      );
      expect(broadcastLogs).toHaveLength(0);

      consoleSpy.mockRestore();
    });

    it('should only send to clients with OPEN readyState', () => {
      WebSocketManager.initialize();

      // Simulate clients with different states
      const mockWsOpen = {
        ...mockWs,
        readyState: WebSocket.OPEN,
        send: jest.fn(),
      };
      const mockWsClosed = {
        ...mockWs,
        readyState: WebSocket.CLOSED,
        send: jest.fn(),
      };
      const mockWsConnecting = {
        ...mockWs,
        readyState: WebSocket.CONNECTING,
        send: jest.fn(),
      };

      connectionCallback(mockWsOpen);
      connectionCallback(mockWsClosed);
      connectionCallback(mockWsConnecting);

      const gpsData = {
        busId: 'bus-001',
        position: {
          lat: 48.8566,
          lng: 2.3522,
          speed: 50,
          timestamp: Date.now(),
        },
        status: BusLiveStatus.EN_ROUTE,
        driverId: 'driver-123',
        routeId: 'route-456',
        passengersCount: 0,
        lastUpdate: new Date(),
      };

      WebSocketManager.broadcastGPSUpdate(gpsData);

      // Only OPEN client should receive message (after initial connection message)
      expect(mockWsOpen.send).toHaveBeenCalledTimes(2); // 1 for connection, 1 for GPS update
      expect(mockWsClosed.send).toHaveBeenCalledTimes(1); // Only connection message
      expect(mockWsConnecting.send).toHaveBeenCalledTimes(1); // Only connection message
    });
  });

  describe('close', () => {
    it('should close all client connections and server', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      WebSocketManager.initialize();

      // Simulate multiple client connections
      const mockWs1 = { ...mockWs, close: jest.fn() };
      const mockWs2 = { ...mockWs, close: jest.fn() };

      connectionCallback(mockWs1);
      connectionCallback(mockWs2);

      WebSocketManager.close();

      expect(mockWs1.close).toHaveBeenCalled();
      expect(mockWs2.close).toHaveBeenCalled();
      expect(mockWss.close).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('🔌 Serveur WebSocket fermé');

      consoleSpy.mockRestore();
    });

    it('should handle closing when no server is initialized', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      // Don't initialize, just try to close
      WebSocketManager.close();

      // Should log that it's closed
      expect(consoleSpy).toHaveBeenCalledWith('🔌 Serveur WebSocket fermé');

      consoleSpy.mockRestore();
    });
  });

  describe('getClientsCount', () => {
    it('should return 0 when no clients connected', () => {
      WebSocketManager.initialize();

      const count = WebSocketManager.getClientsCount();

      expect(count).toBe(0);
    });

    it('should return correct number of connected clients', () => {
      WebSocketManager.initialize();

      // Simulate multiple client connections
      connectionCallback(mockWs);
      connectionCallback({ ...mockWs });
      connectionCallback({ ...mockWs });

      const count = WebSocketManager.getClientsCount();

      expect(count).toBe(3);
    });

    it('should update count after client disconnection', () => {
      WebSocketManager.initialize();

      // Simulate client connections
      const mockWs1 = { ...mockWs, on: jest.fn() };
      const mockWs2 = { ...mockWs, on: jest.fn() };

      connectionCallback(mockWs1);
      connectionCallback(mockWs2);

      expect(WebSocketManager.getClientsCount()).toBe(2);

      // Get the close callback for first client
      const closeCallback = mockWs1.on.mock.calls.find(
        (call: any) => call[0] === 'close'
      )[1];

      // Simulate first client disconnection
      closeCallback();

      expect(WebSocketManager.getClientsCount()).toBe(1);
    });
  });
});
