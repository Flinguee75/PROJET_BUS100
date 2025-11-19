/**
 * Tests for MaintenancePage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { MaintenancePage } from '@/pages/MaintenancePage';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock services
vi.mock('@/services/auth.service', () => ({
  observeAuthState: vi.fn((callback) => {
    callback({
      uid: 'test-user-id',
      email: 'admin@test.com',
      displayName: 'Admin User',
      role: 'admin',
    });
    return vi.fn(); // unsubscribe function
  }),
  login: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/services/maintenance.api', () => ({
  getAllMaintenances: vi.fn(),
  createMaintenance: vi.fn(),
  updateMaintenance: vi.fn(),
  deleteMaintenance: vi.fn(),
  MaintenanceType: {
    MECHANICAL: 'mechanical',
    ELECTRICAL: 'electrical',
    TIRE: 'tire',
    BODY: 'body',
    SAFETY: 'safety',
    CLEANING: 'cleaning',
    INSPECTION: 'inspection',
    OTHER: 'other',
  },
  MaintenanceSeverity: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    CRITICAL: 'critical',
  },
  MaintenanceStatus: {
    REPORTED: 'reported',
    SCHEDULED: 'scheduled',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
  },
}));

vi.mock('@/services/bus.api', () => ({
  getAllBuses: vi.fn(),
}));

import * as maintenanceApi from '@/services/maintenance.api';
import * as busApi from '@/services/bus.api';

describe('MaintenancePage', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the maintenance page', async () => {
    vi.mocked(maintenanceApi.getAllMaintenances).mockResolvedValue([]);
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Gestion des Maintenances')).toBeInTheDocument();
      expect(screen.getByText('Suivre et gérer les opérations de maintenance')).toBeInTheDocument();
    });
  });

  it('shows loading state', () => {
    vi.mocked(maintenanceApi.getAllMaintenances).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    expect(screen.getByText('Chargement des maintenances...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    vi.mocked(maintenanceApi.getAllMaintenances).mockRejectedValue(
      new Error('Failed to load')
    );
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
    });
  });

  it('renders filter dropdowns', async () => {
    vi.mocked(maintenanceApi.getAllMaintenances).mockResolvedValue([]);
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Filtrer par bus')).toBeInTheDocument();
      expect(screen.getByText('Filtrer par statut')).toBeInTheDocument();
    });
  });

  it('renders create button', async () => {
    vi.mocked(maintenanceApi.getAllMaintenances).mockResolvedValue([]);
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nouvelle maintenance')).toBeInTheDocument();
    });
  });

  it('displays maintenances in table', async () => {
    const mockMaintenances = [
      {
        id: 'maint-1',
        busId: 'bus-1',
        type: 'mechanical',
        severity: 'high',
        title: 'Brake Repair',
        description: 'Replace brake pads',
        status: 'scheduled',
        reportedAt: new Date('2024-01-15'),
        reportedBy: 'user-1',
      },
    ];

    const mockBuses = [
      {
        id: 'bus-1',
        plateNumber: 'ABC123',
        model: 'Mercedes',
        year: 2022,
        capacity: 50,
        status: 'active',
        maintenanceStatus: 'ok',
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(maintenanceApi.getAllMaintenances).mockResolvedValue(mockMaintenances);
    vi.mocked(busApi.getAllBuses).mockResolvedValue(mockBuses);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Brake Repair')).toBeInTheDocument();
      expect(screen.getByText('ABC123')).toBeInTheDocument();
    });
  });

  it('displays empty state when no maintenances', async () => {
    vi.mocked(maintenanceApi.getAllMaintenances).mockResolvedValue([]);
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Aucune maintenance trouvée')).toBeInTheDocument();
    });
  });

  it('renders table headers', async () => {
    vi.mocked(maintenanceApi.getAllMaintenances).mockResolvedValue([]);
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Bus')).toBeInTheDocument();
      expect(screen.getByText('Titre')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Sévérité')).toBeInTheDocument();
      expect(screen.getByText('Statut')).toBeInTheDocument();
      expect(screen.getByText('Signalé le')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('displays maintenance severity badges', async () => {
    const mockMaintenances = [
      {
        id: 'maint-1',
        busId: 'bus-1',
        type: 'mechanical',
        severity: 'critical',
        title: 'Critical Issue',
        description: 'Urgent repair needed',
        status: 'scheduled',
        reportedAt: new Date('2024-01-15'),
        reportedBy: 'user-1',
      },
    ];

    vi.mocked(maintenanceApi.getAllMaintenances).mockResolvedValue(mockMaintenances);
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Critique')).toBeInTheDocument();
    });
  });

  it('displays maintenance status badges', async () => {
    const mockMaintenances = [
      {
        id: 'maint-1',
        busId: 'bus-1',
        type: 'mechanical',
        severity: 'medium',
        title: 'Oil Change',
        description: 'Regular maintenance',
        status: 'completed',
        reportedAt: new Date('2024-01-15'),
        reportedBy: 'user-1',
      },
    ];

    vi.mocked(maintenanceApi.getAllMaintenances).mockResolvedValue(mockMaintenances);
    vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

    render(<MaintenancePage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Check that the status badge is displayed (not the select option)
      const statusBadges = screen.getAllByText('Terminé');
      expect(statusBadges.length).toBeGreaterThan(0);
      // Verify at least one has the success styling class
      const badgeElement = statusBadges.find(el =>
        el.className.includes('bg-success-50') &&
        el.className.includes('text-success-700')
      );
      expect(badgeElement).toBeDefined();
    });
  });
});
