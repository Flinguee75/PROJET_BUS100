/**
 * Tests des helpers d'interpolation sur polyligne utilisés par le moteur démo.
 */

import { describe, it, expect } from 'vitest';
import { polylineAt, polylineHeadingAt } from './polyline';

describe('polylineAt', () => {
  it('retourne le premier point à t=0', () => {
    const poly = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 },
    ];
    expect(polylineAt(poly, 0)).toEqual({ lat: 0, lng: 0 });
  });

  it('retourne le dernier point à t=1', () => {
    const poly = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 2 },
    ];
    expect(polylineAt(poly, 1)).toEqual({ lat: 0, lng: 2 });
  });

  it('interpole linéairement à mi-chemin sur deux points', () => {
    const poly = [
      { lat: 0, lng: 0 },
      { lat: 10, lng: 20 },
    ];
    expect(polylineAt(poly, 0.5)).toEqual({ lat: 5, lng: 10 });
  });

  it('respecte la longueur des segments inégaux', () => {
    // Segment 1 = 1 unité (lng 0 → 1), segment 2 = 3 unités (lng 1 → 4).
    // Total = 4. À t=0.25 → distance 1 → exactement le 2e point.
    const poly = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
      { lat: 0, lng: 4 },
    ];
    const at025 = polylineAt(poly, 0.25);
    expect(at025.lng).toBeCloseTo(1, 5);
    expect(at025.lat).toBeCloseTo(0, 5);
  });

  it('clamp les t en dehors de [0, 1]', () => {
    const poly = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
    ];
    expect(polylineAt(poly, -1)).toEqual({ lat: 0, lng: 0 });
    expect(polylineAt(poly, 2)).toEqual({ lat: 0, lng: 1 });
  });

  it('renvoie le point unique si la polyligne ne contient qu’un point', () => {
    const poly = [{ lat: 5, lng: 7 }];
    expect(polylineAt(poly, 0.42)).toEqual({ lat: 5, lng: 7 });
  });
});

describe('polylineHeadingAt', () => {
  it('retourne 90° pour un déplacement vers l’est', () => {
    const poly = [
      { lat: 0, lng: 0 },
      { lat: 0, lng: 1 },
    ];
    expect(polylineHeadingAt(poly, 0.5)).toBeCloseTo(90, 0);
  });

  it('retourne 0° pour un déplacement vers le nord', () => {
    const poly = [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 0 },
    ];
    expect(polylineHeadingAt(poly, 0.5)).toBeCloseTo(0, 0);
  });
});
