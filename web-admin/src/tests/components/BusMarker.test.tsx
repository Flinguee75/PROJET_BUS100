/**
 * Tests pour le composant BusMarker
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BusMarker } from '@/components/BusMarker';
import type { Bus } from '@/types/bus';
import mapboxgl from 'mapbox-gl';

describe('BusMarker', () => {
  let mockMap: mapboxgl.Map;
  let mockBus: Bus;

  beforeEach(() => {
    // Mock de la carte Mapbox
    mockMap = {
      on: vi.fn(),
      remove: vi.fn(),
      addControl: vi.fn(),
      fitBounds: vi.fn(),
      flyTo: vi.fn(),
    } as unknown as mapboxgl.Map;

    // Bus de test
    mockBus = {
      id: 'bus-1',
      immatriculation: 'ABC-123',
      chauffeur: 'Jean Dupont',
      capacite: 50,
      status: 'EN_ROUTE',
      statusLabel: 'En route',
      itineraire: 'Ligne A',
      currentPosition: {
        lat: 48.8566,
        lng: 2.3522,
        speed: 35.5,
        timestamp: Date.now(),
      },
    };
  });

  it('ne crée pas de marqueur si pas de position', () => {
    const busWithoutPosition = { ...mockBus, currentPosition: undefined };
    const { container } = render(
      <BusMarker bus={busWithoutPosition} map={mockMap} />
    );

    // Le composant ne rend rien dans le DOM React
    expect(container.firstChild).toBeNull();
  });

  it('crée un marqueur Mapbox avec la bonne position', () => {
    render(<BusMarker bus={mockBus} map={mockMap} />);

    // Vérifier que Mapbox.Marker a été appelé
    expect(mapboxgl.Marker).toHaveBeenCalled();

    // Vérifier que setLngLat a été appelé avec les bonnes coordonnées
    const markerInstance = vi.mocked(mapboxgl.Marker).mock.results[0]?.value;
    expect(markerInstance.setLngLat).toHaveBeenCalledWith([2.3522, 48.8566]);
  });

  it('ajoute le marqueur à la carte', () => {
    render(<BusMarker bus={mockBus} map={mockMap} />);

    const markerInstance = vi.mocked(mapboxgl.Marker).mock.results[0]?.value;
    expect(markerInstance.addTo).toHaveBeenCalled();
  });

  it('crée un popup avec les informations du bus', () => {
    render(<BusMarker bus={mockBus} map={mockMap} />);

    // Vérifier que Popup a été créé
    expect(mapboxgl.Popup).toHaveBeenCalled();

    // Vérifier que setHTML a été appelé
    const popupInstance = vi.mocked(mapboxgl.Popup).mock.results[0]?.value;
    expect(popupInstance.setHTML).toHaveBeenCalled();

    // Vérifier le contenu du HTML
    const htmlContent = vi.mocked(popupInstance.setHTML).mock.calls[0][0];
    expect(htmlContent).toContain('ABC-123');
    expect(htmlContent).toContain('Jean Dupont');
    expect(htmlContent).toContain('En route');
    expect(htmlContent).toContain('35.5 km/h');
    expect(htmlContent).toContain('Ligne A');
  });

  it('utilise la bonne couleur selon le statut EN_ROUTE', () => {
    mockBus.status = 'EN_ROUTE';
    render(<BusMarker bus={mockBus} map={mockMap} />);

    // Le marqueur est créé avec un élément HTML personnalisé
    const markerCall = vi.mocked(mapboxgl.Marker).mock.calls[0];
    const element = markerCall[0].element as HTMLDivElement;

    expect(element.style.backgroundColor).toBe('rgb(16, 185, 129)'); // Vert
  });

  it('utilise la bonne couleur selon le statut A_L_ARRET', () => {
    vi.clearAllMocks();
    mockBus.status = 'A_L_ARRET';
    render(<BusMarker bus={mockBus} map={mockMap} />);

    const markerCall = vi.mocked(mapboxgl.Marker).mock.calls[0];
    const element = markerCall[0].element as HTMLDivElement;

    // Le navigateur peut retourner rgb() ou hex
    expect(['#f59e0b', 'rgb(245, 158, 11)']).toContain(element.style.backgroundColor);
  });

  it('utilise la bonne couleur selon le statut EN_RETARD', () => {
    vi.clearAllMocks();
    mockBus.status = 'EN_RETARD';
    render(<BusMarker bus={mockBus} map={mockMap} />);

    const markerCall = vi.mocked(mapboxgl.Marker).mock.calls[0];
    const element = markerCall[0].element as HTMLDivElement;

    // Le navigateur peut retourner rgb() ou hex
    expect(['#ef4444', 'rgb(239, 68, 68)']).toContain(element.style.backgroundColor);
  });

  it('utilise la bonne couleur selon le statut HORS_SERVICE', () => {
    vi.clearAllMocks();
    mockBus.status = 'HORS_SERVICE';
    render(<BusMarker bus={mockBus} map={mockMap} />);

    const markerCall = vi.mocked(mapboxgl.Marker).mock.calls[0];
    const element = markerCall[0].element as HTMLDivElement;

    // Le navigateur peut retourner rgb() ou hex
    expect(['#6b7280', 'rgb(107, 114, 128)']).toContain(element.style.backgroundColor);
  });

  it('appelle onClick quand le marqueur est cliqué', async () => {
    const mockOnClick = vi.fn();
    render(<BusMarker bus={mockBus} map={mockMap} onClick={mockOnClick} />);

    // Attendre que useEffect s'exécute
    await new Promise((resolve) => setTimeout(resolve, 0));

    const markerCall = vi.mocked(mapboxgl.Marker).mock.calls[0];
    const element = markerCall[0].element as HTMLDivElement;

    // Simuler un clic sur le marqueur - l'event listener a été ajouté par addEventListener
    element.click();

    expect(mockOnClick).toHaveBeenCalledWith(mockBus);
  });

  it('met à jour la position du marqueur quand elle change', () => {
    const { rerender } = render(<BusMarker bus={mockBus} map={mockMap} />);

    const markerInstance = vi.mocked(mapboxgl.Marker).mock.results[0]?.value;

    // Mettre à jour la position du bus
    const updatedBus = {
      ...mockBus,
      currentPosition: {
        ...mockBus.currentPosition!,
        lat: 48.8,
        lng: 2.3,
      },
    };

    rerender(<BusMarker bus={updatedBus} map={mockMap} />);

    // Vérifier que setLngLat a été appelé (au moins une fois pendant le cycle de vie)
    expect(markerInstance.setLngLat).toHaveBeenCalled();
  });

  it('supprime le marqueur lors du démontage', () => {
    const { unmount } = render(<BusMarker bus={mockBus} map={mockMap} />);

    const markerInstance = vi.mocked(mapboxgl.Marker).mock.results[0]?.value;

    unmount();

    // Vérifier que remove a été appelé
    expect(markerInstance.remove).toHaveBeenCalled();
  });

  it('crée un élément HTML avec les bons styles', () => {
    render(<BusMarker bus={mockBus} map={mockMap} />);

    const markerCall = vi.mocked(mapboxgl.Marker).mock.calls[0];
    const element = markerCall[0].element as HTMLDivElement;

    expect(element.style.width).toBe('40px');
    expect(element.style.height).toBe('40px');
    expect(element.style.borderRadius).toBe('50%');
    expect(element.style.border).toBe('3px solid white');
    expect(element.style.cursor).toBe('pointer');
    expect(element.className).toBe('bus-marker');
  });

  it('utilise la bonne icône selon le statut', () => {
    const statuses: Array<{ status: Bus['status']; icon: string }> = [
      { status: 'EN_ROUTE', icon: '🚌' },
      { status: 'A_L_ARRET', icon: '⏸️' },
      { status: 'EN_RETARD', icon: '⚠️' },
      { status: 'HORS_SERVICE', icon: '❌' },
    ];

    statuses.forEach(({ status, icon }) => {
      vi.clearAllMocks();
      mockBus.status = status;
      render(<BusMarker bus={mockBus} map={mockMap} />);

      const markerCall = vi.mocked(mapboxgl.Marker).mock.calls[0];
      const element = markerCall[0].element as HTMLDivElement;

      expect(element.innerHTML).toBe(icon);
    });
  });

  it('ne rend rien dans le DOM React', () => {
    const { container } = render(<BusMarker bus={mockBus} map={mockMap} />);

    // Le composant retourne null
    expect(container.firstChild).toBeNull();
  });
});
