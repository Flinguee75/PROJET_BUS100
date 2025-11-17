/**
 * Composant BusMarker - Marqueur personnalisé pour Mapbox
 * Affiche un bus sur la carte avec une couleur selon son statut
 */

import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import type { Bus, BusStatus } from '@/types/bus';

interface BusMarkerProps {
  bus: Bus;
  map: mapboxgl.Map;
  onClick?: (bus: Bus) => void;
}

/**
 * Retourne la couleur du marqueur selon le statut du bus
 */
const getMarkerColor = (status: BusStatus): string => {
  switch (status) {
    case 'EN_ROUTE':
      return '#10b981'; // Vert
    case 'A_L_ARRET':
      return '#f59e0b'; // Orange
    case 'EN_RETARD':
      return '#ef4444'; // Rouge
    case 'HORS_SERVICE':
      return '#6b7280'; // Gris
    default:
      return '#3b82f6'; // Bleu
  }
};

/**
 * Retourne l'icône du marqueur selon le statut
 */
const getMarkerIcon = (status: BusStatus): string => {
  switch (status) {
    case 'EN_ROUTE':
      return '🚌';
    case 'A_L_ARRET':
      return '⏸️';
    case 'EN_RETARD':
      return '⚠️';
    case 'HORS_SERVICE':
      return '❌';
    default:
      return '🚌';
  }
};

export const BusMarker = ({ bus, map, onClick }: BusMarkerProps) => {
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  useEffect(() => {
    if (!bus.currentPosition) {
      return;
    }

    // Créer l'élément HTML du marqueur
    const el = document.createElement('div');
    el.className = 'bus-marker';
    el.style.width = '40px';
    el.style.height = '40px';
    el.style.borderRadius = '50%';
    el.style.backgroundColor = getMarkerColor(bus.status);
    el.style.border = '3px solid white';
    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
    el.style.display = 'flex';
    el.style.alignItems = 'center';
    el.style.justifyContent = 'center';
    el.style.fontSize = '20px';
    el.style.cursor = 'pointer';
    el.style.transition = 'transform 0.2s';
    el.innerHTML = getMarkerIcon(bus.status);

    // Animation au survol
    el.addEventListener('mouseenter', () => {
      el.style.transform = 'scale(1.2)';
    });
    el.addEventListener('mouseleave', () => {
      el.style.transform = 'scale(1)';
    });

    // Créer le marqueur Mapbox
    const marker = new mapboxgl.Marker({
      element: el,
      anchor: 'center',
    })
      .setLngLat([bus.currentPosition.lng, bus.currentPosition.lat])
      .addTo(map);

    // Créer le popup
    const popup = new mapboxgl.Popup({
      offset: 25,
      closeButton: false,
      closeOnClick: false,
    }).setHTML(`
      <div style="padding: 8px; min-width: 180px;">
        <div style="font-weight: bold; margin-bottom: 8px; font-size: 14px;">
          🚌 ${bus.immatriculation}
        </div>
        <div style="font-size: 12px; color: #666;">
          <div style="margin-bottom: 4px;">
            <strong>Chauffeur:</strong> ${bus.chauffeur}
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Statut:</strong> <span style="color: ${getMarkerColor(bus.status)};">${bus.statusLabel}</span>
          </div>
          <div style="margin-bottom: 4px;">
            <strong>Vitesse:</strong> ${bus.currentPosition.speed.toFixed(1)} km/h
          </div>
          <div>
            <strong>Itinéraire:</strong> ${bus.itineraire}
          </div>
        </div>
      </div>
    `);

    // Afficher le popup au survol
    el.addEventListener('mouseenter', () => {
      marker.setPopup(popup);
      marker.togglePopup();
    });

    el.addEventListener('mouseleave', () => {
      marker.togglePopup();
    });

    // Gérer le clic sur le marqueur
    if (onClick) {
      el.addEventListener('click', () => {
        onClick(bus);
      });
    }

    markerRef.current = marker;

    // Nettoyage lors du démontage
    return () => {
      marker.remove();
    };
  }, [bus, map, onClick]);

  // Mettre à jour la position du marqueur quand elle change
  useEffect(() => {
    if (markerRef.current && bus.currentPosition) {
      markerRef.current.setLngLat([bus.currentPosition.lng, bus.currentPosition.lat]);
    }
  }, [bus.currentPosition]);

  return null; // Le composant ne rend rien dans le DOM React
};
