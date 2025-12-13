/**
 * Composant AlertsSidebar - Sidebar des alertes actives
 * Affiche uniquement les problèmes critiques (Management by Exception)
 */

import { useState } from 'react';
import {
  AlertTriangle,
  Clock,
  Users,
  XCircle,
  CheckCircle2,
  Navigation,
  School,
  Phone,
  MapPin,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BusLiveStatus, type BusRealtimeData } from '@/types/realtime';
import type { Alert } from '@/types/alerts';

interface AlertsSidebarProps {
  alerts: Alert[];
  buses: BusRealtimeData[];
  studentsCounts?: Record<string, { scanned: number; unscanned: number; total: number }>;
}

export const AlertsSidebar = ({ alerts, buses, studentsCounts = {} }: AlertsSidebarProps) => {
  const navigate = useNavigate();

  // Onglet actif : FLOTTE ou ÉLÈVES
  const [activeTab, setActiveTab] = useState<'fleet' | 'students'>('fleet');

  // Filtre flotte sélectionné (single selection)
  const [selectedFleetFilter, setSelectedFleetFilter] = useState<
    'all' | 'delays' | 'stopped' | 'en_course' | 'at_school'
  >('all');

  // État pour les filtres de type d'alerte élèves
  const [selectedTypes, setSelectedTypes] = useState<Alert['type'][]>(['UNSCANNED_CHILD']);

  // Compteurs pour chaque type d'alerte
  const delayCount = alerts.filter((a) => a.type === 'DELAY').length;
  const stoppedCount = alerts.filter((a) => a.type === 'STOPPED').length;
  const unscannedCount = alerts.filter((a) => a.type === 'UNSCANNED_CHILD').length;
  
  // Calculer les totaux de scannés/non scannés depuis studentsCounts
  const totalScanned = Object.values(studentsCounts).reduce((acc, counts) => acc + counts.scanned, 0);
  const totalUnscanned = Object.values(studentsCounts).reduce((acc, counts) => acc + counts.unscanned, 0);

  // Compteurs pour les bus par statut
  const enCourseCount = buses.filter((b) => {
    return b.liveStatus === BusLiveStatus.EN_ROUTE || b.liveStatus === BusLiveStatus.DELAYED;
  }).length;
  const atSchoolCount = buses.filter((b) => {
    return b.liveStatus === BusLiveStatus.ARRIVED || 
           (b.liveStatus !== BusLiveStatus.EN_ROUTE && b.liveStatus !== BusLiveStatus.DELAYED);
  }).length;

  // Séparation des alertes par contexte
  const fleetAlerts = alerts.filter((a) => a.type === 'DELAY' || a.type === 'STOPPED');
  const studentAlerts = alerts.filter((a) => a.type === 'UNSCANNED_CHILD');

  // Filtrer les bus selon le filtre sélectionné pour FLOTTE
  const getFilteredBuses = () => {
    if (activeTab !== 'fleet') return [];

    switch (selectedFleetFilter) {
      case 'delays':
        // Seulement les bus avec alerte retard
        return buses.filter((b) => alerts.some((a) => a.busId === b.id && a.type === 'DELAY'));
      case 'stopped':
        // Seulement les bus avec alerte arrêt
        return buses.filter((b) => alerts.some((a) => a.busId === b.id && a.type === 'STOPPED'));
      case 'en_course':
        // Tous les bus en course
        return buses.filter((b) => b.liveStatus === BusLiveStatus.EN_ROUTE || b.liveStatus === BusLiveStatus.DELAYED);
      case 'at_school':
        // Tous les bus à l'école (arrivés ou autres statuts)
        return buses.filter((b) => b.liveStatus === BusLiveStatus.ARRIVED || 
          (b.liveStatus !== BusLiveStatus.EN_ROUTE && b.liveStatus !== BusLiveStatus.DELAYED));
      case 'all':
      default:
        // Tous les bus
        return buses;
    }
  };

  const filteredBuses = getFilteredBuses();

  // Filtrer les alertes pour l'onglet ÉLÈVES
  const filteredStudentAlerts = studentAlerts.filter((alert) =>
    selectedTypes.includes(alert.type)
  );


  const handleAlertClick = (busId: string) => {
    // TODO: Naviguer vers /buses/:busId/manifest quand la page sera créée
    console.log('Navigating to bus manifest:', busId);
    // navigate(`/buses/${busId}/manifest`);
  };

  const getAlertIcon = (type: Alert['type']) => {
    switch (type) {
      case 'DELAY':
        return Clock;
      case 'STOPPED':
        return XCircle;
      case 'UNSCANNED_CHILD':
        return Users;
    }
  };

  const formatTimestamp = (timestamp: number) => {
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

  return (
    <div className="w-96 bg-slate-50 border-l border-slate-200 flex flex-col h-full">
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
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              activeTab === 'fleet'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
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
            className={`flex-1 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 ${
              activeTab === 'students'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
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

      {/* Section FLOTTE */}
      {activeTab === 'fleet' && (
        <>
          {/* Barre de filtres unifiée défilante */}
          <div className="px-4 py-3 bg-white border-b border-slate-200">
            <div className="flex gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent pb-1">
              {/* Tout */}
              <button
                onClick={() => setSelectedFleetFilter('all')}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 whitespace-nowrap flex-shrink-0 ${
                  selectedFleetFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Tout ({buses.length})
              </button>

              {/* Retards */}
              <button
                onClick={() => setSelectedFleetFilter('delays')}
                disabled={delayCount === 0}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  selectedFleetFilter === 'delays'
                    ? 'bg-danger-600 text-white'
                    : delayCount === 0
                    ? 'bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-danger-300'
                }`}
              >
                <Clock className="w-3.5 h-3.5" strokeWidth={2.5} />
                Retards ({delayCount})
              </button>

              {/* Arrêts */}
              <button
                onClick={() => setSelectedFleetFilter('stopped')}
                disabled={stoppedCount === 0}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  selectedFleetFilter === 'stopped'
                    ? 'bg-blue-600 text-white'
                    : stoppedCount === 0
                    ? 'bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                <XCircle className="w-3.5 h-3.5" strokeWidth={2.5} />
                Arrêts ({stoppedCount})
              </button>

              {/* En course */}
              <button
                onClick={() => setSelectedFleetFilter('en_course')}
                disabled={enCourseCount === 0}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  selectedFleetFilter === 'en_course'
                    ? 'bg-success-600 text-white'
                    : enCourseCount === 0
                    ? 'bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-success-300'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" strokeWidth={2.5} />
                En course ({enCourseCount})
              </button>

              {/* À l'école */}
              <button
                onClick={() => setSelectedFleetFilter('at_school')}
                disabled={atSchoolCount === 0}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap flex-shrink-0 ${
                  selectedFleetFilter === 'at_school'
                    ? 'bg-blue-400 text-white'
                    : atSchoolCount === 0
                    ? 'bg-slate-100 border-2 border-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-white border-2 border-slate-200 text-slate-600 hover:border-blue-200'
                }`}
              >
                <School className="w-3.5 h-3.5" strokeWidth={2.5} />
                À l'école ({atSchoolCount})
              </button>
            </div>
          </div>
        </>
      )}

      {/* Section ÉLÈVES */}
      {activeTab === 'students' && (
        <>
          {/* Résumé de Sécurité */}
          <div className="px-4 py-3 bg-white border-b border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Résumé Sécurité
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="px-3 py-2.5 bg-success-50 border border-success-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-success-700" strokeWidth={2.5} />
                  <span className="text-xs font-medium text-success-700">Scannés</span>
                </div>
                <div className="text-2xl font-bold text-success-900">
                  {totalScanned}
                </div>
              </div>
              <div className="px-3 py-2.5 bg-warning-50 border border-warning-200 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="w-4 h-4 text-warning-700" strokeWidth={2.5} />
                  <span className="text-xs font-medium text-warning-700">Non scannés</span>
                </div>
                <div className="text-2xl font-bold text-warning-900">{totalUnscanned}</div>
              </div>
            </div>
          </div>

          {/* Info supplémentaire */}
          <div className="px-4 py-2 bg-white border-b border-slate-200">
            <p className="text-xs text-slate-500 italic">
              Liste des élèves nécessitant une attention
            </p>
          </div>
        </>
      )}

      {/* Liste des alertes / bus */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'fleet' && filteredBuses.length === 0 ? (
          <>
            {/* État vide - Tout va bien */}
            <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
              <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-success-600" strokeWidth={2} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">
                Tout est opérationnel
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Aucune alerte active. Tous les bus sont à l'heure et les enfants sont scannés correctement.
              </p>
              <div className="mt-6 w-full space-y-2 text-xs text-slate-500">
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                  <div className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></div>
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

              if (isNormalBus) {
                // Carte pour bus normaux avec statut et comptages
                const counts = studentsCounts[bus.id] || { scanned: 0, unscanned: 0, total: 0 };
                const isArrived = bus.liveStatus === BusLiveStatus.ARRIVED;
                const isEnRoute = bus.liveStatus === BusLiveStatus.EN_ROUTE || bus.liveStatus === BusLiveStatus.DELAYED;
                
                return (
                  <div
                    key={bus.id}
                    className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 p-3 ${
                      isArrived ? 'border-l-4 border-success-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`w-2 h-2 rounded-full ${
                          isArrived ? 'bg-success-500' : 'bg-blue-500'
                        }`}></div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-900">{bus.number}</h3>
                          <p className={`text-sm font-semibold ${
                            isArrived ? 'text-success-700' : 'text-blue-700'
                          }`}>
                            {isArrived ? '✓ Arrivé' : 'En course'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleAlertClick(bus.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Carte
                      </button>
                    </div>
                    {isArrived && (
                      <div className="mt-2 pt-2 border-t border-slate-200">
                        <p className="text-xs text-slate-600 mb-1">
                          <span className="font-semibold text-green-700">{counts.scanned}</span> scannés,{' '}
                          <span className="font-semibold text-red-700">{counts.unscanned}</span> non scannés
                        </p>
                        <p className="text-xs text-slate-500">
                          Total: {counts.total} / {bus.capacity} élèves
                        </p>
                      </div>
                    )}
                  </div>
                );
              }

              // Carte complète pour bus avec alerte
              const Icon = getAlertIcon(busAlert.type);
              const borderColor =
                busAlert.severity === 'HIGH' ? 'border-l-danger-600' : 'border-l-warning-600';
              const iconColor =
                busAlert.severity === 'HIGH' ? 'text-danger-600' : 'text-warning-600';
              const textColor =
                busAlert.severity === 'HIGH' ? 'text-danger-700' : 'text-warning-700';

              return (
                <div
                  key={bus.id}
                  className={`bg-white rounded-xl border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
                        <h3 className="text-lg font-bold text-slate-900">Bus {bus.number}</h3>
                        {busAlert.severity === 'HIGH' && (
                          <span className="px-2 py-0.5 bg-danger-600 text-white text-xs font-bold rounded uppercase">
                            Urgent
                          </span>
                        )}
                      </div>
                    </div>

                    <p className={`text-base font-semibold ${textColor} mb-2`}>{busAlert.message}</p>
                    <p className="text-xs text-slate-500 mb-3">
                      {formatTimestamp(busAlert.timestamp)}
                    </p>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Call driver for bus', bus.id);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Chauffeur
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAlertClick(bus.id);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                      >
                        <MapPin className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Carte
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : filteredStudentAlerts.length === 0 ? (
          // Aucune alerte élève
          <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
            <div className="w-20 h-20 bg-success-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-success-600" strokeWidth={2} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Tous les élèves scannés</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Aucun problème de scan détecté.
            </p>
          </div>
        ) : (
          // Liste des alertes élèves
          <div className="space-y-3">
            {filteredStudentAlerts.map((alert) => {
              const Icon = Users;
              const borderColor = 'border-l-warning-600';
              const iconColor = 'text-warning-600';
              const textColor = 'text-warning-700';

              return (
                <div
                  key={alert.id}
                  className={`bg-white rounded-xl border-l-4 ${borderColor} shadow-sm hover:shadow-md transition-all duration-200`}
                >
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={2.5} />
                        <h3 className="text-lg font-bold text-slate-900">
                          {alert.message.split(' ')[0]} {alert.message.split(' ')[1]}
                        </h3>
                      </div>
                    </div>

                    <p className={`text-base font-semibold ${textColor} mb-2`}>
                      Bus {alert.busNumber} - {alert.message}
                    </p>
                    <p className="text-xs text-slate-500 mb-3">{formatTimestamp(alert.timestamp)}</p>

                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Call parent for alert', alert.id);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Parent
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          console.log('Call driver for bus', alert.busId);
                        }}
                        className="flex-1 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors duration-200 flex items-center justify-center gap-1.5"
                      >
                        <Phone className="w-3.5 h-3.5" strokeWidth={2.5} />
                        Chauffeur
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
