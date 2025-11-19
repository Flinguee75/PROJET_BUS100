/**
 * Tests - RoutesManagementPage
 * Teste la page de gestion des routes géographiques
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RoutesManagementPage } from '@/pages/RoutesManagementPage';
import * as routeApi from '@/services/route.api';

// Mock du module route.api
vi.mock('@/services/route.api');

// Mock des composants
vi.mock('@/components/Header', () => ({
  Header: ({ title }: { title: string }) => <div data-testid="header">{title}</div>,
}));

vi.mock('@/components/LoadingSpinner', () => ({
  LoadingSpinner: () => <div data-testid="loading">Chargement...</div>,
}));

vi.mock('@/components/ErrorMessage', () => ({
  ErrorMessage: ({ message }: { message: string }) => (
    <div data-testid="error">{message}</div>
  ),
}));

describe('RoutesManagementPage', () => {
  let queryClient: QueryClient;

  const mockRoutes = [
    {
      id: 'route-1',
      name: 'Route Cocody - École ABC',
      code: 'COC-ABC-001',
      description: 'Route principale pour Cocody',
      commune: 'Cocody' as routeApi.CommuneAbidjan,
      quartiers: ['Riviera', 'II Plateaux'],
      stops: [
        {
          id: 'stop-1',
          name: 'Arrêt Riviera',
          address: 'Boulevard VGE, Riviera',
          location: { lat: 5.3600, lng: -4.0083 },
          order: 1,
          estimatedTimeMinutes: 5,
          type: 'pickup' as const,
          quartier: 'Riviera',
        },
      ],
      schedule: {
        morningDeparture: '07:00',
        morningArrival: '08:00',
        afternoonDeparture: '16:00',
        afternoonArrival: '17:00',
      },
      totalDistanceKm: 12.5,
      estimatedDurationMinutes: 45,
      capacity: 40,
      currentOccupancy: 10,
      busId: null,
      driverId: null,
      activeDays: ['Monday', 'Tuesday'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
    {
      id: 'route-2',
      name: 'Route Yopougon - École XYZ',
      code: 'YOP-XYZ-001',
      description: 'Route pour Yopougon',
      commune: 'Yopougon' as routeApi.CommuneAbidjan,
      quartiers: ['Niangon', 'Sicogi'],
      stops: [
        {
          id: 'stop-2',
          name: 'Arrêt Niangon',
          address: 'Carrefour Niangon',
          location: { lat: 5.3400, lng: -4.0400 },
          order: 1,
          estimatedTimeMinutes: 5,
          type: 'pickup' as const,
          quartier: 'Niangon',
        },
      ],
      schedule: {
        morningDeparture: '06:30',
        morningArrival: '07:30',
        afternoonDeparture: '15:30',
        afternoonArrival: '16:30',
      },
      totalDistanceKm: 15.0,
      estimatedDurationMinutes: 50,
      capacity: 50,
      currentOccupancy: 25,
      busId: 'bus-123',
      driverId: 'driver-123',
      activeDays: ['Monday', 'Tuesday', 'Wednesday'],
      isActive: true,
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-01T00:00:00Z',
    },
  ];

  const mockCommunes = ['Cocody', 'Yopougon', 'Abobo', 'Adjamé'];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    vi.clearAllMocks();
  });

  const renderWithQueryClient = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    );
  };

  it('devrait afficher le header avec le titre correct', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue(mockRoutes);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    expect(screen.getByTestId('header')).toHaveTextContent('Gestion des Routes');
  });

  it('devrait afficher un spinner pendant le chargement', async () => {
    vi.mocked(routeApi.getAllRoutes).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    expect(screen.getByTestId('loading')).toBeInTheDocument();
  });

  it('devrait afficher les routes chargées', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue(mockRoutes);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Route Cocody - École ABC')).toBeInTheDocument();
      expect(screen.getByText('Route Yopougon - École XYZ')).toBeInTheDocument();
    });
  });

  it('devrait afficher un message si aucune route n\'est configurée', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue([]);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Aucune route configurée')).toBeInTheDocument();
    });
  });

  it('devrait afficher un message d\'erreur en cas d\'échec du chargement', async () => {
    vi.mocked(routeApi.getAllRoutes).mockRejectedValue(
      new Error('Erreur de chargement')
    );
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByTestId('error')).toBeInTheDocument();
    });
  });

  it('devrait afficher les informations de la route correctement', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue([mockRoutes[0]]);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      // Nom et code
      expect(screen.getByText('Route Cocody - École ABC')).toBeInTheDocument();
      expect(screen.getByText('COC-ABC-001')).toBeInTheDocument();

      // Commune
      expect(screen.getByText('Cocody')).toBeInTheDocument();

      // Statistiques
      expect(screen.getByText('1')).toBeInTheDocument(); // Nombre d'arrêts
      expect(screen.getByText('12.5 km')).toBeInTheDocument();
      expect(screen.getByText('45 min')).toBeInTheDocument();
      expect(screen.getByText('10/40')).toBeInTheDocument(); // Occupation
    });
  });

  it('devrait afficher le statut actif/inactif', async () => {
    const inactiveRoute = { ...mockRoutes[0], isActive: false };
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue([inactiveRoute]);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Inactive')).toBeInTheDocument();
    });
  });

  it('devrait afficher les horaires', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue([mockRoutes[0]]);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/07:00 → 08:00/)).toBeInTheDocument();
      expect(screen.getByText(/16:00 → 17:00/)).toBeInTheDocument();
    });
  });

  it('devrait indiquer les assignations de bus et chauffeur', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue([mockRoutes[1]]);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByText(/Bus assigné: bus-123/)).toBeInTheDocument();
      expect(screen.getByText(/Chauffeur: driver-123/)).toBeInTheDocument();
    });
  });

  it('devrait afficher le filtre par commune', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue(mockRoutes);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Filtrer par commune')).toBeInTheDocument();
    });
  });

  it('devrait afficher le bouton de création de route', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue(mockRoutes);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('+ Créer une route')).toBeInTheDocument();
    });
  });

  it('devrait afficher le nombre total de routes', async () => {
    vi.mocked(routeApi.getAllRoutes).mockResolvedValue(mockRoutes);
    vi.mocked(routeApi.getCommunes).mockResolvedValue(mockCommunes);

    renderWithQueryClient(<RoutesManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('2 route(s) configurée(s)')).toBeInTheDocument();
    });
  });
});

