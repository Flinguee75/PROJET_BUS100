/**
 * Composant AlertsSidebar - Sidebar des alertes actives
 * Affiche uniquement les problèmes critiques (Management by Exception)
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  CheckCircle2,
  Navigation,
  School,
  Phone,
  MapPin,
  ChevronRight,
  ChevronDown,
  Search,
  GripVertical,
} from 'lucide-react';
import { BusLiveStatus, type BusRealtimeData } from '@/types/realtime';
import type { Alert } from '@/types/alerts';
import { getBusStudents, watchBusAttendance, type Student, type AttendanceRecord } from '@/services/students.firestore';
import { UrgencySection, SafetyRatioBadge } from '@/components/godview';
import { getRecentCoursesWithMissedStudents, type CourseHistory } from '@/services/courseHistory.firestore';

interface AlertsSidebarProps {
  alerts: Alert[];
  buses: BusRealtimeData[];
  stationedBuses?: BusRealtimeData[];
  studentsCounts?: Record<string, { scanned: number; unscanned: number; total: number }>;
  totalBusCount?: number;
  enCourseCount?: number;
  atSchoolCount?: number; // Non utilisé actuellement mais gardé pour compatibilité
  onFocusBus?: (busId: string) => void;
}

// Constantes pour les limites de largeur
const ALERTS_MIN_WIDTH = 280;
const ALERTS_MAX_WIDTH = 600;
const ALERTS_DEFAULT_WIDTH = 384; // w-96 en pixels

export const AlertsSidebar = ({
  alerts,
  buses,
  stationedBuses = [],
  studentsCounts = {},
  totalBusCount,
  enCourseCount,
  atSchoolCount: _atSchoolCount, // Préfixé avec _ car non utilisé actuellement
  onFocusBus,
}: AlertsSidebarProps) => {
  // Largeur de la sidebar (redimensionnable)
  const [width, setWidth] = useState(ALERTS_DEFAULT_WIDTH);
  const isResizingRef = useRef(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Onglet actif : FLOTTE ou ÉLÈVES
  const [activeTab, setActiveTab] = useState<'fleet' | 'students'>('fleet');

  // Gestion du redimensionnement par drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current || !sidebarRef.current) return;

      // Pour une sidebar à droite, on calcule la largeur depuis le bord droit de la fenêtre
      const newWidth = window.innerWidth - e.clientX;

      // Contraintes de largeur
      if (newWidth >= ALERTS_MIN_WIDTH && newWidth <= ALERTS_MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handleMouseDown = () => {
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  // Filtre flotte sélectionné (single selection)
  const [selectedFleetFilter, setSelectedFleetFilter] = useState<
    'all' | 'en_course' | 'at_school' | 'arrived'
  >('all');

  // État pour les filtres de type d'alerte élèves
  const [selectedTypes] = useState<Alert['type'][]>(['UNSCANNED_CHILD']);

  // État pour gérer les accordéons des bus (section ÉLÈVES)
  const [expandedBusIds, setExpandedBusIds] = useState<Set<string>>(new Set());
  
  // État pour gérer l'ouverture des sections "Présents" par bus
  const [expandedPresentSections, setExpandedPresentSections] = useState<Set<string>>(new Set());
  
  // État pour stocker les données détaillées des élèves par bus
  const [busStudentsData, setBusStudentsData] = useState<
    Record<string, {
      students: Student[];
      scanned: Student[];
      unscanned: Student[];
      attendanceMap: Map<string, AttendanceRecord>;
    }>
  >({});
  
  // Barre de recherche pour les élèves
  const [searchQuery, setSearchQuery] = useState('');

  // État pour les courses récentes avec élèves manquants
  const [recentCoursesWithMissed, setRecentCoursesWithMissed] = useState<CourseHistory[]>([]);

  // Compteurs pour chaque type d'alerte
  const delayCount = alerts.filter((a) => a.type === 'DELAY').length;

  // Combiner tous les bus (buses + stationedBuses) pour le filtre "all"
  const allBuses = useMemo(() => {
    const busMap = new Map<string, BusRealtimeData>();
    // Ajouter tous les bus de la liste principale
    buses.forEach((bus) => busMap.set(bus.id, bus));
    // Ajouter les bus stationnés (peuvent être déjà dans buses, mais on veut s'assurer qu'ils sont inclus)
    stationedBuses.forEach((bus) => busMap.set(bus.id, bus));
    return Array.from(busMap.values());
  }, [buses, stationedBuses]);

  // Calculer le total de la flotte en incluant tous les bus (buses + stationedBuses)
  const totalFleet = useMemo(() => {
    if (totalBusCount) return totalBusCount;
    return allBuses.length;
  }, [totalBusCount, allBuses]);

  // Identifier les bus EN_ROUTE (incluant DELAYED) pour filtrer les comptages d'élèves
  const busesEnRouteIds = useMemo(() => {
    return new Set(
      allBuses
        .filter((b) => b.liveStatus === BusLiveStatus.EN_ROUTE || b.liveStatus === BusLiveStatus.DELAYED)
        .map((b) => b.id)
    );
  }, [allBuses]);

  // Charger les courses récentes avec élèves manquants
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const courses = await getRecentCoursesWithMissedStudents(60); // Dernières 60 minutes
        setRecentCoursesWithMissed(courses);
      } catch (error) {
        console.error('Erreur lors du chargement des courses avec élèves manquants:', error);
      }
    };

    fetchCourses();
    // Rafraîchir toutes les 30 secondes
    const interval = setInterval(fetchCourses, 30000);
    return () => clearInterval(interval);
  }, []);

  // Fonction pour supprimer une urgence (course) traitée
  const handleDismissCourse = (courseId: string) => {
    setRecentCoursesWithMissed((prev) => prev.filter((c) => c.id !== courseId));
  };

  // Calculer les totaux de scannés/non scannés depuis studentsCounts
  // IMPORTANT: Ne compter que les élèves des bus EN_ROUTE (trajets actifs uniquement)
  // NOTE: totalUnscanned est la source de vérité pour le KPI car il vient directement des données de comptage
  // filteredStudentAlerts peut être vide même si totalUnscanned > 0 si les alertes ne sont pas encore créées
  // Dans ce cas, on affiche un message informatif plutôt que le checkmark vert
  const totalScanned = useMemo(() => {
    return Object.entries(studentsCounts)
      .filter(([busId]) => busesEnRouteIds.has(busId))
      .reduce((acc, [, counts]) => acc + counts.scanned, 0);
  }, [studentsCounts, busesEnRouteIds]);
  
  const totalUnscanned = useMemo(() => {
    return Object.entries(studentsCounts)
      .filter(([busId]) => busesEnRouteIds.has(busId))
      .reduce((acc, [, counts]) => acc + counts.unscanned, 0);
  }, [studentsCounts, busesEnRouteIds]);

  // Compteur pour les bus en course (EN_ROUTE + DELAYED)
  const effectiveEnCourse = useMemo(() => {
    return enCourseCount ?? allBuses.filter(
      (b) => b.liveStatus === BusLiveStatus.EN_ROUTE || b.liveStatus === BusLiveStatus.DELAYED
    ).length;
  }, [enCourseCount, allBuses]);

  // Compteur pour les bus arrivés récemment (ARRIVED)
  const arrivedCount = useMemo(() => {
    return allBuses.filter((b) => b.liveStatus === BusLiveStatus.ARRIVED).length;
  }, [allBuses]);
  const atSchoolCount = useMemo(() => {
    return allBuses.filter(
      (b) =>
        b.liveStatus === BusLiveStatus.STOPPED ||
        b.liveStatus === BusLiveStatus.ARRIVED ||
        stationedBuses.some((sb) => sb.id === b.id)
    ).length;
  }, [allBuses, stationedBuses]);

  // Séparation des alertes par contexte
  const fleetAlerts = alerts.filter((a) => a.type === 'DELAY');
  const studentAlerts = alerts.filter((a) => a.type === 'UNSCANNED_CHILD');

  // Filtrer les bus selon le filtre sélectionné pour FLOTTE
  const filteredBuses = useMemo(() => {
    if (activeTab !== 'fleet') return [];

    switch (selectedFleetFilter) {
      case 'en_course':
        return allBuses.filter(
          (b) => b.liveStatus === BusLiveStatus.EN_ROUTE || b.liveStatus === BusLiveStatus.DELAYED
        );
      case 'at_school':
        // Afficher tous les bus à l'école (STOPPED, ARRIVED ou ceux dans stationedBuses)
        return allBuses.filter(
          (b) =>
            b.liveStatus === BusLiveStatus.STOPPED ||
            b.liveStatus === BusLiveStatus.ARRIVED ||
            stationedBuses.some((sb) => sb.id === b.id)
        );
      case 'arrived':
        // Afficher uniquement les bus arrivés récemment (ARRIVED)
        return allBuses.filter((b) => b.liveStatus === BusLiveStatus.ARRIVED);
      case 'all':
      default:
        // Afficher tous les bus
        return allBuses;
    }
  }, [activeTab, selectedFleetFilter, allBuses, stationedBuses]);

  // Fonction supprimée - non nécessaire pour la nouvelle interface simplifiée

  const emptyFleetStateTitle =
    selectedFleetFilter === 'at_school' ? 'Aucun bus stationné' : 'Aucun bus en course';
  const emptyFleetStateDescription =
    selectedFleetFilter === 'at_school'
      ? 'Tous les bus sont actuellement en circulation.'
      : 'Aucun bus en course, aucune alerte active.';

  // Filtrer les alertes pour l'onglet ÉLÈVES
  const filteredStudentAlerts = studentAlerts.filter((alert) =>
    selectedTypes.includes(alert.type)
  );

  // Grouper les alertes par bus pour la section ÉLÈVES
  const alertsByBus = useMemo(() => {
    const grouped: Record<string, Alert[]> = {};
    filteredStudentAlerts.forEach((alert) => {
      if (!grouped[alert.busId]) {
        grouped[alert.busId] = [];
      }
      grouped[alert.busId].push(alert);
    });
    return grouped;
  }, [filteredStudentAlerts]);

  // Récupérer les bus actifs avec des élèves (uniquement ceux en course)
  const busesWithStudents = useMemo(() => {
    return allBuses.filter((bus) => busesEnRouteIds.has(bus.id));
  }, [allBuses, busesEnRouteIds]);

  // Charger les données des élèves pour chaque bus en course
  useEffect(() => {
    if (busesWithStudents.length === 0) {
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const unsubscribes: (() => void)[] = [];
    const busStudentsMap = new Map<string, Student[]>();

    // Récupérer d'abord la liste des élèves pour chaque bus
    const fetchBusStudents = async () => {
      const promises = busesWithStudents.map(async (bus) => {
        try {
          const students = await getBusStudents(bus.id, bus.tripType);
          busStudentsMap.set(bus.id, students);
        } catch (error) {
          console.error(`Erreur lors de la récupération des élèves pour le bus ${bus.id}:`, error);
          busStudentsMap.set(bus.id, []);
        }
      });
      await Promise.all(promises);
    };

    fetchBusStudents().then(() => {
      // Pour chaque bus, écouter les changements d'attendance en temps réel
      busesWithStudents.forEach((bus) => {
        const unsubscribe = watchBusAttendance(
          bus.id,
          today,
          (attendance) => {
            // #region agent log
            // #endregion
            
            const students = busStudentsMap.get(bus.id) || [];
            const attendanceMap = new Map<string, AttendanceRecord>();
            const currentTripType = bus.tripType;
            const currentTripStartTime = bus.tripStartTime;
            
            // Filtrer les enregistrements d'attendance pour ne garder que ceux du trajet actuel
            // MODE TOLÉRANT : Accepter les scans récents même si tripType pas parfaitement aligné
            attendance.forEach((record) => {
              // #region agent log
              // #endregion
              
              // RÈGLE 1 : Si pas de tripType dans le record, TOUJOURS garder (compatibilité)
              if (!record.tripType) {
                attendanceMap.set(record.studentId, record);
                // #region agent log
                // #endregion
                return;
              }
              
              // RÈGLE 2 : Si pas de currentTripType défini, TOUJOURS garder (mode tolérant)
              if (!currentTripType) {
                attendanceMap.set(record.studentId, record);
                // #region agent log
                // #endregion
                return;
              }
              
              // RÈGLE 3 : Vérifier correspondance tripType
              if (record.tripType !== currentTripType) {
                // #region agent log
                // #endregion
                return;
              }
              
              // RÈGLE 4 : Vérifier timestamp (seulement si tripStartTime défini)
              if (currentTripStartTime && record.timestamp) {
                if (record.timestamp >= currentTripStartTime) {
                  attendanceMap.set(record.studentId, record);
                  // #region agent log
                  // #endregion
                } else {
                  // #region agent log
                  // #endregion
                }
              } else {
                // Pas de tripStartTime, garder le record
                attendanceMap.set(record.studentId, record);
                // #region agent log
                // #endregion
              }
            });

            // Séparer les élèves scannés et non scannés
            const scanned: Student[] = [];
            const unscanned: Student[] = [];

            // Déterminer si un élève est scanné pour le trajet actuel
            // en fonction du tripType du bus
            const isStudentScannedForCurrentTrip = (record: AttendanceRecord | undefined): boolean => {
              if (!record) return false;
              
              const currentTripType = bus.tripType;
              const isPresent =
                record.status === 'present' ||
                record.morningStatus === 'present' ||
                record.eveningStatus === 'present';
              
              // Si pas de tripType défini, on considère comme non scanné pour éviter les faux positifs
              if (!currentTripType) return isPresent;
              
              // Vérifier que le record correspond au tripType actuel
              if (record.tripType && record.tripType !== currentTripType) {
                return false;
              }
              
              // Selon le type de trajet, vérifier le bon statut
              if (currentTripType === 'morning_outbound' || currentTripType === 'midday_return') {
                // Trajets du matin/midi-retour : vérifier morningStatus
                return record.morningStatus === 'present' || record.status === 'present';
              } else if (currentTripType === 'midday_outbound' || currentTripType === 'evening_return') {
                // Trajets du midi/soir : vérifier eveningStatus
                return record.eveningStatus === 'present' || record.status === 'present';
              }
              
              // Fallback : vérifier les deux statuts si tripType non reconnu
              return isPresent;
            };

            students.forEach((student) => {
              const record = attendanceMap.get(student.id);
              const isScanned = isStudentScannedForCurrentTrip(record);
              
              // #region agent log
              // #endregion

              if (isScanned) {
                scanned.push(student);
              } else {
                unscanned.push(student);
              }
            });
            
            // #region agent log
            // #endregion

            setBusStudentsData((prev) => ({
              ...prev,
              [bus.id]: {
                students,
                scanned,
                unscanned,
                attendanceMap,
              },
            }));
          },
          () => {}
        );
        unsubscribes.push(unsubscribe);
      });
    });

    return () => {
      unsubscribes.forEach((unsubscribe) => unsubscribe());
    };
  }, [busesWithStudents]);

  // Toggle l'accordéon d'un bus
  const toggleBusAccordion = (busId: string) => {
    setExpandedBusIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(busId)) {
        newSet.delete(busId);
      } else {
        newSet.add(busId);
      }
      return newSet;
    });
  };

  // Toggle la section "Présents" d'un bus
  const togglePresentSection = (busId: string) => {
    setExpandedPresentSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(busId)) {
        newSet.delete(busId);
      } else {
        newSet.add(busId);
      }
      return newSet;
    });
  };

  // Ouvrir automatiquement les bus avec des alertes
  useEffect(() => {
    const busIdsWithAlerts = Object.keys(alertsByBus);
    if (busIdsWithAlerts.length > 0) {
      setExpandedBusIds((prev) => {
        const newSet = new Set(prev);
        busIdsWithAlerts.forEach((busId) => newSet.add(busId));
        return newSet;
      });
    }
  }, [alertsByBus]);

  // Ouvrir automatiquement les bus qui correspondent à la recherche
  useEffect(() => {
    if (!searchQuery.trim()) return;

    const query = searchQuery.toLowerCase();
    const filterStudentsFn = (students: Student[]): Student[] => {
      return students.filter(
        (student) =>
          student.firstName.toLowerCase().includes(query) ||
          student.lastName.toLowerCase().includes(query) ||
          `${student.firstName} ${student.lastName}`.toLowerCase().includes(query)
      );
    };

    const matchingBusIds = new Set<string>();
    busesWithStudents.forEach((bus) => {
      const busData = busStudentsData[bus.id];
      if (!busData) return;

      const filteredScanned = filterStudentsFn(busData.scanned);
      const filteredUnscanned = filterStudentsFn(busData.unscanned);

      if (filteredScanned.length > 0 || filteredUnscanned.length > 0) {
        matchingBusIds.add(bus.id);
        // Ouvrir aussi la section "Présents" si des élèves scannés correspondent
        if (filteredScanned.length > 0) {
          setExpandedPresentSections((prev) => {
            const newSet = new Set(prev);
            newSet.add(bus.id);
            return newSet;
          });
        }
      }
    });

    if (matchingBusIds.size > 0) {
      setExpandedBusIds((prev) => {
        const newSet = new Set(prev);
        matchingBusIds.forEach((busId) => newSet.add(busId));
        return newSet;
      });
    }
  }, [searchQuery, busesWithStudents, busStudentsData]);

  // Extraire le nom de l'élève depuis une alerte
  const extractStudentNameFromAlert = (alert: Alert): string => {
    const messageParts = alert.message.split(' - ');
    return messageParts[0] || alert.message.split(' ').slice(0, 2).join(' ') || 'Élève';
  };

  // Extraire l'arrêt depuis une alerte
  const extractStopFromAlert = (alert: Alert): string => {
    const messageParts = alert.message.split(' - ');
    return messageParts[1] || 'Arrêt non spécifié';
  };

  // Filtrer les élèves selon la recherche
  const filterStudents = (students: Student[]): Student[] => {
    if (!searchQuery.trim()) return students;
    const query = searchQuery.toLowerCase();
    return students.filter(
      (student) =>
        student.firstName.toLowerCase().includes(query) ||
        student.lastName.toLowerCase().includes(query) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(query)
    );
  };

  // Surligner les termes de recherche dans le texte
  const highlightMatch = (text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text;

    try {
      const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);

      return parts.map((part, index) => {
        if (regex.test(part)) {
          // Réinitialiser lastIndex pour les tests suivants
          regex.lastIndex = 0;
          return (
            <mark key={index} className="bg-yellow-200 px-0.5 rounded">
              {part}
            </mark>
          );
        }
        return part;
      });
    } catch (error) {
      // En cas d'erreur regex, retourner le texte original
      return text;
    }
  };

  // Fonction helper pour obtenir les classes de fond coloré selon le statut
  const getStatusBackground = (liveStatus: BusLiveStatus | null): string => {
    if (!liveStatus) {
      return 'bg-white border-l-4 border-slate-300';
    }

    switch (liveStatus) {
      case BusLiveStatus.DELAYED:
        return 'bg-red-50 border-l-4 border-red-600';
      case BusLiveStatus.ARRIVED:
        return 'bg-green-50 border-l-4 border-green-500';
      case BusLiveStatus.EN_ROUTE:
        return 'bg-blue-50 border-l-4 border-blue-500';
      case BusLiveStatus.STOPPED:
      case BusLiveStatus.IDLE:
        return 'bg-slate-50 border-l-4 border-slate-400';
      default:
        return 'bg-white border-l-4 border-slate-300';
    }
  };


  const handleAlertClick = (busId: string) => {
    if (onFocusBus) {
      onFocusBus(busId);
      return;
    }
    // TODO: Naviguer vers /buses/:busId/manifest quand la page sera créée
    console.log('Navigating to bus manifest:', busId);
    // navigate(`/buses/${busId}/manifest`);
  };

const formatTimestamp = (timestamp: number | null) => {
  if (timestamp == null || Number.isNaN(timestamp)) {
    return '—';
  }

  const date = new Date(timestamp);
  const now = new Date();
  const diffMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffMinutes < 1) return 'À l\'instant';
    if (diffMinutes === 1) return 'Il y a 1 min';
    if (diffMinutes < 60) return `Il y a ${diffMinutes} min`;

    const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return 'Il y a 1h';
  return `Il y a ${diffHours}h`;
};

const getBusUpdateTimestamp = (bus: BusRealtimeData): number | null => {
  if (typeof bus.currentPosition?.timestamp === 'number') {
    return bus.currentPosition.timestamp;
  }
  if (bus.lastUpdate) {
    const parsed = Date.parse(bus.lastUpdate);
    return Number.isNaN(parsed) ? null : parsed;
  }
  return null;
};

// Fonction inutilisée - supprimée pour simplification

const calculateMinutesSince = (timestamp: number | null | undefined): number => {
  if (!timestamp) return 0;

  let timestampMs: number;
  if (typeof timestamp === 'number') {
    timestampMs = timestamp;
  } else if (typeof timestamp === 'string') {
    timestampMs = new Date(timestamp).getTime();
  } else {
    return 0;
  }

  const elapsed = Date.now() - timestampMs;
  return Math.floor(elapsed / 60000);
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

  return (
    <div
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="bg-[#F9FAFB] border-l border-slate-200 flex flex-col h-full relative flex-shrink-0"
    >
      {/* Header */}
      <div className="p-6 bg-white border-b border-slate-200">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold text-slate-900 font-display">Supervision</h1>
          {alerts.length > 0 && (
            <div className="px-3 py-1.5 rounded-full text-base font-bold bg-danger-600 text-white">
              {alerts.length}
            </div>
          )}
        </div>

        {/* Segmented Control - Onglets */}
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
          <button
            onClick={() => setActiveTab('fleet')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              activeTab === 'fleet'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            role="tab"
            aria-selected={activeTab === 'fleet'}
            aria-controls="fleet-panel"
          >
            <div className="flex items-center justify-center gap-2">
              <span>FLOTTE</span>
              {fleetAlerts.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === 'fleet' ? 'bg-danger-100 text-danger-700' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {fleetAlerts.length}
                </span>
              )}
            </div>
          </button>
          <button
            onClick={() => setActiveTab('students')}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              activeTab === 'students'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            role="tab"
            aria-selected={activeTab === 'students'}
            aria-controls="students-panel"
          >
            <div className="flex items-center justify-center gap-2">
              <span>ÉLÈVES</span>
              {studentAlerts.length > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${
                    activeTab === 'students'
                      ? 'bg-warning-100 text-warning-700'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {studentAlerts.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* UrgencySection - Management by Exception (Basée sur course_history) */}
      <UrgencySection
        courses={recentCoursesWithMissed}
        delayedBusCount={delayCount}
        onDismissCourse={handleDismissCourse}
        onBusClick={onFocusBus}
      />

      {/* Section FLOTTE */}
      {activeTab === 'fleet' && (
        <>
          {/* Barre de filtres unifiée défilante */}
          <div className="px-4 py-3 bg-white border-b border-slate-200">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pb-1">
              {/* Tout */}
              <button
                onClick={() => setSelectedFleetFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1 ${
                  selectedFleetFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
                aria-pressed={selectedFleetFilter === 'all'}
                aria-label="Afficher tous les bus"
              >
                Tout ({totalFleet})
              </button>

              {/* Arrivé Récemment - Affiché uniquement s'il y a des bus ARRIVED */}
              {arrivedCount > 0 && (
                <button
                  onClick={() => setSelectedFleetFilter('arrived')}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 ${
                    selectedFleetFilter === 'arrived'
                      ? 'bg-green-500 text-white'
                      : 'bg-white border-2 border-green-500 text-green-700 hover:bg-green-50'
                  }`}
                  aria-pressed={selectedFleetFilter === 'arrived'}
                  aria-label="Afficher les bus arrivés récemment"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                  Arrivé Récemment ({arrivedCount})
                </button>
              )}

              {/* En course */}
              <button
                onClick={() => setSelectedFleetFilter('en_course')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 ${
                  selectedFleetFilter === 'en_course'
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
                aria-pressed={selectedFleetFilter === 'en_course'}
                aria-label="Afficher les bus en course"
              >
                <Navigation className="w-3.5 h-3.5" strokeWidth={2.5} />
                En course{effectiveEnCourse > 0 ? ` (${effectiveEnCourse})` : ''}
              </button>

              {/* À l'école */}
              <button
                onClick={() => setSelectedFleetFilter('at_school')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 ${
                  selectedFleetFilter === 'at_school'
                    ? 'bg-blue-400 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-200'
                }`}
                aria-pressed={selectedFleetFilter === 'at_school'}
                aria-label="Afficher les bus à l'école"
              >
                <School className="w-3.5 h-3.5" strokeWidth={2.5} />
                À l'école{atSchoolCount > 0 ? ` (${atSchoolCount})` : ''}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Section ÉLÈVES - Header avec KPI uniquement si service actif */}
      {activeTab === 'students' && effectiveEnCourse > 0 && (
        <>
          {/* Résumé de Sécurité - KPI */}
          <div className="px-4 py-3 bg-white border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Résumé Sécurité
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="px-3 py-2.5 bg-slate-100 border border-slate-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-slate-600" strokeWidth={2.5} />
                  <span className="text-xs font-medium text-slate-700">À bord</span>
                </div>
                <div className="text-2xl font-bold text-slate-900">
                  {totalScanned}
                </div>
              </div>
              <div className="px-3 py-2.5 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-warning-700" strokeWidth={2.5} />
                  <span className="text-xs font-medium text-warning-700">En attente</span>
                </div>
                <div className="text-2xl font-bold text-warning-900">{totalUnscanned}</div>
              </div>
            </div>

            {/* Barre de progression visuelle */}
            <div className="mt-3">
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 ${
                    totalScanned + totalUnscanned === 0
                      ? 'bg-slate-400'
                      : ((totalScanned / (totalScanned + totalUnscanned)) * 100) >= 95
                      ? 'bg-green-500'
                      : ((totalScanned / (totalScanned + totalUnscanned)) * 100) >= 80
                      ? 'bg-yellow-500'
                      : 'bg-red-500'
                  }`}
                  style={{
                    width: `${
                      totalScanned + totalUnscanned === 0
                        ? 0
                        : Math.min(
                            (totalScanned / (totalScanned + totalUnscanned)) * 100,
                            100
                          )
                    }%`,
                  }}
                />
              </div>
              <p className="text-xs text-slate-600 text-center mt-1.5">
                {totalScanned + totalUnscanned === 0
                  ? '0% scannés'
                  : `${Math.round(
                      (totalScanned / (totalScanned + totalUnscanned)) * 100
                    )}% des élèves à bord`}
              </p>
            </div>
          </div>

          {/* Barre de recherche */}
          <div className="px-4 py-3 bg-white border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Chercher un élève..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                aria-label="Rechercher un élève par nom"
              />
            </div>
          </div>
        </>
      )}

      {/* Liste des alertes / bus */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#F9FAFB]">
        {activeTab === 'fleet' && filteredBuses.length === 0 ? (
          <>
            {/* État vide - flotte */}
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-slate-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                {emptyFleetStateTitle}
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {emptyFleetStateDescription}
              </p>
              <div className="mt-6 w-full space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                  <span>Surveillance active</span>
                </div>
              </div>
            </div>
          </>
        ) : activeTab === 'fleet' ? (
          // Liste des bus filtrés (FLOTTE)
          <div className="space-y-3">
            {filteredBuses.map((bus) => {
              // Vérifier si le bus a une alerte
              const busAlert = alerts.find((a) => a.busId === bus.id);
              const hasAlert = busAlert !== undefined;
              const isNormalBus = !hasAlert; // Bus normal sans problème
              const counts = studentsCounts[bus.id] || { scanned: 0, unscanned: 0, total: 0 };

              if (isNormalBus) {
                // Carte pour bus normaux avec statut et comptages
                const isArrived = bus.liveStatus === BusLiveStatus.ARRIVED;
                const isEnRoute =
                  bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED;

                const isDelayed = bus.liveStatus === BusLiveStatus.DELAYED;
                const tripDuration = typeof bus.tripStartTime === 'number'
                  ? formatDurationFromMs(Date.now() - bus.tripStartTime)
                  : null;
                const speed = bus.currentPosition?.speed ?? 0;
                const busUpdatedAt = getBusUpdateTimestamp(bus);

                return (
                  <div
                    key={bus.id}
                    onClick={() => handleAlertClick(bus.id)}
                    className={`rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 cursor-pointer ${getStatusBackground(bus.liveStatus)}`}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleAlertClick(bus.id);
                      }
                    }}
                    aria-label={`Bus ${bus.number}, ${counts.scanned} élèves sur ${counts.total} à bord, cliquer pour centrer sur la carte`}
                  >
                    {/* Ligne 1: Nom du bus + Badge élèves */}
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-base font-bold text-slate-900">{bus.number}</h3>
                      {(isEnRoute || isArrived || isDelayed) && counts.total > 0 && (
                        <SafetyRatioBadge
                          scanned={counts.scanned}
                          total={counts.total}
                          size="md"
                          variant={isArrived ? 'success' : undefined}
                        />
                      )}
                    </div>

                    {/* Ligne 2: Localisation */}
                    {(isEnRoute || isDelayed) && (
                      <div className="flex items-center gap-1.5 text-slate-700 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={2.5} />
                        <span className="text-sm font-medium truncate">
                          {bus.currentZone || bus.route?.name || 'En déplacement'}
                        </span>
                      </div>
                    )}

                    {isArrived && (
                      <div className="flex items-center gap-1.5 text-slate-700 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-green-500 flex-shrink-0" strokeWidth={2.5} />
                        <span className="text-sm font-medium">
                          Arrivé il y a {calculateMinutesSince(bus.stoppedAt)} min
                        </span>
                      </div>
                    )}

                    {/* Ligne 3: Infos spécifiques selon l'état */}

                    {/* BUS ARRIVÉ: Temps depuis l'arrêt */}
                    {isArrived && (
                      <div className="mt-2">
                        <div className="text-xs text-slate-500">
                          <span>Arrêté depuis: {formatDurationFromMs(
                            bus.stoppedAt ? Date.now() - (typeof bus.stoppedAt === 'number' ? bus.stoppedAt : new Date(bus.stoppedAt as string).getTime()) : 0
                          )}</span>
                        </div>
                      </div>
                    )}

                    {/* BUS EN ROUTE: Vitesse + Temps */}
                    {isEnRoute && !isDelayed && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          {speed > 0 && (
                            <span className="font-semibold text-blue-600">{Math.round(speed)} km/h</span>
                          )}
                          {tripDuration && (
                            <div className="text-slate-500 ml-auto">
                              <span className="text-xs">Trajet: {tripDuration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* BUS EN RETARD: Vitesse + Temps + Badge retard */}
                    {isDelayed && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            {speed > 0 && (
                              <span className="font-semibold text-orange-600">{Math.round(speed)} km/h</span>
                            )}
                            <div className="flex items-center gap-1 text-red-600 font-semibold">
                              <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                              <span>Retard</span>
                            </div>
                          </div>
                          {tripDuration && (
                            <div className="text-slate-500">
                              <span className="text-xs">Trajet: {tripDuration}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Ligne 4: Chauffeur */}
                    {bus.driver && (
                      <div className="flex items-center gap-2 text-xs text-slate-600 mt-2">
                        <Users className="w-3 h-3 text-slate-400 flex-shrink-0" strokeWidth={2.5} />
                        <span className="truncate flex-1">{bus.driver.name}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
                      <Clock className="w-3 h-3" strokeWidth={2.5} />
                      <span>Maj: {formatTimestamp(busUpdatedAt)}</span>
                    </div>
                  </div>
                );
              }

              // Carte complète pour bus avec alerte
              const borderColor =
                busAlert.severity === 'HIGH' ? 'border-l-danger-600' : 'border-l-warning-600';
              const busUpdatedAt = getBusUpdateTimestamp(bus);

              return (
                <div
                  key={bus.id}
                  onClick={() => handleAlertClick(bus.id)}
                  className={`rounded-xl border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer ${getStatusBackground(bus.liveStatus)}`}
                  role="button"
                  tabIndex={0}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleAlertClick(bus.id);
                    }
                  }}
                  aria-label={`Bus ${bus.number} avec alerte, ${counts.scanned} élèves sur ${counts.total}, cliquer pour centrer sur la carte`}
                >
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900">Bus {bus.number}</h3>
                        <span className={`px-2 py-0.5 text-xs font-bold rounded uppercase flex-shrink-0 ${
                          busAlert.severity === 'HIGH'
                            ? 'bg-red-600 text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          ⚠ {busAlert.type === 'DELAY' ? 'Retard' : 'Alerte'}
                        </span>
                      </div>
                      <SafetyRatioBadge
                        scanned={counts.scanned}
                        total={counts.total}
                        size="md"
                        className="ml-2"
                      />
                    </div>

                    {/* Localisation + Durée - même structure que cartes normales */}
                    <div className="flex items-center justify-between text-sm mt-2 mb-2">
                      <div className="flex items-center gap-1.5 text-slate-700 flex-1 min-w-0">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" strokeWidth={2.5} />
                        <span className="font-medium truncate">
                          {bus.currentZone || bus.route?.name || 'En déplacement'}
                        </span>
                      </div>
                      {typeof bus.tripStartTime === 'number' && (
                        <div className="text-slate-500 text-xs flex-shrink-0 ml-2">
                          <span>Trajet: {formatDurationFromMs(Date.now() - bus.tripStartTime)}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {bus.driver?.phone && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`tel:${bus.driver?.phone}`, '_self');
                          }}
                          className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                          aria-label={`Appeler ${bus.driver?.name || 'le chauffeur'}`}
                        >
                          <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
                          Chauffeur
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAlertClick(bus.id);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                        aria-label={`Voir le bus ${bus.number} sur la carte`}
                      >
                        <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Carte
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-3">
                      <Clock className="w-3 h-3" strokeWidth={2.5} />
                      <span>Maj: {formatTimestamp(busUpdatedAt)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : activeTab === 'students' && effectiveEnCourse === 0 ? (
          // ÉTAT A : Mode Veille (Aucun bus en course) - Vue principale
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <Navigation className="w-10 h-10 text-slate-400" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">
              Aucun ramassage en cours
            </h3>
            <p className="text-sm text-slate-500 leading-relaxed">
              La supervision des élèves démarrera automatiquement avec le premier bus.
            </p>
            <div className="mt-6 w-full space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-slate-400 rounded-full"></div>
                <span>Système en attente</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'students' && totalUnscanned === 0 ? (
          // ÉTAT B : Tous les élèves sont à bord (Succès !)
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-slate-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Tous les élèves sont à bord !
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aucun élève en attente sur les trajets actifs.
            </p>
            <div className="mt-6 w-full space-y-2 text-xs text-slate-500">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></div>
                <span>Supervision active - Tout est en ordre</span>
              </div>
            </div>
          </div>
        ) : activeTab === 'students' && totalUnscanned > 0 ? (
          // Liste des bus avec accordéons (section ÉLÈVES)
          <div className="space-y-3">
            {busesWithStudents.map((bus) => {
              const busData = busStudentsData[bus.id];
              const counts = studentsCounts[bus.id] || { scanned: 0, unscanned: 0, total: 0 };
              const busAlerts = alertsByBus[bus.id] || [];
              const isExpanded = expandedBusIds.has(bus.id);
              const hasUnscanned = counts.unscanned > 0;

              // Filtrer les élèves selon la recherche
              const filteredScanned = busData
                ? filterStudents(busData.scanned)
                : [];
              const filteredUnscanned = busData
                ? filterStudents(busData.unscanned)
                : [];

              // Si recherche active, ne montrer que les bus avec résultats
              if (searchQuery.trim() && filteredScanned.length === 0 && filteredUnscanned.length === 0) {
                return null;
              }

              return (
                <div
                  key={bus.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                >
                  {/* En-tête de la carte (toujours visible) */}
                  <button
                    onClick={() => toggleBusAccordion(bus.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-inset"
                    aria-expanded={isExpanded}
                    aria-controls={`bus-students-${bus.id}`}
                    aria-label={`${isExpanded ? 'Masquer' : 'Afficher'} les élèves du bus ${bus.number}`}
                  >
                    <div className="flex items-center gap-3 flex-1 text-left">
                      <div className={`flex-shrink-0 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}>
                        <ChevronRight className="w-5 h-5 text-slate-400" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-bold text-slate-900">
                          Bus {bus.number}
                        </h3>
                        {bus.route?.name && (
                          <p className="text-xs text-slate-500 truncate">
                            {bus.route.name}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 ml-3">
                      {hasUnscanned ? (
                        <div className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700" strokeWidth={2.5} />
                          {counts.unscanned} Manquant{counts.unscanned > 1 ? 's' : ''}
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 bg-slate-100 border border-slate-200 text-slate-700 rounded-full text-xs font-bold flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-600" strokeWidth={2.5} />
                          {counts.scanned}/{counts.total} Présents
                        </div>
                      )}
                    </div>
                  </button>

                  {/* Corps de la carte (dépliable) */}
                  {isExpanded && (
                    <div 
                      id={`bus-students-${bus.id}`}
                      className="border-t border-slate-200"
                      role="region"
                      aria-label={`Liste des élèves du bus ${bus.number}`}
                    >
                      {/* Zone 1 : Élèves non scannés (Alertes) - Zone critique avec fond ambre pâle */}
                      {filteredUnscanned.length > 0 && (
                        <div className="bg-amber-50 border-t border-amber-100 border-b border-amber-100 p-4 space-y-3">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-amber-700" strokeWidth={2.5} />
                            <p className="text-xs font-bold text-amber-800 uppercase tracking-wider">
                              En attente ({filteredUnscanned.length})
                            </p>
                          </div>
                          <div className="space-y-2">
                            {filteredUnscanned.map((student) => {
                              // Trouver l'alerte correspondante si elle existe
                              const alert = busAlerts.find((a) => {
                                const alertName = extractStudentNameFromAlert(a);
                                return (
                                  alertName.toLowerCase() ===
                                  `${student.firstName} ${student.lastName}`.toLowerCase()
                                );
                              });

                              return (
                                <div
                                  key={student.id}
                                  className="flex items-center justify-between gap-3 py-2 px-3 bg-white rounded-lg border border-amber-200 hover:bg-amber-50 transition-colors"
                                >
                                  <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-1.5 h-1.5 rounded-full bg-amber-600 flex-shrink-0"></div>
                                    <div className="flex-1 min-w-0">
                                      <span className="text-sm font-medium text-slate-900 truncate block">
                                        {highlightMatch(`${student.firstName} ${student.lastName}`, searchQuery)}
                                      </span>
                                      {alert && (
                                        <span className="text-xs text-slate-500 truncate block">
                                          {extractStopFromAlert(alert)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      console.log('Call parent for student', student.id);
                                    }}
                                    className="flex-shrink-0 p-1.5 hover:bg-white rounded-lg transition-colors"
                                    aria-label={`Appeler le parent de ${student.firstName} ${student.lastName}`}
                                  >
                                    <Phone className="w-4 h-4 text-amber-700" strokeWidth={2.5} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Zone 2 : Élèves scannés (Présents) */}
                      {filteredScanned.length > 0 && (
                        <div className="p-4 bg-white">
                          <button
                            onClick={() => togglePresentSection(bus.id)}
                            className="w-full cursor-pointer text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3 flex items-center gap-2 hover:text-slate-800 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
                            aria-expanded={expandedPresentSections.has(bus.id)}
                            aria-controls={`present-students-${bus.id}`}
                            aria-label={`${expandedPresentSections.has(bus.id) ? 'Masquer' : 'Afficher'} les élèves présents (${filteredScanned.length})`}
                          >
                            <ChevronDown
                              className={`w-3 h-3 transition-transform duration-200 ${
                                expandedPresentSections.has(bus.id) ? 'rotate-180' : ''
                              }`}
                            />
                            Présents ({filteredScanned.length})
                          </button>
                          {expandedPresentSections.has(bus.id) && (
                            <div 
                              id={`present-students-${bus.id}`}
                              className="space-y-1.5"
                              role="list"
                              aria-label="Élèves présents"
                            >
                              {filteredScanned.map((student) => {
                                const attendance = busData?.attendanceMap.get(student.id);
                                const scanTime = attendance?.timestamp
                                  ? formatTimestamp(attendance.timestamp)
                                  : null;

                                return (
                                  <div
                                    key={student.id}
                                    className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between text-xs border border-slate-100"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <div className="w-2 h-2 bg-slate-400 rounded-full flex-shrink-0"></div>
                                      <span className="font-medium text-slate-700 truncate">
                                        {highlightMatch(`${student.firstName} ${student.lastName}`, searchQuery)}
                                      </span>
                                    </div>
                                    {scanTime && (
                                      <span className="text-slate-400 text-[10px] flex-shrink-0 ml-2">
                                        {scanTime}
                                      </span>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Message si aucun élève trouvé après filtrage */}
                      {filteredUnscanned.length === 0 && filteredScanned.length === 0 && (
                        <div className="p-4 text-center bg-white">
                          <p className="text-xs text-slate-500">
                            Aucun élève ne correspond à la recherche.
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* Message si aucun bus trouvé après filtrage */}
            {searchQuery.trim() &&
              busesWithStudents.every((bus) => {
                const busData = busStudentsData[bus.id];
                if (!busData) return true;
                const filteredScanned = filterStudents(busData.scanned);
                const filteredUnscanned = filterStudents(busData.unscanned);
                return filteredScanned.length === 0 && filteredUnscanned.length === 0;
              }) && (
                <div className="flex flex-col items-center justify-center py-8 px-6 text-center">
                  <Search className="w-12 h-12 text-slate-300 mb-3" strokeWidth={1.5} />
                  <p className="text-sm text-slate-500">
                    Aucun élève ne correspond à "{searchQuery}"
                  </p>
                </div>
              )}
          </div>
        ) : null}
      </div>

      {/* Handle de redimensionnement */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 left-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary-500 transition-colors group"
        aria-label="Redimensionner la sidebar"
      >
        {/* Indicateur visuel au centre */}
        <div className="absolute top-1/2 -translate-y-1/2 left-0 w-1 h-12 bg-slate-700 group-hover:bg-primary-500 transition-colors rounded-r-sm flex items-center justify-center">
          <GripVertical className="w-3 h-3 text-slate-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
};
