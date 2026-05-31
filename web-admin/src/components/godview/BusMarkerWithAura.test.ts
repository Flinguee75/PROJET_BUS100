/**
 * Tests du générateur HTML pour les marqueurs de bus de la God View.
 *
 * On vérifie le contenu textuel du HTML émis (pas son rendu Mapbox).
 */

import { describe, it, expect } from 'vitest';
import { generateBusMarkerHTML } from './BusMarkerWithAura';

describe('generateBusMarkerHTML', () => {
  const base = {
    busNumber: 'BUS-12',
    color: '#3b82f6',
    rotation: 45,
    hasAlert: false,
  };

  it('affiche le numéro de bus dans une étiquette flottante au-dessus du marqueur', () => {
    const html = generateBusMarkerHTML({
      ...base,
      scannedCount: 3,
      totalCount: 6,
    });

    expect(html).toContain('BUS-12');
    expect(html).toContain('bus-marker-label');
  });

  it('affiche le ratio scannés/total dans l’étiquette', () => {
    const html = generateBusMarkerHTML({
      ...base,
      scannedCount: 3,
      totalCount: 6,
    });

    // Doit contenir "3/6" sans aucun caractère interrompant la séquence.
    expect(html).toMatch(/3\s*\/\s*6/);
  });

  it('omet le ratio quand le total est inconnu (0)', () => {
    const html = generateBusMarkerHTML({
      ...base,
      scannedCount: 0,
      totalCount: 0,
    });

    expect(html).toContain('BUS-12');
    expect(html).not.toMatch(/\/\s*0/);
  });

  it('fonctionne sans compteurs (rétrocompatibilité — appel sans scannedCount/totalCount)', () => {
    const html = generateBusMarkerHTML(base);

    expect(html).toContain('BUS-12');
  });
});
