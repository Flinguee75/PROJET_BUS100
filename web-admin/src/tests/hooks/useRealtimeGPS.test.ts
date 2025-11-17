/**
 * Tests pour le hook useRealtimeGPS
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useRealtimeGPS, useRealtimeBusPosition } from '@/hooks/useRealtimeGPS';

// Mock de Firestore
const mockOnSnapshot = vi.fn();
const mockQuery = vi.fn();
const mockCollection = vi.fn();

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => mockCollection(...args),
  onSnapshot: (...args: unknown[]) => mockOnSnapshot(...args),
  query: (...args: unknown[]) => mockQuery(...args),
}));

vi.mock('@/services/firebase', () => ({
  db: {},
}));

describe('useRealtimeGPS', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue({});
  });

  it('initialise avec loading=true et buses vide', () => {
    mockOnSnapshot.mockImplementation(() => vi.fn());

    const { result } = renderHook(() => useRealtimeGPS());

    expect(result.current.loading).toBe(true);
    expect(result.current.buses).toEqual([]);
    expect(result.current.error).toBe(null);
  });

  it('récupère les bus depuis Firestore', async () => {
    const mockBusData = {
      immatriculation: 'ABC-123',
      chauffeur: 'Jean Dupont',
      capacite: 50,
      itineraire: 'Ligne A',
      position: {
        lat: 48.8566,
        lng: 2.3522,
        speed: 35,
        timestamp: Date.now(),
      },
      status: 'EN_ROUTE',
    };

    mockOnSnapshot.mockImplementation((query, onNext) => {
      const snapshot = {
        forEach: (callback: (doc: unknown) => void) => {
          callback({
            id: 'bus-1',
            data: () => mockBusData,
          });
        },
      };
      onNext(snapshot);
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeGPS());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.buses).toHaveLength(1);
      expect(result.current.buses[0].id).toBe('bus-1');
      expect(result.current.buses[0].immatriculation).toBe('ABC-123');
    });
  });

  it('détermine le statut EN_ROUTE pour un bus en mouvement', async () => {
    const mockBusData = {
      position: {
        lat: 48.8566,
        lng: 2.3522,
        speed: 35,
        timestamp: Date.now(),
      },
      lastUpdate: Date.now(),
    };

    mockOnSnapshot.mockImplementation((query, onNext) => {
      const snapshot = {
        forEach: (callback: (doc: unknown) => void) => {
          callback({
            id: 'bus-1',
            data: () => mockBusData,
          });
        },
      };
      onNext(snapshot);
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeGPS());

    await waitFor(() => {
      expect(result.current.buses[0]?.status).toBe('EN_ROUTE');
    });
  });

  it('détermine le statut A_L_ARRET pour un bus immobile', async () => {
    const mockBusData = {
      position: {
        lat: 48.8566,
        lng: 2.3522,
        speed: 0,
        timestamp: Date.now(),
      },
      lastUpdate: Date.now(),
    };

    mockOnSnapshot.mockImplementation((query, onNext) => {
      const snapshot = {
        forEach: (callback: (doc: unknown) => void) => {
          callback({
            id: 'bus-1',
            data: () => mockBusData,
          });
        },
      };
      onNext(snapshot);
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeGPS());

    await waitFor(() => {
      expect(result.current.buses[0]?.status).toBe('A_L_ARRET');
    });
  });

  it('détermine le statut HORS_SERVICE pour un bus sans mise à jour récente', async () => {
    const fiveMinutesAgo = Date.now() - 6 * 60 * 1000; // 6 minutes
    const mockBusData = {
      position: {
        lat: 48.8566,
        lng: 2.3522,
        speed: 0,
        timestamp: fiveMinutesAgo,
      },
      lastUpdate: fiveMinutesAgo,
    };

    mockOnSnapshot.mockImplementation((query, onNext) => {
      const snapshot = {
        forEach: (callback: (doc: unknown) => void) => {
          callback({
            id: 'bus-1',
            data: () => mockBusData,
          });
        },
      };
      onNext(snapshot);
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeGPS());

    await waitFor(() => {
      expect(result.current.buses[0]?.status).toBe('HORS_SERVICE');
    });
  });

  it('gère les erreurs de Firestore', async () => {
    const mockError = new Error('Firestore error');

    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      onError(mockError);
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeGPS());

    await waitFor(() => {
      expect(result.current.error).toBe('Impossible de récupérer les positions GPS en temps réel');
      expect(result.current.loading).toBe(false);
    });
  });

  it('met à jour les bus en temps réel', async () => {
    let snapshotCallback: ((snapshot: unknown) => void) | null = null;

    mockOnSnapshot.mockImplementation((query, onNext) => {
      snapshotCallback = onNext;
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeGPS());

    // Premier snapshot
    const snapshot1 = {
      forEach: (callback: (doc: unknown) => void) => {
        callback({
          id: 'bus-1',
          data: () => ({
            immatriculation: 'ABC-123',
            position: { lat: 48.8566, lng: 2.3522, speed: 30, timestamp: Date.now() },
          }),
        });
      },
    };

    snapshotCallback(snapshot1);

    await waitFor(() => {
      expect(result.current.buses).toHaveLength(1);
    });

    // Deuxième snapshot avec un bus de plus
    const snapshot2 = {
      forEach: (callback: (doc: unknown) => void) => {
        callback({
          id: 'bus-1',
          data: () => ({
            immatriculation: 'ABC-123',
            position: { lat: 48.8566, lng: 2.3522, speed: 30, timestamp: Date.now() },
          }),
        });
        callback({
          id: 'bus-2',
          data: () => ({
            immatriculation: 'XYZ-789',
            position: { lat: 48.8600, lng: 2.3500, speed: 40, timestamp: Date.now() },
          }),
        });
      },
    };

    snapshotCallback(snapshot2);

    await waitFor(() => {
      expect(result.current.buses).toHaveLength(2);
    });
  });

  it('appelle unsubscribe lors du démontage', () => {
    const unsubscribeMock = vi.fn();
    mockOnSnapshot.mockImplementation(() => unsubscribeMock);

    const { unmount } = renderHook(() => useRealtimeGPS());

    expect(unsubscribeMock).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});

describe('useRealtimeBusPosition', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQuery.mockReturnValue({});
  });

  it('initialise avec loading=true et position null', () => {
    mockOnSnapshot.mockImplementation(() => vi.fn());

    const { result } = renderHook(() => useRealtimeBusPosition('bus-1'));

    expect(result.current.loading).toBe(true);
    expect(result.current.position).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('récupère la position d\'un bus spécifique', async () => {
    const mockPosition = {
      lat: 48.8566,
      lng: 2.3522,
      speed: 35,
      timestamp: Date.now(),
    };

    mockOnSnapshot.mockImplementation((query, onNext) => {
      const snapshot = {
        docs: [
          {
            id: 'bus-1',
            data: () => ({
              position: mockPosition,
            }),
          },
        ],
      };
      onNext(snapshot);
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeBusPosition('bus-1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.position).toEqual(mockPosition);
    });
  });

  it('retourne null si le bus n\'est pas trouvé', async () => {
    mockOnSnapshot.mockImplementation((query, onNext) => {
      const snapshot = {
        docs: [],
      };
      onNext(snapshot);
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeBusPosition('bus-unknown'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.position).toBe(null);
    });
  });

  it('ne fait rien si busId est vide', () => {
    const { result } = renderHook(() => useRealtimeBusPosition(''));

    expect(result.current.loading).toBe(false);
    expect(result.current.position).toBe(null);
  });

  it('gère les erreurs', async () => {
    mockOnSnapshot.mockImplementation((query, onNext, onError) => {
      onError(new Error('Firestore error'));
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeBusPosition('bus-1'));

    await waitFor(() => {
      expect(result.current.error).toBe('Impossible de récupérer la position du bus');
      expect(result.current.loading).toBe(false);
    });
  });

  it('met à jour la position en temps réel', async () => {
    let snapshotCallback: ((snapshot: unknown) => void) | null = null;

    mockOnSnapshot.mockImplementation((query, onNext) => {
      snapshotCallback = onNext;
      return vi.fn();
    });

    const { result } = renderHook(() => useRealtimeBusPosition('bus-1'));

    const position1 = { lat: 48.8566, lng: 2.3522, speed: 30, timestamp: Date.now() };
    const snapshot1 = {
      docs: [
        {
          id: 'bus-1',
          data: () => ({ position: position1 }),
        },
      ],
    };

    snapshotCallback(snapshot1);

    await waitFor(() => {
      expect(result.current.position).toEqual(position1);
    });

    const position2 = { lat: 48.8600, lng: 2.3500, speed: 40, timestamp: Date.now() };
    const snapshot2 = {
      docs: [
        {
          id: 'bus-1',
          data: () => ({ position: position2 }),
        },
      ],
    };

    snapshotCallback(snapshot2);

    await waitFor(() => {
      expect(result.current.position).toEqual(position2);
    });
  });

  it('appelle unsubscribe lors du démontage', () => {
    const unsubscribeMock = vi.fn();
    mockOnSnapshot.mockImplementation(() => unsubscribeMock);

    const { unmount } = renderHook(() => useRealtimeBusPosition('bus-1'));

    expect(unsubscribeMock).not.toHaveBeenCalled();

    unmount();

    expect(unsubscribeMock).toHaveBeenCalled();
  });
});
