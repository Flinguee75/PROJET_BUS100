/**
 * Tests pour AlertsSidebar
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AlertsSidebar } from '@/components/AlertsSidebar';
import type { Alert } from '@/types/alerts';
import { BusStatus, BusLiveStatus, type BusRealtimeData } from '@/types/realtime';

const mockAlerts: Alert[] = [
  {
    id: 'alert_1',
    type: 'DELAY',
    busId: 'bus_1',
    busNumber: '#12',
    severity: 'HIGH',
    message: 'Retard de 18 minutes',
    timestamp: Date.now() - 5 * 60000,
  },
  {
    id: 'alert_2',
    type: 'UNSCANNED_CHILD',
    busId: 'bus_2',
    busNumber: '#5',
    severity: 'MEDIUM',
    message: '3 enfants non scannés à Cocody',
    timestamp: Date.now() - 10 * 60000,
  },
  {
    id: 'alert_3',
    type: 'STOPPED',
    busId: 'bus_3',
    busNumber: '#8',
    severity: 'MEDIUM',
    message: 'Arrêté depuis 12 minutes',
    timestamp: Date.now() - 12 * 60000,
  },
];

const mockBuses: BusRealtimeData[] = [
  {
    id: 'bus_1',
    number: 'Bus #12',
    plateNumber: 'CI-123-AB',
    capacity: 30,
    model: 'Test',
    year: 2023,
    status: BusStatus.ACTIVE,
    currentPosition: null,
    liveStatus: BusLiveStatus.EN_ROUTE,
    driver: null,
    route: null,
    passengersCount: 10,
    passengersPresent: 10,
    currentZone: null,
    lastUpdate: null,
    isActive: true,
  },
  {
    id: 'bus_2',
    number: 'Bus #5',
    plateNumber: 'CI-456-CD',
    capacity: 40,
    model: 'Test',
    year: 2022,
    status: BusStatus.INACTIVE,
    currentPosition: null,
    liveStatus: BusLiveStatus.IDLE,
    driver: null,
    route: null,
    passengersCount: 0,
    passengersPresent: 0,
    currentZone: null,
    lastUpdate: null,
    isActive: false,
  },
  {
    id: 'bus_3',
    number: 'Bus #8',
    plateNumber: 'CI-789-EF',
    capacity: 35,
    model: 'Test',
    year: 2021,
    status: BusStatus.ACTIVE,
    currentPosition: null,
    liveStatus: BusLiveStatus.STOPPED,
    driver: null,
    route: null,
    passengersCount: 20,
    passengersPresent: 18,
    currentZone: null,
    lastUpdate: null,
    isActive: true,
  },
];

const renderSidebar = (overrides: Partial<Parameters<typeof AlertsSidebar>[0]> = {}) => {
  const props = {
    alerts: [],
    buses: mockBuses,
    ...overrides,
  };

  return render(
    <BrowserRouter>
      <AlertsSidebar {...props} />
    </BrowserRouter>
  );
};

describe('AlertsSidebar', () => {
  it('should render without crashing', () => {
    renderSidebar();
    expect(screen.getByText('Supervision')).toBeInTheDocument();
  });

  it('should display empty state when no buses', () => {
    renderSidebar({ buses: [] });
    expect(
      screen.getByRole('heading', { name: /Aucun bus en course/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Aucun bus en course, aucune alerte active\./i)
    ).toBeInTheDocument();
  });

  it('should display alert count badge when alerts exist', () => {
    renderSidebar({ alerts: mockAlerts });
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display all alerts', () => {
    renderSidebar({ alerts: mockAlerts });
    expect(screen.getByText(/Bus #12/)).toBeInTheDocument();
    expect(screen.getByText(/Bus #5/)).toBeInTheDocument();
    expect(screen.getByText(/Bus #8/)).toBeInTheDocument();
    expect(screen.getByText('Retard de 18 minutes')).toBeInTheDocument();
    expect(screen.getByText('3 enfants non scannés à Cocody')).toBeInTheDocument();
    expect(screen.getByText('Arrêté depuis 12 minutes')).toBeInTheDocument();
  });

  it('should display severity filters with counts', () => {
    renderSidebar({ alerts: mockAlerts });
    expect(screen.getByText('Retards (1)')).toBeInTheDocument();
    expect(screen.getByText("Arrêts (1)")).toBeInTheDocument();
  });

  it('should format timestamps correctly', () => {
    const recentAlert: Alert = {
      id: 'alert_recent',
      type: 'DELAY',
      busId: 'bus_1',
      busNumber: '#1',
      severity: 'HIGH',
      message: 'Test',
      timestamp: Date.now() - 30000, // 30 secondes
    };

    renderSidebar({ alerts: [recentAlert] });

    // Devrait afficher "À l'instant" ou "Il y a X min"
    expect(screen.getByText(/Il y a|À l'instant/i)).toBeInTheDocument();
  });

  it('should display different alert categories', () => {
    const { container } = renderSidebar({ alerts: mockAlerts });
    const categoryButtons = container.querySelectorAll('button');
    expect(categoryButtons.length).toBeGreaterThan(0);
    expect(screen.getByText('Retards (1)')).toBeInTheDocument();
    expect(screen.getByText("Arrêts (1)")).toBeInTheDocument();
  });

  it('should list stationed buses when clicking À l’école', () => {
    renderSidebar({ stationedBuses: [mockBuses[1]] });
    const atSchoolButton = screen.getByText(/À l'école/i);
    fireEvent.click(atSchoolButton);
    expect(screen.getByText(/Bus #5/)).toBeInTheDocument();
    expect(screen.getByText(/Stationné/i)).toBeInTheDocument();
  });

  it('should show stationed empty state when no stationed buses', () => {
    renderSidebar({ stationedBuses: [] });
    const atSchoolButton = screen.getByText(/À l'école/i);
    fireEvent.click(atSchoolButton);
    expect(
      screen.getByRole('heading', { name: /Aucun bus stationné/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Tous les bus sont actuellement en circulation\./i)
    ).toBeInTheDocument();
  });
});
