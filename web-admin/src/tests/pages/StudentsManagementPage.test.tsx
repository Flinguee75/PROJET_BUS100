/**
 * Tests for StudentsManagementPage
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { StudentsManagementPage } from '@/pages/StudentsManagementPage';
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

vi.mock('@/services/student.api', () => ({
  getAllStudents: vi.fn(),
  createStudent: vi.fn(),
  updateStudent: vi.fn(),
  deleteStudent: vi.fn(),
}));

vi.mock('@/services/gps.api', () => ({
  getAllBuses: vi.fn(),
}));

import * as studentApi from '@/services/student.api';
import * as gpsApi from '@/services/gps.api';

describe('StudentsManagementPage', () => {
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

  it('renders the students management page', async () => {
    vi.mocked(studentApi.getAllStudents).mockResolvedValue([]);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Gestion des Élèves')).toBeInTheDocument();
    expect(screen.getByText('Interface complète pour gérer les élèves')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    vi.mocked(studentApi.getAllStudents).mockImplementation(
      () => new Promise(() => { }) // Never resolves
    );
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    expect(screen.getByText('Chargement des élèves...')).toBeInTheDocument();
  });

  it('shows error state', async () => {
    vi.mocked(studentApi.getAllStudents).mockRejectedValue(new Error('Failed to load'));
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Impossible de charger les élèves')).toBeInTheDocument();
    });
  });

  it('renders the add student button', async () => {
    vi.mocked(studentApi.getAllStudents).mockResolvedValue([]);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Ajouter un élève')).toBeInTheDocument();
    });
  });

  it('displays empty state when no students', async () => {
    vi.mocked(studentApi.getAllStudents).mockResolvedValue([]);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Aucun élève enregistré')).toBeInTheDocument();
      expect(
        screen.getByText(
          "Utilisez le bouton 'Ajouter un élève' ci-dessus pour commencer à gérer les inscriptions"
        )
      ).toBeInTheDocument();
    });
  });

  it('displays student count', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'student-2',
        firstName: 'Bob',
        lastName: 'Martin',
        dateOfBirth: new Date('2011-08-20').toISOString(),
        grade: 'CM1',
        parentIds: ['parent-2'],
        pickupLocation: {
          address: '789 Oak St',
          lat: 5.35,
          lng: -4.02,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Yopougon',
        quartier: 'Zone 4',
        busId: null,
        routeId: 'route-2',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('2 élève(s) enregistré(s)')).toBeInTheDocument();
    });
  });

  it('displays students in table', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Alice Dupont')).toBeInTheDocument();
      expect(screen.getByText('CM2')).toBeInTheDocument();
    });
  });

  it('renders table headers', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Nom Complet')).toBeInTheDocument();
      expect(screen.getByText('Classe')).toBeInTheDocument();
      expect(screen.getByText('Date de naissance')).toBeInTheDocument();
      expect(screen.getByText('Bus assigné')).toBeInTheDocument();
      expect(screen.getByText('Statut')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });
  });

  it('displays active status badge for active students', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Actif')).toBeInTheDocument();
    });
  });

  it('displays inactive status badge for inactive students', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        isActive: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Inactif')).toBeInTheDocument();
    });
  });

  it('displays special needs indicator when student has special needs', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        specialNeeds: 'Wheelchair access required',
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Besoins spéciaux')).toBeInTheDocument();
    });
  });

  it('displays bus assignment when student has bus assigned', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        busId: 'bus-1',
        busSchedule: {
          morning: true,
          midday: false,
          evening: true,
        },
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        routeId: 'route-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    const mockBuses = [
      {
        id: 'bus-1',
        number: 'Bus 101',
        immatriculation: 'ABC-123',
        chauffeur: 'John Doe',
        capacite: 50,
        itineraire: 'Route A',
        status: 'EN_ROUTE' as const,
        statusLabel: 'En service',
        maintenanceStatus: 100,
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue(mockBuses);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Bus 101')).toBeInTheDocument();
      expect(screen.getByText('Matin')).toBeInTheDocument();
      expect(screen.getByText('Soir')).toBeInTheDocument();
    });
  });

  it('displays "Non assigné" when student has no bus', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: null,
        routeId: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Non assigné')).toBeInTheDocument();
    });
  });

  it('displays action buttons for each student', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByTitle('Modifier')).toBeInTheDocument();
      expect(screen.getByTitle('Supprimer')).toBeInTheDocument();
    });
  });

  it('opens create modal when add button is clicked', async () => {
    vi.mocked(studentApi.getAllStudents).mockResolvedValue([]);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const addButton = screen.getByText('Ajouter un élève');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Ajouter un nouvel élève')).toBeInTheDocument();
    });
  });

  it('displays required form fields in create modal', async () => {
    vi.mocked(studentApi.getAllStudents).mockResolvedValue([]);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const addButton = screen.getByText('Ajouter un élève');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Prénom *')).toBeInTheDocument();
      expect(screen.getByText('Nom *')).toBeInTheDocument();
      expect(screen.getByText('Date de naissance *')).toBeInTheDocument();
      expect(screen.getByText('Classe *')).toBeInTheDocument();
    });
  });

  it('closes modal when cancel button is clicked', async () => {
    vi.mocked(studentApi.getAllStudents).mockResolvedValue([]);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const addButton = screen.getByText('Ajouter un élève');
      fireEvent.click(addButton);
    });

    await waitFor(() => {
      expect(screen.getByText('Ajouter un nouvel élève')).toBeInTheDocument();
    });

    const cancelButton = screen.getByText('Annuler');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Ajouter un nouvel élève')).not.toBeInTheDocument();
    });
  });

  it('displays date of birth in correct format', async () => {
    const mockStudents = [
      {
        id: 'student-1',
        firstName: 'Alice',
        lastName: 'Dupont',
        dateOfBirth: new Date('2010-05-15T12:00:00Z').toISOString(),
        grade: 'CM2',
        parentIds: ['parent-1'],
        pickupLocation: {
          address: '123 Main St',
          lat: 5.36,
          lng: -4.0083,
        },
        dropoffLocation: {
          address: '456 School Ave',
          lat: 5.37,
          lng: -4.01,
        },
        commune: 'Cocody',
        quartier: 'Riviera',
        busId: 'bus-1',
        routeId: 'route-1',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    vi.mocked(studentApi.getAllStudents).mockResolvedValue(mockStudents);
    vi.mocked(gpsApi.getAllBuses).mockResolvedValue([]);

    render(<StudentsManagementPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      // French date format: 15/05/2010
      expect(screen.getByText('15/05/2010')).toBeInTheDocument();
    });
  });
});
