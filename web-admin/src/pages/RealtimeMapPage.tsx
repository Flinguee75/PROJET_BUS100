/**
 * Page Carte Temps Réel - Tracking GPS des bus
 * Style "Gestion des Bus" avec carte + sidebar
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/Header';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { useRealtimeGPS } from '@/hooks/useRealtimeGPS';
import * as gpsApi from '@/services/gps.api';
import type { Bus } from '@/types/bus';

// Token Mapbox depuis les variables d'environnement
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

export const RealtimeMapPage = () => {
  const navigate = useNavigate();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Récupérer la liste initiale des bus
  const {
    data: buses,
    isLoading,
    error,
  } = useQuery<Bus[]>({
    queryKey: ['buses'],
    queryFn: gpsApi.getAllBuses,
  });

  // Écouter les mises à jour GPS en temps réel
  const { buses: realtimeBuses } = useRealtimeGPS();

  // Filtrer les bus selon la recherche
  const filteredBuses = (realtimeBuses.length > 0 ? realtimeBuses : buses || []).filter(
    (bus) =>
      bus.immatriculation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bus.chauffeur.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Initialiser la carte Mapbox
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    if (!MAPBOX_TOKEN) {
      console.error('Token Mapbox manquant !');
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;

    // Créer la carte centrée sur la Tunisie
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [10.1815, 36.8065], // Tunis
      zoom: 12,
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

    const busesToDisplay = realtimeBuses.length > 0 ? realtimeBuses : buses || [];

    busesToDisplay.forEach((bus) => {
      if (!bus.currentPosition) return;

      const { lat, lng } = bus.currentPosition;
      const busId = bus.id;

      // Si le marqueur existe déjà, le mettre à jour
      if (markers.current.has(busId)) {
        const marker = markers.current.get(busId)!;
        marker.setLngLat([lng, lat]);
      } else {
        // Créer un nouveau marqueur
        const el = document.createElement('div');
        el.className = 'custom-marker';
        el.innerHTML = `
          <div class="bus-marker ${bus.status.toLowerCase()}">
            <span class="text-xl">${
              bus.status === 'EN_ROUTE'
                ? '🚌'
                : bus.status === 'EN_RETARD'
                ? '🚌'
                : '🚌'
            }</span>
            ${
              bus.status === 'EN_ROUTE'
                ? '<div class="bus-marker-check">✓</div>'
                : bus.status === 'EN_RETARD'
                ? '<div class="bus-marker-clock">⏰</div>'
                : ''
            }
          </div>
        `;

        const marker = new mapboxgl.Marker(el)
          .setLngLat([lng, lat])
          .setPopup(
            new mapboxgl.Popup({ offset: 25 }).setHTML(`
              <div class="p-2">
                <h3 class="font-bold">${bus.immatriculation}</h3>
                <p class="text-sm">Chauffeur: ${bus.chauffeur}</p>
                <p class="text-sm">Itinéraire: ${bus.itineraire}</p>
                <p class="text-sm">Statut: ${bus.statusLabel}</p>
              </div>
            `)
          )
          .addTo(map.current!);

        markers.current.set(busId, marker);
      }
    });

    // Supprimer les marqueurs des bus qui n'existent plus
    markers.current.forEach((marker, busId) => {
      if (!busesToDisplay.find((b) => b.id === busId)) {
        marker.remove();
        markers.current.delete(busId);
      }
    });
  }, [buses, realtimeBuses, mapLoaded]);

  const handleBusClick = (busId: string) => {
    navigate(`/buses/${busId}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      <Header title="Gestion des Bus" />

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
                <p className="text-red-600 font-semibold mb-2">
                  Token Mapbox manquant !
                </p>
                <p className="text-sm text-gray-600">
                  Veuillez ajouter{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">
                    VITE_MAPBOX_ACCESS_TOKEN
                  </code>{' '}
                  dans votre fichier{' '}
                  <code className="bg-gray-100 px-2 py-1 rounded">.env</code>
                </p>
              </div>
            </div>
          )}

          {/* Conteneur de la carte */}
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        {/* Sidebar droite avec liste des bus */}
        <div className="w-96 bg-white shadow-lg p-6 overflow-y-auto">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            Gestion des Bus
          </h3>

          {/* Barre de recherche */}
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

          {/* Liste des bus */}
          <div className="space-y-3">
            {filteredBuses.map((bus) => (
              <div
                key={bus.id}
                onClick={() => handleBusClick(bus.id)}
                className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
              >
                {/* Badge de statut */}
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      bus.status === 'EN_ROUTE'
                        ? 'bg-green-100 text-green-700'
                        : bus.status === 'EN_RETARD'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {bus.statusLabel}
                  </span>
                </div>

                {/* Nom du bus */}
                <h4 className="font-bold text-blue-600 text-lg mb-1">
                  Bus {bus.immatriculation.split(' ')[1]}
                </h4>

                {/* Informations */}
                <div className="space-y-1 text-sm text-gray-600">
                  <p>
                    <span className="font-medium">Position actuelle:</span>{' '}
                    {bus.itineraire}
                  </p>
                  {bus.lastGPSUpdate && (
                    <p>
                      <span className="font-medium">Heure de dernier GPS:</span>{' '}
                      <span className="text-blue-600 font-medium">
                        {bus.lastGPSUpdate}: {bus.chauffeur}
                      </span>
                    </p>
                  )}
                  {bus.chauffeur && (
                    <p>
                      <span className="font-medium">Chauffeur assigné GPS:</span>{' '}
                      {bus.chauffeur}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
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
        
        .bus-marker.en_route {
          background-color: #10b981;
        }
        
        .bus-marker.en_retard {
          background-color: #f59e0b;
        }
        
        .bus-marker.a_l_arret {
          background-color: #3b82f6;
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
          justify-center: center;
          font-size: 10px;
          border: 2px solid #f59e0b;
        }
      `}</style>
    </div>
  );
};

