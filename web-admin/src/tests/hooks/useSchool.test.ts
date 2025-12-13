/**
 * Tests pour les hooks useSchool et useSchoolBuses
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useSchool, useSchoolBuses } from '@/hooks/useSchool';
import type { School } from '@/types/school';
import type { BusRealtimeData } from '@/types/realtime';
import { BusStatus, BusLiveStatus } from '@/types/realtime';
import { watchSchool, watchSchoolBuses } from '@/services/school.firestore';

const mockWatchSchool = vi.mocked(watchSchool);
const mockWatchSchoolBuses = vi.mocked(watchSchoolBuses);

describe('useSchool', () => {
  const sampleSchool: School = {
    id: 'school-1',
    name: 'Ecole Demo',
    location: { lat: 5.3, lng: -4.01 },
    fleetSize: 12,
    address: 'Plateau',
    contactEmail: 'contact@school.ci',
    contactPhone: '+22501020304',
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retourne un état inactif quand aucun schoolId n\'est fourni', () => {
    const { result } = renderHook(() => useSchool(null));

    expect(result.current.school).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockWatchSchool).not.toHaveBeenCalled();
  });

  it('écoute une école quand un schoolId est fourni', async () => {
    const unsubscribe = vi.fn();
    mockWatchSchool.mockImplementation((_id, onUpdate) => {
      onUpdate?.(sampleSchool);
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => useSchool('school-1'));

    await waitFor(() => {
      expect(result.current.school).toEqual(sampleSchool);
      expect(result.current.isLoading).toBe(false);
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('gère les erreurs provenant du watcher', async () => {
    mockWatchSchool.mockImplementation((_id, _onUpdate, onError) => {
      onError?.(new Error('Firestore indisponible'));
      return vi.fn();
    });

    const { result } = renderHook(() => useSchool('school-1'));

    await waitFor(() => {
      expect(result.current.error).toBe('Firestore indisponible');
      expect(result.current.isLoading).toBe(false);
    });
  });
});

describe('useSchoolBuses', () => {
  const mockBuses: BusRealtimeData[] = [
    {
      id: 'bus-1',
      number: 'BUS-1',
      plateNumber: 'AA-123-AA',
      capacity: 50,
      model: 'Iveco',
      year: 2020,
      status: BusStatus.ACTIVE,
      currentPosition: { lat: 5.31, lng: -4.02, speed: 10, heading: 0, timestamp: Date.now() },
      liveStatus: BusLiveStatus.EN_ROUTE,
      driver: null,
      route: null,
      passengersCount: 25,
      passengersPresent: 20,
      currentZone: null,
      lastUpdate: new Date().toISOString(),
      isActive: true,
      schoolId: 'school-1',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renvoie un tableau vide quand aucun schoolId n\'est fourni', () => {
    const { result } = renderHook(() => useSchoolBuses(null));

    expect(result.current.buses).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockWatchSchoolBuses).not.toHaveBeenCalled();
  });

  it('écoute les bus de l\'école', async () => {
    const unsubscribe = vi.fn();
    mockWatchSchoolBuses.mockImplementation((_id, onUpdate) => {
      onUpdate?.(mockBuses);
      return unsubscribe;
    });

    const { result, unmount } = renderHook(() => useSchoolBuses('school-1'));

    await waitFor(() => {
      expect(result.current.buses).toEqual(mockBuses);
      expect(result.current.isLoading).toBe(false);
    });

    unmount();
    expect(unsubscribe).toHaveBeenCalled();
  });

  it('gère une erreur du watcher', async () => {
    mockWatchSchoolBuses.mockImplementation((_id, _onUpdate, onError) => {
      onError?.(new Error('Permission denied'));
      return vi.fn();
    });

    const { result } = renderHook(() => useSchoolBuses('school-1'));

    await waitFor(() => {
      expect(result.current.error).toBe('Permission denied');
      expect(result.current.isLoading).toBe(false);
    });
  });
});
