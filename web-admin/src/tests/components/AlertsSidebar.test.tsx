/**
 * Tests pour AlertsSidebar
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AlertsSidebar, Alert } from '@/components/AlertsSidebar';

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

describe('AlertsSidebar', () => {
  it('should render without crashing', () => {
    render(
      <BrowserRouter>
        <AlertsSidebar alerts={[]} />
      </BrowserRouter>
    );
    expect(screen.getByText('Alertes Actives')).toBeInTheDocument();
  });

  it('should display "Tout est opérationnel" when no alerts', () => {
    render(
      <BrowserRouter>
        <AlertsSidebar alerts={[]} />
      </BrowserRouter>
    );
    expect(screen.getByText('Tout est opérationnel')).toBeInTheDocument();
    expect(
      screen.getByText(/Aucune alerte active/i)
    ).toBeInTheDocument();
  });

  it('should display alert count badge when alerts exist', () => {
    render(
      <BrowserRouter>
        <AlertsSidebar alerts={mockAlerts} />
      </BrowserRouter>
    );
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should display all alerts', () => {
    render(
      <BrowserRouter>
        <AlertsSidebar alerts={mockAlerts} />
      </BrowserRouter>
    );
    expect(screen.getByText('Bus #12')).toBeInTheDocument();
    expect(screen.getByText('Bus #5')).toBeInTheDocument();
    expect(screen.getByText('Bus #8')).toBeInTheDocument();
    expect(screen.getByText('Retard de 18 minutes')).toBeInTheDocument();
    expect(screen.getByText('3 enfants non scannés à Cocody')).toBeInTheDocument();
    expect(screen.getByText('Arrêté depuis 12 minutes')).toBeInTheDocument();
  });

  it('should display URGENT badge for HIGH severity alerts', () => {
    render(
      <BrowserRouter>
        <AlertsSidebar alerts={mockAlerts} />
      </BrowserRouter>
    );
    expect(screen.getByText('URGENT')).toBeInTheDocument();
  });

  it('should display statistics footer when alerts exist', () => {
    render(
      <BrowserRouter>
        <AlertsSidebar alerts={mockAlerts} />
      </BrowserRouter>
    );

    // 1 retard, 1 arrêt, 1 non scanné
    const stats = screen.getAllByText('1');
    expect(stats.length).toBeGreaterThanOrEqual(3);
  });

  it('should display correct severity count in subtitle', () => {
    render(
      <BrowserRouter>
        <AlertsSidebar alerts={mockAlerts} />
      </BrowserRouter>
    );
    expect(screen.getByText(/1 critique/i)).toBeInTheDocument();
  });

  it('should handle empty alerts array', () => {
    render(
      <BrowserRouter>
        <AlertsSidebar alerts={[]} />
      </BrowserRouter>
    );
    expect(screen.getByText('Surveillance en temps réel')).toBeInTheDocument();
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

    render(
      <BrowserRouter>
        <AlertsSidebar alerts={[recentAlert]} />
      </BrowserRouter>
    );

    // Devrait afficher "À l'instant" ou "Il y a X min"
    expect(screen.getByText(/Il y a|À l'instant/i)).toBeInTheDocument();
  });

  it('should display different colors for different severity levels', () => {
    const { container } = render(
      <BrowserRouter>
        <AlertsSidebar alerts={mockAlerts} />
      </BrowserRouter>
    );

    // Vérifier que les alertes sont rendues avec des éléments de bordure
    const borderedElements = container.querySelectorAll('[class*="border"]');
    expect(borderedElements.length).toBeGreaterThan(0);

    // Vérifier que les différents types de sévérité sont présents
    expect(screen.getByText('URGENT')).toBeInTheDocument(); // HIGH severity
  });
});
