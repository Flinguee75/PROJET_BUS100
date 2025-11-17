/**
 * Tests pour les types Bus
 */

import { describe, it, expect } from 'vitest';
import type { BusStatus } from '@/types/bus';
import { mockBus, mockGPSPosition } from '../mocks/bus.mock';

describe('Bus Types', () => {
  it('BusStatus contient toutes les valeurs attendues', () => {
    const statuses: BusStatus[] = ['EN_ROUTE', 'EN_RETARD', 'A_L_ARRET', 'HORS_SERVICE'];
    expect(statuses).toContain('EN_ROUTE');
    expect(statuses).toContain('EN_RETARD');
    expect(statuses).toContain('A_L_ARRET');
    expect(statuses).toContain('HORS_SERVICE');
  });

  it('mockBus a la structure attendue', () => {
    expect(mockBus).toHaveProperty('id');
    expect(mockBus).toHaveProperty('immatriculation');
    expect(mockBus).toHaveProperty('chauffeur');
    expect(mockBus).toHaveProperty('capacite');
    expect(mockBus).toHaveProperty('itineraire');
    expect(mockBus).toHaveProperty('status');
    expect(mockBus).toHaveProperty('currentPosition');
    expect(mockBus).toHaveProperty('maintenanceStatus');
  });

  it('mockGPSPosition a la structure attendue', () => {
    expect(mockGPSPosition).toHaveProperty('lat');
    expect(mockGPSPosition).toHaveProperty('lng');
    expect(mockGPSPosition).toHaveProperty('speed');
    expect(mockGPSPosition).toHaveProperty('timestamp');
    
    expect(typeof mockGPSPosition.lat).toBe('number');
    expect(typeof mockGPSPosition.lng).toBe('number');
    expect(typeof mockGPSPosition.speed).toBe('number');
    expect(typeof mockGPSPosition.timestamp).toBe('number');
  });

  it('valide les coordonnées GPS', () => {
    expect(mockGPSPosition.lat).toBeGreaterThanOrEqual(-90);
    expect(mockGPSPosition.lat).toBeLessThanOrEqual(90);
    expect(mockGPSPosition.lng).toBeGreaterThanOrEqual(-180);
    expect(mockGPSPosition.lng).toBeLessThanOrEqual(180);
  });
});
