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
import { watchBusAttendance, getBusStudents } from '@/services/students.firestore';
import { generateBusMarkerHTML, calculateHeadingToSchool } from '@/components/godview/BusMarkerWithAura';
import { generateSimplifiedBusPopupHTML, generateParkingPopupHTML } from '@/components/godview/SimplifiedBusPopup';
import { generateStudentStopMarkerHTML, generateStudentStopPopupHTML } from '@/components/godview/StudentStopMarker';
import { getNextStudent } from '@/services/bus.api';
import { MapPin } from 'lucide-react';

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
    const elapsedMinutes = Math.floor(elapsed / 60000);

    console.log(`🚦 [isBusEnCourse] Bus ${bus.number} STOPPED avec stoppedAt:`, {
      stoppedAt: bus.stoppedAt,
      stoppedAtTimestamp,
      elapsed: `${elapsedMinutes} min`,
      threshold: '15 min',
      passFiltre: elapsed < ARRIVED_DISPLAY_DURATION_MS,
    });

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
        if (timeSinceLastUpdate < GPS_TIMEOUT_MS && 
            bus.liveStatus !== BusLiveStatus.ARRIVED) {
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
  if (wasRecentlyEnRoute && bus.liveStatus !== BusLiveStatus.ARRIVED) {
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
  const initialCenterRef = useRef<[number, number]>(
    school?.location ? [school.location.lng, school.location.lat] : ABIDJAN_CENTER
  );

  const [mapLoaded, setMapLoaded] = useState(false);
  const { alerts: realtimeAlerts, error: alertsError } = useRealtimeAlerts();
  const [lastRealtimeUpdate, setLastRealtimeUpdate] = useState<number | null>(null);
  
  // Stocker les comptages d'élèves pour chaque bus
  const [studentsCounts, setStudentsCounts] = useState<
    Record<string, { scanned: number; unscanned: number; total: number }>
  >({});

  const [scannedStudentIdsByBus, setScannedStudentIdsByBus] = useState<Record<string, string[]>>({});
  const [notifications, setNotifications] = useState<
    Array<{ id: number; message: string; type: 'start' | 'scan' | 'end' }>
  >([]);
  const notificationIdRef = useRef(0);
  
  // State pour tracker le popup actuellement ouvert (pour auto-refresh)
  const [activePopupBusId, setActivePopupBusId] = useState<string | null>(null);

  // Suivre l'état local du statut pour éviter le flickering
  const localStatusRef = useRef<Map<string, BusLiveStatus>>(new Map());
  const previousBusStatusRef = useRef<Map<string, BusLiveStatus | null>>(new Map());
  const previousTripStartRef = useRef<Map<string, number | null>>(new Map());
  const previousScannedCountRef = useRef<Map<string, number>>(new Map());

  // State dummy pour forcer re-render périodique (rafraîchir affichage ARRIVED → STOPPED)
  const [, setForceUpdate] = useState(0);

  // Constante de durée pour affichage ARRIVED (15 minutes)
  const ARRIVED_DISPLAY_DURATION_MS = 15 * 60 * 1000;

  // ===== États pour les arrêts d'élèves =====
  // Toggle pour afficher/masquer les arrêts d'élèves
  const [showStudentStops, setShowStudentStops] = useState<boolean>(false);

  // Bus actuellement sélectionné (pour afficher ses arrêts)
  const [selectedBusId, setSelectedBusId] = useState<string | null>(null);

  // Données des élèves avec leur emplacement
  const [busStudents, setBusStudents] = useState<StudentWithLocation[]>([]);

  // Chargement des données d'élèves
  const [studentsLoading, setStudentsLoading] = useState<boolean>(false);

  // Ref pour les marqueurs d'arrêts d'élèves (séparés des marqueurs de bus)
  const studentMarkers = useRef<Map<string, mapboxgl.Marker>>(new Map());

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

    // ✅ NOUVEAU : Lire stoppedAt depuis Firestore (source de vérité backend)
    const stoppedAt = bus.stoppedAt;

    console.log(`🔍 [DISPLAY STATUS] Bus ${bus.number}:`, {
      stoppedAt,
      type: typeof stoppedAt,
      raw: bus.stoppedAt,
      currentStatus,
    });

    // Si pas de timestamp, le bus était déjà STOPPED avant la transition → afficher STOPPED
    if (!stoppedAt) {
      console.log(`❌ [DISPLAY STATUS] Bus ${bus.number}: Pas de stoppedAt → STOPPED`);
      return BusLiveStatus.STOPPED;
    }

    // Convertir stoppedAt en timestamp si c'est une string ou un objet Firestore Timestamp
    let stoppedAtTimestamp: number;

    if (typeof stoppedAt === 'string') {
      stoppedAtTimestamp = new Date(stoppedAt).getTime();
      console.log(`🔄 [DISPLAY STATUS] Bus ${bus.number}: Conversion string → timestamp`, stoppedAtTimestamp);
    } else if (typeof stoppedAt === 'object' && stoppedAt !== null && 'seconds' in stoppedAt) {
      // Firestore Timestamp format
      stoppedAtTimestamp = (stoppedAt as any).seconds * 1000;
      console.log(`🔄 [DISPLAY STATUS] Bus ${bus.number}: Conversion Firestore Timestamp → timestamp`, stoppedAtTimestamp);
    } else if (typeof stoppedAt === 'number') {
      stoppedAtTimestamp = stoppedAt;
      console.log(`✅ [DISPLAY STATUS] Bus ${bus.number}: stoppedAt déjà en timestamp`, stoppedAtTimestamp);
    } else {
      console.error(`⚠️ [DISPLAY STATUS] Bus ${bus.number}: Format stoppedAt inconnu`, stoppedAt);
      return BusLiveStatus.STOPPED;
    }

    // Calculer le temps écoulé depuis l'arrêt
    const elapsed = Date.now() - stoppedAtTimestamp;
    const elapsedMinutes = Math.floor(elapsed / 60000);
    const thresholdMinutes = ARRIVED_DISPLAY_DURATION_MS / 60000;

    const result = elapsed < ARRIVED_DISPLAY_DURATION_MS
      ? BusLiveStatus.ARRIVED
      : BusLiveStatus.STOPPED;

    console.log(`🎯 [DISPLAY STATUS] Bus ${bus.number}:`, {
      now: Date.now(),
      stoppedAtTimestamp,
      elapsed: `${elapsedMinutes} min`,
      threshold: `${thresholdMinutes} min`,
      result,
    });

    return result;
  }, [ARRIVED_DISPLAY_DURATION_MS]);

  const processedBuses: ClassifiedBus[] = useMemo(() => {
    return schoolBuses
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
  }, [schoolBuses, school]);

  const stationedBuses = useMemo(() => {
    return schoolBuses.filter((bus) => bus.isActive && isBusStationed(bus));
  }, [schoolBuses]);

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
  const isRealtimeConnected = !schoolError && !schoolBusesError && !alertsError;

  useEffect(() => {
    if (alertsError) {
      console.error('❌ Impossible de charger les alertes temps réel:', alertsError);
    }
  }, [alertsError]);

  useEffect(() => {
    if (schoolBuses.length || realtimeAlerts.length) {
      setLastRealtimeUpdate(Date.now());
    }
  }, [schoolBuses, realtimeAlerts]);

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
      const currentBusIds = new Set(schoolBuses.map((bus) => bus.id));

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
    }, 60000); // Nettoyage toutes les 60 secondes

    return () => clearInterval(cleanupInterval);
  }, [schoolBuses]);

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
      zoom: 16,
      minZoom: 13,
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
      zoom: 16,
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
    const dx = to.lng - from.lng;
    const dy = to.lat - from.lat;
    const distanceSquared = dx * dx + dy * dy;
    if (distanceSquared < 1e-10) {
      return 0;
    }

    const angleRadians = Math.atan2(dy, dx);
    let rotation = (angleRadians * 180) / Math.PI - 90;
    if (rotation < 0) {
      rotation += 360;
    }

    return rotation;
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

  // Créer le HTML du marqueur avec flèche directionnelle
  const createMarkerHTML = useCallback((bus: ClassifiedBus): string => {
    const color = getMarkerColor(bus);
    const rotationAngle = getMarkerRotation(bus);

    // Déterminer si le bus a une alerte
    const busAlerts = realtimeAlerts.filter(a => a.busId === bus.id);
    const hasAlert = busAlerts.length > 0;
    const alertSeverity = busAlerts.find(a => a.severity === 'HIGH') ? 'HIGH' : 'MEDIUM';

    // Utiliser le helper pour générer le HTML avec aura
  return generateBusMarkerHTML({
      busNumber: bus.number,
      color,
      rotation: rotationAngle,
      hasAlert,
      alertSeverity,
    });
  }, [getMarkerColor, getMarkerRotation, realtimeAlerts]);

  // Compteurs de flotte (pour la sidebar)
  // Le badge "En course" affiche uniquement les bus avec statut EN_ROUTE explicite
  const fleetEnCourseCount = useMemo(
    () => schoolBuses.filter((bus) => bus.liveStatus === BusLiveStatus.EN_ROUTE).length,
    [schoolBuses]
  );
  const fleetAtSchoolCount = useMemo(
    () => schoolBuses.filter((bus) => isBusStationed(bus)).length,
    [schoolBuses]
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

  /**
   * Nettoie tous les marqueurs d'arrêts d'élèves
   */
  const clearStudentMarkers = useCallback(() => {
    studentMarkers.current.forEach(marker => marker.remove());
    studentMarkers.current.clear();
  }, []);

  /**
   * Crée les marqueurs d'arrêts d'élèves sur la carte
   */
  const createStudentMarkers = useCallback((students: StudentWithLocation[], busId: string) => {
    if (!map.current || !mapLoaded) return;

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

      // Créer le marqueur
      const marker = new mapboxgl.Marker({ element: el.firstElementChild as HTMLElement })
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current);

      // Stocker la référence
      const key = `student_${student.id}_${busId}`;
      studentMarkers.current.set(key, marker);
    });
  }, [mapLoaded]);

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

        // Mettre à jour le HTML du marqueur
        const el = marker.getElement();
        el.innerHTML = generateStudentStopMarkerHTML({
          order: student.order,
          status
        });

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
  const fetchStudentStops = useCallback(async (busId: string) => {
    setStudentsLoading(true);

    try {
      const bus = processedBuses.find(b => b.id === busId);
      if (!bus) return;

      const tripType = getActiveTripType(bus);
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
          isScanned: (scannedStudentIdsByBus[busId] ?? bus.currentTrip?.scannedStudentIds ?? []).includes(student.id),
        }));

      setBusStudents(studentsWithLocation);

      // Créer les marqueurs
      createStudentMarkers(studentsWithLocation, busId);

    } catch (error) {
      console.error('Erreur lors de la récupération des arrêts:', error);
    } finally {
      setStudentsLoading(false);
    }
  }, [processedBuses, createStudentMarkers, scannedStudentIdsByBus]);

  useEffect(() => {
    if (!selectedBusId || !showStudentStops) {
      clearStudentMarkers();
      setBusStudents([]);
      return;
    }

    clearStudentMarkers();
    fetchStudentStops(selectedBusId);
  }, [selectedBusId, showStudentStops, fetchStudentStops, clearStudentMarkers]);

  useEffect(() => {
    if (!selectedBusId || !showStudentStops) return;

    const bus = processedBuses.find((candidate) => candidate.id === selectedBusId);
    const scannedIds = scannedStudentIdsByBus[selectedBusId] ?? bus?.currentTrip?.scannedStudentIds ?? [];

    updateStudentMarkerStatuses(scannedIds);
  }, [processedBuses, scannedStudentIdsByBus, selectedBusId, showStudentStops, updateStudentMarkerStatuses]);

  const focusBusOnMap = useCallback(
    (busId: string) => {
      if (!map.current || !mapLoaded) return;

      const classifiedBus = processedBuses.find((bus) => bus.id === busId);
      const fallbackBus = stationedBuses.find((bus) => bus.id === busId);
      const targetBus = classifiedBus ?? fallbackBus;

      if (!targetBus) return;

      setSelectedBusId(busId);

      // 🔥 FERMER TOUS LES AUTRES POPUPS AVANT D'OUVRIR LE NOUVEAU
      popups.current.forEach((popup) => {
        if (popup.isOpen()) popup.remove();
      });
      if (parkingZonePopup.current?.isOpen()) {
        parkingZonePopup.current.remove();
      }

      // If bus is stationed, navigate to parking zone
      if (classifiedBus?.classification === 'stationed' && parkingZone && school?.location) {
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
        const popup = popups.current.get(busId);
        if (popup && map.current) {
          popup.setLngLat([targetLng!, targetLat!]).addTo(map.current);
        }
      }, 600); // Délai court pour attendre la fin de l'animation flyTo
    },
    [mapLoaded, processedBuses, stationedBuses, school, parkingZone]
  );

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

  // Créer le HTML du popup - VERSION SIMPLIFIÉE Phase 4 avec tracking ramassage
  const createPopupHTML = useCallback(
    async (bus: ClassifiedBus): Promise<string> => {
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
              studentName: nextStudent.studentName
            };
          }
        } catch (error) {
          console.error('Error fetching next student:', error);
        }
      }

      // Calculer la durée du trajet
      const tripDuration = bus.tripStartTime 
        ? formatDurationFromMs(Date.now() - bus.tripStartTime) 
        : undefined;

      // Générer callback pour centrer sur le bus (sera attaché au window)
      const centerCallbackId = `centerOnBus_${bus.id}`;

      // Utiliser le helper pour générer le popup simplifié
      return generateSimplifiedBusPopupHTML({
        busNumber: bus.number,
        busStatus: bus.liveStatus,
        driverName: bus.driver?.name,
        driverPhone: bus.driver?.phone,
        scannedCount: counts.scanned,
        totalCount: counts.total,
        onCenterClick: `window.${centerCallbackId} && window.${centerCallbackId}()`,

        // NOUVEAUX champs Phase 4
        lastScan: lastScanInfo,
        nextStudent: nextStudentInfo,
        speed: bus.currentPosition?.speed,
        tripDuration,
      });
    },
    [studentsCounts]
  );

  const attachPopupCloseHandler = useCallback((popup: mapboxgl.Popup) => {
    const popupElement = popup.getElement();
    if (!popupElement) return;
    const closeButton = popupElement.querySelector('.bus-popup-close') as HTMLButtonElement | null;
    if (!closeButton) return;
    closeButton.onclick = (event) => {
      event.stopPropagation();
      popup.remove();
    };
  }, []);

  // Ref pour stocker les données temps réel des bus (tripType, tripStartTime)
  const busRealtimeDataRef = useRef<Map<string, { tripType: string | null; tripStartTime: number | null }>>(new Map());

  // Mettre à jour la ref quand schoolBuses change
  useEffect(() => {
    schoolBuses.forEach((bus) => {
      busRealtimeDataRef.current.set(bus.id, {
        tripType: bus.tripType ?? null,
        tripStartTime: bus.tripStartTime ?? null,
      });
    });
  }, [schoolBuses]);

  // Écouter les changements d'attendance en temps réel pour chaque bus
  useEffect(() => {
    if (schoolBuses.length === 0) {
      return;
    }

    const unsubscribes: (() => void)[] = [];
    const busStudentsMap = new Map<string, number>(); // Map pour stocker le total d'élèves par bus

    // Récupérer d'abord le total d'élèves pour chaque bus (one-shot)
    const fetchBusStudentsTotals = async () => {
      const promises = schoolBuses.map(async (bus) => {
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
      schoolBuses.forEach((bus) => {
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
            
            // #region agent log
            // #endregion
            
            const isAttendanceScanned = (a: typeof attendance[number]) => {
              const isPresent =
                a.status === 'present' ||
                a.morningStatus === 'present' ||
                a.eveningStatus === 'present';

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
  }, [schoolBuses]);

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

    return () => {
      delete (window as any).focusBusFromParkingZone;
    };
  }, [focusBusOnMap]);

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

  const animateMarkerToPosition = useCallback(
    (
      busId: string,
      marker: mapboxgl.Marker,
      targetLat: number,
      targetLng: number,
      targetTimestamp: number | null
    ) => {
      if (isMapInteracting.current || map.current?.isMoving() || map.current?.isZooming()) {
        marker.setLngLat([targetLng, targetLat]);
        markerMotionRef.current.set(busId, {
          lat: targetLat,
          lng: targetLng,
          timestamp: targetTimestamp,
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
      let durationMs = 1200;
      if (
        typeof targetTimestamp === 'number' &&
        typeof previousTimestamp === 'number' &&
        targetTimestamp > previousTimestamp
      ) {
        const deltaMs = targetTimestamp - previousTimestamp;
        durationMs = Math.min(Math.max(deltaMs, 600), 10000);
      }
      const startTime = performance.now();

      const step = (currentTime: number) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / durationMs, 1);
        const lat = fromLat + (targetLat - fromLat) * progress;
        const lng = fromLng + (targetLng - fromLng) * progress;
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
        lat: targetLat,
        lng: targetLng,
        timestamp: targetTimestamp,
      });
    },
    []
  );

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
        animateMarkerToPosition(busId, marker, lat, lng, targetTimestamp);

        // Mettre à jour le HTML du marqueur (pour le changement de couleur)
        const el = marker.getElement();
        el.innerHTML = createMarkerHTML(bus);

        // Mettre à jour le popup (async)
        if (popups.current.has(busId)) {
          const popup = popups.current.get(busId)!;
          createPopupHTML(bus).then(html => {
            popup.setHTML(html);
            attachPopupCloseHandler(popup);
          });
        }
      } else {
        // Créer un nouveau marqueur
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = createMarkerHTML(bus);

        // Créer le popup (async)
        createPopupHTML(bus).then(html => {
          const popup = new mapboxgl.Popup({
            offset: 25,
            closeButton: false,
            closeOnClick: false,
          }).setHTML(html);

          // Tracker le popup quand il est ouvert
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

          // Cleanup quand popup fermé
          popup.on('close', () => {
            setActivePopupBusId(null);
          });

          popups.current.set(busId, popup);

          const marker = new mapboxgl.Marker(el)
            .setLngLat([lng, lat])
            .setPopup(popup)
            .addTo(map.current!);

          markers.current.set(busId, marker);
          markerMotionRef.current.set(busId, {
            lat,
            lng,
            timestamp: getBusPositionTimestamp(bus),
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

  const realtimeUpdateLabel = lastRealtimeUpdate
    ? formatDurationFromMs(Date.now() - lastRealtimeUpdate)
    : '—';

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
          <span>{isRealtimeConnected ? 'Firebase connecté' : 'Firebase hors ligne'}</span>
          <span style={{ fontWeight: 600, opacity: 0.85 }}>Maj: {realtimeUpdateLabel}</span>
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

        <button
          type="button"
          className="student-stops-toggle"
          disabled={studentsLoading}
          onClick={() => setShowStudentStops((prev) => !prev)}
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            zIndex: 1,
            backgroundColor: showStudentStops ? '#3b82f6' : 'white',
            color: showStudentStops ? 'white' : '#0f172a',
            padding: '10px 16px',
            borderRadius: '8px',
            border: showStudentStops ? '2px solid transparent' : '2px solid #e5e7eb',
            fontWeight: 600,
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: showStudentStops ? '0 2px 10px rgba(59,130,246,0.35)' : '0 2px 8px rgba(0,0,0,0.1)',
            transform: showStudentStops ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
            opacity: studentsLoading ? 0.85 : 1,
          }}
        >
          <MapPin size={16} />
          {studentsLoading ? 'Chargement...' : showStudentStops ? 'Masquer arrêts' : 'Afficher arrêts'}
          {studentsLoading && <span className="student-stops-spinner" aria-hidden="true" />}
        </button>

        {showStudentStops && !selectedBusId && (
          <div className="student-stops-hint">
            Sélectionnez un bus pour afficher les arrêts.
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
        totalBusCount={schoolBuses.length}
        enCourseCount={fleetEnCourseCount}
        atSchoolCount={fleetAtSchoolCount}
        onFocusBus={focusBusOnMap}
      />
    </div>
  );
};
