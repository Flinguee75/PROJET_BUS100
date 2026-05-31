/**
 * Moteur de simulation du MODE DÉMO.
 *
 * Fait progresser chaque bus le long d'une trajectoire **routière réelle**
 * (polyligne pré-calculée via Mapbox Directions, cf. `seed-routes.ts`)
 * vers l'école, « scanne » les élèves au fur et à mesure des arrêts, génère
 * des alertes, et expose des abonnements qui reproduisent la signature des
 * listeners Firestore — de sorte que le reste de l'app ne voit aucune
 * différence.
 *
 * Le moteur démarre paresseusement au premier abonnement et tourne pour toute
 * la durée de la session (comportement attendu dans une SPA de démonstration).
 */

import { BusLiveStatus, BusStatus, type BusRealtimeData } from '@/types/realtime';
import type { Alert } from '@/types/alerts';
import type { Student, AttendanceRecord } from '@/services/students.firestore';
import type { CourseHistoryEntry } from '@/services/courseHistory.firestore';
import type { NextStudentInfo } from '@/services/bus.api';
import {
  DEMO_BUSES,
  DEMO_SCHOOL,
  DEMO_SCHOOL_LOCATION,
  type DemoBusSeed,
  type DemoStudentSeed,
  type LatLng,
} from './seed';
import { DEMO_ROUTES } from './seed-routes';
import { polylineAt, polylineHeadingAt } from './polyline';
import { DEMO_DWELL_AT_SCHOOL_MS, DEMO_TICK_MS, DEMO_TRIP_DURATION_MS } from './config';

export { DEMO_SCHOOL, DEMO_USER } from './seed';

type Listener<T> = (value: T) => void;

interface RuntimeBus {
  seed: DemoBusSeed;
  polyline: LatLng[];
  position: LatLng;
  heading: number;
  speed: number; // m/s
  progress: number; // 0..1
  phase: 'driving' | 'dwell';
  delayed: boolean;
  status: BusLiveStatus;
  tripStartTime: number;
  stoppedAt: number | null;
  arrivedAt: number | null;
  dwellStart: number | null;
  scanned: Map<string, number>; // studentId -> scanTime
  scannedVersion: number;
  lastScan?: BusRealtimeData['lastScan'];
}

// ---------------------------------------------------------------------------
// Géométrie
// ---------------------------------------------------------------------------

const polylineForSeed = (seed: DemoBusSeed): LatLng[] => {
  const route = DEMO_ROUTES[seed.id];
  if (route && route.polyline.length >= 2) return route.polyline;
  // Fallback minimal si la route n'a pas été pré-générée pour ce bus :
  // segment direct start → école (suffisant pour ne pas casser la démo).
  return [seed.start, DEMO_SCHOOL_LOCATION];
};

const distanceMeters = (a: LatLng, b: LatLng): number => {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
};

const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
};

const orderedStudents = (seed: DemoBusSeed): DemoStudentSeed[] =>
  [...seed.students].sort((a, b) => a.stopT - b.stopT);

// ---------------------------------------------------------------------------
// Moteur
// ---------------------------------------------------------------------------

class DemoSimulation {
  private buses: RuntimeBus[] = [];
  private timer: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private paused = false;
  private speedMultiplier = 1;

  private busListeners = new Set<Listener<BusRealtimeData[]>>();
  private alertListeners = new Set<Listener<Alert[]>>();
  private courseListeners = new Set<Listener<CourseHistoryEntry[]>>();
  private attendanceSubs: Array<{
    busId: string;
    date: string;
    cb: Listener<AttendanceRecord[]>;
    lastVersion: number;
  }> = [];

  private courseHistory: CourseHistoryEntry[] = [];
  private lastAlertSignature = '';

  // --- Cycle de vie -------------------------------------------------------

  private ensureStarted(): void {
    if (this.started) return;
    this.started = true;
    this.buses = DEMO_BUSES.map((seed) => this.initBus(seed));
    this.timer = setInterval(() => this.tick(), DEMO_TICK_MS);
  }

