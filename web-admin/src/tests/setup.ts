/**
 * Configuration des tests
 * Setup global pour Vitest et Testing Library
 */

import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Nettoyer après chaque test
afterEach(() => {
  cleanup();
});

// Mock des variables d'environnement
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com');
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789');
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef');
vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'test-mapbox-token');
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000');

// Mock de Mapbox GL
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      on: vi.fn(),
      remove: vi.fn(),
      addControl: vi.fn(),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
    })),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      setPopup: vi.fn().mockReturnThis(),
      togglePopup: vi.fn(),
    })),
    Popup: vi.fn(() => ({
      setHTML: vi.fn().mockReturnThis(),
    })),
    NavigationControl: vi.fn(),
    FullscreenControl: vi.fn(),
    LngLatBounds: vi.fn(() => ({
      extend: vi.fn(),
    })),
  },
}));

// Etendre les matchers expect
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

