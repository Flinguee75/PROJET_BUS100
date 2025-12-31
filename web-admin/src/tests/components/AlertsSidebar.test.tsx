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

  // ===== NOUVEAUX TESTS - Améliorations UX/UI =====

  describe('Status Background Colors', () => {
    it('should apply blue background for EN_ROUTE buses', () => {
      const enRouteBus: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.EN_ROUTE,
        isActive: true,
      };
      const { container } = renderSidebar({ buses: [enRouteBus] });
      const busCard = container.querySelector('.bg-blue-50');
      expect(busCard).toBeInTheDocument();
    });

    it('should apply red background for DELAYED buses', () => {
      const delayedBus: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.DELAYED,
        isActive: true,
      };
      const { container } = renderSidebar({ buses: [delayedBus] });
      const busCard = container.querySelector('.bg-red-50');
      expect(busCard).toBeInTheDocument();
    });

    it('should apply green background for ARRIVED buses', () => {
      const arrivedBus: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.ARRIVED,
        isActive: true,
      };
      const { container } = renderSidebar({ buses: [arrivedBus] });
      const busCard = container.querySelector('.bg-green-50');
      expect(busCard).toBeInTheDocument();
    });

    it('should apply slate background for STOPPED buses', () => {
      const stoppedBus: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.STOPPED,
        isActive: true,
      };
      const { container } = renderSidebar({ buses: [stoppedBus] });
      const busCard = container.querySelector('.bg-slate-50');
      expect(busCard).toBeInTheDocument();
    });
  });

  describe('SafetyRatioBadge Size', () => {
    it('should display SafetyRatioBadge with medium size', () => {
      const busWithStudents: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.EN_ROUTE,
        isActive: true,
      };
      renderSidebar({
        buses: [busWithStudents],
        studentsCounts: {
          'bus_1': { scanned: 14, unscanned: 1, total: 15 }
        }
      });

      // Vérifier que le badge affiche 14/15
      expect(screen.getByText('14/15')).toBeInTheDocument();
    });
  });

  describe('Location and Duration Display', () => {
    it('should display location and trip duration when bus is en route', () => {
      const busEnRoute: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.EN_ROUTE,
        currentZone: 'Cocody',
        tripStartTime: Date.now() - 15 * 60000, // 15 minutes ago
        isActive: true,
      };
      renderSidebar({ buses: [busEnRoute] });

      expect(screen.getByText('Cocody')).toBeInTheDocument();
      expect(screen.getByText(/15 min/i)).toBeInTheDocument();
    });

    it('should display route name when currentZone is not available', () => {
      const busWithRoute: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.EN_ROUTE,
        currentZone: null,
        route: { id: 'route1', name: 'Route Plateau', fromZone: 'Cocody', toZone: 'Plateau' },
        tripStartTime: Date.now() - 10 * 60000,
        isActive: true,
      };
      renderSidebar({ buses: [busWithRoute] });

      expect(screen.getByText('Route Plateau')).toBeInTheDocument();
    });
  });

  describe('Clickable Bus Cards', () => {
    it('should call onFocusBus when clicking on bus card', () => {
      const onFocusBus = vi.fn();
      const { container } = renderSidebar({
        buses: [mockBuses[0]],
        onFocusBus
      });

      const busCard = container.querySelector('[role="button"]');
      expect(busCard).toBeInTheDocument();

      if (busCard) {
        fireEvent.click(busCard);
        expect(onFocusBus).toHaveBeenCalledWith('bus_1');
      }
    });

    it('should have cursor-pointer class on bus cards', () => {
      const { container } = renderSidebar({ buses: [mockBuses[0]] });
      const busCard = container.querySelector('.cursor-pointer');
      expect(busCard).toBeInTheDocument();
    });

    it('should support keyboard navigation (Enter key)', () => {
      const onFocusBus = vi.fn();
      const { container } = renderSidebar({
        buses: [mockBuses[0]],
        onFocusBus
      });

      const busCard = container.querySelector('[role="button"]');
      if (busCard) {
        fireEvent.keyPress(busCard, { key: 'Enter', code: 'Enter' });
        expect(onFocusBus).toHaveBeenCalledWith('bus_1');
      }
    });

    it('should support keyboard navigation (Space key)', () => {
      const onFocusBus = vi.fn();
      const { container } = renderSidebar({
        buses: [mockBuses[0]],
        onFocusBus
      });

      const busCard = container.querySelector('[role="button"]');
      if (busCard) {
        fireEvent.keyPress(busCard, { key: ' ', code: 'Space' });
        expect(onFocusBus).toHaveBeenCalledWith('bus_1');
      }
    });
  });

  describe('Progress Bar (KPI Students)', () => {
    it('should display progress bar in students tab when buses are en route', () => {
      const busEnRoute: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.EN_ROUTE,
        isActive: true,
      };

      renderSidebar({
        buses: [busEnRoute],
        studentsCounts: {
          'bus_1': { scanned: 14, unscanned: 1, total: 15 }
        }
      });

      // Switch to students tab
      const studentsTab = screen.getByRole('tab', { name: /ÉLÈVES/i });
      fireEvent.click(studentsTab);

      // Verify progress bar exists
      expect(screen.getByText(/93% des élèves à bord/i)).toBeInTheDocument();
    });

    it('should show green progress bar when >= 95% scanned', () => {
      const busEnRoute: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.EN_ROUTE,
        isActive: true,
      };

      const { container } = renderSidebar({
        buses: [busEnRoute],
        studentsCounts: {
          'bus_1': { scanned: 19, unscanned: 1, total: 20 }
        }
      });

      const studentsTab = screen.getByRole('tab', { name: /ÉLÈVES/i });
      fireEvent.click(studentsTab);

      const progressBar = container.querySelector('.bg-green-500');
      expect(progressBar).toBeInTheDocument();
      expect(screen.getByText(/95% des élèves à bord/i)).toBeInTheDocument();
    });

    it('should show yellow progress bar when >= 80% and < 95% scanned', () => {
      const busEnRoute: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.EN_ROUTE,
        isActive: true,
      };

      const { container } = renderSidebar({
        buses: [busEnRoute],
        studentsCounts: {
          'bus_1': { scanned: 17, unscanned: 3, total: 20 }
        }
      });

      const studentsTab = screen.getByRole('tab', { name: /ÉLÈVES/i });
      fireEvent.click(studentsTab);

      const progressBar = container.querySelector('.bg-yellow-500');
      expect(progressBar).toBeInTheDocument();
      expect(screen.getByText(/85% des élèves à bord/i)).toBeInTheDocument();
    });

    it('should show red progress bar when < 80% scanned', () => {
      const busEnRoute: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.EN_ROUTE,
        isActive: true,
      };

      const { container } = renderSidebar({
        buses: [busEnRoute],
        studentsCounts: {
          'bus_1': { scanned: 10, unscanned: 10, total: 20 }
        }
      });

      const studentsTab = screen.getByRole('tab', { name: /ÉLÈVES/i });
      fireEvent.click(studentsTab);

      const progressBar = container.querySelector('.bg-red-500');
      expect(progressBar).toBeInTheDocument();
      expect(screen.getByText(/50% des élèves à bord/i)).toBeInTheDocument();
    });
  });

  describe('Simplified Alert Cards', () => {
    it('should display alert badge instead of verbose message', () => {
      const delayAlert: Alert = {
        id: 'alert_delay',
        type: 'DELAY',
        busId: 'bus_1',
        busNumber: '#12',
        severity: 'HIGH',
        message: 'Bus en retard de 15 minutes',
        timestamp: Date.now(),
      };

      const delayedBus: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.DELAYED,
        isActive: true,
      };

      renderSidebar({
        alerts: [delayAlert],
        buses: [delayedBus]
      });

      // Should show compact badge instead of full message
      expect(screen.getByText(/⚠ Retard/i)).toBeInTheDocument();
      // Should NOT show the full message
      expect(screen.queryByText('Bus en retard de 15 minutes')).not.toBeInTheDocument();
    });

    it('should display location and duration in alert cards', () => {
      const delayAlert: Alert = {
        id: 'alert_delay',
        type: 'DELAY',
        busId: 'bus_1',
        busNumber: '#12',
        severity: 'HIGH',
        message: 'Retard',
        timestamp: Date.now(),
      };

      const delayedBus: BusRealtimeData = {
        ...mockBuses[0],
        liveStatus: BusLiveStatus.DELAYED,
        currentZone: 'Zone Industrielle',
        tripStartTime: Date.now() - 18 * 60000, // 18 minutes
        isActive: true,
      };

      renderSidebar({
        alerts: [delayAlert],
        buses: [delayedBus]
      });

      expect(screen.getByText('Zone Industrielle')).toBeInTheDocument();
      expect(screen.getByText(/18 min/i)).toBeInTheDocument();
    });
  });
});
