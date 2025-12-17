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
import {
  simulateBusTrajectoryToSchool,
} from '@/utils/busPositionSimulator';
import { watchBusAttendance, getBusStudents } from '@/services/students.firestore';

type ClassifiedBus = BusRealtimeData & {
  classification: 'stationed' | 'deployed';
  distanceFromSchool: number | null;
  displayPosition: { lat: number; lng: number } | null;
  hasArrived?: boolean; // Flag pour indiquer si le bus est arrivé
};

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

const isBusAtSchool = (bus: BusRealtimeData): boolean => bus.liveStatus === BusLiveStatus.ARRIVED;

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
  const initialCenterRef = useRef<[number, number]>(
    school?.location ? [school.location.lng, school.location.lat] : ABIDJAN_CENTER
  );

  const [mapLoaded, setMapLoaded] = useState(false);
  const { alerts: realtimeAlerts, error: alertsError } = useRealtimeAlerts();
  
  // Stocker les comptages d'élèves pour chaque bus
  const [studentsCounts, setStudentsCounts] = useState<
    Record<string, { scanned: number; unscanned: number; total: number }>
  >({});
  
  // État pour forcer la mise à jour des positions simulées
  const [simulationTick, setSimulationTick] = useState(0);

  // Suivre l'état local du statut pour éviter le flickering
  const localStatusRef = useRef<Map<string, BusLiveStatus>>(new Map());

  const processedBuses: ClassifiedBus[] = useMemo(() => {
    return schoolBuses
      // Filtrer : conserver uniquement les bus en course ou à l'école
      .filter((bus) => (isBusEnCourse(bus) || isBusAtSchool(bus)) && bus.isActive)
      .map((bus) => {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:156',message:'Processing bus - entry',data:{busId:bus.id,busLiveStatus:bus.liveStatus,localStatus:localStatusRef.current.get(bus.id),isActive:bus.isActive},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        const { classification, distance } = classifyBus(bus, school?.location);
        
        // Déterminer la position d'affichage
        let displayPosition: { lat: number; lng: number } | null = null;
        let hasArrived = false;
        
        if (school?.location) {
          // Calculer la progression du bus vers l'école
          // Chaque bus a une vitesse différente basée sur son ID
          const seed = bus.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
          const busSpeed = 0.02 + (seed % 100) / 100 * 0.03; // Vitesse entre 0.02 et 0.05 par tick
          
          // Progress va de 0 (quartier) à 1 (école), puis recommence
          // Le cycle complet dure environ 20-50 ticks (100-250 secondes)
          const cycleLength = Math.floor(1 / busSpeed);
          const progress = (simulationTick % cycleLength) * busSpeed;
          
          // Utiliser le statut local si disponible, sinon le statut Firestore
          const effectiveStatus = localStatusRef.current.get(bus.id) ?? bus.liveStatus;
          
          // #region agent log
          fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:179',message:'Effective status calculated',data:{busId:bus.id,effectiveStatus,firestoreStatus:bus.liveStatus,localStatus:localStatusRef.current.get(bus.id),progress:progress.toFixed(3)},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'MANUAL_ARRIVAL'})}).catch(()=>{});
          // #endregion
          
          // Si le bus est arrivé (statut ARRIVED défini manuellement), afficher à l'école
          if (effectiveStatus === BusLiveStatus.ARRIVED) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:185',message:'Bus is ARRIVED - displaying at school',data:{busId:bus.id,effectiveStatus},timestamp:Date.now(),sessionId:'debug-session',runId:'run3',hypothesisId:'MANUAL_ARRIVAL'})}).catch(()=>{});
            // #endregion
            displayPosition = school.location;
            hasArrived = true;
          } else {
            // Si le bus a une position réelle, l'utiliser comme point de départ
            if (bus.currentPosition) {
              // Interpoler entre la position réelle et l'école
              const realProgress = Math.min(progress * 2, 1); // Plus rapide si position réelle
              displayPosition = {
                lat: bus.currentPosition.lat + (school.location.lat - bus.currentPosition.lat) * realProgress,
                lng: bus.currentPosition.lng + (school.location.lng - bus.currentPosition.lng) * realProgress,
              };
            } else {
              // Simuler la trajectoire depuis un quartier vers l'école
              displayPosition = simulateBusTrajectoryToSchool(school.location, bus.id, progress);
            }
          }
        }
        
        // Si aucune position calculée, fallback sur la position réelle si dispo,
        // sinon sur l'école ou le centre par défaut pour éviter les null
        if (!displayPosition) {
          if (bus.currentPosition) {
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
        }
        
        // Utiliser le statut local si disponible
        const effectiveLiveStatus = localStatusRef.current.get(bus.id) ?? bus.liveStatus;
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/96abddaa-2d2c-404e-bd87-d80d66843adb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'GodViewPage.tsx:248',message:'Final effectiveLiveStatus for bus',data:{busId:bus.id,effectiveLiveStatus,firestoreStatus:bus.liveStatus,localStatus:localStatusRef.current.get(bus.id),hasArrived},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
        // #endregion
        
        return {
          ...bus,
          liveStatus: effectiveLiveStatus, // Utiliser le statut local pour éviter le flickering
          classification,
          distanceFromSchool: distance,
          displayPosition,
          hasArrived, // Ajouter un flag pour indiquer l'arrivée
        };
      });
  }, [schoolBuses, school, simulationTick]);

  const stationedBuses = useMemo(() => {
    return schoolBuses.filter((bus) => bus.isActive && isBusStationed(bus));
  }, [schoolBuses]);

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

  // Animation de simulation de mouvement pour les bus EN_ROUTE
  useEffect(() => {
    const interval = setInterval(() => {
      // Mettre à jour le tick de simulation toutes les 5 secondes
      setSimulationTick((prev) => prev + 1);
    }, 5000); // Mise à jour toutes les 5 secondes

    return () => clearInterval(interval);
  }, []);

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

  // Créer le HTML du popup
  const createPopupHTML = useCallback(
    (bus: ClassifiedBus): string => {
      const distanceLabel =
        typeof bus.distanceFromSchool === 'number'
          ? `${Math.round(bus.distanceFromSchool)} m`
          : 'N/A';
      const classificationLabel =
        bus.classification === 'stationed' ? "Stationné à l'école" : 'Déployé';
      const tripLabel = formatTripTypeLabel(bus.tripType, bus.tripLabel) ?? 'Non défini';
      const tripDuration =
        typeof bus.tripStartTime === 'number'
          ? formatDurationFromMs(Date.now() - bus.tripStartTime)
          : '—';

      // Récupérer les comptages d'élèves pour ce bus
      const counts = studentsCounts[bus.id] || { scanned: 0, unscanned: 0, total: 0 };

      return `
      <div class="p-4 min-w-[240px]">
        <div class="text-center mb-3 pb-3 border-b border-slate-200">
          <h3 class="text-2xl font-bold text-primary-600">${bus.number}</h3>
        </div>

        <div class="space-y-2.5 text-sm">
          ${
            bus.driver
              ? `
            <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <svg class="w-4 h-4 text-slate-600 flex-shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM12 14a7 7 0 0 0-7 7h14a7 7 0 0 0-7-7Z"/></svg>
              <div class="flex-1 min-w-0">
                <p class="font-medium text-slate-900 truncate">${bus.driver.name}</p>
                <p class="text-slate-500 text-xs">${bus.driver.phone}</p>
              </div>
            </div>
          `
              : `
            <div class="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
              <p class="text-slate-400 text-xs italic">Aucun chauffeur assigné</p>
            </div>
          `
          }

          <div class="space-y-2 p-2.5 bg-primary-50 rounded-lg">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
              <span class="text-primary-700 text-xs font-medium">Élèves</span>
            </div>
            <div class="space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-slate-600">Scannés:</span>
                <span class="font-semibold text-green-600">${counts.scanned}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600">Non scannés:</span>
                <span class="font-semibold text-red-600">${counts.unscanned}</span>
              </div>
              <div class="flex justify-between pt-1 border-t border-primary-200">
                <span class="text-primary-700 font-medium">Total:</span>
                <span class="font-bold text-primary-900">${counts.total} / ${bus.capacity}</span>
              </div>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2">
            <div class="p-2 bg-slate-50 rounded-lg">
              <p class="text-slate-500 text-[11px] uppercase">Type de course</p>
              <p class="font-semibold text-slate-800">${tripLabel}</p>
            </div>
            <div class="p-2 bg-slate-50 rounded-lg">
              <p class="text-slate-500 text-[11px] uppercase">Durée</p>
              <p class="font-semibold text-slate-800">${tripDuration}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-2 text-xs text-slate-600 pt-2">
            <div class="p-2 bg-slate-50 rounded-lg">
              <p class="font-semibold text-slate-800">${classificationLabel}</p>
              <p class="text-slate-500">Statut actuel</p>
            </div>
            <div class="p-2 bg-slate-50 rounded-lg">
              <p class="font-semibold text-slate-800">${distanceLabel}</p>
              <p class="text-slate-500">Distance école</p>
            </div>
          </div>
        </div>
      </div>
    `;
    },
    [studentsCounts]
  );

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
            // Calculer le nombre d'élèves scannés pour le trajet actuel uniquement
            // en fonction du tripType du bus
            const currentTripType = bus.tripType;
            const scanned = attendance.filter((a) => {
              // Si pas de tripType défini, ne considérer aucun élève comme scanné
              if (!currentTripType) return false;
              
              // Vérifier que le record correspond au tripType actuel
              if (a.tripType && a.tripType !== currentTripType) {
                return false;
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

  // Mettre à jour les marqueurs quand les bus changent
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    processedBuses.forEach((bus) => {
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

    // Supprimer les marqueurs des bus qui ne sont plus dans la liste filtrée
    markers.current.forEach((marker, busId) => {
      if (!processedBuses.find((b) => b.id === busId)) {
        marker.remove();
        markers.current.delete(busId);
        popups.current.delete(busId);
      }
    });
  }, [processedBuses, mapLoaded, createMarkerHTML, createPopupHTML, studentsCounts]);

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
      `}</style>
    </div>
  );
};
