/**
 * Page God View - Tour de Contrôle (Management by Exception)
 * Carte temps réel + Sidebar alertes critiques uniquement
 */

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { AlertsSidebar } from '@/components/AlertsSidebar';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSchoolBuses } from '@/hooks/useSchool';
import { useRealtimeAlerts } from '@/hooks/useRealtimeAlerts';
import { BusLiveStatus, type BusRealtimeData } from '@/types/realtime';
import { watchBusAttendance, getBusStudents } from '@/services/students.firestore';

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

// Timeout pour considérer un bus comme "en route" même sans GPS récent (2 minutes)
const GPS_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutes

const isBusEnCourse = (bus: BusRealtimeData): boolean => {
  // Si le statut est explicitement EN_ROUTE ou DELAYED, le bus est en course
  if (bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED) {
    return true;
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
        fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:isBusEnCourse',message:'No GPS but checking lastUpdate',data:{busId:bus.id,liveStatus:bus.liveStatus,timeSinceLastUpdate,wasRecentlyUpdated:timeSinceLastUpdate < GPS_TIMEOUT_MS,isArrived:bus.liveStatus === BusLiveStatus.ARRIVED,result:timeSinceLastUpdate < GPS_TIMEOUT_MS && bus.liveStatus !== BusLiveStatus.ARRIVED},timestamp:Date.now(),sessionId:'debug-session',runId:'run-gps-timeout-fix-v2',hypothesisId:'GPS_TIMEOUT_FIX_V2'})}).catch(()=>{});
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
  fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:isBusEnCourse',message:'Checking if bus is en course with GPS',data:{busId:bus.id,liveStatus:bus.liveStatus,hasGPS:!!bus.currentPosition,timeSinceLastGPS,wasRecentlyEnRoute,isArrived:bus.liveStatus === BusLiveStatus.ARRIVED,result:wasRecentlyEnRoute && bus.liveStatus !== BusLiveStatus.ARRIVED},timestamp:Date.now(),sessionId:'debug-session',runId:'run-gps-timeout-fix-v2',hypothesisId:'GPS_TIMEOUT_FIX_V2'})}).catch(()=>{});
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
  bus.liveStatus === BusLiveStatus.ARRIVED || bus.liveStatus === BusLiveStatus.STOPPED;

const isBusStationed = (bus: BusRealtimeData): boolean =>
  bus.liveStatus === BusLiveStatus.STOPPED || bus.liveStatus === BusLiveStatus.IDLE;

// Token Mapbox depuis les variables d'environnement
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Centre par défaut (localisation de l'école)
const ABIDJAN_CENTER: [number, number] = [-3.953921037595442, 5.351860986707333];
const STATIONED_DISTANCE_THRESHOLD_METERS = 150;
const TRIP_TYPE_LABELS: Record<string, string> = {
  morning_outbound: 'Matin - Récupérer les élèves',
  midday_outbound: 'Midi - Déposer les élèves',
  midday_return: 'Après-midi - Récupérer les élèves',
  evening_return: 'Soir - Déposer les élèves',
};

const formatTripTypeLabel = (tripType?: string | null, tripLabel?: string | null): string | null => {
  if (tripLabel && tripLabel.trim().length > 0) return tripLabel;
  if (tripType && TRIP_TYPE_LABELS[tripType]) {
    return TRIP_TYPE_LABELS[tripType];
  }
  return tripType ?? null;
};

const formatDurationFromMs = (durationMs: number | null | undefined): string => {
  if (durationMs == null || durationMs < 0) return '—';
  if (durationMs < 60000) return '< 1 min';
  const totalMinutes = Math.floor(durationMs / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours <= 0) {
    return `${totalMinutes} min`;
  }
  return `${hours}h${minutes.toString().padStart(2, '0')}`;
};

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
    !bus.isActive;

  const classification: 'stationed' | 'deployed' =
    isNearSchool && stationaryStatus ? 'stationed' : 'deployed';

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
  const popups = useRef<Map<string, mapboxgl.Popup>>(new Map());
  const schoolMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const parkingZoneMarker = useRef<mapboxgl.Marker | null>(null);
  const parkingZonePopup = useRef<mapboxgl.Popup | null>(null);
  const initialCenterRef = useRef<[number, number]>(
    school?.location ? [school.location.lng, school.location.lat] : ABIDJAN_CENTER
  );

  const [mapLoaded, setMapLoaded] = useState(false);
  const { alerts: realtimeAlerts, error: alertsError } = useRealtimeAlerts();
  
  // Stocker les comptages d'élèves pour chaque bus
  const [studentsCounts, setStudentsCounts] = useState<
    Record<string, { scanned: number; unscanned: number; total: number }>
  >({});
  
  // Suivre l'état local du statut pour éviter le flickering
  const localStatusRef = useRef<Map<string, BusLiveStatus>>(new Map());

  const processedBuses: ClassifiedBus[] = useMemo(() => {
    return schoolBuses
      .filter((bus) => (isBusEnCourse(bus) || isBusAtSchool(bus)) && bus.isActive)
      .map((bus) => {
        fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:156',message:'Processing bus - entry',data:{busId:bus.id,busLiveStatus:bus.liveStatus,localStatus:localStatusRef.current.get(bus.id),isActive:bus.isActive},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});

        const { classification, distance } = classifyBus(bus, school?.location);
        const effectiveLiveStatus = localStatusRef.current.get(bus.id) ?? bus.liveStatus;

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

        fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:248',message:'Final effectiveLiveStatus for bus',data:{busId:bus.id,effectiveLiveStatus,firestoreStatus:bus.liveStatus,localStatus:localStatusRef.current.get(bus.id),hasArrived},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});

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

  useEffect(() => {
    if (alertsError) {
      console.error('❌ Impossible de charger les alertes temps réel:', alertsError);
    }
  }, [alertsError]);

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
    }, 60000); // Nettoyage toutes les 60 secondes

    return () => clearInterval(cleanupInterval);
  }, [schoolBuses]);

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
      style: 'mapbox://styles/mapbox/dark-v11', // Style sombre avec fond noir/gris foncé
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

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Ajouter les contrôles de navigation
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [initialCenterRef]);

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

    if (bus.liveStatus === BusLiveStatus.DELAYED) return '#f97316'; // Orange (retard)
    if (bus.classification === 'stationed') return '#ef4444'; // Rouge (à l'école)
    if (bus.liveStatus === BusLiveStatus.EN_ROUTE) return '#3b82f6'; // Bleu électrique (en cours) - meilleur contraste sur fond clair

    return '#3b82f6'; // Bleu par défaut
  }, []);

  // Créer le HTML du marqueur de zone de stationnement
  const createParkingZoneMarkerHTML = useCallback((count: number): string => {
    return `
      <div class="parking-zone-marker">
        <div class="parking-icon-container">
          <svg class="parking-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M8 8h4a3 3 0 0 1 0 6H8V8z" />
            <line x1="8" y1="8" x2="8" y2="17" />
          </svg>
        </div>
        <div class="bus-count-badge">${count}</div>
      </div>
    `;
  }, []);

  // Créer le HTML du marqueur avec flèche directionnelle
  const createMarkerHTML = useCallback((bus: ClassifiedBus): string => {
    const color = getMarkerColor(bus);
    
    // Calculer l'angle de rotation basé sur la direction du bus vers l'école
    let rotationAngle = 0;
    if (bus.currentPosition?.heading !== undefined) {
      // Heading GPS : 0 = Nord, 90 = Est, 180 = Sud, 270 = Ouest
      // CSS rotate : 0 = Nord (haut), 90 = Est (droite), 180 = Sud (bas), 270 = Ouest (gauche)
      rotationAngle = bus.currentPosition.heading;
    } else if (bus.displayPosition && school?.location) {
      // Calculer l'angle vers l'école
      // dx = différence en longitude (Est-Ouest)
      // dy = différence en latitude (Nord-Sud)
      const dx = school.location.lng - bus.displayPosition.lng;
      const dy = school.location.lat - bus.displayPosition.lat;
      
      // Math.atan2(dy, dx) retourne un angle où :
      // - 0° = Est (dx > 0, dy = 0)
      // - 90° = Nord (dx = 0, dy > 0)
      // - 180° = Ouest (dx < 0, dy = 0)
      // - -90° = Sud (dx = 0, dy < 0)
      // Pour CSS rotate où 0° = Nord, on doit convertir :
      // angle = atan2(dy, dx) - 90° (pour avoir 0° = Nord)
      const angleRadians = Math.atan2(dy, dx);
      rotationAngle = (angleRadians * 180) / Math.PI - 90;
      
      // Normaliser entre 0 et 360
      if (rotationAngle < 0) {
        rotationAngle += 360;
      }
    }
    
    // Icône de bus avec flèche directionnelle (plus visible)
    const busIcon = `
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="white">
        <!-- Flèche directionnelle pointant vers le haut (sera rotée selon la direction) -->
        <path d="M12 1 L18 9 L15 9 L15 18 C15 19.1 14.1 20 13 20 L11 20 C9.9 20 9 19.1 9 18 L9 9 L6 9 Z" fill="white" stroke="none"/>
        <!-- Cercle pour le bus (base) -->
        <circle cx="12" cy="20" r="2.5" fill="white"/>
      </svg>
    `;

    // Animation de clignotement pour les bus en retard critique
    const isBlinking = bus.liveStatus === BusLiveStatus.DELAYED;

    return `
      <div class="bus-marker ${isBlinking ? 'animate-pulse' : ''}" style="background-color: ${color}; transform: rotate(${rotationAngle}deg);">
        ${busIcon}
      </div>
    `;
  }, [getMarkerColor, school]);

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

  const focusBusOnMap = useCallback(
    (busId: string) => {
      if (!map.current || !mapLoaded) return;

      const classifiedBus = processedBuses.find((bus) => bus.id === busId);
      const fallbackBus = stationedBuses.find((bus) => bus.id === busId);
      const targetBus = classifiedBus ?? fallbackBus;

      if (!targetBus) return;

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

  // Helper pour formater le temps écoulé depuis un timestamp
  const formatTimeSince = useCallback((timestamp: number): string => {
    const now = Date.now();
    const diffMs = now - timestamp;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);

    if (diffMins < 1) return "à l'instant";
    if (diffMins < 60) return `il y a ${diffMins} min`;
    if (diffHours < 24) return `il y a ${diffHours}h`;
    return `il y a ${Math.floor(diffHours / 24)}j`;
  }, []);

  // Créer le HTML du popup de la zone de stationnement
  const createParkingZonePopupHTML = useCallback(
    (zone: ParkingZone): string => {
      const busItemsHTML = zone.stationedBuses
        .map((bus) => {
          const tripTypeLabel = bus.tripType
            ? TRIP_TYPE_LABELS[bus.tripType] || bus.tripType
            : 'Aucune course récente';

          const tripTime = bus.tripStartTime ? formatTimeSince(bus.tripStartTime) : 'N/A';

          const driverName = bus.driver?.name || 'Aucun conducteur';

          return `
            <div class="parking-bus-item" data-bus-id="${bus.id}">
              <div class="bus-info-row">
                <span class="bus-number-pill">${bus.number}</span>
                <span class="driver-name-text">${driverName}</span>
              </div>
              <div class="trip-info-row">
                <div class="trip-type-label">
                  <svg class="trip-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                  </svg>
                  <span>${tripTypeLabel}</span>
                </div>
                ${
                  bus.tripStartTime
                    ? `<span class="trip-time-text">Terminé ${tripTime}</span>`
                    : ''
                }
              </div>
              <button
                class="view-bus-details-btn"
                onclick="window.focusBusFromParkingZone('${bus.id}')"
              >
                Voir détails →
              </button>
            </div>
          `;
        })
        .join('');

      return `
        <div class="parking-zone-popup">
          <div class="popup-header-parking">
            <div class="header-left">
              <svg class="parking-icon-header" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M8 8h4a3 3 0 0 1 0 6H8V8z" />
                <line x1="8" y1="8" x2="8" y2="17" />
              </svg>
              <h3 class="parking-title">Zone de Stationnement</h3>
            </div>
            <span class="bus-count-badge-header">${zone.count} bus</span>
          </div>

          <div class="bus-list-container">
            ${busItemsHTML}
          </div>
        </div>
      `;
    },
    [formatTimeSince]
  );

  // Créer le HTML du popup - VERSION SIMPLIFIÉE avec hiérarchie visuelle claire
  const createPopupHTML = useCallback(
    (bus: ClassifiedBus): string => {
      const tripLabel = formatTripTypeLabel(bus.tripType, bus.tripLabel) ?? 'Non défini';
      const tripDuration =
        typeof bus.tripStartTime === 'number'
          ? formatDurationFromMs(Date.now() - bus.tripStartTime)
          : '—';

      // Récupérer les comptages d'élèves pour ce bus
      const counts = studentsCounts[bus.id] || { scanned: 0, unscanned: 0, total: 0 };

      // Statut avec icône
      const getStatusBadge = () => {
        if (bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED) {
          const color = bus.liveStatus === BusLiveStatus.DELAYED ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800';
          const label = bus.liveStatus === BusLiveStatus.DELAYED ? 'En retard' : 'En course';
          return `<span class="px-2 py-1 ${color} rounded-full text-xs font-semibold">${label}</span>`;
        }
        return `<span class="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold">Stationné</span>`;
      };

      return `
      <div class="p-3 min-w-[200px] max-w-[280px]">
        <!-- Header compact avec numéro bus + statut -->
        <div class="flex items-center justify-between mb-3 pb-2 border-b border-slate-200">
          <h3 class="text-xl font-bold text-slate-900">${bus.number}</h3>
          ${getStatusBadge()}
        </div>

        <!-- Section CRITIQUE : Élèves (si en course) -->
        ${
          (bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED)
            ? `
        <div class="mb-3 p-2.5 bg-primary-50 border border-primary-100 rounded-lg">
          <div class="flex items-center justify-between mb-1.5">
            <span class="text-xs font-bold text-primary-900 uppercase tracking-wide">Élèves</span>
            <span class="text-xs font-semibold text-slate-600">${counts.total} / ${bus.capacity}</span>
          </div>
          <div class="grid grid-cols-2 gap-2 text-sm">
            <div class="text-center">
              <div class="text-xl font-bold text-green-600">${counts.scanned}</div>
              <div class="text-[10px] text-slate-600 uppercase">À bord</div>
            </div>
            <div class="text-center">
              <div class="text-xl font-bold ${counts.unscanned > 0 ? 'text-red-600' : 'text-slate-400'}">${counts.unscanned}</div>
              <div class="text-[10px] text-slate-600 uppercase">Manquants</div>
            </div>
          </div>
        </div>
        `
            : ''
        }

        <!-- Infos secondaires -->
        <div class="space-y-2 text-xs">
          ${
            bus.driver
              ? `
          <div class="flex items-start gap-2">
            <svg class="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z"/></svg>
            <div class="flex-1 min-w-0">
              <p class="font-medium text-slate-900 truncate">${bus.driver.name}</p>
              <p class="text-slate-500 text-[11px]">${bus.driver.phone}</p>
            </div>
          </div>
          `
              : ''
          }

          <div class="pt-2 border-t border-slate-200">
            <div class="flex justify-between mb-1">
              <span class="text-slate-500">Course</span>
              <span class="font-semibold text-slate-800">${tripLabel}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-slate-500">Durée</span>
              <span class="font-semibold text-slate-800">${tripDuration}</span>
            </div>
          </div>
        </div>
      </div>
    `;
    },
    [studentsCounts]
  );

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

    const today = new Date().toISOString().split('T')[0];
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
        const unsubscribe = watchBusAttendance(
          bus.id,
          today,
          (attendance) => {
            // Récupérer les données temps réel actuelles depuis la ref
            const realtimeData = busRealtimeDataRef.current.get(bus.id);
            const currentTripType = realtimeData?.tripType ?? null;
            const currentTripStartTime = realtimeData?.tripStartTime ?? null;
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:calculateScanned',message:'Calculating scanned students with ref data',data:{busId:bus.id,currentTripType,currentTripStartTime,fromRef:!!realtimeData,attendanceCount:attendance.length,attendanceRecords:attendance.map(a=>({studentId:a.studentId,tripType:a.tripType,timestamp:a.timestamp,morningStatus:a.morningStatus,eveningStatus:a.eveningStatus}))},timestamp:Date.now(),sessionId:'debug-session',runId:'run2',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            
            const scanned = attendance.filter((a) => {
              // Si pas de tripType défini, ne considérer aucun élève comme scanné
              if (!currentTripType) return false;
              
              // Vérifier que le record correspond au tripType actuel
              if (a.tripType && a.tripType !== currentTripType) {
                return false;
              }
              
              // Vérifier que le record a été créé après le début de la course actuelle
              if (currentTripStartTime && a.timestamp) {
                if (a.timestamp < currentTripStartTime) {
                  // #region agent log
                  fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:filterAttendance',message:'Record rejected - before tripStart',data:{busId:bus.id,studentId:a.studentId,recordTimestamp:a.timestamp,currentTripStartTime},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
                  // #endregion
                  return false;
                }
              }
              
              // Selon le type de trajet, vérifier le bon statut
              if (currentTripType === 'morning_outbound' || currentTripType === 'midday_return') {
                // Trajets du matin/midi-retour : vérifier morningStatus
                return a.morningStatus === 'present';
              } else if (currentTripType === 'midday_outbound' || currentTripType === 'evening_return') {
                // Trajets du midi/soir : vérifier eveningStatus
                return a.eveningStatus === 'present';
              }
              
              // Fallback : vérifier les deux statuts si tripType non reconnu
              return a.morningStatus === 'present' || a.eveningStatus === 'present';
            }).length;
            
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:finalScanned',message:'Final scanned count',data:{busId:bus.id,scannedCount:scanned},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
            // #endregion

            // Le total d'élèves du bus (récupéré précédemment)
            const total = busStudentsMap.get(bus.id) || 0;
            const unscanned = Math.max(0, total - scanned);

            // Mettre à jour les comptages pour ce bus
            setStudentsCounts((prev) => ({
              ...prev,
              [bus.id]: { scanned, unscanned, total },
            }));
          },
          (error) => {
            console.error(`Erreur lors de l'écoute de l'attendance pour le bus ${bus.id}:`, error);
          }
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
      // Remove old parking zone marker
      if (parkingZoneMarker.current) {
        parkingZoneMarker.current.remove();
      }

      // Décalage du parking à côté de l'école (environ 80 mètres à l'est)
      // 1 degré de longitude ≈ 111km à l'équateur, donc 0.0007° ≈ 80m
      const parkingOffset = 0.0007;
      const parkingLng = school.location.lng + parkingOffset;
      const parkingLat = school.location.lat;

      // Create parking zone marker element
      const parkingEl = document.createElement('div');
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

    // 3. UPDATE individual bus markers (EXCLUDE stationed buses)
    const deployedBuses = processedBuses.filter((bus) => bus.classification === 'deployed');

    deployedBuses.forEach((bus) => {
      if (!bus.displayPosition) return;

      const { lat, lng } = bus.displayPosition;
      const busId = bus.id;

      // Si le marqueur existe déjà, le mettre à jour
      if (markers.current.has(busId)) {
        const marker = markers.current.get(busId)!;
        marker.setLngLat([lng, lat]);

        // Mettre à jour le HTML du marqueur (pour le changement de couleur)
        const el = marker.getElement();
        el.innerHTML = createMarkerHTML(bus);

        // Mettre à jour le popup
        if (popups.current.has(busId)) {
          const popup = popups.current.get(busId)!;
          popup.setHTML(createPopupHTML(bus));
        }
      } else {
        // Créer un nouveau marqueur
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = createMarkerHTML(bus);

        // Créer le popup
        const popup = new mapboxgl.Popup({
          offset: 25,
          closeButton: true,
          closeOnClick: false,
        }).setHTML(createPopupHTML(bus));

        popups.current.set(busId, popup);

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(popup)
          .addTo(map.current!);

        markers.current.set(busId, marker);
      }
    });

    // Supprimer les marqueurs des bus qui ne sont plus dans la liste des bus déployés
    markers.current.forEach((marker, busId) => {
      if (!deployedBuses.find((b) => b.id === busId)) {
        marker.remove();
        markers.current.delete(busId);
        popups.current.delete(busId);
      }
    });
  }, [processedBuses, mapLoaded, createMarkerHTML, createPopupHTML, studentsCounts, parkingZone, school, createParkingZoneMarkerHTML, createParkingZonePopupHTML]);

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

      <style>{`
        .bus-marker {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          color: white;
        }

        .bus-marker:hover {
          transform: scale(1.15);
          box-shadow: 0 8px 20px rgba(0,0,0,0.35);
        }

        /* Parking Zone Marker Styles */
        .parking-zone-marker {
          width: 60px;
          height: 60px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          position: relative;
        }

        .parking-icon-container {
          width: 52px;
          height: 52px;
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
          border: 3px solid white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 12px rgba(0,0,0,0.25);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .parking-zone-marker:hover .parking-icon-container {
          transform: scale(1.15);
          box-shadow: 0 8px 20px rgba(0,0,0,0.35);
        }

        .parking-icon {
          width: 28px;
          height: 28px;
          color: white;
        }

        .bus-count-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background: #ef4444;
          color: white;
          font-weight: 700;
          font-size: 12px;
          padding: 4px 8px;
          border-radius: 12px;
          border: 2px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.2);
          min-width: 24px;
          text-align: center;
        }

        /* Parking Zone Popup Styles */
        .parking-zone-popup {
          min-width: 320px;
          max-width: 400px;
          font-family: system-ui, -apple-system, sans-serif;
        }

        .popup-header-parking {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 16px;
          background: linear-gradient(135deg, #475569 0%, #334155 100%);
          color: white;
          border-radius: 8px 8px 0 0;
          margin: -15px -15px 0 -15px;
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .parking-icon-header {
          width: 24px;
          height: 24px;
          color: white;
        }

        .parking-title {
          font-size: 16px;
          font-weight: 700;
          margin: 0;
        }

        .bus-count-badge-header {
          background: rgba(255,255,255,0.25);
          color: white;
          font-weight: 700;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 12px;
          border: 1px solid rgba(255,255,255,0.4);
        }

        .bus-list-container {
          max-height: 400px;
          overflow-y: auto;
          padding: 12px 0;
        }

        .parking-bus-item {
          padding: 14px 16px;
          border-bottom: 1px solid #e5e7eb;
          transition: background-color 0.15s;
        }

        .parking-bus-item:last-child {
          border-bottom: none;
        }

        .parking-bus-item:hover {
          background-color: #f9fafb;
        }

        .bus-info-row {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .bus-number-pill {
          background: #475569;
          color: white;
          font-weight: 700;
          font-size: 12px;
          padding: 4px 10px;
          border-radius: 6px;
        }

        .driver-name-text {
          color: #374151;
          font-weight: 500;
          font-size: 14px;
        }

        .trip-info-row {
          display: flex;
          flex-direction: column;
          gap: 4px;
          margin-bottom: 10px;
        }

        .trip-type-label {
          display: flex;
          align-items: center;
          gap: 6px;
          color: #6b7280;
          font-size: 13px;
        }

        .trip-icon {
          color: #9ca3af;
        }

        .trip-time-text {
          color: #9ca3af;
          font-size: 12px;
          font-style: italic;
        }

        .view-bus-details-btn {
          width: 100%;
          padding: 8px 12px;
          background: white;
          border: 1.5px solid #475569;
          color: #475569;
          font-weight: 600;
          font-size: 13px;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .view-bus-details-btn:hover {
          background: #475569;
          color: white;
        }

        /* Highlight animation for bus item */
        @keyframes highlight-pulse {
          0%, 100% { background-color: #f9fafb; }
          50% { background-color: #dbeafe; }
        }

        .highlight-bus {
          animation: highlight-pulse 0.6s ease-in-out 3;
        }

        /* Améliorer la visibilité du bouton de fermeture des popups Mapbox */
        .mapboxgl-popup-close-button {
          font-size: 24px !important;
          width: 32px !important;
          height: 32px !important;
          line-height: 32px !important;
          color: #1e293b !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 0 8px 0 4px !important;
          opacity: 1 !important;
          transition: all 0.2s !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
        }

        .mapboxgl-popup-close-button:hover {
          background: #ef4444 !important;
          color: white !important;
          transform: scale(1.1) !important;
        }

        /* Style du popup pour parking zone */
        .mapboxgl-popup-content {
          padding: 0 !important;
          border-radius: 8px !important;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2) !important;
        }

        /* Améliorer le contraste du popup */
        .parking-zone-popup .mapboxgl-popup-content {
          background: white !important;
        }

        /* Centrer le popup de parking sur la page */
        .parking-popup-centered .mapboxgl-popup-content {
          position: fixed !important;
          top: 50% !important;
          left: 50% !important;
          transform: translate(-50%, -50%) !important;
          z-index: 1000 !important;
        }

        .parking-popup-centered .mapboxgl-popup-tip {
          display: none !important;
        }
      `}</style>
    </div>
  );
};
