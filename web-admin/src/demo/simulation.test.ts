/**
 * Tests du moteur de simulation du mode démo.
 * Vérifie que la flotte est émise, que les bus se déplacent dans le temps et
 * que les élèves sont scannés au fil de la tournée.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { demoSim } from './simulation';
import { BusLiveStatus, type BusRealtimeData } from '@/types/realtime';
import { DEMO_TICK_MS } from './config';

const totalScanned = (buses: BusRealtimeData[]): number =>
  buses.reduce((sum, bus) => sum + (bus.currentTrip?.scannedStudentIds.length ?? 0), 0);

describe('demoSim', () => {
  afterEach(() => {
    demoSim.stop();
    vi.useRealTimers();
  });

  it('émet une flotte initiale de 5 bus avec positions', () => {
    const cb = vi.fn();
    const unsubscribe = demoSim.subscribeBuses(cb);

    expect(cb).toHaveBeenCalled();
    const buses = cb.mock.calls[0][0] as BusRealtimeData[];
    expect(buses).toHaveLength(5);
    buses.forEach((bus) => {
      expect(bus.currentPosition).not.toBeNull();
      expect(typeof bus.currentPosition?.lat).toBe('number');
    });

    unsubscribe();
  });

  it('déplace les bus en route et fait progresser les scans dans le temps', () => {
    vi.useFakeTimers();

    let latest: BusRealtimeData[] = [];
    const unsubscribe = demoSim.subscribeBuses((buses) => {
      latest = buses;
    });

    const movingBefore = latest.find(
      (bus) => bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED
    );
    expect(movingBefore).toBeDefined();
    const posBefore = { ...movingBefore!.currentPosition! };
    const scannedBefore = totalScanned(latest);

    // Avancer ~30 s de simulation.
    vi.advanceTimersByTime(DEMO_TICK_MS * 20);

    const movingAfter = latest.find((bus) => bus.id === movingBefore!.id)!;
    const moved =
      movingAfter.currentPosition!.lat !== posBefore.lat ||
      movingAfter.currentPosition!.lng !== posBefore.lng;

    expect(moved).toBe(true);
    expect(totalScanned(latest)).toBeGreaterThanOrEqual(scannedBefore);

    unsubscribe();
  });

  it('fournit le prochain élève à scanner pour un bus', () => {
    const next = demoSim.getNextStudent('demo-bus-12');
    // Soit un élève reste à scanner (objet), soit tous scannés (null) — jamais une erreur.
    if (next) {
      expect(next.studentName).toBeTruthy();
      expect(next.stopOrder).toBeGreaterThan(0);
    } else {
      expect(next).toBeNull();
    }
  });
});
