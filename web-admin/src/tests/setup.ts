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

// jsdom ne fournit pas ResizeObserver, utilisé par la carte (GodViewPage)
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);

// Mock des variables d'environnement
vi.stubEnv('VITE_FIREBASE_API_KEY', 'test-api-key');
vi.stubEnv('VITE_FIREBASE_AUTH_DOMAIN', 'test-project.firebaseapp.com');
vi.stubEnv('VITE_FIREBASE_PROJECT_ID', 'test-project');
vi.stubEnv('VITE_FIREBASE_STORAGE_BUCKET', 'test-project.appspot.com');
vi.stubEnv('VITE_FIREBASE_MESSAGING_SENDER_ID', '123456789');
vi.stubEnv('VITE_FIREBASE_APP_ID', '1:123456789:web:abcdef');
vi.stubEnv('VITE_MAPBOX_ACCESS_TOKEN', 'test-mapbox-token');
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:3000');

// Mock des services Firestore School
vi.mock('@/services/school.firestore', () => {
  const noopUnsubscribe = () => undefined;
  const mock = {
    watchSchool: vi.fn(() => noopUnsubscribe),
    watchSchoolBuses: vi.fn(() => noopUnsubscribe),
    getSchool: vi.fn(),
  };
  return mock;
});

// Mock de Mapbox GL (interface complète utilisée par GodViewPage)
vi.mock('mapbox-gl', () => ({
  default: {
    accessToken: '',
    Map: vi.fn(() => ({
      on: vi.fn(),
      off: vi.fn(),
      remove: vi.fn(),
      addControl: vi.fn(),
      resize: vi.fn(),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
      easeTo: vi.fn(),
      getCenter: vi.fn(() => ({ lat: 5.351824, lng: -3.953979 })),
      getZoom: vi.fn(() => 16),
      isMoving: vi.fn(() => false),
      isZooming: vi.fn(() => false),
      getContainer: vi.fn(() => document.createElement('div')),
    })),
    Marker: vi.fn(() => ({
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      setPopup: vi.fn().mockReturnThis(),
      togglePopup: vi.fn(),
      getLngLat: vi.fn(() => ({ lat: 5.351824, lng: -3.953979 })),
      getElement: vi.fn(() => document.createElement('div')),
    })),
    Popup: vi.fn(() => ({
      setHTML: vi.fn().mockReturnThis(),
      setLngLat: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      remove: vi.fn(),
      on: vi.fn(),
      isOpen: vi.fn(() => false),
      getElement: vi.fn(() => null),
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