  /** Arrête la simulation (utile pour les tests ou un teardown explicite). */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.started = false;
    this.paused = false;
  }

  /** Suspend les ticks du moteur sans détruire l'état des bus. */
  pause(): void {
    if (this.paused) return;
    this.paused = true;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /** Reprend la simulation à l'endroit où elle a été mise en pause. */
  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    if (this.started && this.timer == null) {
      this.timer = setInterval(() => this.tick(), DEMO_TICK_MS);
    }
  }

  isPaused(): boolean {
    return this.paused;
  }

  /**
   * Multiplie la cadence de progression de tous les bus et raccourcit
   * proportionnellement les phases de stationnement à l'école. Utile en
   * démo pour montrer un cycle complet (trip + dwell + restart) sans
   * attendre les ~2 minutes naturelles.
   */
  setSpeed(multiplier: number): void {
    if (!Number.isFinite(multiplier) || multiplier <= 0) return;
    this.speedMultiplier = multiplier;
  }

  getSpeed(): number {
    return this.speedMultiplier;
  }

  /**
   * Restaure tous les bus à leur état seed initial (positions, progression,
   * statut, scans). Vide aussi l'historique de courses accumulé pendant la
   * session. Utile pour relancer une démo proprement en cours de session.
   */
  reset(): void {
    this.buses = DEMO_BUSES.map((seed) => this.initBus(seed));
    this.courseHistory = [];
    this.lastAlertSignature = '';
    this.attendanceSubs.forEach((sub) => {
      sub.lastVersion = -1;
    });
    this.emitBuses();
    this.emitAlerts();
    this.emitAttendance();
    this.emitCourses();
  }

  private initBus(seed: DemoBusSeed): RuntimeBus {
    const now = Date.now();
    const polyline = polylineForSeed(seed);
    const delayed = seed.speedFactor < 0.7;
    const isArrived = seed.initialState === 'arrived';
    const progress = isArrived ? 1 : seed.initialProgress;
    const tripStartTime = now - Math.round(progress * DEMO_TRIP_DURATION_MS) - (isArrived ? 120_000 : 0);

    const scanned = new Map<string, number>();
    const ordered = orderedStudents(seed);
    // Pré-scanner les élèves déjà dépassés au démarrage.
    // Pour un bus arrivé, on laisse volontairement le dernier élève « non ramassé »
    // afin d'illustrer une alerte et la liste des oublis.
    ordered.forEach((student, index) => {
      const passed = isArrived
        ? index < ordered.length - 1
        : progress >= student.stopT;
      if (passed) {
        scanned.set(student.id, tripStartTime + Math.round(student.stopT * DEMO_TRIP_DURATION_MS));
      }
    });

    const position = isArrived
      ? { ...DEMO_SCHOOL_LOCATION }
      : polylineAt(polyline, progress);

    return {
      seed,
      polyline,
      position,
      heading: polylineHeadingAt(polyline, Math.min(progress, 0.99)),
      speed: isArrived ? 0 : 12,
      progress,
      phase: isArrived ? 'dwell' : 'driving',
      delayed,
      status: isArrived ? BusLiveStatus.ARRIVED : delayed ? BusLiveStatus.DELAYED : BusLiveStatus.EN_ROUTE,
      tripStartTime,
      stoppedAt: isArrived ? now - 120_000 : null,
      arrivedAt: isArrived ? now - 120_000 : null,
      dwellStart: isArrived ? now - 120_000 : null,
      scanned,
      scannedVersion: 1,
    };
  }

  private startNewTrip(bus: RuntimeBus): void {
    const now = Date.now();
    bus.progress = 0;
    bus.phase = 'driving';
    bus.status = bus.delayed ? BusLiveStatus.DELAYED : BusLiveStatus.EN_ROUTE;
    bus.tripStartTime = now;
    bus.stoppedAt = null;
    bus.arrivedAt = null;
    bus.dwellStart = null;
    bus.scanned = new Map();
    bus.scannedVersion += 1;
    bus.lastScan = undefined;
    bus.position = { ...bus.seed.start };
    bus.speed = 12;
  }

  private completeTrip(bus: RuntimeBus): void {
    const now = Date.now();
    bus.progress = 1;
    bus.phase = 'dwell';
    bus.status = BusLiveStatus.ARRIVED;
    bus.stoppedAt = now;
    bus.arrivedAt = now;
    bus.dwellStart = now;
    bus.position = { ...DEMO_SCHOOL_LOCATION };
    bus.speed = 0;
    this.recordCourse(bus);
  }

  // --- Boucle de simulation ----------------------------------------------

  private tick(): void {
    const now = Date.now();

    const speed = this.speedMultiplier;
    const dwellMs = DEMO_DWELL_AT_SCHOOL_MS / speed;

    for (const bus of this.buses) {
      if (bus.phase === 'dwell') {
        if (bus.dwellStart != null && now - bus.dwellStart >= dwellMs) {
          this.startNewTrip(bus);
        }
        continue;
      }

      const prev = bus.position;
      const step = (DEMO_TICK_MS / DEMO_TRIP_DURATION_MS) * bus.seed.speedFactor * speed;
      bus.progress = Math.min(1, bus.progress + step);

      // Scanner les élèves dont l'arrêt vient d'être dépassé.
      for (const student of orderedStudents(bus.seed)) {
        if (!bus.scanned.has(student.id) && bus.progress >= student.stopT) {
          bus.scanned.set(student.id, now);
          bus.scannedVersion += 1;
          bus.lastScan = {
            studentId: student.id,
            studentName: `${student.firstName} ${student.lastName}`,
            timestamp: now,
            type: 'boarding',
          };
        }
      }

      if (bus.progress >= 1) {
        this.completeTrip(bus);
        continue;
      }

      const pos = bezier(bus.seed.start, bus.control, DEMO_SCHOOL_LOCATION, bus.progress);
      bus.speed = distanceMeters(prev, pos) / (DEMO_TICK_MS / 1000);
      bus.heading = bezierHeading(bus.seed.start, bus.control, DEMO_SCHOOL_LOCATION, bus.progress);
      bus.position = pos;
    }

    this.emitBuses();
    this.emitAlerts();
    this.emitAttendance();
  }

  private recordCourse(bus: RuntimeBus): void {
    const ordered = orderedStudents(bus.seed);
    const scannedIds = ordered.filter((s) => bus.scanned.has(s.id)).map((s) => s.id);
    const missedIds = ordered.filter((s) => !bus.scanned.has(s.id)).map((s) => s.id);
    const total = ordered.length;
    const entry: CourseHistoryEntry = {
      id: `course-${bus.seed.id}-${bus.tripStartTime}`,
      busId: bus.seed.id,
      busNumber: bus.seed.number,
      driverId: bus.seed.driver.id,
      status: 'completed',
      tripType: bus.seed.tripType,
      tripLabel: bus.seed.tripLabel,
      busLabel: `Bus ${bus.seed.number}`,
      busPlate: bus.seed.plateNumber,
      zoneLabel: bus.seed.route.fromZone,
      driverName: bus.seed.driver.name,
      driverPhone: bus.seed.driver.phone,
      startTime: bus.tripStartTime,
      endTime: Date.now(),
      durationMinutes: Math.max(1, Math.round((Date.now() - bus.tripStartTime) / 60000)),
      stats: {
        totalStudents: total,
        scannedCount: scannedIds.length,
        unscannedCount: missedIds.length,
      },
      scannedStudentIds: scannedIds,
      missedStudentIds: missedIds,
    };
    this.courseHistory = [entry, ...this.courseHistory].slice(0, 20);
    this.emitCourses();
  }

  // --- Mappers ------------------------------------------------------------

  private toRealtime(bus: RuntimeBus): BusRealtimeData {
    const now = Date.now();
    const arrived = bus.status === BusLiveStatus.ARRIVED;
    return {
      id: bus.seed.id,
      number: bus.seed.number,
      plateNumber: bus.seed.plateNumber,
      capacity: bus.seed.capacity,
      model: bus.seed.model,
      year: bus.seed.year,
      status: BusStatus.ACTIVE,
      currentPosition: {
        lat: bus.position.lat,
        lng: bus.position.lng,
        speed: bus.speed,
        heading: bus.heading,
        timestamp: now,
      },
      liveStatus: bus.status,
      driver: { ...bus.seed.driver },
      route: { ...bus.seed.route },
      passengersCount: bus.seed.students.length,
      passengersPresent: bus.scanned.size,
      currentZone: bus.seed.route.fromZone,
      lastUpdate: new Date(now).toISOString(),
      isActive: true,
      schoolId: DEMO_SCHOOL.id,
      tripType: bus.seed.tripType,
      tripLabel: bus.seed.tripLabel,
      tripStartTime: bus.tripStartTime,
      stoppedAt: arrived ? bus.arrivedAt : null,
      lastScan: bus.lastScan,
      currentTrip: {
        tripType: bus.seed.tripType,
        routeId: bus.seed.route.id,
        startTime: bus.tripStartTime,
        scannedStudentIds: Array.from(bus.scanned.keys()),
        totalStudentCount: bus.seed.students.length,
      },
    };
  }

  private studentSeedToStudent(bus: DemoBusSeed, seed: DemoStudentSeed): Student {
    const control = controlPoint(bus.start, DEMO_SCHOOL_LOCATION, bus.curve);
    const base = bezier(bus.start, control, DEMO_SCHOOL_LOCATION, seed.stopT);
    const location = {
      address: `${bus.route.fromZone} — arrêt ${seed.firstName}`,
      lat: base.lat + seed.sideOffset,
      lng: base.lng + seed.sideOffset,
    };
    return {
      id: seed.id,
      firstName: seed.firstName,
      lastName: seed.lastName,
      dateOfBirth: '',
      grade: seed.grade,
      parentIds: [],
      busId: bus.id,
      routeId: bus.route.id,
      commune: bus.route.fromZone,
      quartier: bus.route.fromZone,
      isActive: true,
      locations: {
        morningPickup: location,
        eveningDropoff: location,
      },
    };
  }

  private attendanceFor(bus: RuntimeBus, date: string): AttendanceRecord[] {
    return Array.from(bus.scanned.entries()).map(([studentId, scanTime]) => ({
      id: `att-${bus.seed.id}-${studentId}`,
      studentId,
      busId: bus.seed.id,
      date,
      status: 'present',
      morningStatus: 'present',
      eveningStatus: 'present',
      tripType: bus.seed.tripType,
      timestamp: scanTime,
      type: 'boarding',
    }));
  }

  private buildAlerts(): Alert[] {
    const now = Date.now();
    const alerts: Alert[] = [];
    for (const bus of this.buses) {
      if (bus.phase === 'driving' && bus.delayed) {
        alerts.push({
          id: `alert-delay-${bus.seed.id}`,
          type: 'DELAY',
          busId: bus.seed.id,
          busNumber: bus.seed.number,
          severity: 'HIGH',
          message: `${bus.seed.number} accuse du retard sur la ligne ${bus.seed.route.fromZone}.`,
          timestamp: now,
        });
      }
      const missed = bus.seed.students.length - bus.scanned.size;
      if (bus.status === BusLiveStatus.ARRIVED && missed > 0) {
        alerts.push({
          id: `alert-unscanned-${bus.seed.id}`,
          type: 'UNSCANNED_CHILD',
          busId: bus.seed.id,
          busNumber: bus.seed.number,
          severity: 'MEDIUM',
          message: `${bus.seed.number} : ${missed} élève(s) non ramassé(s) sur cette tournée.`,
          timestamp: now,
        });
      }
    }
    return alerts;
  }

  // --- Émetteurs ----------------------------------------------------------

  private emitBuses(): void {
    const payload = this.buses.map((bus) => this.toRealtime(bus));
    this.busListeners.forEach((cb) => cb(payload));
  }

  private emitAlerts(): void {
    const alerts = this.buildAlerts();
    const signature = alerts.map((a) => `${a.id}:${a.severity}`).join('|');
    if (signature === this.lastAlertSignature) return;
    this.lastAlertSignature = signature;
    this.alertListeners.forEach((cb) => cb(alerts));
  }

  private emitAttendance(): void {
    for (const sub of this.attendanceSubs) {
      const bus = this.buses.find((b) => b.seed.id === sub.busId);
      if (!bus) continue;
      if (bus.scannedVersion === sub.lastVersion) continue;
      sub.lastVersion = bus.scannedVersion;
      sub.cb(this.attendanceFor(bus, sub.date));
    }
  }

  private emitCourses(): void {
    this.courseListeners.forEach((cb) => cb([...this.courseHistory]));
  }

  // --- API publique (abonnements façon Firestore) -------------------------

  subscribeBuses(cb: Listener<BusRealtimeData[]>): () => void {
    this.ensureStarted();
    this.busListeners.add(cb);
    cb(this.buses.map((bus) => this.toRealtime(bus)));
    return () => this.busListeners.delete(cb);
  }

  subscribeAlerts(cb: Listener<Alert[]>): () => void {
    this.ensureStarted();
    this.alertListeners.add(cb);
    cb(this.buildAlerts());
    return () => this.alertListeners.delete(cb);
  }

  subscribeAttendance(busId: string, date: string, cb: Listener<AttendanceRecord[]>): () => void {
    this.ensureStarted();
    const sub = { busId, date, cb, lastVersion: -1 };
    this.attendanceSubs.push(sub);
    const bus = this.buses.find((b) => b.seed.id === busId);
    cb(bus ? this.attendanceFor(bus, date) : []);
    if (bus) sub.lastVersion = bus.scannedVersion;
    return () => {
      this.attendanceSubs = this.attendanceSubs.filter((s) => s !== sub);
    };
  }

  subscribeCourseHistory(cb: Listener<CourseHistoryEntry[]>): () => void {
    this.ensureStarted();
    this.courseListeners.add(cb);
    cb([...this.courseHistory]);
    return () => this.courseListeners.delete(cb);
  }

  getStudents(busId: string): Student[] {
    const seed = DEMO_BUSES.find((b) => b.id === busId);
    if (!seed) return [];
    return seed.students.map((student) => this.studentSeedToStudent(seed, student));
  }

  getStudentsByIds(ids: string[]): Student[] {
    if (!ids.length) return [];
    const wanted = new Set(ids);
    const result: Student[] = [];
    for (const seed of DEMO_BUSES) {
      for (const student of seed.students) {
        if (wanted.has(student.id)) {
          result.push(this.studentSeedToStudent(seed, student));
        }
      }
    }
    return result;
  }

  getNextStudent(busId: string): NextStudentInfo | null {
    this.ensureStarted();
    const bus = this.buses.find((b) => b.seed.id === busId);
    if (!bus) return null;
    const ordered = orderedStudents(bus.seed);
    const index = ordered.findIndex((s) => !bus.scanned.has(s.id));
    if (index === -1) return null;
    const student = ordered[index];
    return {
      studentId: student.id,
      studentName: `${student.firstName} ${student.lastName}`,
      stopOrder: index + 1,
    };
  }

  getLatestGpsTimestamp(busId: string): number | null {
    this.ensureStarted();
    const bus = this.buses.find((b) => b.seed.id === busId);
    return bus?.arrivedAt ?? bus?.stoppedAt ?? null;
  }

  getCourseHistory(): CourseHistoryEntry[] {
    this.ensureStarted();
    return [...this.courseHistory];
  }

  /**
   * Échantillonne la trajectoire prévue (courbe de Bézier) d'un bus de son
   * point de départ jusqu'à l'école. Sert à dessiner la ligne pointillée
   * "où va ce bus" sur la carte du mode démo.
   */
  getTrajectory(busId: string, samples = 32): LatLng[] {
    const seed = DEMO_BUSES.find((b) => b.id === busId);
    if (!seed) return [];
    const control = controlPoint(seed.start, DEMO_SCHOOL_LOCATION, seed.curve);
    const points: LatLng[] = [];
    for (let i = 0; i <= samples; i++) {
      const t = i / samples;
      points.push(bezier(seed.start, control, DEMO_SCHOOL_LOCATION, t));
    }
    return points;
  }
}

/** Instance unique partagée par toute l'application en mode démo. */
export const demoSim = new DemoSimulation();
export { todayStr as demoTodayStr };
