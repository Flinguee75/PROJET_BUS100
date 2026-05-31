/**
 * Page God View - Tour de Contrôle (Management by Exception)
 * Carte temps réel + Sidebar alertes critiques uniquement
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@/styles/godview.css';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { AlertsSidebar } from '@/components/AlertsSidebar';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSchoolBuses } from '@/hooks/useSchool';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { BusLiveStatus, type BusRealtimeData } from '@/types/realtime';
import { watchBusAttendance, getBusStudents, getStudentsByIds } from '@/services/students.firestore';
import { generateBusMarkerHTML, calculateHeadingToSchool } from '@/components/godview/BusMarkerWithAura';
import { generateSimplifiedBusPopupHTML, generateParkingPopupHTML } from '@/components/godview/SimplifiedBusPopup';
import { generateStudentStopMarkerHTML, generateStudentStopPopupHTML } from '@/components/godview/StudentStopMarker';
import { getNextStudent } from '@/services/bus.api';
import { getLatestGpsHistoryTimestamp } from '@/services/gps_history.firestore';
import { watchRecentCourseHistory } from '@/services/courseHistory.firestore';
 
import { GpsKalmanFilter } from '@/utils/gpsKalmanFilter';
import { computeAnimationPlan } from '@/utils/animationPlan';
import { IS_DEMO, demoSim } from '@/demo';
import { DEMO_BUSES } from '@/demo/seed';
import { splitPolylineAt } from '@/demo/polyline';
import { DemoControls } from '@/components/godview/DemoControls';

type ClassifiedBus = BusRealtimeData & {
  classification: 'stationed' | 'deployed';
  distanceFromSchool: number | null;
  displayPosition: { lat: number; lng: number } | null;
  hasArrived?: boolean; // Flag pour indiquer si le bus est arrivé
};

interface ParkingZone {
  id: string;
  schoolId: string;
  location: { lat: number; lng: number };
  stationedBuses: ClassifiedBus[];
  count: number;
}

interface StudentWithLocation {
  id: string;
  firstName: string;
  lastName: string;
  grade: string;
  busId: string | null;
  location: {
    lat: number;
    lng: number;
    address: string;
    notes?: string;
  };
  order: number;
  isScanned: boolean;
}

// Timeout pour considérer un bus comme "en route" même sans GPS récent (2 minutes)
const GPS_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

const formatLocalDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const isBusEnCourse = (bus: BusRealtimeData): boolean => {
  // Si le statut est explicitement EN_ROUTE ou DELAYED, le bus est en course
  if (bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED) {
    return true;
  }

  // NOUVEAU : Si le bus est STOPPED avec stoppedAt récent (< 15 min), le considérer comme en cours
  // pour qu'il soit affiché avec le statut ARRIVED (calculé dans computeDisplayStatus)
  if (bus.liveStatus === BusLiveStatus.STOPPED && bus.stoppedAt) {
    // Convertir stoppedAt en timestamp (peut être string ou number ou Firestore Timestamp)
    let stoppedAtTimestamp: number;

    if (typeof bus.stoppedAt === 'string') {
      stoppedAtTimestamp = new Date(bus.stoppedAt).getTime();
    } else if (typeof bus.stoppedAt === 'object' && bus.stoppedAt !== null && 'seconds' in bus.stoppedAt) {
      stoppedAtTimestamp = (bus.stoppedAt as any).seconds * 1000;
    } else if (typeof bus.stoppedAt === 'number') {
      stoppedAtTimestamp = bus.stoppedAt;
    } else {
      console.error(`⚠️ [isBusEnCourse] Bus ${bus.number}: Format stoppedAt inconnu`, bus.stoppedAt);
      return false;
    }

    const elapsed = Date.now() - stoppedAtTimestamp;
    const ARRIVED_DISPLAY_DURATION_MS = 15 * 60 * 1000;

    if (elapsed < ARRIVED_DISPLAY_DURATION_MS) {
      return true; // Bus arrêté récemment → afficher comme ARRIVED
    }
    return false; // Bus arrêté depuis > 15 min → vraiment arrêté
  }

  // Un bus marqué ARRIVED est considéré en cours pour l'afficher
  if (bus.liveStatus === BusLiveStatus.ARRIVED) {
    return true;
  }

  // Un bus marqué STOPPED sans stoppedAt est considéré hors course
  if (bus.liveStatus === BusLiveStatus.STOPPED) {
    return false;
  }
  
  // Si le bus n'a pas de position GPS, utiliser lastUpdate comme fallback
  if (!bus.currentPosition || !bus.currentPosition.timestamp) {
    // Vérifier si le bus avait une mise à jour récente (dans les 2 dernières minutes)
    if (bus.lastUpdate) {
      const lastUpdateTime = typeof bus.lastUpdate === 'string' 
        ? new Date(bus.lastUpdate).getTime() 
        : (typeof bus.lastUpdate === 'number' ? bus.lastUpdate : null);
      
      if (lastUpdateTime) {
        const timeSinceLastUpdate = Date.now() - lastUpdateTime;
        
        // #region agent log
        // #endregion
        
        // Si la dernière mise à jour est récente ET que le statut n'est pas ARRIVED,
        // on considère le bus comme toujours en course (protection contre arrêt temporaire GPS)
        if (timeSinceLastUpdate < GPS_TIMEOUT_MS) {
          return true;
        }
      }
    }
    return false;
  }
  
  // Si le bus avait une position GPS récente (GPS reçu il y a moins de GPS_TIMEOUT_MS),
  // on le considère toujours comme en course même si le statut a changé
  // Cela gère le cas où le mobile arrête d'envoyer des GPS quand le bus est immobile
  // Le backend peut mettre le statut à STOPPED quand il n'y a plus de GPS, mais si le GPS est récent,
  // c'est juste que le bus est immobile temporairement, pas qu'il a terminé sa course
  const timeSinceLastGPS = Date.now() - bus.currentPosition.timestamp;
  const wasRecentlyEnRoute = timeSinceLastGPS < GPS_TIMEOUT_MS;
  
  // #region agent log
  // #endregion
  
  // Si le bus avait une position GPS récente ET qu'il n'est pas explicitement arrivé,
  // on le considère toujours comme en course (même si le statut est STOPPED ou IDLE)
  // car cela signifie que le bus est juste immobile temporairement
  if (wasRecentlyEnRoute) {
    return true;
  }
  
  return false;
};

const isBusAtSchool = (bus: BusRealtimeData): boolean =>
  bus.liveStatus === BusLiveStatus.ARRIVED ||
  bus.liveStatus === BusLiveStatus.STOPPED ||
  bus.liveStatus === BusLiveStatus.IDLE;

const isBusStationed = (bus: BusRealtimeData): boolean =>
  !isBusEnCourse(bus) &&
  (bus.liveStatus === BusLiveStatus.STOPPED ||
    bus.liveStatus === BusLiveStatus.IDLE ||
    bus.liveStatus === BusLiveStatus.ARRIVED);

// Token Mapbox depuis les variables d'environnement
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Centre par défaut (localisation de l'école)
const ABIDJAN_CENTER: [number, number] = [-3.953921037595442, 5.351860986707333];
const STATIONED_DISTANCE_THRESHOLD_METERS = 150;


const calculateDistanceMeters = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371000; // rayon de la Terre en mètres
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const getBusUpdateTimestamp = (bus: BusRealtimeData): number => {
  const positionTs = bus.currentPosition?.timestamp;
  if (typeof positionTs === 'number') {
    return positionTs < 1e12 ? positionTs * 1000 : positionTs;
  }
  const lastUpdate = bus.lastUpdate;
  if (typeof lastUpdate === 'number') {
    return lastUpdate;
  }
  if (typeof lastUpdate === 'string') {
    const parsed = Date.parse(lastUpdate);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return 0;
};

const dedupeBuses = (buses: BusRealtimeData[]): BusRealtimeData[] => {
  const byKey = new Map<string, BusRealtimeData>();
  buses.forEach((bus) => {
    const key = bus.number || bus.plateNumber || bus.id;
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, bus);
      return;
    }
    const existingTs = getBusUpdateTimestamp(existing);
    const candidateTs = getBusUpdateTimestamp(bus);
    if (candidateTs >= existingTs) {
      byKey.set(key, bus);
    }
  });
  return Array.from(byKey.values());
};

const classifyBus = (
  bus: BusRealtimeData,
  schoolLocation?: { lat: number; lng: number }
): { classification: 'stationed' | 'deployed'; distance: number | null } => {
  if (!schoolLocation || !bus.currentPosition) {
    const defaultClassification =
      bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED
        ? 'deployed'
        : 'stationed';
    return { classification: defaultClassification, distance: null };
  }

  const distance = calculateDistanceMeters(
    bus.currentPosition.lat,
    bus.currentPosition.lng,
    schoolLocation.lat,
    schoolLocation.lng
  );
  const isNearSchool = distance <= STATIONED_DISTANCE_THRESHOLD_METERS;
  const stationaryStatus =
    bus.liveStatus === BusLiveStatus.IDLE ||
    bus.liveStatus === BusLiveStatus.STOPPED ||
    bus.liveStatus === BusLiveStatus.ARRIVED ||
    !bus.isActive;

  const classification: 'stationed' | 'deployed' =
    (stationaryStatus && (isNearSchool || bus.liveStatus === BusLiveStatus.STOPPED))
      ? 'stationed'
      : 'deployed';

  return { classification, distance };
};

export const GodViewPage = () => {
  const { user, school, schoolLoading, schoolError } = useAuthContext();
  const schoolId = user?.schoolId ?? null;
  const {
    buses: schoolBuses,
    isLoading: schoolBusesLoading,
    error: schoolBusesError,
  } = useSchoolBuses(schoolId);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const markerAnimations = useRef<Map<string, number>>(new Map());
  const popups = useRef<Map<string, mapboxgl.Popup>>(new Map());
  const schoolMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const parkingZoneMarker = useRef<mapboxgl.Marker | null>(null);
  const parkingZonePopup = useRef<mapboxgl.Popup | null>(null);
  const isMapInteracting = useRef(false);
  const markerStateRef = useRef<Map<string, { lat: number; lng: number; heading: number }>>(new Map());
  const markerMotionRef = useRef<
    Map<string, { lat: number; lng: number; timestamp: number | null }>
  >(new Map());
  // Cibles différées : positions reçues pendant un pan/zoom, à traiter à moveend.
  const pendingTargetsRef = useRef<
    Map<string, { lat: number; lng: number; timestamp: number | null; bus: ClassifiedBus }>
  >(new Map());
  const flushPendingTargetsRef = useRef<(() => void) | null>(null);
  const initialCenterRef = useRef<[number, number]>(
    school?.location ? [school.location.lng, school.location.lat] : ABIDJAN_CENTER
  );

  // Filtres Kalman pour lissage GPS (un par bus)
  const kalmanFilters = useRef<Map<string, GpsKalmanFilter>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const { alerts: realtimeAlerts, error: alertsError } = useRealtimeAlerts();
  
  // Stocker les comptages d'élèves pour chaque bus
  const [studentsCounts, setStudentsCounts] = useState<
    Record<string, { scanned: number; unscanned: number; total: number }>
  >({});

  const [scannedStudentIdsByBus, setScannedStudentIdsByBus] = useState<Record<string, string[]>>({});
  const scannedStudentIdsRef = useRef<Record<string, string[]>>({});
  const [notifications, setNotifications] = useState<
    Array<{ id: number; message: string; type: 'start' | 'scan' | 'end' }>
  >([]);
  const notificationIdRef = useRef(0);
  
  // State pour tracker le popup actuellement ouvert (pour auto-refresh)
  const [activePopupBusId, setActivePopupBusId] = useState<string | null>(null);

  const dedupedSchoolBuses = useMemo(() => dedupeBuses(schoolBuses), [schoolBuses]);

  // Suivre l'état local du statut pour éviter le flickering
  const localStatusRef = useRef<Map<string, BusLiveStatus>>(new Map());
  const previousBusStatusRef = useRef<Map<string, BusLiveStatus | null>>(new Map());
  const previousTripStartRef = useRef<Map<string, number | null>>(new Map());
  const previousScannedCountRef = useRef<Map<string, number>>(new Map());

  // State dummy pour forcer re-render périodique (rafraîchir affichage ARRIVED → STOPPED)
  const [, setForceUpdate] = useState(0);

  // État Pause/Reset/Vitesse du moteur de simulation démo (uniquement IS_DEMO).
  const [demoPaused, setDemoPaused] = useState<boolean>(false);
  const DEMO_SPEED_CYCLE = [0.5, 1, 2, 5] as const;
  const [demoSpeed, setDemoSpeed] = useState<number>(1);

  const handleTogglePauseDemo = useCallback(() => {
    if (demoSim.isPaused()) {
      demoSim.resume();
      setDemoPaused(false);
    } else {
      demoSim.pause();
      setDemoPaused(true);
    }
  }, []);

  const handleResetDemo = useCallback(() => {
    demoSim.reset();
    demoSim.setSpeed(1);
    setDemoSpeed(1);
    setDemoPaused(demoSim.isPaused());
  }, []);

  const handleCycleSpeedDemo = useCallback(() => {
    setDemoSpeed((current) => {
      const idx = DEMO_SPEED_CYCLE.indexOf(current as typeof DEMO_SPEED_CYCLE[number]);
      const next = DEMO_SPEED_CYCLE[(idx + 1) % DEMO_SPEED_CYCLE.length];
      demoSim.setSpeed(next);
      return next;
    });
  }, []);

  // Constante de durée pour affichage ARRIVED (15 minutes)
  const ARRIVED_DISPLAY_DURATION_MS = 15 * 60 * 1000;

  // ===== États pour les arrêts d'élèves =====
  // Toggle pour afficher/masquer les arrêts d'élèves
  const [showStudentStops, setShowStudentStops] = useState<boolean>(false);

  // Bus actuellement sélectionné (pour afficher ses arrêts)
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);
  const [trackedBusId, setTrackedBusId] = useState<string | null>(null);
  const trackedBusIdRef = useRef<string | null>(null);

  // Données des élèves avec leur emplacement
  const [busStudents, setBusStudents] = useState<StudentWithLocation[]>([]);

  // Chargement des données d'élèves
  const [stopsSnapshot, setStopsSnapshot] = useState<{ busId: string; tripType: string | null } | null>(null);
  const [gpsHistoryByBus, setGpsHistoryByBus] = useState<Record<string, number>>({});
  const gpsHistoryFetchRef = useRef<Set<string>>(new Set());
  const pendingStudentFocusRef = useRef<{ busId: string; studentId: string } | null>(null);
  const singleStudentOnlyRef = useRef(false);
  const [courseStatsByBus, setCourseStatsByBus] = useState<Record<string, { scanned: number; total: number; unscanned: number }>>({});
  const [courseRosterByBus, setCourseRosterByBus] = useState<Record<string, { scannedNames: string[]; missedNames: string[] }>>({});
  const [courseTripTypeByBus, setCourseTripTypeByBus] = useState<Record<string, string>>({});
  const courseRosterFetchRef = useRef<Map<string, string>>(new Map());
  const [stopsBusId, setStopsBusId] = useState<string | null>(null);
  const [stopsTripType, setStopsTripType] = useState<string | null>(null);

  // Ref pour les marqueurs d'arrêts d'élèves (séparés des marqueurs de bus)
  const studentMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const studentPopups = useRef<Map<string, mapboxgl.Popup>>(new Map());
  const processedBusesRef = useRef<ClassifiedBus[]>([]);

  const addNotification = useCallback(
    (message: string, type: 'start' | 'scan' | 'end') => {
      const id = ++notificationIdRef.current;
      setNotifications((prev) => [...prev, { id, message, type }].slice(-3));
      setTimeout(() => {
        setNotifications((prev) => prev.filter((item) => item.id !== id));
      }, 5000);
    },
    []
  );

  // Fonction qui détermine le statut visuel à afficher
  // Bus STOPPED depuis < 15 min → afficher comme ARRIVED
  // Bus STOPPED depuis >= 15 min → afficher comme STOPPED
  const computeDisplayStatus = useCallback((bus: BusRealtimeData): BusLiveStatus => {
    const currentStatus = bus.liveStatus;

    // Si le statut est null ou n'est pas STOPPED, retourner le statut tel quel
    if (currentStatus !== BusLiveStatus.STOPPED) {
      return currentStatus ?? BusLiveStatus.IDLE;
    }

    // Lire stoppedAt depuis Firestore (source de vérité backend)
    const stoppedAt = bus.stoppedAt;

    // Si pas de timestamp, le bus était déjà STOPPED avant la transition → afficher STOPPED
    if (!stoppedAt) {
      return BusLiveStatus.STOPPED;
    }

    // Convertir stoppedAt en timestamp si c'est une string ou un objet Firestore Timestamp
    let stoppedAtTimestamp: number;

    if (typeof stoppedAt === 'string') {
      stoppedAtTimestamp = new Date(stoppedAt).getTime();
    } else if (typeof stoppedAt === 'object' && stoppedAt !== null && 'seconds' in stoppedAt) {
      // Firestore Timestamp format
      stoppedAtTimestamp = (stoppedAt as any).seconds * 1000;
    } else if (typeof stoppedAt === 'number') {
      stoppedAtTimestamp = stoppedAt;
    } else {
      console.error(`⚠️ [DISPLAY STATUS] Bus ${bus.number}: Format stoppedAt inconnu`, stoppedAt);
      return BusLiveStatus.STOPPED;
    }

    // Calculer le temps écoulé depuis l'arrêt
    const elapsed = Date.now() - stoppedAtTimestamp;

    return elapsed < ARRIVED_DISPLAY_DURATION_MS
      ? BusLiveStatus.ARRIVED
      : BusLiveStatus.STOPPED;
  }, [ARRIVED_DISPLAY_DURATION_MS]);

  const processedBuses: ClassifiedBus[] = useMemo(() => {
    return dedupedSchoolBuses
      .filter((bus) => (isBusEnCourse(bus) || isBusAtSchool(bus)) && bus.isActive)
      .map((bus) => {
        const { classification, distance } = classifyBus(bus, school?.location);
        const effectiveLiveStatus = localStatusRef.current.get(bus.id) ?? computeDisplayStatus(bus);

        let displayPosition: { lat: number; lng: number } | null = null;
        let hasArrived = false;

        if (effectiveLiveStatus === BusLiveStatus.ARRIVED && school?.location) {
          displayPosition = {
            lat: school.location.lat,
            lng: school.location.lng,
          };
          hasArrived = true;
        } else if (bus.currentPosition) {
          displayPosition = {
            lat: bus.currentPosition.lat,
            lng: bus.currentPosition.lng,
          };
        } else if (school?.location) {
          displayPosition = {
            lat: school.location.lat,
            lng: school.location.lng,
          };
        } else {
          displayPosition = { lat: ABIDJAN_CENTER[1], lng: ABIDJAN_CENTER[0] };
        }


        return {
          ...bus,
          liveStatus: effectiveLiveStatus,
          classification,
          distanceFromSchool: distance,
          displayPosition,
          hasArrived,
        };
      });
  }, [dedupedSchoolBuses, school]);

  useEffect(() => {
    trackedBusIdRef.current = trackedBusId;
  }, [trackedBusId]);

  useEffect(() => {
    if (!trackedBusId) return;
    const bus = processedBuses.find((candidate) => candidate.id === trackedBusId);
    if (!bus || (bus.liveStatus !== BusLiveStatus.EN_ROUTE && bus.liveStatus !== BusLiveStatus.DELAYED)) {
      setTrackedBusId(null);
    }
  }, [processedBuses, trackedBusId]);

  const stationedBuses = useMemo(() => {
    return dedupedSchoolBuses.filter((bus) => bus.isActive && isBusStationed(bus));
  }, [dedupedSchoolBuses]);

  // Compute parking zone for stationed buses
  const parkingZone = useMemo<ParkingZone | null>(() => {
    if (!school?.location || stationedBuses.length === 0) {
      return null;
    }

    // Filter processedBuses to get only stationed buses
    const stationedProcessedBuses = processedBuses.filter(
      (bus) => bus.classification === 'stationed'
    );

    if (stationedProcessedBuses.length === 0) {
      return null;
    }

    return {
      id: `parking_zone_${school.id}`,
      schoolId: school.id,
      location: school.location,
      stationedBuses: stationedProcessedBuses,
      count: stationedProcessedBuses.length,
    };
  }, [school, stationedBuses, processedBuses]);

  const schoolAlerts = useMemo(() => {
    if (alertsError) return [];
    const allowedBusIds = new Set(processedBuses.map((bus) => bus.id));
    return realtimeAlerts.filter((alert) => allowedBusIds.has(alert.busId));
  }, [alertsError, processedBuses, realtimeAlerts]);

  const isLoading = schoolLoading || schoolBusesLoading;
  const errorMessage = schoolError || schoolBusesError || null;
  const hasRealtimeError = Boolean(schoolError || schoolBusesError || alertsError);
  // Le badge ne passe en rouge que si le serveur crash vraiment, pas à cause du timeout
  const isRealtimeConnected = !hasRealtimeError;

  useEffect(() => {
    if (alertsError) {
      console.error('❌ Impossible de charger les alertes temps réel:', alertsError);
    }
  }, [alertsError]);


  useEffect(() => {
    processedBusesRef.current = processedBuses;
  }, [processedBuses]);

  useEffect(() => {
    scannedStudentIdsRef.current = scannedStudentIdsByBus;
  }, [scannedStudentIdsByBus]);

  useEffect(() => {
    processedBuses.forEach((bus) => {
      const previousStatus = previousBusStatusRef.current.get(bus.id);
      if (previousStatus === undefined) {
        previousBusStatusRef.current.set(bus.id, bus.liveStatus ?? null);
      } else if (previousStatus !== bus.liveStatus) {
        if (bus.liveStatus === BusLiveStatus.EN_ROUTE) {
          addNotification(`Course démarrée • ${bus.number}`, 'start');
        } else if (bus.liveStatus === BusLiveStatus.ARRIVED) {
          addNotification(`Course terminée • ${bus.number}`, 'end');
        }
        previousBusStatusRef.current.set(bus.id, bus.liveStatus ?? null);
      }

      const previousTripStart = previousTripStartRef.current.get(bus.id);
      if (previousTripStart === undefined) {
        previousTripStartRef.current.set(bus.id, bus.tripStartTime ?? null);
      } else if (bus.tripStartTime && previousTripStart !== bus.tripStartTime) {
        addNotification(`Course démarrée • ${bus.number}`, 'start');
        previousTripStartRef.current.set(bus.id, bus.tripStartTime);
      }
    });
  }, [processedBuses, addNotification]);

  useEffect(() => {
    processedBuses.forEach((bus) => {
      const counts = studentsCounts[bus.id];
      if (!counts) return;

      const previousCount = previousScannedCountRef.current.get(bus.id);
      if (previousCount === undefined) {
        previousScannedCountRef.current.set(bus.id, counts.scanned);
        return;
      }

      if (counts.scanned > previousCount) {
        const delta = counts.scanned - previousCount;
        const label = delta > 1 ? `${delta} élèves scannés` : '1 élève scanné';
        addNotification(`${label} • ${bus.number}`, 'scan');
      }

      previousScannedCountRef.current.set(bus.id, counts.scanned);
    });
  }, [processedBuses, studentsCounts, addNotification]);

  // Nettoyer périodiquement les bus qui ne sont plus dans la liste (prévenir fuites mémoire)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const currentBusIds = new Set(dedupedSchoolBuses.map((bus) => bus.id));

      // Nettoyer localStatusRef
      localStatusRef.current.forEach((_, busId) => {
        if (!currentBusIds.has(busId)) {
          localStatusRef.current.delete(busId);
        }
      });
      markerStateRef.current.forEach((_, busId) => {
        if (!currentBusIds.has(busId)) {
          markerStateRef.current.delete(busId);
        }
      });
      // Nettoyer filtres Kalman des bus disparus
      kalmanFilters.current.forEach((_, busId) => {
        if (!currentBusIds.has(busId)) {
          kalmanFilters.current.delete(busId);
        }
      });
    }, 60000); // Nettoyage toutes les 60 secondes

    return () => clearInterval(cleanupInterval);
  }, [dedupedSchoolBuses]);

  // Force re-render toutes les 30 secondes pour actualiser l'affichage ARRIVED → STOPPED
  useEffect(() => {
    const interval = setInterval(() => {
      setForceUpdate(prev => prev + 1);
    }, 30000); // 30 secondes

    return () => clearInterval(interval);
  }, []);

  // Initialiser la carte Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      console.error('Token Mapbox manquant !');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Créer la carte centrée sur l'école de l'utilisateur (fallback Abidjan)
    const initialCenter = initialCenterRef.current;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11', // Style clair vectoriel - fond blanc avec routes grises
      center: initialCenter,
      zoom: 13,
      minZoom: 11,
      maxZoom: 18,
      dragPan: true,
      scrollZoom: true,
      boxZoom: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
      keyboard: true,
      touchPitch: false,
      dragRotate: false,
    });

    const handleInteractionStart = () => {
      isMapInteracting.current = true;
      markerAnimations.current.forEach((rafId) => cancelAnimationFrame(rafId));
      markerAnimations.current.clear();
    };

    const handleInteractionEnd = () => {
      isMapInteracting.current = false;
      // Reprendre les animations différées pendant le pan/zoom : chaque bus
      // anime maintenant depuis sa position visuelle figée vers la cible la
      // plus récente reçue pendant l'interaction.
      flushPendingTargetsRef.current?.();
    };

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('movestart', handleInteractionStart);
    map.current.on('moveend', handleInteractionEnd);
    map.current.on('zoomstart', handleInteractionStart);
    map.current.on('zoomend', handleInteractionEnd);
    map.current.on('dragstart', handleInteractionStart);
    map.current.on('dragend', handleInteractionEnd);

    // Ajouter les contrôles de navigation
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.off('movestart', handleInteractionStart);
        map.current.off('moveend', handleInteractionEnd);
        map.current.off('zoomstart', handleInteractionStart);
        map.current.off('zoomend', handleInteractionEnd);
        map.current.off('dragstart', handleInteractionStart);
        map.current.off('dragend', handleInteractionEnd);
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialCenterRef]);

  // Redimensionner la carte quand le conteneur change de taille (ex: redimensionnement des sidebars)
  useEffect(() => {
    if (!mapContainer.current || !map.current) return;

    const resizeObserver = new ResizeObserver(() => {
      if (map.current) {
        map.current.resize();
      }
    });

    resizeObserver.observe(mapContainer.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [mapLoaded]); // Re-run quand la carte est chargée

  useEffect(() => {
    if (!map.current || !mapLoaded || !school?.location) return;

    map.current.flyTo({
      center: [school.location.lng, school.location.lat],
      zoom: 13,
      speed: 0.8,
      curve: 1,
      easing: (t) => t,
    });
  }, [school, mapLoaded]);
  
  // Ajouter un marqueur fixe pour représenter l'école
  useEffect(() => {
    if (!map.current || !mapLoaded || !school?.location) return;

    const schoolMarkerHTML = `
      <div class="bg-white rounded-full border-4 border-primary-500 shadow-xl p-3 flex items-center justify-center w-12 h-12">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor" class="text-primary-600">
          <path d="M12 3l9 6-9 6-9-6 9-6zm0 8.485L6 8.25v8.935A2.815 2.815 0 0 0 8.815 20h6.37A2.815 2.815 0 0 0 18 17.185V8.25l-6 3.235z"/>
        </svg>
      </div>
    `;

    if (schoolMarkerRef.current) {
      const existingElement = schoolMarkerRef.current.getElement();
      existingElement.innerHTML = schoolMarkerHTML;
      schoolMarkerRef.current.setLngLat([school.location.lng, school.location.lat]);
    } else {
      const el = document.createElement('div');
      el.className = 'school-marker';
      el.innerHTML = schoolMarkerHTML;

      schoolMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([school.location.lng, school.location.lat])
        .addTo(map.current);
    }

    return () => {
      if (schoolMarkerRef.current) {
        schoolMarkerRef.current.remove();
        schoolMarkerRef.current = null;
      }
    };
  }, [school, mapLoaded]);

  // En mode démo, dessiner les trajectoires Bézier prévues de chaque bus
  // en pointillé discret. Aide à comprendre d'un coup d'œil "d'où vient ce
  // bus / où il va". Pas affiché en mode réel (les routes planifiées ne
  // sont pas stockées sous cette forme).
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapLoaded || !IS_DEMO) return;

    const SOURCE_ID = 'demo-trajectories';
    const LAYER_ID = 'demo-trajectories-layer';

    const data = {
      type: 'FeatureCollection' as const,
      features: DEMO_BUSES.map((seed) => ({
        type: 'Feature' as const,
        properties: { busId: seed.id },
        geometry: {
          type: 'LineString' as const,
          coordinates: demoSim.getRoutePolyline(seed.id).map((p) => [p.lng, p.lat]),
        },
      })),
    };

    const existing = mapInstance.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource | undefined;
    if (existing) {
      existing.setData(data);
    } else {
      mapInstance.addSource(SOURCE_ID, { type: 'geojson', data });
      mapInstance.addLayer({
        id: LAYER_ID,
        type: 'line',
        source: SOURCE_ID,
        paint: {
          'line-color': '#94a3b8',
          'line-width': 1.5,
          'line-dasharray': [2, 3],
          'line-opacity': 0.65,
        },
      });
    }

    return () => {
      if (mapInstance.getLayer(LAYER_ID)) mapInstance.removeLayer(LAYER_ID);
      if (mapInstance.getSource(SOURCE_ID)) mapInstance.removeSource(SOURCE_ID);
    };
  }, [mapLoaded]);

  // Afficher la route du bus sélectionné (deux segments : parcouru + restant)
  // Déclenché par l'ouverture du popup (activePopupBusId).
  useEffect(() => {
    const mapInstance = map.current;
    if (!mapInstance || !mapLoaded || !IS_DEMO) return;

    const TRAVELED_SOURCE = 'demo-route-traveled';
    const REMAINING_SOURCE = 'demo-route-remaining';
    const TRAVELED_LAYER = 'demo-route-traveled-layer';
    const REMAINING_LAYER = 'demo-route-remaining-layer';

    const emptyCollection = () =>
      ({ type: 'FeatureCollection' as const, features: [] }) as GeoJSON.FeatureCollection;

    // Créer les sources/layers une seule fois et les réutiliser ensuite.
    if (!mapInstance.getSource(TRAVELED_SOURCE)) {
      mapInstance.addSource(TRAVELED_SOURCE, { type: 'geojson', data: emptyCollection() });
      // Portion parcourue : tirets discrets pour signifier "chemin déjà effectué"
      mapInstance.addLayer({
        id: TRAVELED_LAYER,
        type: 'line',
        source: TRAVELED_SOURCE,
        layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#94a3b8',
          'line-width': 2.5,
          'line-opacity': 0.5,
          'line-dasharray': [3, 4],
        },
      });
    }
    if (!mapInstance.getSource(REMAINING_SOURCE)) {
      mapInstance.addSource(REMAINING_SOURCE, { type: 'geojson', data: emptyCollection() });
      // Portion restante : ligne pleine épaisse pour "où va le bus"
      mapInstance.addLayer({
        id: REMAINING_LAYER,
        type: 'line',
        source: REMAINING_SOURCE,
        layout: { visibility: 'none', 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#3b82f6',
          'line-width': 6,
          'line-opacity': 0.92,
        },
      });
    }

    if (!activePopupBusId) {
      mapInstance.setLayoutProperty(TRAVELED_LAYER, 'visibility', 'none');
      mapInstance.setLayoutProperty(REMAINING_LAYER, 'visibility', 'none');
      return;
    }

    const polyline = demoSim.getRoutePolyline(activePopupBusId);
    if (polyline.length < 2) return;

    const progress = demoSim.getBusProgress(activePopupBusId);
    const { traveled, remaining } = splitPolylineAt(polyline, progress);

    (mapInstance.getSource(TRAVELED_SOURCE) as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: traveled.map((p) => [p.lng, p.lat]) },
      }],
    });

    (mapInstance.getSource(REMAINING_SOURCE) as mapboxgl.GeoJSONSource).setData({
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: remaining.map((p) => [p.lng, p.lat]) },
      }],
    });

    // Couleur du segment restant = couleur du marqueur du bus sélectionné.
    const bus = processedBuses.find((b) => b.id === activePopupBusId);
    const busColor =
      bus?.liveStatus === BusLiveStatus.DELAYED
        ? '#dc2626'
        : bus?.liveStatus === BusLiveStatus.ARRIVED
          ? '#22c55e'
          : '#3b82f6';

    mapInstance.setLayoutProperty(TRAVELED_LAYER, 'visibility', 'visible');
    mapInstance.setLayoutProperty(REMAINING_LAYER, 'visibility', 'visible');
    mapInstance.setPaintProperty(REMAINING_LAYER, 'line-color', busColor);

    // Ajuster la vue pour montrer toute la route sans que le popup la cache.
    // On attend que le flyTo précédent (déclenché par focusBusOnMap) soit terminé.
    const fitTimer = setTimeout(() => {
      if (!map.current) return;
      const lngs = polyline.map((p) => p.lng);
      const lats = polyline.map((p) => p.lat);
      const sw: [number, number] = [Math.min(...lngs), Math.min(...lats)];
      const ne: [number, number] = [Math.max(...lngs), Math.max(...lats)];
      map.current.fitBounds([sw, ne], {
        padding: {
          top: 120,    // laisser de la place au popup (s'ouvre au-dessus du marqueur)
          bottom: 80,
          left: 80,
          right: 80,
        },
        maxZoom: 14,
        duration: 900,
        essential: true,
      });
    }, 700); // après la fin du flyTo (600 ms dans focusBusOnMap)

    return () => clearTimeout(fitTimer);
  }, [activePopupBusId, mapLoaded, processedBuses]);

  // Déterminer la couleur du marqueur selon le statut
  const getMarkerColor = useCallback((bus: ClassifiedBus): string => {
    if (!bus.isActive) return '#64748b'; // Gris (inactif)

    if (bus.liveStatus === BusLiveStatus.ARRIVED) return '#22c55e'; // Vert (arrivé < 15 min)
    if (bus.liveStatus === BusLiveStatus.DELAYED) return '#dc2626'; // Rouge (retard)
    if (bus.classification === 'stationed') return '#22c55e'; // Vert (arrivé/à l'école)
    if (bus.liveStatus === BusLiveStatus.EN_ROUTE) return '#3b82f6'; // Bleu électrique (en cours) - meilleur contraste sur fond clair

    return '#3b82f6'; // Bleu par défaut
  }, []);

  const computeHeadingBetweenPoints = (
    from: { lat: number; lng: number },
    to: { lat: number; lng: number }
  ): number => {
    const dLng = to.lng - from.lng;
    const dLat = to.lat - from.lat;
    if (dLng * dLng + dLat * dLat < 1e-10) return 0;
    // Bearing géographique : 0° = Nord, sens horaire. atan2(dLng, dLat) est
    // la convention correcte — identique à polylineHeadingAt dans polyline.ts.
    let deg = (Math.atan2(dLng, dLat) * 180) / Math.PI;
    if (deg < 0) deg += 360;
    return deg;
  };

  const getMarkerRotation = useCallback(
    (bus: ClassifiedBus): number => {
      const speed = bus.currentPosition?.speed ?? 0;
      const previous = markerStateRef.current.get(bus.id);
      const currentPosition = bus.currentPosition ?? bus.displayPosition;

      if (!currentPosition) {
        return previous?.heading ?? 0;
      }

      let rotation = previous?.heading ?? 0;
      const hasMovement = speed >= 5;

      if (!hasMovement && previous) {
        rotation = previous.heading;
      } else if (hasMovement && previous) {
        const dx = currentPosition.lng - previous.lng;
        const dy = currentPosition.lat - previous.lat;
        if (dx * dx + dy * dy < 1e-10) {
          rotation = previous.heading;
        } else {
          rotation = computeHeadingBetweenPoints(previous, currentPosition);
        }
      } else if (hasMovement && typeof bus.currentPosition?.heading === 'number') {
        rotation = bus.currentPosition.heading;
      } else if (hasMovement && bus.displayPosition && school?.location) {
        rotation = calculateHeadingToSchool(bus.displayPosition, school.location);
      } else if (!previous && typeof bus.currentPosition?.heading === 'number') {
        rotation = bus.currentPosition.heading;
      } else if (!previous && bus.displayPosition && school?.location) {
        rotation = calculateHeadingToSchool(bus.displayPosition, school.location);
      }

      markerStateRef.current.set(bus.id, {
        lat: currentPosition.lat,
        lng: currentPosition.lng,
        heading: rotation,
      });

      return rotation;
    },
    [school]
  );

  // Créer le HTML du marqueur de zone de stationnement
  const createParkingZoneMarkerHTML = useCallback((count: number): string => {
    return `
      <div class="parking-icon-container">
        <svg class="parking-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M8 8h4a3 3 0 0 1 0 6H8V8z" />
          <line x1="8" y1="8" x2="8" y2="17" />
        </svg>
      </div>
      <div class="bus-count-badge">${count}</div>
    `;
  }, []);

  // Créer le HTML du marqueur avec flèche directionnelle + étiquette flottante
  const createMarkerHTML = useCallback((bus: ClassifiedBus): string => {
    const color = getMarkerColor(bus);
    const rotationAngle = getMarkerRotation(bus);

    const busAlerts = realtimeAlerts.filter(a => a.busId === bus.id);
    const hasAlert = busAlerts.length > 0;
    const alertSeverity = busAlerts.find(a => a.severity === 'HIGH') ? 'HIGH' : 'MEDIUM';

    const counts = studentsCounts[bus.id];

    return generateBusMarkerHTML({
      busNumber: bus.number,
      color,
      rotation: rotationAngle,
      hasAlert,
      alertSeverity,
      scannedCount: counts?.scanned,
      totalCount: counts?.total,
    });
  }, [getMarkerColor, getMarkerRotation, realtimeAlerts, studentsCounts]);

  // Compteurs de flotte (pour la sidebar)
  // Le badge "En course" affiche uniquement les bus avec statut EN_ROUTE explicite
  const fleetEnCourseCount = useMemo(
    () => dedupedSchoolBuses.filter((bus) => bus.liveStatus === BusLiveStatus.EN_ROUTE).length,
    [dedupedSchoolBuses]
  );
  const fleetAtSchoolCount = useMemo(
    () => dedupedSchoolBuses.filter((bus) => isBusStationed(bus)).length,
    [dedupedSchoolBuses]
  );

  // Agrégat des élèves à bord (somme des comptages de tous les bus suivis)
  const studentsAggregate = useMemo(
    () =>
      Object.values(studentsCounts).reduce(
        (acc, counts) => {
          acc.scanned += counts.scanned;
          acc.total += counts.total;
          return acc;
        },
        { scanned: 0, total: 0 }
      ),
    [studentsCounts]
  );

  // ===== Fonctions pour les arrêts d'élèves =====

  /**
   * Détermine le type de trajet actif pour un bus
   */
  const getActiveTripType = (bus: ClassifiedBus): string | null => {
    return bus.currentTrip?.tripType ?? bus.tripType ?? null;
  };

  /**
   * Mappe le type de trajet vers le champ location correspondant
   */
  const getTripLocationField = (tripType: string): 'morningPickup' | 'middayDropoff' | 'middayPickup' | 'eveningDropoff' | null => {
    const mapping: Record<string, 'morningPickup' | 'middayDropoff' | 'middayPickup' | 'eveningDropoff'> = {
      'morning_outbound': 'morningPickup',
      'midday_outbound': 'middayDropoff',
      'midday_return': 'middayPickup',
      'evening_return': 'eveningDropoff'
    };
    return mapping[tripType] || null;
  };

  const studentLocationFields: Array<'morningPickup' | 'middayDropoff' | 'middayPickup' | 'eveningDropoff'> = [
    'morningPickup',
    'middayDropoff',
    'middayPickup',
    'eveningDropoff',
  ];

  const getStudentStopColor = (status: 'pending' | 'scanned' | 'inactive'): string => {
    switch (status) {
      case 'scanned':
        return '#16a34a';
      case 'pending':
        return '#dc2626';
      case 'inactive':
      default:
        return '#64748b';
    }
  };

  /**
   * Nettoie tous les marqueurs d'arrêts d'élèves
   */
  const clearStudentMarkers = useCallback(() => {
    studentMarkers.current.forEach(marker => marker.remove());
    studentMarkers.current.clear();
    studentPopups.current.clear();
  }, []);

  const closeStudentPopups = useCallback((exceptKey?: string) => {
    studentPopups.current.forEach((popup, key) => {
      if (key !== exceptKey && popup.isOpen()) {
        popup.remove();
      }
    });
  }, []);

  /**
   * Crée les marqueurs d'arrêts d'élèves sur la carte
   */
  const createStudentMarkers = useCallback((students: StudentWithLocation[], busId: string) => {
    const mapInstance = map.current;
    if (!mapInstance || !mapLoaded) return;

    students.forEach(student => {
      const { location, order, isScanned } = student;
      const status = isScanned ? 'scanned' : 'pending';

      // Créer l'élément du marqueur
      const el = document.createElement('div');
      el.innerHTML = generateStudentStopMarkerHTML({ order, status });

      // Créer le popup
      const popup = new mapboxgl.Popup({
        offset: 20,
        closeButton: true,
        closeOnClick: false,
        maxWidth: '280px'
      }).setHTML(generateStudentStopPopupHTML({
        studentName: `${student.firstName} ${student.lastName}`,
        grade: student.grade,
        address: location.address,
        order,
        status
      }));

      const key = `student_${student.id}_${busId}`;

      // Créer le marqueur
      const marker = new mapboxgl.Marker({ element: el.firstElementChild as HTMLElement })
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(mapInstance);

      // Fermer les autres popups d'élèves quand on ouvre celui-ci
      const markerEl = marker.getElement();
      markerEl.addEventListener('click', () => closeStudentPopups(key));
      popup.on('open', () => closeStudentPopups(key));

      // Stocker la référence
      studentMarkers.current.set(key, marker);
      studentPopups.current.set(key, popup);

      if (
        pendingStudentFocusRef.current &&
        pendingStudentFocusRef.current.busId === busId &&
        pendingStudentFocusRef.current.studentId === student.id
      ) {
        closeStudentPopups(key);
        popup.addTo(mapInstance);
        mapInstance.flyTo({
          center: [location.lng, location.lat],
          zoom: Math.max(mapInstance.getZoom(), 16),
          speed: 0.9,
          curve: 1,
          easing: (t) => t,
          essential: true,
        });
        pendingStudentFocusRef.current = null;
      }
    });
  }, [mapLoaded, closeStudentPopups]);

  const resolveStudentLocation = useCallback((
    student: { locations?: Record<string, any> },
    tripType: string | null
  ) => {
    const locationSource = student.locations;
    const locationField = tripType ? getTripLocationField(tripType) : null;
    const resolvedField =
      locationField ??
      studentLocationFields.find((field) => locationSource?.[field]);
    return resolvedField ? locationSource?.[resolvedField] : null;
  }, [studentLocationFields]);

  const fetchSingleStudentStop = useCallback(async (busId: string, studentId: string, tripType: string | null) => {
    try {
      const students = await getBusStudents(busId, tripType ?? null);
      const student = students.find((entry) => entry.id === studentId);
      if (!student) {
        return;
      }
      const location = resolveStudentLocation(student as any, tripType);
      if (!location || typeof location.lat !== 'number' || typeof location.lng !== 'number') {
        return;
      }

      const mappedStudent: StudentWithLocation = {
        ...student,
        location,
        order: 1,
        isScanned: (scannedStudentIdsRef.current[busId] ?? []).includes(student.id),
      };

      setBusStudents([mappedStudent]);
      createStudentMarkers([mappedStudent], busId);
    } catch (error) {
      console.error('Erreur lors de la récupération de l’arrêt élève:', error);
    }
  }, [createStudentMarkers, resolveStudentLocation]);

  /**
   * Met à jour les statuts des marqueurs d'élèves en temps réel
   */
  const updateStudentMarkerStatuses = useCallback((scannedIds: string[]) => {
    busStudents.forEach(student => {
      const key = `student_${student.id}_${selectedBusId}`;
      const marker = studentMarkers.current.get(key);

      if (marker) {
        const isScanned = scannedIds.includes(student.id);
        const status = isScanned ? 'scanned' : 'pending';

        // Mettre à jour le style sans recréer l'élément (évite l'animation à chaque update GPS)
        const el = marker.getElement() as HTMLElement;
        const color = getStudentStopColor(status);
        el.style.backgroundColor = color;
        el.textContent = String(student.order);

        // Mettre à jour le HTML du popup
        const popup = marker.getPopup();
        if (popup) {
          popup.setHTML(generateStudentStopPopupHTML({
            studentName: `${student.firstName} ${student.lastName}`,
            grade: student.grade,
            address: student.location.address,
            order: student.order,
            status
          }));
        }
      }
    });
  }, [busStudents, selectedBusId]);

  /**
   * Récupère et affiche les arrêts d'élèves pour un bus donné
   */
  const fetchStudentStops = useCallback(async (busId: string, tripType: string | null) => {
    try {
      const locationField = tripType ? getTripLocationField(tripType) : null;

      // Récupérer les élèves du bus
      const students = await getBusStudents(busId, tripType ?? null);

      // Filtrer uniquement les élèves avec un emplacement valide pour ce trajet
      const studentsWithLocation = students
        .map((student) => {
          const locationSource = (student as any).locations;
          const resolvedField =
            locationField ??
            studentLocationFields.find((field) => locationSource?.[field]);
          const location = resolvedField ? locationSource?.[resolvedField] : null;
          return {
            student,
            location,
          };
        })
        .filter(({ location }) => {
          return (
            location &&
            typeof location.lat === 'number' &&
            typeof location.lng === 'number'
          );
        })
        .map(({ student, location }, index) => ({
          ...student,
          location,
          order: index + 1,
          isScanned: (scannedStudentIdsRef.current[busId] ?? []).includes(student.id),
        }));

      setBusStudents(studentsWithLocation);

      // Créer les marqueurs
      createStudentMarkers(studentsWithLocation, busId);

    } catch (error) {
      console.error('Erreur lors de la récupération des arrêts:', error);
    }
  }, [createStudentMarkers]);

  useEffect(() => {
    if (!showStudentStops) {
      clearStudentMarkers();
      setBusStudents([]);
      setStopsSnapshot(null);
      singleStudentOnlyRef.current = false;
      setStopsBusId(null);
      setStopsTripType(null);
    }
  }, [showStudentStops, clearStudentMarkers]);

  useEffect(() => {
    if (!showStudentStops || stopsSnapshot || !selectedBusId || singleStudentOnlyRef.current || stopsBusId) {
      return;
    }
    const bus = processedBusesRef.current.find((candidate) => candidate.id === selectedBusId);
    const tripType = bus ? getActiveTripType(bus) : null;
    setStopsSnapshot({ busId: selectedBusId, tripType });
    clearStudentMarkers();
    fetchStudentStops(selectedBusId, tripType);
  }, [showStudentStops, stopsSnapshot, selectedBusId, clearStudentMarkers, fetchStudentStops, stopsBusId]);

  useEffect(() => {
    if (!showStudentStops || !stopsBusId || singleStudentOnlyRef.current) {
      return;
    }
    singleStudentOnlyRef.current = false;
    setStopsSnapshot({ busId: stopsBusId, tripType: stopsTripType });
    setSelectedBusId(stopsBusId);
    clearStudentMarkers();
    setBusStudents([]);
    fetchStudentStops(stopsBusId, stopsTripType);
  }, [showStudentStops, stopsBusId, stopsTripType, clearStudentMarkers, fetchStudentStops]);

  const focusStudentStop = useCallback((busId: string, studentId: string) => {
    const bus = processedBusesRef.current.find((candidate) => candidate.id === busId);
    const tripType = bus ? getActiveTripType(bus) : null;
    pendingStudentFocusRef.current = { busId, studentId };
    singleStudentOnlyRef.current = true;
    setStopsSnapshot(null);
    setSelectedBusId(busId);
    setShowStudentStops(true);
    clearStudentMarkers();
    fetchSingleStudentStop(busId, studentId, tripType);
  }, [clearStudentMarkers, fetchSingleStudentStop]);

  useEffect(() => {
    if (!selectedBusId || !showStudentStops) return;

    const bus = processedBuses.find((candidate) => candidate.id === selectedBusId);
    const scannedIds = scannedStudentIdsByBus[selectedBusId] ?? bus?.currentTrip?.scannedStudentIds ?? [];

    updateStudentMarkerStatuses(scannedIds);
  }, [processedBuses, scannedStudentIdsByBus, selectedBusId, showStudentStops, updateStudentMarkerStatuses]);

  // Créer le HTML du popup de la zone de stationnement - VERSION SIMPLIFIÉE Phase 3
  const createParkingZonePopupHTML = useCallback(
    (zone: ParkingZone): string => {
      // Extraire les infos de bus (numéro + chauffeur) pour le popup
      const busesInfo = zone.stationedBuses.map(bus => ({
        busNumber: bus.number,
        driverName: bus.driver?.name
      }));

      // Utiliser le helper pour générer le popup simplifié
      return generateParkingPopupHTML(busesInfo);
    },
    []
  );

  // Helper pour formater une durée en ms en format lisible
  const formatDurationFromMs = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h${remainingMinutes.toString().padStart(2, '0')}`;
  };

  const formatClockTime = (timestamp: number | null | undefined): string | undefined => {
    if (!timestamp || Number.isNaN(timestamp)) {
      return undefined;
    }
    const date = new Date(timestamp);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const toggleBusTracking = useCallback((busId: string) => {
    setTrackedBusId((current) => (current === busId ? null : busId));
  }, []);

  // Créer le HTML du popup - VERSION SIMPLIFIÉE Phase 4 avec tracking ramassage
  const createPopupHTML = useCallback(
    async (bus: BusRealtimeData): Promise<string> => {
      // Récupérer les comptages d'élèves pour ce bus
      const counts = studentsCounts[bus.id] || { scanned: 0, unscanned: 0, total: 0 };

      // NOUVEAU: Calculer minutesAgo pour lastScan
      let lastScanInfo = undefined;
      if (bus.lastScan) {
        const minutesAgo = Math.floor((Date.now() - bus.lastScan.timestamp) / 60000);
        lastScanInfo = {
          studentName: bus.lastScan.studentName,
          minutesAgo
        };
      }

      // NOUVEAU: Récupérer prochain élève (seulement si bus en route)
      let nextStudentInfo = undefined;
      if (bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED) {
        try {
          const nextStudent = await getNextStudent(bus.id);
          if (nextStudent) {
            nextStudentInfo = {
              studentName: nextStudent.studentName,
              stopOrder: nextStudent.stopOrder
            };
          }
        } catch (error) {
          console.error('Error fetching next student:', error);
        }
      }

      const stoppedAtMs = typeof bus.stoppedAt === 'number'
        ? bus.stoppedAt
        : (typeof bus.stoppedAt === 'string' ? Date.parse(bus.stoppedAt) : null);
      const arrivedAtMs = gpsHistoryByBus[bus.id] ?? stoppedAtMs ?? undefined;

      // Calculer la durée du trajet
      const tripDuration = bus.tripStartTime
        ? formatDurationFromMs((arrivedAtMs ?? Date.now()) - bus.tripStartTime)
        : undefined;
      const tripStartLabel = formatClockTime(bus.tripStartTime ?? undefined);
      const tripEndLabel = formatClockTime(arrivedAtMs ?? undefined);

      // Générer callback pour centrer/suivre (attachés au window)
      const isTrackable = bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED;
      const isTracking = trackedBusId === bus.id;

      // Utiliser le helper pour générer le popup simplifié
      return generateSimplifiedBusPopupHTML({
        busNumber: bus.number,
        busStatus: bus.liveStatus ?? undefined,
        driverName: bus.driver?.name,
        scannedCount: counts.scanned,
        totalCount: counts.total,
        onCenterClick: `window.focusBusOnMap && window.focusBusOnMap('${bus.id}')`,
        tripStartLabel,
        tripEndLabel,
        scannedNames: courseRosterByBus[bus.id]?.scannedNames,
        missedNames: courseRosterByBus[bus.id]?.missedNames,

        // NOUVEAUX champs Phase 4
        lastScan: lastScanInfo,
        nextStudent: nextStudentInfo,
        tripDuration,
        showTrackingToggle: isTrackable,
        trackingEnabled: isTracking,
        onTrackingToggle: `window.toggleBusTracking && window.toggleBusTracking('${bus.id}')`,
      });
    },
    [studentsCounts, gpsHistoryByBus, courseRosterByBus, trackedBusId]
  );

  const attachPopupCloseHandler = useCallback((popup: mapboxgl.Popup) => {
    const popupElement = popup.getElement();
    if (!popupElement) return;

    // Close button — animate out before removing
    const closeButton = popupElement.querySelector('.bus-popup-close') as HTMLButtonElement | null;
    if (closeButton) {
      closeButton.onclick = (event) => {
        event.stopPropagation();
        const el = popup.getElement();
        if (el) {
          el.classList.add('popup-closing');
          setTimeout(() => popup.remove(), 180);
        } else {
          popup.remove();
        }
      };
    }

    // Drag-to-move: grab the header and reposition the popup.
    // Guard: attachPopupCloseHandler est rappelée à chaque mise à jour du HTML
    // du popup (tick GPS). Sans garde, on empilement des handlers document-level
    // → drag erratique. On marque le handle dès la 1ère inscription.
    const dragHandle = popupElement.querySelector('[data-drag-handle]') as HTMLElement | null;
    const mapInstance = map.current;
    if (!dragHandle || !mapInstance) return;
    if (dragHandle.dataset.dragAttached === '1') return;
    dragHandle.dataset.dragAttached = '1';

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let originLngLat: mapboxgl.LngLat | null = null;

    const onMouseDown = (e: MouseEvent) => {
      if ((e.target as HTMLElement).closest('.bus-popup-close')) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      originLngLat = popup.getLngLat();
      dragHandle.style.cursor = 'grabbing';
      mapInstance.dragPan.disable();
      e.stopPropagation();
      e.preventDefault(); // évite la sélection de texte pendant le drag
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging || !originLngLat) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const origin = mapInstance.project(originLngLat);
      const newLngLat = mapInstance.unproject([origin.x + dx, origin.y + dy]);
      popup.setLngLat(newLngLat);
    };

    const onMouseUp = () => {
      if (!isDragging) return;
      isDragging = false;
      dragHandle.style.cursor = 'grab';
      mapInstance.dragPan.enable();
    };

    dragHandle.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);

    popup.once('close', () => {
      dragHandle.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
      mapInstance.dragPan.enable();
    });
  }, []);

  const focusBusOnMap = useCallback(
    (busId: string, options?: { forceBusPopup?: boolean; showStops?: boolean }) => {
      if (!map.current || !mapLoaded) return;

      const classifiedBus = processedBuses.find((bus) => bus.id === busId);
      const fallbackBus = stationedBuses.find((bus) => bus.id === busId);
      const targetBus = classifiedBus ?? fallbackBus;

      if (!targetBus) return;

      setSelectedBusId(busId);

      if (options?.showStops) {
        const tripType =
          (classifiedBus ? getActiveTripType(classifiedBus) : null) ??
          courseTripTypeByBus[busId] ??
          null;
        singleStudentOnlyRef.current = false;
        setStopsBusId(busId);
        setStopsTripType(tripType);
        setStopsSnapshot({ busId, tripType });
        setShowStudentStops(true);
        clearStudentMarkers();
        setBusStudents([]);
      } else {
        setShowStudentStops(false);
      }

      // 🔥 FERMER TOUS LES AUTRES POPUPS AVANT D'OUVRIR LE NOUVEAU
      popups.current.forEach((popup) => {
        if (popup.isOpen()) popup.remove();
      });
      if (parkingZonePopup.current?.isOpen()) {
        parkingZonePopup.current.remove();
      }

      // If bus is stationed, navigate to parking zone
      if (!options?.forceBusPopup && classifiedBus?.classification === 'stationed' && parkingZone && school?.location) {
        const currentZoom = map.current.getZoom();
        map.current.flyTo({
          center: [school.location.lng, school.location.lat],
          zoom: Math.max(currentZoom, 16),
          speed: 1.2,
          curve: 1,
          easing: (t) => t,
          essential: true,
        });

        // Open parking zone popup after animation
        setTimeout(() => {
          if (parkingZonePopup.current && map.current) {
            parkingZonePopup.current.addTo(map.current);

            // Optionally: Scroll to the specific bus in the popup list
            setTimeout(() => {
              const busElement = document.querySelector(`[data-bus-id="${busId}"]`);
              if (busElement) {
                busElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                busElement.classList.add('highlight-bus');
                setTimeout(() => busElement.classList.remove('highlight-bus'), 2000);
              }
            }, 100);
          }
        }, 1600);

        return;
      }

      // If bus is deployed, navigate to individual marker (existing logic)
      let targetLat: number | null = null;
      let targetLng: number | null = null;

      if (targetBus.currentPosition) {
        targetLat = targetBus.currentPosition.lat;
        targetLng = targetBus.currentPosition.lng;
      } else if (classifiedBus?.displayPosition) {
        targetLat = classifiedBus.displayPosition.lat;
        targetLng = classifiedBus.displayPosition.lng;
      } else if (school?.location) {
        targetLat = school.location.lat;
        targetLng = school.location.lng;
      }

      if (targetLat == null || targetLng == null) return;

      const currentZoom = map.current.getZoom();
      map.current.flyTo({
        center: [targetLng, targetLat],
        zoom: Math.max(currentZoom, 15), // Zoom minimum de 15 pour voir les détails
        speed: 1.2,
        curve: 1,
        easing: (t) => t,
        essential: true,
      });

      // Ouvrir le popup du bus ciblé après un petit délai pour synchroniser avec l'animation
      setTimeout(() => {
        const mapInstance = map.current;
        if (!mapInstance) return;
        const existingPopup = popups.current.get(busId);
        if (existingPopup) {
          existingPopup.setLngLat([targetLng!, targetLat!]).addTo(mapInstance);
          return;
        }

        createPopupHTML(targetBus).then((html) => {
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(html);

          popup.on('open', () => {
            setActivePopupBusId(busId);
            popups.current.forEach((existingPopup, existingBusId) => {
              if (existingBusId !== busId && existingPopup.isOpen()) {
                existingPopup.remove();
              }
            });
            if (parkingZonePopup.current?.isOpen()) {
              parkingZonePopup.current.remove();
            }
            attachPopupCloseHandler(popup);
          });

          // Setter fonctionnel : n'efface activePopupBusId que si c'est bien
          // CE popup qui était actif. Sans ça, quand popup A est fermé par
          // l'ouverture de popup B (remove() dans le handler 'open' de B),
          // le close de A appelle setActivePopupBusId(null) dans le même batch
          // React et écrase le busId de B → l'itinéraire disparaît.
          popup.on('close', () => {
            setActivePopupBusId((prev) => (prev === busId ? null : prev));
          });

          popups.current.set(busId, popup);
          popup.setLngLat([targetLng!, targetLat!]).addTo(mapInstance);
        });
      }, 600); // Délai court pour attendre la fin de l'animation flyTo
    },
    [mapLoaded, processedBuses, stationedBuses, school, parkingZone, createPopupHTML, attachPopupCloseHandler, clearStudentMarkers, courseTripTypeByBus]
  );

  // Ref pour stocker les données temps réel des bus (tripType, tripStartTime)
  const busRealtimeDataRef = useRef<Map<string, { tripType: string | null; tripStartTime: number | null }>>(new Map());

  // Mettre à jour la ref quand schoolBuses change
  useEffect(() => {
    dedupedSchoolBuses.forEach((bus) => {
      busRealtimeDataRef.current.set(bus.id, {
        tripType: bus.tripType ?? null,
        tripStartTime: bus.tripStartTime ?? null,
      });
    });
  }, [dedupedSchoolBuses]);

  // Écouter les changements d'attendance en temps réel pour chaque bus
  useEffect(() => {
    if (dedupedSchoolBuses.length === 0) {
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const busStudentsMap = new Map<string, number>(); // Map pour stocker le total d'élèves par bus

    // Récupérer d'abord le total d'élèves pour chaque bus (one-shot)
    const fetchBusStudentsTotals = async () => {
      const promises = dedupedSchoolBuses.map(async (bus) => {
        try {
          const students = await getBusStudents(bus.id, bus.tripType);
          busStudentsMap.set(bus.id, students.length);
        } catch (error) {
          console.error(`Erreur lors de la récupération des élèves pour le bus ${bus.id}:`, error);
          busStudentsMap.set(bus.id, 0);
        }
      });
      await Promise.all(promises);
    };

    fetchBusStudentsTotals().then(() => {
      // Pour chaque bus, écouter les changements d'attendance en temps réel
      dedupedSchoolBuses.forEach((bus) => {
        const attendanceDate = bus.tripStartTime
          ? formatLocalDate(new Date(bus.tripStartTime))
          : formatLocalDate(new Date());

        const unsubscribe = watchBusAttendance(
          bus.id,
          attendanceDate,
          (attendance) => {
            // Récupérer les données temps réel actuelles depuis la ref
            const realtimeData = busRealtimeDataRef.current.get(bus.id);
            const currentTripType = realtimeData?.tripType ?? null;
            const currentTripStartTime = realtimeData?.tripStartTime ?? null;
            const stoppedAtMs = typeof bus.stoppedAt === 'number'
              ? bus.stoppedAt
              : (typeof bus.stoppedAt === 'string' ? Date.parse(bus.stoppedAt) : null);
            const shouldIgnoreTripFilter =
              bus.liveStatus === BusLiveStatus.ARRIVED ||
              (stoppedAtMs != null && Date.now() - stoppedAtMs < ARRIVED_DISPLAY_DURATION_MS);
            
            // #region agent log
            // #endregion
            
            const isAttendanceScanned = (a: typeof attendance[number]) => {
              const isPresent =
                a.status === 'present' ||
                a.morningStatus === 'present' ||
                a.eveningStatus === 'present';

              // BUS ARRIVÉ RÉCEMMENT : ne pas filtrer par tripType
              if (shouldIgnoreTripFilter) {
                return isPresent;
              }

              // MODE TOLÉRANT : Si pas de tripType défini, accepter tous les scans valides
              if (!currentTripType) {
                // Accepter si au moins un statut est 'present'
                return isPresent;
              }
              
              // Vérifier que le record correspond au tripType actuel (seulement si record a un tripType)
              if (a.tripType && a.tripType !== currentTripType) {
                return false;
              }
              
              // Vérifier que le record a été créé après le début de la course actuelle
              if (currentTripStartTime && a.timestamp) {
                if (a.timestamp < currentTripStartTime) {
                  // #region agent log
                  // #endregion
                  return false;
                }
              }
              
              // Selon le type de trajet, vérifier le bon statut
              if (currentTripType === 'morning_outbound' || currentTripType === 'midday_return') {
                // Trajets du matin/midi-retour : vérifier morningStatus
                return a.morningStatus === 'present' || a.status === 'present';
              } else if (currentTripType === 'midday_outbound' || currentTripType === 'evening_return') {
                // Trajets du midi/soir : vérifier eveningStatus
                return a.eveningStatus === 'present' || a.status === 'present';
              }
              
              // Fallback : vérifier les deux statuts si tripType non reconnu
              return isPresent;
            };

            const scannedIdsSet = new Set<string>();
            attendance.forEach((record) => {
              if (isAttendanceScanned(record)) {
                scannedIdsSet.add(record.studentId);
              }
            });

            const scanned = scannedIdsSet.size;
            const scannedIds = Array.from(scannedIdsSet);
            
            // #region agent log
            // #endregion

            // Le total d'élèves du bus (récupéré précédemment)
            const total = busStudentsMap.get(bus.id) || 0;
            const unscanned = Math.max(0, total - scanned);

            // Mettre à jour les comptages pour ce bus
            setStudentsCounts((prev) => ({
              ...prev,
              [bus.id]: { scanned, unscanned, total },
            }));

            setScannedStudentIdsByBus((prev) => ({
              ...prev,
              [bus.id]: scannedIds,
            }));
          },
          () => {}
        );
        unsubscribes.push(unsubscribe);
      });
    });

    // Cleanup: désabonner tous les listeners quand les bus changent ou le composant se démonte
    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [dedupedSchoolBuses]);

  useEffect(() => {
    const arrivedBuses = processedBuses.filter((bus) => bus.liveStatus === BusLiveStatus.ARRIVED);
    if (arrivedBuses.length === 0) {
      return;
    }

    const fetchLatestHistory = async () => {
      const updates: Record<string, number> = {};
      for (const bus of arrivedBuses) {
        if (gpsHistoryFetchRef.current.has(bus.id)) {
          continue;
        }
        gpsHistoryFetchRef.current.add(bus.id);
        const referenceTime =
          typeof bus.stoppedAt === 'number'
            ? bus.stoppedAt
            : (typeof bus.tripStartTime === 'number' ? bus.tripStartTime : Date.now());
        const date = formatLocalDate(new Date(referenceTime));
        const latestTimestamp = await getLatestGpsHistoryTimestamp(bus.id, date);
        if (latestTimestamp) {
          updates[bus.id] = latestTimestamp;
        }
      }
      if (Object.keys(updates).length > 0) {
        setGpsHistoryByBus((prev) => ({
          ...prev,
          ...updates,
        }));
      }
    };

    void fetchLatestHistory();
  }, [processedBuses]);

  useEffect(() => {
    const unsubscribe = watchRecentCourseHistory(
      50,
      (entries) => {
        const nextMap: Record<string, { scanned: number; total: number; unscanned: number }> = {};
        const tripTypeMap: Record<string, string> = {};
        const latestByBus = new Map<string, typeof entries[number]>();
        entries.forEach((entry) => {
          if (!entry.busId) {
            return;
          }
          if (nextMap[entry.busId]) {
            return;
          }
          const scanned = entry.stats?.scannedCount ?? entry.scannedStudentIds.length ?? 0;
          const total =
            entry.stats?.totalStudents ??
            (entry.scannedStudentIds.length + entry.missedStudentIds.length);
          const unscanned = entry.stats?.unscannedCount ?? Math.max(0, total - scanned);
          nextMap[entry.busId] = { scanned, total, unscanned };
          if (entry.tripType) {
            tripTypeMap[entry.busId] = entry.tripType;
          }
          latestByBus.set(entry.busId, entry);
        });
        setCourseStatsByBus(nextMap);
        if (Object.keys(tripTypeMap).length > 0) {
          setCourseTripTypeByBus((prev) => ({
            ...prev,
            ...tripTypeMap,
          }));
        }

        const MAX_NAMES = 6;
        const fetchNames = async () => {
          for (const [busId, course] of latestByBus.entries()) {
            if (!course.id) {
              continue;
            }
            const previousCourseId = courseRosterFetchRef.current.get(busId);
            if (previousCourseId === course.id) {
              continue;
            }
            courseRosterFetchRef.current.set(busId, course.id);
            try {
              const scannedIds = (course.scannedStudentIds || []).slice(0, MAX_NAMES);
              const missedIds = (course.missedStudentIds || []).slice(0, MAX_NAMES);
              const [scannedStudents, missedStudents] = await Promise.all([
                getStudentsByIds(scannedIds),
                getStudentsByIds(missedIds),
              ]);
              setCourseRosterByBus((prev) => ({
                ...prev,
                [busId]: {
                  scannedNames: scannedStudents.map((student) => `${student.firstName} ${student.lastName}`.trim()),
                  missedNames: missedStudents.map((student) => `${student.firstName} ${student.lastName}`.trim()),
                },
              }));
            } catch (error) {
              console.error('Erreur chargement élèves course:', error);
            }
          }
        };

        void fetchNames();
      },
      () => {}
    );

    return () => unsubscribe();
  }, []);

  // Activation automatique des arrêts élèves : dès qu'un popup bus est
  // ouvert, ses arrêts apparaissent sur la carte. Au close, ils disparaissent.
  // Évite à l'utilisateur de chercher un toggle pour comprendre la tournée.
  useEffect(() => {
    if (activePopupBusId) {
      const bus = processedBusesRef.current.find((b) => b.id === activePopupBusId);
      const tripType =
        (bus ? getActiveTripType(bus) : null) ?? courseTripTypeByBus[activePopupBusId] ?? null;
      singleStudentOnlyRef.current = false;
      setStopsBusId(activePopupBusId);
      setStopsTripType(tripType);
      setStopsSnapshot({ busId: activePopupBusId, tripType });
      setShowStudentStops(true);
    } else {
      setShowStudentStops(false);
    }
  }, [activePopupBusId, courseTripTypeByBus]);

  // Make focusBusOnMap globally accessible for popup buttons
  useEffect(() => {
    (window as any).focusBusFromParkingZone = (busId: string) => {
      // Close parking zone popup
      if (parkingZonePopup.current?.isOpen()) {
        parkingZonePopup.current.remove();
      }

      // Focus the specific bus (will show individual popup)
      focusBusOnMap(busId);
    };
    (window as any).focusBusOnMap = (busId: string) => {
      focusBusOnMap(busId);
    };
    (window as any).toggleBusTracking = (busId: string) => {
      toggleBusTracking(busId);
    };

    return () => {
      delete (window as any).focusBusFromParkingZone;
      delete (window as any).focusBusOnMap;
      delete (window as any).toggleBusTracking;
    };
  }, [focusBusOnMap, toggleBusTracking]);

  // Auto-refresh du popup ouvert toutes les 15 secondes
  useEffect(() => {
    if (!activePopupBusId) return;

    const interval = setInterval(async () => {
      // Récupérer le bus mis à jour
      const bus = processedBuses.find(b => b.id === activePopupBusId);
      if (!bus) return;

      // Régénérer le HTML du popup
      const newHTML = await createPopupHTML(bus);

      // Mettre à jour le popup sans le fermer
      const popup = popups.current.get(activePopupBusId);
      if (popup) {
        popup.setHTML(newHTML);
        attachPopupCloseHandler(popup);
      }
    }, 15000); // 15 secondes

    return () => clearInterval(interval);
  }, [activePopupBusId, processedBuses, createPopupHTML, attachPopupCloseHandler]);

  useEffect(() => {
    if (!activePopupBusId) return;
    const bus = processedBuses.find((candidate) => candidate.id === activePopupBusId);
    if (!bus) return;

    createPopupHTML(bus).then((html) => {
      const popup = popups.current.get(activePopupBusId);
      if (popup) {
        popup.setHTML(html);
        attachPopupCloseHandler(popup);
      }
    });
  }, [activePopupBusId, trackedBusId, processedBuses, createPopupHTML, attachPopupCloseHandler]);

  const animateMarkerToPosition = useCallback(
    (
      busId: string,
      marker: mapboxgl.Marker,
      targetLat: number,
      targetLng: number,
      targetTimestamp: number | null,
      bus: ClassifiedBus
    ) => {
      if (isMapInteracting.current || map.current?.isMoving() || map.current?.isZooming()) {
        // Pendant un pan/zoom utilisateur, on fige visuellement le marqueur
        // (pas de setLngLat brut qui sauterait à la cible) et on mémorise la
        // cible la plus récente. Elle sera animée proprement à moveend.
        pendingTargetsRef.current.set(busId, {
          lat: targetLat,
          lng: targetLng,
          timestamp: targetTimestamp,
          bus,
        });
        return;
      }

      const existingRaf = markerAnimations.current.get(busId);
      if (existingRaf) {
        cancelAnimationFrame(existingRaf);
        markerAnimations.current.delete(busId);
      }

      const startLngLat = marker.getLngLat();
      const fromLat = startLngLat.lat;
      const fromLng = startLngLat.lng;
      const previousMotion = markerMotionRef.current.get(busId);
      const previousTimestamp = previousMotion?.timestamp ?? null;

      // En mode démo, le moteur émet des positions propres à cadence rapide :
      // on évite d'allouer un filtre Kalman (et son état persistant) inutilement.
      let kalmanFilter: GpsKalmanFilter | null = null;
      if (!IS_DEMO) {
        if (!kalmanFilters.current.has(busId)) {
          kalmanFilters.current.set(
            busId,
            new GpsKalmanFilter(targetLat, targetLng, 0.01, 20)
          );
        }
        kalmanFilter = kalmanFilters.current.get(busId)!;
      }

      const plan = computeAnimationPlan({
        raw: { lat: targetLat, lng: targetLng },
        previousTimestamp,
        currentTimestamp: targetTimestamp,
        bus: {
          currentPosition: bus.currentPosition
            ? { speed: bus.currentPosition.speed, heading: bus.currentPosition.heading }
            : null,
        },
        kalmanFilter,
        isDemo: IS_DEMO,
      });

      const finalTarget = plan.target;
      const durationMs = plan.durationMs;

      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const rawProgress = Math.min(elapsed / durationMs, 1);

        const progress = rawProgress < 0.5
          ? 2 * rawProgress * rawProgress
          : 1 - Math.pow(-2 * rawProgress + 2, 2) / 2;

        const lat = fromLat + (finalTarget.lat - fromLat) * progress;
        const lng = fromLng + (finalTarget.lng - fromLng) * progress;
        marker.setLngLat([lng, lat]);

        if (progress < 1) {
          const rafId = requestAnimationFrame(step);
          markerAnimations.current.set(busId, rafId);
        } else {
          markerAnimations.current.delete(busId);
        }
      };

      const rafId = requestAnimationFrame(step);
      markerAnimations.current.set(busId, rafId);

      markerMotionRef.current.set(busId, {
        lat: finalTarget.lat,
        lng: finalTarget.lng,
        timestamp: targetTimestamp,
      });
    },
    []
  );

  // Hook de "flush" appelé à moveend : reprend les animations différées
  // pendant l'interaction utilisateur en repartant de la position visuelle.
  useEffect(() => {
    flushPendingTargetsRef.current = () => {
      pendingTargetsRef.current.forEach((pending, busId) => {
        const marker = markers.current.get(busId);
        if (!marker) return;
        animateMarkerToPosition(
          busId,
          marker,
          pending.lat,
          pending.lng,
          pending.timestamp,
          pending.bus
        );
      });
      pendingTargetsRef.current.clear();
    };
    return () => {
      flushPendingTargetsRef.current = null;
    };
  }, [animateMarkerToPosition]);

  const getBusPositionTimestamp = useCallback((bus: ClassifiedBus): number | null => {
    if (typeof bus.currentPosition?.timestamp === 'number') {
      const rawTimestamp = bus.currentPosition.timestamp;
      return rawTimestamp < 1e12 ? rawTimestamp * 1000 : rawTimestamp;
    }
    if (bus.lastUpdate) {
      const parsed = Date.parse(bus.lastUpdate);
      return Number.isNaN(parsed) ? null : parsed;
    }
    return null;
  }, []);

  useEffect(() => {
    return () => {
      markerAnimations.current.forEach((rafId) => cancelAnimationFrame(rafId));
      markerAnimations.current.clear();
    };
  }, []);

  // Mettre à jour les marqueurs quand les bus changent
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // 1. REMOVE parking zone marker if no stationed buses
    if (!parkingZone && parkingZoneMarker.current) {
      parkingZoneMarker.current.remove();
      parkingZoneMarker.current = null;
      parkingZonePopup.current = null;
    }

    // 2. CREATE/UPDATE parking zone marker if stationed buses exist
    if (parkingZone && school?.location) {
      // Décalage léger du parking à côté de l'école (environ 20 mètres à l'est)
      // 1 degré de longitude ≈ 111km à l'équateur, donc 0.0002° ≈ 22m
      // École reste visible séparément pour permettre interaction distincte
      const parkingOffset = 0.0002;
      const parkingLng = school.location.lng + parkingOffset;
      const parkingLat = school.location.lat;

      if (parkingZoneMarker.current) {
        const existingEl = parkingZoneMarker.current.getElement();
        existingEl.className = 'parking-zone-marker';
        existingEl.innerHTML = createParkingZoneMarkerHTML(parkingZone.count);
        parkingZoneMarker.current.setLngLat([parkingLng, parkingLat]);

        if (parkingZonePopup.current) {
          parkingZonePopup.current.setHTML(createParkingZonePopupHTML(parkingZone));
        }
      } else {
        // Create parking zone marker element
        const parkingEl = document.createElement('div');
        parkingEl.className = 'parking-zone-marker';
        parkingEl.innerHTML = createParkingZoneMarkerHTML(parkingZone.count);

        // Create parking zone popup - CENTRÉ SUR LA PAGE
        const parkingPopup = new mapboxgl.Popup({
          offset: 30,
          closeButton: true,
          closeOnClick: false,
          maxWidth: '420px',
          anchor: 'center', // Centre le popup
          className: 'parking-popup-centered',
        }).setHTML(createParkingZonePopupHTML(parkingZone));

        parkingZonePopup.current = parkingPopup;

        // Create parking zone marker avec position décalée
        const marker = new mapboxgl.Marker(parkingEl)
          .setLngLat([parkingLng, parkingLat])
          .setPopup(parkingPopup)
          .addTo(map.current);

        parkingZoneMarker.current = marker;
      }
    }

    // 3. UPDATE individual bus markers (EXCLUDE stationed buses)
    const deployedBuses = processedBuses.filter((bus) => bus.classification === 'deployed');

    deployedBuses.forEach((bus) => {
      if (!bus.displayPosition) return;

      const { lat, lng } = bus.displayPosition;
      const busId = bus.id;

      // Si le marqueur existe déjà, le mettre à jour
      if (markers.current.has(busId)) {
        const marker = markers.current.get(busId)!;
        const targetTimestamp = getBusPositionTimestamp(bus);
        animateMarkerToPosition(busId, marker, lat, lng, targetTimestamp, bus);

        // Mettre à jour le HTML du marqueur (pour le changement de couleur)
        const el = marker.getElement();
        el.innerHTML = createMarkerHTML(bus);

        if (
          trackedBusIdRef.current === busId &&
          map.current &&
          !isMapInteracting.current &&
          !map.current.isMoving() &&
          !map.current.isZooming()
        ) {
          const center = map.current.getCenter();
          const threshold = 0.00005;
          if (Math.abs(center.lat - lat) > threshold || Math.abs(center.lng - lng) > threshold) {
            map.current.easeTo({
              center: [lng, lat],
              zoom: map.current.getZoom(),
              duration: 800,
              easing: (t) => t,
              essential: true,
            });
          }
        }

        // Mettre à jour le popup (async)
        if (popups.current.has(busId)) {
          const popup = popups.current.get(busId)!;
          createPopupHTML(bus).then(html => {
            popup.setHTML(html);
            attachPopupCloseHandler(popup);
          });
        }
      } else {
        // Créer un nouveau marqueur SYNCHRONEUSEMENT (le popup est attaché
        // async ensuite). Si on attendait la résolution du popup async pour
        // enregistrer le marker, un tick suivant arrivant entre temps verrait
        // markers.current.has(busId) === false et créerait un doublon.
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = createMarkerHTML(bus);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .addTo(map.current!);

        markers.current.set(busId, marker);
        markerMotionRef.current.set(busId, {
          lat,
          lng,
          timestamp: getBusPositionTimestamp(bus),
        });

        if (
          trackedBusIdRef.current === busId &&
          map.current &&
          !isMapInteracting.current &&
          !map.current.isMoving() &&
          !map.current.isZooming()
        ) {
          map.current.easeTo({
            center: [lng, lat],
            zoom: map.current.getZoom(),
            duration: 800,
            easing: (t) => t,
            essential: true,
          });
        }

        // Attacher le popup une fois le HTML résolu.
        createPopupHTML(bus).then(html => {
          // Garde-fou : si le marker a été nettoyé entre-temps (ex: bus
          // déclassifié), on n'attache rien.
          if (!markers.current.has(busId)) return;

          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(html);

          popup.on('open', () => {
            setActivePopupBusId(bus.id);
            setSelectedBusId(bus.id);
            popups.current.forEach((existingPopup, existingBusId) => {
              if (existingBusId !== bus.id && existingPopup.isOpen()) {
                existingPopup.remove();
              }
            });
            if (parkingZonePopup.current?.isOpen()) {
              parkingZonePopup.current.remove();
            }
            attachPopupCloseHandler(popup);
          });

          popup.on('close', () => {
            setActivePopupBusId((prev) => (prev === bus.id ? null : prev));
          });

          popups.current.set(busId, popup);

          // Ouvrir le popup à la position courante du marqueur sans l'y attacher
          // (marker.setPopup ferait suivre le popup quand le bus bouge).
          el.addEventListener('click', (e) => {
            e.stopPropagation();
            const m = markers.current.get(busId);
            const mapInst = map.current;
            if (!m || !mapInst) return;
            if (popup.isOpen()) {
              popup.remove();
              return;
            }
            popup.setLngLat(m.getLngLat()).addTo(mapInst);
          });
        });
      }
    });

    // Supprimer les marqueurs des bus qui ne sont plus dans la liste des bus déployés
    markers.current.forEach((marker, busId) => {
      if (!deployedBuses.find((b) => b.id === busId)) {
        const rafId = markerAnimations.current.get(busId);
        if (rafId) {
          cancelAnimationFrame(rafId);
          markerAnimations.current.delete(busId);
        }
        marker.remove();
        markers.current.delete(busId);
        popups.current.delete(busId);
        markerMotionRef.current.delete(busId);
        markerStateRef.current.delete(busId);
      }
    });
  }, [
    processedBuses,
    mapLoaded,
    createMarkerHTML,
    createPopupHTML,
    studentsCounts,
    parkingZone,
    school,
    createParkingZoneMarkerHTML,
    createParkingZonePopupHTML,
    animateMarkerToPosition,
    getBusPositionTimestamp,
  ]);

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Carte principale - 70% */}
      <div className="flex-1 relative h-full">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-95">
            <LoadingSpinner message="Chargement de la carte..." />
          </div>
        )}

        {errorMessage && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <ErrorMessage message={errorMessage || 'Impossible de charger les bus'} />
          </div>
        )}

        {!MAPBOX_TOKEN && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
            <div className="text-center max-w-md p-8">
              <AlertCircle className="w-12 h-12 text-danger-500 mx-auto mb-4" />
              <p className="text-danger-600 font-semibold mb-2 text-lg">Token Mapbox manquant !</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Veuillez ajouter{' '}
                <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">VITE_MAPBOX_ACCESS_TOKEN</code>{' '}
                dans votre fichier <code className="bg-slate-100 px-2 py-1 rounded text-xs font-mono">.env</code>
              </p>
            </div>
          </div>
        )}

        <div
          className="realtime-status-badge"
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            zIndex: 1,
            backgroundColor: isRealtimeConnected ? '#16a34a' : '#dc2626',
            color: 'white',
            padding: '8px 12px',
            borderRadius: '999px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 700,
            boxShadow: '0 6px 16px rgba(0,0,0,0.18)',
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              backgroundColor: 'white',
              boxShadow: '0 0 0 2px rgba(255,255,255,0.35)',
            }}
          />
          <span>
            {isRealtimeConnected
              ? 'Connecté au service'
              : hasRealtimeError
                ? 'Service déconnecté'
                : 'Service hors ligne'}
          </span>
        </div>

        <div className="godview-notifications">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`godview-notification godview-notification--${notification.type}`}
            >
              {notification.message}
            </div>
          ))}
        </div>

        {/* Badge MODE DÉMO + contrôles présentation (pause/reset) */}
        {IS_DEMO && (
          <div className="godview-demo-badge" style={{ position: 'absolute', top: '46px', left: '10px', zIndex: 2 }}>
            <span className="godview-demo-dot" />
            <span>MODE DÉMO — données simulées</span>
            <DemoControls
              isPaused={demoPaused}
              onTogglePause={handleTogglePauseDemo}
              onReset={handleResetDemo}
              speed={demoSpeed}
              onCycleSpeed={handleCycleSpeedDemo}
            />
          </div>
        )}

        {/* Barre de statistiques de la flotte */}
        {MAPBOX_TOKEN && !isLoading && (
          <div className="godview-stats-bar" style={{ position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
            <div className="godview-stat">
              <span className="godview-stat__value">{dedupedSchoolBuses.length}</span>
              <span className="godview-stat__label">Bus</span>
            </div>
            <div className="godview-stat">
              <span className="godview-stat__value" style={{ color: '#2563eb' }}>{fleetEnCourseCount}</span>
              <span className="godview-stat__label">En course</span>
            </div>
            <div className="godview-stat">
              <span className="godview-stat__value" style={{ color: '#16a34a' }}>{fleetAtSchoolCount}</span>
              <span className="godview-stat__label">À l’école</span>
            </div>
            <div className="godview-stat">
              <span className="godview-stat__value">
                {studentsAggregate.scanned}<span style={{ color: '#94a3b8', fontWeight: 600 }}>/{studentsAggregate.total}</span>
              </span>
              <span className="godview-stat__label">Élèves à bord</span>
            </div>
          </div>
        )}

        {/* Bouton Vue d'ensemble — recadre sur toute la flotte (utile pour enregistrement) */}
        {MAPBOX_TOKEN && processedBuses.length > 0 && (
          <button
            onClick={() => {
              const mapInst = map.current;
              if (!mapInst) return;
              const positions = processedBuses
                .filter((b) => b.displayPosition)
                .map((b) => b.displayPosition!);
              if (positions.length === 0) return;
              const lngs = positions.map((p) => p.lng);
              const lats = positions.map((p) => p.lat);
              mapInst.fitBounds(
                [[Math.min(...lngs), Math.min(...lats)], [Math.max(...lngs), Math.max(...lats)]],
                { padding: 80, maxZoom: 14, duration: 900 }
              );
            }}
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '10px',
              zIndex: 2,
              background: 'rgba(255,255,255,0.96)',
              backdropFilter: 'blur(4px)',
              border: '1.5px solid #e2e8f0',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#0f172a',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'box-shadow 0.15s',
            }}
            title="Centrer la vue sur toute la flotte"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M3 3l7 7M3 21l7-7M21 3l-7 7M21 21l-7-7"/>
            </svg>
            Vue d'ensemble
          </button>
        )}

        {/* Légende des couleurs de marqueurs */}
        {MAPBOX_TOKEN && (
          <div className="godview-legend" style={{ position: 'absolute', bottom: '60px', left: '10px', zIndex: 2 }}>
            <div className="godview-legend__title">Légende</div>
            {[
              { color: '#3b82f6', label: 'En route' },
              { color: '#dc2626', label: 'En retard' },
              { color: '#22c55e', label: 'Arrivé / à l’école' },
              { color: '#64748b', label: 'Inactif' },
            ].map((item) => (
              <div key={item.label} className="godview-legend__row">
                <span className="godview-legend__dot" style={{ backgroundColor: item.color }} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Conteneur de la carte */}
        <div ref={mapContainer} className="w-full h-full absolute inset-0" />
      </div>

      {/* Sidebar Alertes - 30% */}
      <AlertsSidebar 
        alerts={schoolAlerts} 
        buses={processedBuses}
        stationedBuses={stationedBuses}
        studentsCounts={studentsCounts}
        gpsHistoryByBus={gpsHistoryByBus}
        courseStatsByBus={courseStatsByBus}
        totalBusCount={dedupedSchoolBuses.length}
        enCourseCount={fleetEnCourseCount}
        atSchoolCount={fleetAtSchoolCount}
        onFocusBus={focusBusOnMap}
        onFocusStudentStop={focusStudentStop}
        selectedBusId={selectedBusId}
      />
    </div>
  );
};
