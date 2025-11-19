/**
 * Page Carte Temps Réel - Tracking GPS des bus d'Abidjan
 * Affiche les bus en temps réel avec informations détaillées
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useRealtimeBuses, useRealtimeStatistics } from '@/hooks/useRealtimeBuses';
import { BusLiveStatus, type BusRealtimeData } from '@/types/realtime';

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

  // Récupérer les bus en temps réel via Firestore listeners
  const { buses, isLoading, error } = useRealtimeBuses();

  // Récupérer les statistiques en temps réel calculées depuis les bus
  const { stats } = useRealtimeStatistics();

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

    // Créer la carte centrée sur Abidjan
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: ABIDJAN_CENTER,
      zoom: 11,
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
    const icon = bus.isActive ? '🚌' : '🚌';

    return `
      <div class="bus-marker ${statusClass}">
        <span class="text-xl">${icon}</span>
        ${
          bus.liveStatus === BusLiveStatus.EN_ROUTE
            ? '<div class="bus-marker-check">✓</div>'
            : bus.liveStatus === BusLiveStatus.DELAYED
            ? '<div class="bus-marker-clock">⏰</div>'
            : ''
        }
      </div>
    `;
  };

  // Créer le HTML du popup
  const createPopupHTML = (bus: BusRealtimeData): string => {
    return `
      <div class="p-3 min-w-[250px]">
        <div class="flex items-center justify-between mb-2">
          <h3 class="font-bold text-lg">${bus.plateNumber}</h3>
          <span class="px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
            bus.liveStatus
          )}">
            ${getStatusLabel(bus.liveStatus)}
          </span>
        </div>

        <div class="space-y-2 text-sm">
          ${
            bus.driver
              ? `
            <div>
              <span class="font-medium text-gray-600">👨‍✈️ Conducteur:</span>
              <p class="text-gray-900">${bus.driver.name}</p>
              <p class="text-gray-500 text-xs">${bus.driver.phone}</p>
            </div>
          `
              : ''
          }

          ${
            bus.currentZone
              ? `
            <div>
              <span class="font-medium text-gray-600">📍 Zone:</span>
              <p class="text-gray-900">${bus.currentZone}</p>
            </div>
          `
              : ''
          }

          ${
            bus.route
              ? `
            <div>
              <span class="font-medium text-gray-600">🛣️ Itinéraire:</span>
              <p class="text-gray-900">${bus.route.name}</p>
              <p class="text-gray-500 text-xs">${bus.route.fromZone} → ${bus.route.toZone}</p>
            </div>
          `
              : ''
          }

          <div>
            <span class="font-medium text-gray-600">👥 Élèves à bord:</span>
            <p class="text-gray-900 font-semibold">${bus.passengersCount} / ${
      bus.capacity
    }</p>
          </div>

          ${
            bus.currentPosition
              ? `
            <div>
              <span class="font-medium text-gray-600">🚀 Vitesse:</span>
              <p class="text-gray-900">${Math.round(bus.currentPosition.speed)} km/h</p>
            </div>
          `
              : ''
          }

          <div>
            <span class="font-medium text-gray-600">🔧 Modèle:</span>
            <p class="text-gray-900">${bus.model} (${bus.year})</p>
          </div>
        </div>
      </div>
    `;
  };

  // Obtenir la classe CSS pour le statut
  const getStatusClass = (status: BusLiveStatus | null): string => {
    switch (status) {
      case BusLiveStatus.EN_ROUTE:
        return 'en-route';
      case BusLiveStatus.STOPPED:
      case BusLiveStatus.IDLE:
        return 'stopped';
      case BusLiveStatus.DELAYED:
        return 'delayed';
      default:
        return 'inactive';
    }
  };

  // Obtenir la classe CSS pour le badge
  const getStatusBadgeClass = (status: BusLiveStatus | null): string => {
    switch (status) {
      case BusLiveStatus.EN_ROUTE:
        return 'bg-green-100 text-green-700';
      case BusLiveStatus.STOPPED:
      case BusLiveStatus.IDLE:
        return 'bg-blue-100 text-blue-700';
      case BusLiveStatus.DELAYED:
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Obtenir le label du statut
  const getStatusLabel = (status: BusLiveStatus | null): string => {
    switch (status) {
      case BusLiveStatus.EN_ROUTE:
        return 'En route';
      case BusLiveStatus.STOPPED:
        return 'Arrêté';
      case BusLiveStatus.IDLE:
        return 'En attente';
      case BusLiveStatus.DELAYED:
        return 'En retard';
      case BusLiveStatus.ARRIVED:
        return 'Arrivé';
      default:
        return 'Hors service';
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Header title="Carte Temps Réel - Abidjan" />

      <div className="flex-1 flex overflow-hidden">
        {/* Carte principale */}
        <div className="flex-1 relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white bg-opacity-90">
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
              <div className="text-center max-w-md">
                <p className="text-red-600 font-semibold mb-2">Token Mapbox manquant !</p>
                <p className="text-sm text-gray-600">
                  Veuillez ajouter{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">VITE_MAPBOX_ACCESS_TOKEN</code>{' '}
                  dans votre fichier <code className="bg-gray-100 px-2 py-1 rounded">.env</code>
                </p>
              </div>
            </div>
          )}

          {/* Conteneur de la carte */}
          <div ref={mapContainer} className="w-full h-full" />

          {/* Indicateur de connexion temps réel */}
          <div className="absolute top-4 left-4 z-10 bg-white px-4 py-2 rounded-lg shadow-md">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium text-gray-700">Temps réel actif</span>
            </div>
          </div>
        </div>

        {/* Sidebar droite avec statistiques et liste */}
        <div className="w-96 bg-white shadow-lg overflow-y-auto flex flex-col">
          {/* Statistiques */}
          {stats && (
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-blue-100">
              <h3 className="text-xl font-bold text-gray-900 mb-4">📊 Statistiques</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg shadow">
                  <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                  <div className="text-xs text-gray-600">Total bus</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow">
                  <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                  <div className="text-xs text-gray-600">En course</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow">
                  <div className="text-2xl font-bold text-orange-600">{stats.enRoute}</div>
                  <div className="text-xs text-gray-600">En route</div>
                </div>
                <div className="bg-white p-3 rounded-lg shadow">
                  <div className="text-2xl font-bold text-purple-600">{stats.totalPassengers}</div>
                  <div className="text-xs text-gray-600">Élèves</div>
                </div>
              </div>
            </div>
          )}

          {/* Filtres et recherche */}
          <div className="p-6 border-b">
            <div className="mb-4">
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-400">🔍</span>
                <input
                  type="text"
                  placeholder="Rechercher un bus..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'all'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Tous ({buses.length})
              </button>
              <button
                onClick={() => setFilterStatus('active')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'active'
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                En course ({activeBuses.length})
              </button>
              <button
                onClick={() => setFilterStatus('inactive')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterStatus === 'inactive'
                    ? 'bg-gray-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Hors course ({inactiveBuses.length})
              </button>
            </div>
          </div>

          {/* Liste des bus en course */}
          {activeBuses.length > 0 && (filterStatus === 'all' || filterStatus === 'active') && (
            <div className="p-6 border-b">
              <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></span>
                Bus en course ({activeBuses.length})
              </h4>
              <div className="space-y-3">
                {activeBuses.map((bus) => (
                  <BusCard key={bus.id} bus={bus} />
                ))}
              </div>
            </div>
          )}

          {/* Liste des bus hors course */}
          {inactiveBuses.length > 0 && (filterStatus === 'all' || filterStatus === 'inactive') && (
            <div className="p-6">
              <h4 className="font-bold text-gray-600 mb-3 flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                Bus hors course ({inactiveBuses.length})
              </h4>
              <div className="space-y-3">
                {inactiveBuses.map((bus) => (
                  <BusCard key={bus.id} bus={bus} />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .bus-marker {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 3px solid white;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transition: transform 0.2s;
          position: relative;
        }

        .bus-marker:hover {
          transform: scale(1.1);
        }

        .bus-marker.en-route {
          background-color: #10b981;
        }

        .bus-marker.delayed {
          background-color: #f59e0b;
        }

        .bus-marker.stopped {
          background-color: #3b82f6;
        }

        .bus-marker.inactive {
          background-color: #6b7280;
        }

        .bus-marker-check {
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          color: #10b981;
          border: 2px solid #10b981;
        }

        .bus-marker-clock {
          position: absolute;
          bottom: -8px;
          right: -8px;
          width: 20px;
          height: 20px;
          background-color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          border: 2px solid #f59e0b;
        }
      `}</style>
    </div>
  );
};

// Composant pour une carte de bus
const BusCard = ({ bus }: { bus: BusRealtimeData }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
      <div className="flex items-start justify-between mb-2">
        <div>
          <h5 className="font-bold text-blue-600">{bus.plateNumber}</h5>
          <p className="text-xs text-gray-500">{bus.model}</p>
        </div>
        <span
          className={`px-2 py-1 rounded-full text-xs font-semibold ${
            bus.liveStatus === BusLiveStatus.EN_ROUTE
              ? 'bg-green-100 text-green-700'
              : bus.liveStatus === BusLiveStatus.DELAYED
              ? 'bg-yellow-100 text-yellow-700'
              : bus.liveStatus === BusLiveStatus.STOPPED || bus.liveStatus === BusLiveStatus.IDLE
              ? 'bg-blue-100 text-blue-700'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          {bus.liveStatus === BusLiveStatus.EN_ROUTE
            ? 'En route'
            : bus.liveStatus === BusLiveStatus.DELAYED
            ? 'En retard'
            : bus.liveStatus === BusLiveStatus.STOPPED
            ? 'Arrêté'
            : bus.liveStatus === BusLiveStatus.IDLE
            ? 'En attente'
            : 'Hors service'}
        </span>
      </div>

      <div className="space-y-1 text-sm text-gray-600">
        {bus.driver && (
          <p>
            <span className="font-medium">👨‍✈️</span> {bus.driver.name}
          </p>
        )}
        {bus.currentZone && (
          <p>
            <span className="font-medium">📍</span> {bus.currentZone}
          </p>
        )}
        {bus.route && (
          <p className="text-xs">
            <span className="font-medium">🛣️</span> {bus.route.name}
          </p>
        )}
        <p>
          <span className="font-medium">👥</span> {bus.passengersCount}/{bus.capacity} élèves
        </p>
      </div>
    </div>
  );
};
