/**
 * Tests du moteur de simulation du mode démo.
 * Vérifie que la flotte est émise, que les bus se déplacent dans le temps et
 * que les élèves sont scannés au fil de la tournée.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { demoSim } from './simulation';
import { DEMO_BUSES, DEMO_SCHOOL_LOCATION } from './seed';
import { BusLiveStatus, type BusRealtimeData } from '@/types/realtime';

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

    // Avancer ~30 s de simulation (indépendant de la cadence du tick).
    vi.advanceTimersByTime(30_000);

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

  it('expose la trajectoire prévue d’un bus vers l’école', () => {
    const seed = DEMO_BUSES[0];
    const trajectory = demoSim.getTrajectory(seed.id);

    expect(trajectory.length).toBeGreaterThanOrEqual(10);

    const first = trajectory[0];
    const last = trajectory[trajectory.length - 1];

    // Le premier point doit être ≈ départ du seed (à 1e-3 près).
    expect(first.lat).toBeCloseTo(seed.start.lat, 3);
    expect(first.lng).toBeCloseTo(seed.start.lng, 3);

    // Le dernier point doit être ≈ l’école.
    expect(last.lat).toBeCloseTo(DEMO_SCHOOL_LOCATION.lat, 3);
    expect(last.lng).toBeCloseTo(DEMO_SCHOOL_LOCATION.lng, 3);
  });

  it('retourne une trajectoire vide pour un bus inconnu', () => {
    expect(demoSim.getTrajectory('bus-inexistant')).toEqual([]);
  });

  it('met en pause les ticks et reprend où on s’était arrêté', () => {
    vi.useFakeTimers();

    const cb = vi.fn();
    const unsubscribe = demoSim.subscribeBuses(cb);

    // Quelques ticks normaux.
    vi.advanceTimersByTime(1000);
    const callsBeforePause = cb.mock.calls.length;
    expect(callsBeforePause).toBeGreaterThan(1);

    demoSim.pause();
    expect(demoSim.isPaused()).toBe(true);

    // Pendant la pause: plus aucun nouveau tick.
    vi.advanceTimersByTime(2000);
    expect(cb.mock.calls.length).toBe(callsBeforePause);

    demoSim.resume();
    expect(demoSim.isPaused()).toBe(false);

    // Après resume: les ticks reprennent.
    vi.advanceTimersByTime(1000);
    expect(cb.mock.calls.length).toBeGreaterThan(callsBeforePause);

    unsubscribe();
  });

  it('restaure l’état seed initial avec reset()', () => {
    vi.useFakeTimers();

    let latest: BusRealtimeData[] = [];
    const unsubscribe = demoSim.subscribeBuses((buses) => {
      latest = buses;
    });

    // Avancer pour que tous les bus aient bougé et scanné des élèves.
    vi.advanceTimersByTime(60_000);

    const movingBus = latest.find(
      (bus) =>
        bus.id !== 'demo-bus-45' &&
        bus.currentTrip != null &&
        (bus.currentTrip.scannedStudentIds.length > 0)
    );
    expect(movingBus).toBeDefined();

    demoSim.reset();

    const busAfterReset = latest.find((b) => b.id === movingBus!.id)!;
    // Les scans de la course actuelle sont purgés.
    expect(busAfterReset.currentTrip?.scannedStudentIds.length ?? 0).toBeLessThan(
      movingBus!.currentTrip!.scannedStudentIds.length
    );

    // BUS-45 redevient ARRIVED (état initial seed).
    const bus45 = latest.find((b) => b.id === 'demo-bus-45');
    expect(bus45?.liveStatus).toBe(BusLiveStatus.ARRIVED);

    unsubscribe();
  });

  it('émet toujours exactement 5 bus avec des IDs uniques même après plusieurs cycles', () => {
    vi.useFakeTimers();

    let latest: BusRealtimeData[] = [];
    const unsubscribe = demoSim.subscribeBuses((buses) => {
      latest = buses;
    });

    // Avancer largement au-delà d'un cycle complet (trip 90s + dwell 25s = 115s).
    vi.advanceTimersByTime(180_000);

    expect(latest).toHaveLength(5);
    const ids = new Set(latest.map((b) => b.id));
    expect(ids.size).toBe(5);

    const numbers = new Set(latest.map((b) => b.number));
    expect(numbers.size).toBe(5);

    unsubscribe();
  });

  it('démarre avec une vitesse de simulation de 1×', () => {
    expect(demoSim.getSpeed()).toBe(1);
  });

  it('accélère la progression des bus quand setSpeed(2) est appelé', () => {
    vi.useFakeTimers();

    let latest: BusRealtimeData[] = [];
    const unsubscribe = demoSim.subscribeBuses((buses) => {
      latest = buses;
    });

    // Mesure baseline 1×
    const movingId = latest.find(
      (bus) => bus.liveStatus === BusLiveStatus.EN_ROUTE
    )!.id;
    const posBefore = { ...latest.find((b) => b.id === movingId)!.currentPosition! };
    vi.advanceTimersByTime(2_000);
    const posAfterNormal = { ...latest.find((b) => b.id === movingId)!.currentPosition! };
    const dxNormal = Math.hypot(
      posAfterNormal.lat - posBefore.lat,
      posAfterNormal.lng - posBefore.lng
    );

    // Reset, set speed 2×, même intervalle simulé.
    demoSim.reset();
    demoSim.setSpeed(2);
    expect(demoSim.getSpeed()).toBe(2);

    const posBefore2 = { ...latest.find((b) => b.id === movingId)!.currentPosition! };
    vi.advanceTimersByTime(2_000);
    const posAfterFast = { ...latest.find((b) => b.id === movingId)!.currentPosition! };
    const dxFast = Math.hypot(
      posAfterFast.lat - posBefore2.lat,
      posAfterFast.lng - posBefore2.lng
    );

    // À 2×, la distance parcourue doit être nettement supérieure.
    expect(dxFast).toBeGreaterThan(dxNormal * 1.5);

    demoSim.setSpeed(1); // cleanup pour les autres tests
    unsubscribe();
  });

  it('émet plusieurs ticks par seconde pour fluidifier les animations', () => {
    vi.useFakeTimers();

    const cb = vi.fn();
    const unsubscribe = demoSim.subscribeBuses(cb);

    const initialCalls = cb.mock.calls.length;
    vi.advanceTimersByTime(1000);
    const ticksIn1s = cb.mock.calls.length - initialCalls;

    expect(ticksIn1s).toBeGreaterThanOrEqual(3);

    unsubscribe();
  });
});
