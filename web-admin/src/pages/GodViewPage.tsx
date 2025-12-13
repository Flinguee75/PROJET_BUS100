/**
 * Page God View - Tour de Contrôle (Management by Exception)
 * Carte temps réel + Sidebar alertes critiques uniquement
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useQuery } from '@tanstack/react-query';
import { RefreshCw, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage';
import { AlertsSidebar, Alert } from '@/components/AlertsSidebar';
import * as realtimeApi from '@/services/realtime.api';
import type { BusRealtimeData, BusLiveStatus } from '@/types/realtime';

// Token Mapbox depuis les variables d'environnement
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;

// Centre d'Abidjan
const ABIDJAN_CENTER: [number, number] = [-4.0083, 5.3599];

export const GodViewPage = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popups = useRef<Map<string, mapboxgl.Popup>>(new Map());

  const [mapLoaded, setMapLoaded] = useState(false);

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

  // TODO: Récupérer les alertes depuis l'API
  // Pour l'instant, on utilise des données mockées
  const mockAlerts: Alert[] = [
    {
      id: 'alert_1',
      type: 'DELAY',
      busId: 'bus_1',
      busNumber: '#12',
      severity: 'HIGH',
      message: 'Retard de 18 minutes',
      timestamp: Date.now() - 5 * 60000, // Il y a 5 min
    },
    {
      id: 'alert_2',
      type: 'UNSCANNED_CHILD',
      busId: 'bus_2',
      busNumber: '#5',
      severity: 'MEDIUM',
      message: '3 enfants non scannés à Cocody',
      timestamp: Date.now() - 10 * 60000, // Il y a 10 min
    },
    {
      id: 'alert_3',
      type: 'STOPPED',
      busId: 'bus_3',
      busNumber: '#8',
      severity: 'MEDIUM',
      message: 'Arrêté depuis 12 minutes',
      timestamp: Date.now() - 12 * 60000, // Il y a 12 min
    },
  ];

  // TODO: Remplacer par la vraie requête API
  const alerts = mockAlerts;

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
      zoom: 10.5,
      minZoom: 9,
      maxZoom: 14,
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
  }, []);

  // Déterminer la couleur du marqueur selon le statut
  const getMarkerColor = useCallback((bus: BusRealtimeData): string => {
    if (!bus.isActive) return '#64748b'; // Gris (inactif)

    // TODO: Calculer le vrai retard depuis l'API
    const delayMinutes = 0; // Placeholder

    if (delayMinutes > 15) return '#ef4444'; // Rouge (retard critique)
    if (delayMinutes > 5) return '#f59e0b'; // Orange (retard léger)
    if (bus.liveStatus === 'en_route') return '#22c55e'; // Vert (à l'heure)

    return '#3b82f6'; // Bleu (arrêté)
  }, []);

  // Créer le HTML du marqueur
  const createMarkerHTML = useCallback((bus: BusRealtimeData): string => {
    const color = getMarkerColor(bus);
    const busIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/><circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/></svg>`;

    // Animation de clignotement pour les bus en retard critique
    const isBlinking = color === '#ef4444';

    return `
      <div class="bus-marker ${isBlinking ? 'animate-pulse' : ''}" style="background-color: ${color}">
        ${busIcon}
      </div>
    `;
  }, [getMarkerColor]);

  // Créer le HTML du popup
  const createPopupHTML = useCallback((bus: BusRealtimeData): string => {
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

          <div class="flex items-center justify-between p-2.5 bg-primary-50 rounded-lg">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-primary-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0M15 7a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z"/></svg>
              <span class="text-primary-700 text-xs font-medium">Élèves</span>
            </div>
            <span class="text-primary-900 font-bold text-base">${bus.passengersCount} / ${bus.capacity}</span>
          </div>
        </div>
      </div>
    `;
  }, []);

  // Mettre à jour les marqueurs quand les bus changent
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    buses.forEach((bus) => {
      if (!bus.currentPosition) return;

      const { lat, lng } = bus.currentPosition;
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

    // Supprimer les marqueurs des bus qui n'existent plus
    markers.current.forEach((marker, busId) => {
      if (!buses.find((b) => b.id === busId)) {
        marker.remove();
        markers.current.delete(busId);
        popups.current.delete(busId);
      }
    });
  }, [buses, mapLoaded, createMarkerHTML, createPopupHTML]);

  return (
    <div className="flex h-screen bg-neutral-50">
      {/* Carte principale - 70% */}
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

        {/* Conteneur de la carte */}
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

      {/* Sidebar Alertes - 30% */}
      <AlertsSidebar alerts={alerts} />

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
