/**
 * Page Carte Temps Réel - Tracking GPS des bus d'Abidjan (Design Professionnel)
 * Affiche les bus en temps réel avec informations détaillées
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { 
  RefreshCw,
  Search,
  Bus,
  Users,
  MapPin,
  Activity,
  Navigation,
  UserCheck,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import * as realtimeApi from '@/services/realtime.api';
import type { BusRealtimeData, BusLiveStatus } from '@/types/realtime';

// Token Mapbox depuis les variables d'environnement
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Centre d'Abidjan
const ABIDJAN_CENTER: [number, number] = [-4.0083, 5.3599];

export const RealtimeMapPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popups = useRef<Map<string, mapboxgl.Popup>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Récupérer les bus en temps réel
  const {
    data: buses = [],
    isLoading,
    error,
    refetch,
  } = useQuery<BusRealtimeData[]>({
    queryKey: ['buses-realtime'],
    queryFn: realtimeApi.getAllBusesRealtime,
    refetchInterval: 5000, // Rafraîchir toutes les 5 secondes
  });

  // Récupérer les statistiques
  const { data: stats } = useQuery({
    queryKey: ['bus-statistics'],
    queryFn: realtimeApi.getBusStatistics,
    refetchInterval: 10000, // Rafraîchir toutes les 10 secondes
  });

  // Filtrer les bus selon la recherche et le statut
  const filteredBuses = buses.filter((bus) => {
    const matchesSearch =
      bus.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.driver?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.currentZone?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      filterStatus === 'all' ||
      (filterStatus === 'active' && bus.isActive) ||
      (filterStatus === 'inactive' && !bus.isActive);

    return matchesSearch && matchesFilter;
  });

  // Séparer les bus en actifs et inactifs
  const activeBuses = filteredBuses.filter((b) => b.isActive);
  const inactiveBuses = filteredBuses.filter((b) => !b.isActive);

  // Initialiser la carte Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      console.error('Token Mapbox manquant !');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Créer la carte centrée sur Abidjan - Interactions limitées
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: ABIDJAN_CENTER,
      zoom: 10.5, // Zoom initial pour vue globale d'Abidjan
      // Limites de zoom pour éviter que la carte soit trop grande ou trop petite
      minZoom: 9,   // Zoom minimum (vue très large d'Abidjan)
      maxZoom: 14,  // Zoom maximum (vue détaillée mais pas trop proche)
      // Activer les interactions normales
      dragPan: true,           // Permettre le déplacement
      scrollZoom: true,        // Permettre le zoom avec la molette
      boxZoom: true,           // Permettre le zoom avec la boîte
      doubleClickZoom: true,   // Permettre le zoom double-clic
      touchZoomRotate: true,   // Permettre le zoom tactile
      keyboard: true,           // Permettre les raccourcis clavier
      touchPitch: false,        // Désactiver l'inclinaison tactile (optionnel)
      dragRotate: false,       // Désactiver la rotation (optionnel)
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    // Ajouter les contrôles de navigation (zoom +/-, rotation)
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Mettre à jour les marqueurs quand les bus changent
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    filteredBuses.forEach((bus) => {
      if (!bus.currentPosition) return;

      const { lat, lng } = bus.currentPosition;
      const busId = bus.id;

      // Si le marqueur existe déjà, le mettre à jour
      if (markers.current.has(busId)) {
        const marker = markers.current.get(busId)!;
        marker.setLngLat([lng, lat]);

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

    // Supprimer les marqueurs des bus qui n'existent plus
    markers.current.forEach((marker, busId) => {
      if (!filteredBuses.find((b) => b.id === busId)) {
        marker.remove();
        markers.current.delete(busId);
        popups.current.delete(busId);
      }
    });
  }, [filteredBuses, mapLoaded]);

  // Créer le HTML du marqueur
  const createMarkerHTML = (bus: BusRealtimeData): string => {
    const statusClass = getStatusClass(bus.liveStatus);
    const busIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`;

    return `
      <div class="bus-marker ${statusClass}">
        ${busIcon}
        ${
          bus.liveStatus === 'en_route'
            ? '<div class="bus-marker-badge success"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>'
            : bus.liveStatus === 'delayed'
            ? '<div class="bus-marker-badge warning"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg></div>'
            : ''
        }
      </div>
    `;
  };

  // Créer le HTML du popup
  const createPopupHTML = (bus: BusRealtimeData): string => {
    return `
      <div class="p-4 min-w-[280px]">
        <div class="flex items-center justify-between mb-3">
          <h3 class="font-bold text-lg text-slate-900">${bus.plateNumber}</h3>
          <span class="px-2.5 py-1 rounded-md text-xs font-semibold ${getStatusBadgeClass(
            bus.liveStatus
          )}">
            ${getStatusLabel(bus.liveStatus)}
          </span>
        </div>

        <div class="space-y-2.5 text-sm">
          ${
            bus.driver
              ? `
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="5"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
              <div class="flex-1">
                <p class="font-medium text-slate-700 text-xs">Conducteur</p>
                <p class="text-slate-900 font-medium">${bus.driver.name}</p>
                <p class="text-slate-500 text-xs">${bus.driver.phone}</p>
              </div>
            </div>
          `
              : ''
          }

          ${
            bus.currentZone
              ? `
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
              <div class="flex-1">
                <p class="font-medium text-slate-700 text-xs">Zone actuelle</p>
                <p class="text-slate-900 font-medium">${bus.currentZone}</p>
              </div>
            </div>
          `
              : ''
          }

          ${
            bus.route
              ? `
            <div class="flex items-start gap-2">
              <svg class="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/></svg>
              <div class="flex-1">
                <p class="font-medium text-slate-700 text-xs">Itinéraire</p>
                <p class="text-slate-900 font-medium">${bus.route.name}</p>
                <p class="text-slate-500 text-xs">${bus.route.fromZone} → ${bus.route.toZone}</p>
              </div>
            </div>
          `
              : ''
          }

          <div class="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span class="text-slate-700 text-xs font-medium">Élèves</span>
            </div>
            <span class="text-slate-900 font-bold">${bus.passengersCount} / ${bus.capacity}</span>
          </div>

          ${
            bus.currentPosition
              ? `
            <div class="flex items-center justify-between p-2 bg-primary-50 rounded-lg">
              <div class="flex items-center gap-2">
                <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
                <span class="text-primary-700 text-xs font-medium">Vitesse</span>
              </div>
              <span class="text-primary-900 font-bold">${Math.round(bus.currentPosition.speed)} km/h</span>
            </div>
          `
              : ''
          }

          <div class="pt-2 border-t border-slate-200">
            <p class="text-xs text-slate-500">
              <span class="font-medium">${bus.model}</span> · ${bus.year}
            </p>
          </div>
        </div>
      </div>
    `;
  };

  // Obtenir la classe CSS pour le statut
  const getStatusClass = (status: BusLiveStatus | null): string => {
    switch (status) {
      case 'en_route':
        return 'en-route';
      case 'stopped':
      case 'idle':
        return 'stopped';
      case 'delayed':
        return 'delayed';
      default:
        return 'inactive';
    }
  };

  // Obtenir la classe CSS pour le badge
  const getStatusBadgeClass = (status: BusLiveStatus | null): string => {
    switch (status) {
      case 'en_route':
        return 'bg-success-50 text-success-700';
      case 'stopped':
      case 'idle':
        return 'bg-primary-50 text-primary-700';
      case 'delayed':
        return 'bg-warning-50 text-warning-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  // Obtenir le label du statut
  const getStatusLabel = (status: BusLiveStatus | null): string => {
    switch (status) {
      case 'en_route':
        return 'En route';
      case 'stopped':
        return 'Arrêté';
      case 'idle':
        return 'En attente';
      case 'delayed':
        return 'En retard';
      case 'arrived':
        return 'Arrivé';
      default:
        return 'Hors service';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-neutral-50" style={{ height: '100vh', overflow: 'hidden' }}>
      <Header title="Carte Temps Réel - Abidjan" subtitle="Suivi GPS des bus scolaires" />

      <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 80px)' }}>
        {/* Carte principale - Prend toute la hauteur disponible */}
        <div className="flex-1 relative h-full">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-95">
              <LoadingSpinner message="Chargement de la carte..." />
            </div>
          )}

          {error && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white">
              <ErrorMessage message="Impossible de charger les bus" />
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

          {/* Conteneur de la carte - Prend toute la hauteur disponible */}
          <div ref={mapContainer} className="w-full h-full absolute inset-0" />

          {/* Bouton de rafraîchissement */}
          <button
            onClick={() => refetch()}
            className="absolute top-4 left-4 z-10 bg-white px-4 py-2.5 rounded-lg shadow-card hover:shadow-card-hover transition-all duration-200 flex items-center gap-2 text-slate-700 hover:text-primary-600 font-medium group"
          >
            <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" strokeWidth={2} />
            <span className="text-sm">Actualiser</span>
          </button>
        </div>

        {/* Sidebar droite avec statistiques et liste - Scrollable */}
        <div className="w-96 bg-white border-l border-slate-200 flex flex-col overflow-hidden h-full">
          {/* Contenu scrollable */}
          <div className="flex-1 overflow-y-auto" style={{ minHeight: 0 }}>
            {/* Statistiques */}
            {stats && (
              <div className="p-6 border-b border-slate-200 bg-gradient-to-br from-slate-50 to-white">
                <div className="flex items-center gap-2 mb-4">
                  <Activity className="w-5 h-5 text-primary-600" strokeWidth={2} />
                  <h3 className="text-lg font-bold text-slate-900 font-display">Statistiques</h3>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Bus className="w-4 h-4 text-slate-500" strokeWidth={2} />
                      <div className="text-xs text-slate-600 font-medium">Total bus</div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                  </div>
                  <div className="bg-success-50 p-3 rounded-lg border border-success-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <CheckCircle2 className="w-4 h-4 text-success-600" strokeWidth={2} />
                      <div className="text-xs text-success-700 font-medium">En course</div>
                    </div>
                    <div className="text-2xl font-bold text-success-700">{stats.active}</div>
                  </div>
                  <div className="bg-primary-50 p-3 rounded-lg border border-primary-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Navigation className="w-4 h-4 text-primary-600" strokeWidth={2} />
                      <div className="text-xs text-primary-700 font-medium">En route</div>
                    </div>
                    <div className="text-2xl font-bold text-primary-700">{stats.enRoute}</div>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-slate-600" strokeWidth={2} />
                      <div className="text-xs text-slate-600 font-medium">Élèves</div>
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.totalPassengers}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Filtres et recherche */}
            <div className="p-5 border-b border-slate-200">
              {/* Barre de recherche */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={2} />
                  <input
                    type="text"
                    placeholder="Rechercher un bus..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </div>
              </div>

              {/* Boutons de filtre */}
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'all'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Tous ({buses.length})
                </button>
                <button
                  onClick={() => setFilterStatus('active')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'active'
                      ? 'bg-success-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Actifs ({activeBuses.length})
                </button>
                <button
                  onClick={() => setFilterStatus('inactive')}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    filterStatus === 'inactive'
                      ? 'bg-slate-600 text-white shadow-md'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Inactifs ({inactiveBuses.length})
                </button>
              </div>
            </div>

            {/* Liste des bus en course */}
            {activeBuses.length > 0 && (filterStatus === 'all' || filterStatus === 'active') && (
              <div className="p-5 border-b border-slate-200">
                <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse"></span>
                  Bus en course ({activeBuses.length})
                </h4>
                <div className="space-y-2.5">
                  {activeBuses.map((bus) => (
                    <BusCard key={bus.id} bus={bus} />
                  ))}
                </div>
              </div>
            )}

            {/* Liste des bus hors course */}
            {inactiveBuses.length > 0 && (filterStatus === 'all' || filterStatus === 'inactive') && (
              <div className="p-5">
                <h4 className="font-semibold text-slate-600 mb-3 flex items-center gap-2 text-sm">
                  <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                  Bus hors course ({inactiveBuses.length})
                </h4>
                <div className="space-y-2.5">
                  {inactiveBuses.map((bus) => (
                    <BusCard key={bus.id} bus={bus} />
                  ))}
                </div>
              </div>
            )}
          </div>
          {/* Fin du contenu scrollable */}
        </div>
      </div>

      <style>{`
        .bus-marker {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-center: center;
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

        .bus-marker.en-route {
          background-color: #22c55e;
        }

        .bus-marker.delayed {
          background-color: #f59e0b;
        }

        .bus-marker.stopped {
          background-color: #3b82f6;
        }

        .bus-marker.inactive {
          background-color: #64748b;
        }

        .bus-marker-badge {
          position: absolute;
          bottom: -6px;
          right: -6px;
          width: 22px;
          height: 22px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }

        .bus-marker-badge.success {
          border: 2.5px solid #22c55e;
          color: #22c55e;
        }

        .bus-marker-badge.warning {
          border: 2.5px solid #f59e0b;
          color: #f59e0b;
        }
      `}</style>
    </div>
  );
};

// Composant pour une carte de bus
const BusCard = ({ bus }: { bus: BusRealtimeData }) => {
  const getStatusBadge = (status: BusLiveStatus | null) => {
    switch (status) {
      case 'en_route':
        return { className: 'bg-success-50 text-success-700 border-success-200', label: 'En route' };
      case 'delayed':
        return { className: 'bg-warning-50 text-warning-700 border-warning-200', label: 'En retard' };
      case 'stopped':
        return { className: 'bg-primary-50 text-primary-700 border-primary-200', label: 'Arrêté' };
      case 'idle':
        return { className: 'bg-slate-100 text-slate-700 border-slate-200', label: 'En attente' };
      default:
        return { className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Hors service' };
    }
  };

  const statusBadge = getStatusBadge(bus.liveStatus);

  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 hover:shadow-card-hover hover:border-slate-300 transition-all duration-200 cursor-pointer group">
      <div className="flex items-start justify-between mb-2.5">
        <div>
          <h5 className="font-bold text-slate-900 group-hover:text-primary-600 transition-colors">
            {bus.plateNumber}
          </h5>
          <p className="text-xs text-slate-500">{bus.model}</p>
        </div>
        <span
          className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${statusBadge.className}`}
        >
          {statusBadge.label}
        </span>
      </div>

      <div className="space-y-1.5 text-xs">
        {bus.driver && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <UserCheck className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
            <span className="font-medium truncate">{bus.driver.name}</span>
          </div>
        )}
        {bus.currentZone && (
          <div className="flex items-center gap-1.5 text-slate-600">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
            <span className="truncate">{bus.currentZone}</span>
          </div>
        )}
        {bus.route && (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Navigation className="w-3.5 h-3.5 flex-shrink-0" strokeWidth={2} />
            <span className="truncate text-xs">{bus.route.name}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Users className="w-3.5 h-3.5" strokeWidth={2} />
            <span className="font-medium text-xs">Élèves</span>
          </div>
          <span className="font-bold text-slate-900 text-xs">
            {bus.passengersCount}/{bus.capacity}
          </span>
        </div>
      </div>
    </div>
  );
};
