/**
 * Tests for DriversManagementPage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { DriversManagementPage } from '@/pages/DriversManagementPage';
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

vi.mock('@/services/driver.api', () => ({
  getAllDrivers: vi.fn(),
  createDriver: vi.fn(),
  updateDriver: vi.fn(),
  deleteDriver: vi.fn(),
}));

import * as driverApi from '@/services/driver.api';

describe('DriversManagementPage', () => {
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

  it('renders the drivers management page', async () => {
    vi.mocked(driverApi.getAllDrivers).mockResolvedValue([]);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Gestion des Chauffeurs')).toBeInTheDocument();
    expect(screen.getByText('Interface complète pour gérer les chauffeurs')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(driverApi.getAllDrivers).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Chargement des chauffeurs...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    vi.mocked(driverApi.getAllDrivers).mockRejectedValue(new Error('Failed to load'));

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Impossible de charger les chauffeurs')).toBeInTheDocument();
    });
  });

  it('renders the add driver button', async () => {
    vi.mocked(driverApi.getAllDrivers).mockResolvedValue([]);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Ajouter un chauffeur')).toBeInTheDocument();
    });
  });

  it('displays empty state when no drivers', async () => {
    vi.mocked(driverApi.getAllDrivers).mockResolvedValue([]);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Aucun chauffeur enregistré')).toBeInTheDocument();
      expect(
        screen.getByText(
          "Utilisez le bouton 'Ajouter un chauffeur' ci-dessus pour commencer à gérer l'équipe"
        )
      ).toBeInTheDocument();
    });
  });

  it('displays driver count', async () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        email: 'driver1@test.com',
        displayName: 'John Doe',
        phoneNumber: '+1234567890',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        photoUrl: 'https://example.com/photo.jpg',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'driver-2',
        email: 'driver2@test.com',
        displayName: 'Jane Smith',
        phoneNumber: '+0987654321',
        licenseNumber: 'LIC654321',
        licenseExpiry: new Date('2026-06-30').toISOString(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(driverApi.getAllDrivers).mockResolvedValue(mockDrivers);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('2 chauffeur(s) enregistré(s)')).toBeInTheDocument();
    });
  });

  it('displays drivers in table', async () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        email: 'driver1@test.com',
        displayName: 'John Doe',
        phoneNumber: '+1234567890',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(driverApi.getAllDrivers).mockResolvedValue(mockDrivers);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
    });
  });

  it('renders table headers', async () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        email: 'driver1@test.com',
        displayName: 'John Doe',
        phoneNumber: '+1234567890',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(driverApi.getAllDrivers).mockResolvedValue(mockDrivers);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nom')).toBeInTheDocument();
      expect(screen.getByText('Téléphone')).toBeInTheDocument();
      expect(screen.getByText('Statut')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('displays active status badge for active drivers', async () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        email: 'driver1@test.com',
        displayName: 'John Doe',
        phoneNumber: '+1234567890',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(driverApi.getAllDrivers).mockResolvedValue(mockDrivers);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Actif')).toBeInTheDocument();
    });
  });

  it('displays inactive status badge for inactive drivers', async () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        email: 'driver1@test.com',
        displayName: 'John Doe',
        phoneNumber: '+1234567890',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(driverApi.getAllDrivers).mockResolvedValue(mockDrivers);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Inactif')).toBeInTheDocument();
    });
  });

  it('displays action buttons for each driver', async () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        email: 'driver1@test.com',
        displayName: 'John Doe',
        phoneNumber: '+1234567890',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(driverApi.getAllDrivers).mockResolvedValue(mockDrivers);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Voir détails')).toBeInTheDocument();
      expect(screen.getByTitle('Modifier')).toBeInTheDocument();
      expect(screen.getByTitle('Supprimer')).toBeInTheDocument();
    });
  });

  it('opens create modal when add button is clicked', async () => {
    vi.mocked(driverApi.getAllDrivers).mockResolvedValue([]);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const addButton = screen.getByText('Ajouter un chauffeur');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Ajouter un nouveau chauffeur')).toBeInTheDocument();
    });
  });

  it('displays required form fields in create modal', async () => {
    vi.mocked(driverApi.getAllDrivers).mockResolvedValue([]);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const addButton = screen.getByText('Ajouter un chauffeur');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Nom complet *')).toBeInTheDocument();
      expect(screen.getByText('Email *')).toBeInTheDocument();
      expect(screen.getByText('Téléphone *')).toBeInTheDocument();
      expect(screen.getByText('Numéro de permis *')).toBeInTheDocument();
      expect(screen.getByText("Date d'expiration *")).toBeInTheDocument();
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    vi.mocked(driverApi.getAllDrivers).mockResolvedValue([]);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const addButton = screen.getByText('Ajouter un chauffeur');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Ajouter un nouveau chauffeur')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Ajouter un nouveau chauffeur')).not.toBeInTheDocument();
    });
  });

  it('displays multiple drivers correctly', async () => {
    const mockDrivers = [
      {
        id: 'driver-1',
        email: 'driver1@test.com',
        displayName: 'John Doe',
        phoneNumber: '+1234567890',
        licenseNumber: 'LIC123456',
        licenseExpiry: new Date('2025-12-31').toISOString(),
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'driver-2',
        email: 'driver2@test.com',
        displayName: 'Jane Smith',
        phoneNumber: '+0987654321',
        licenseNumber: 'LIC654321',
        licenseExpiry: new Date('2026-06-30').toISOString(),
        isActive: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    vi.mocked(driverApi.getAllDrivers).mockResolvedValue(mockDrivers);

    render(<DriversManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('+1234567890')).toBeInTheDocument();
      expect(screen.getByText('+0987654321')).toBeInTheDocument();
    });
  });
});
