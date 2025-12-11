/**
 * Tests pour BusesManagementPage
 * Teste l'interface de gestion CRUD des bus
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { BusesManagementPage } from '@/pages/BusesManagementPage';
import { AuthProvider } from '@/contexts/AuthContext';
import * as busApi from '@/services/bus.api';
import * as driverApi from '@/services/driver.api';

// Mock du service API
vi.mock('@/services/bus.api');
vi.mock('@/services/driver.api');

// Mock du module auth.service
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
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

describe('BusesManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock par défaut pour les chauffeurs
    vi.mocked(driverApi.getAllDrivers).mockResolvedValue([]);
  });

  describe('Affichage initial', () => {
    it('affiche le titre et le bouton d\'ajout', async () => {
      vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

      render(<BusesManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Liste des bus')).toBeInTheDocument();
      expect(screen.getByText('Ajouter un bus')).toBeInTheDocument();
    });

    it('affiche un état de chargement', () => {
      vi.mocked(busApi.getAllBuses).mockImplementation(
        () => new Promise(() => { }) // Never resolves
      );

      render(<BusesManagementPage />, { wrapper: createWrapper() });

      expect(screen.getByText('Chargement des bus...')).toBeInTheDocument();
    });

    it('affiche un message d\'erreur en cas d\'échec', async () => {
      vi.mocked(busApi.getAllBuses).mockRejectedValue(
        new Error('Network error')
      );

      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(
          screen.getByText('Impossible de charger les bus')
        ).toBeInTheDocument();
      });
    });
  });

  describe('Liste des bus', () => {
    it('affiche la liste des bus avec les bonnes colonnes', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          busNumber: 1,
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes Sprinter',
          year: 2024,
          capacity: 50,
          status: 'active',
          maintenanceStatus: 'ok',
          driverId: 'driver-123',
          driverName: 'Jean Dupont',
          routeId: 'route-abc',
          assignedCommune: 'Cocody',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'bus-2',
          busNumber: 2,
          plateNumber: 'TU 222 TN 222',
          model: 'Volvo Bus',
          year: 2023,
          capacity: 40,
          status: 'active',
          maintenanceStatus: 'ok',
          driverId: null,
          driverName: null,
          routeId: null,
          assignedCommune: undefined,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(busApi.getAllBuses).mockResolvedValue(mockBuses);

      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        // Vérifier les numéros de bus
        expect(screen.getByText('Bus 1')).toBeInTheDocument();
        expect(screen.getByText('Bus 2')).toBeInTheDocument();

        // Vérifier les chauffeurs
        expect(screen.getByText('Jean Dupont')).toBeInTheDocument();
        expect(screen.getByText('Non assigné')).toBeInTheDocument();

        // Vérifier les zones
        expect(screen.getByText('Cocody')).toBeInTheDocument();
        expect(screen.getByText('Non assignée')).toBeInTheDocument();

        // Vérifier les capacités
        expect(screen.getByText('50 places')).toBeInTheDocument();
        expect(screen.getByText('40 places')).toBeInTheDocument();
      });
    });

    it('affiche les bons en-têtes de colonnes', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          busNumber: 1,
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes',
          year: 2024,
          capacity: 50,
          status: 'active',
          maintenanceStatus: 'ok',
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(busApi.getAllBuses).mockResolvedValue(mockBuses);

      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Numéro de Bus')).toBeInTheDocument();
        expect(screen.getByText('Chauffeur')).toBeInTheDocument();
        expect(screen.getByText('Zone')).toBeInTheDocument();
        expect(screen.getByText('Capacité')).toBeInTheDocument();
        expect(screen.getByText('Actions')).toBeInTheDocument();
      });
    });

    it('affiche le compteur de bus', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          busNumber: 1,
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes',
          year: 2024,
          capacity: 50,
          status: 'active',
          maintenanceStatus: 'ok',
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(busApi.getAllBuses).mockResolvedValue(mockBuses);

      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('1 bus au total')).toBeInTheDocument();
      });
    });

    it('affiche un message si aucun bus', async () => {
      vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Aucun bus enregistré')).toBeInTheDocument();
        expect(
          screen.getByText(/Utilisez le bouton "Ajouter un bus" ci-dessus pour commencer/)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Modal de création', () => {
    it('ouvre le modal de création au clic sur le bouton', async () => {
      vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ajouter un bus')).toBeInTheDocument();
      });

      const addButton = screen.getAllByText('Ajouter un bus')[0];
      await user.click(addButton);

      expect(screen.getByText('Numéro de bus *')).toBeInTheDocument();
      expect(screen.getByText('Plaque d\'immatriculation *')).toBeInTheDocument();
      expect(screen.getByText('Capacité *')).toBeInTheDocument();
      expect(screen.getByText('Modèle *')).toBeInTheDocument();
      expect(screen.getByText('Année *')).toBeInTheDocument();
      expect(screen.getByText(/Chauffeur/)).toBeInTheDocument();
      expect(screen.getByText('Zone (optionnel)')).toBeInTheDocument();
    });

    it('ferme le modal au clic sur Annuler', async () => {
      vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ajouter un bus')).toBeInTheDocument();
      });

      // Ouvrir modal
      const addButton = screen.getAllByText('Ajouter un bus')[0];
      await user.click(addButton);

      // Fermer modal
      const cancelButton = screen.getByText('Annuler');
      await user.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByText('Numéro de bus *')).not.toBeInTheDocument();
      });
    });
  });

  describe('Création d\'un bus', () => {
    it('crée un nouveau bus avec succès', async () => {
      vi.mocked(busApi.getAllBuses).mockResolvedValue([]);
      vi.mocked(busApi.createBus).mockResolvedValue({
        id: 'bus-new',
        busNumber: 3,
        plateNumber: 'TU 123 TN 456',
        model: 'Bus Standard',
        year: 2024,
        capacity: 50,
        status: 'active',
        maintenanceStatus: 'ok',
        driverId: null,
        routeId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const user = userEvent.setup();
      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ajouter un bus')).toBeInTheDocument();
      });

      // Ouvrir modal
      const addButton = screen.getAllByText('Ajouter un bus')[0];
      await user.click(addButton);

      // Remplir le formulaire
      const busNumberInput = screen.getByPlaceholderText('Ex: 1, 2, 3...');
      const plateNumberInput = screen.getByPlaceholderText('Ex: TU 123 TN 456');
      const capacityInput = screen.getByPlaceholderText('50');

      await user.type(busNumberInput, '3');
      await user.type(plateNumberInput, 'TU 123 TN 456');
      await user.type(capacityInput, '50');

      // Soumettre
      const submitButton = screen.getByText('Enregistrer');
      await user.click(submitButton);

      await waitFor(() => {
        expect(busApi.createBus).toHaveBeenCalled();
        const callArgs = vi.mocked(busApi.createBus).mock.calls[0][0];
        expect(callArgs).toMatchObject({
          busNumber: 3,
          plateNumber: 'TU 123 TN 456',
          capacity: 50,
          model: 'Bus Standard',
          year: new Date().getFullYear(),
        });
      });
    });

    it('affiche une erreur si des champs sont manquants', async () => {
      vi.mocked(busApi.getAllBuses).mockResolvedValue([]);

      const user = userEvent.setup();
      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Ajouter un bus')).toBeInTheDocument();
      });

      // Ouvrir modal
      const addButton = screen.getAllByText('Ajouter un bus')[0];
      await user.click(addButton);

      // Soumettre sans remplir
      const submitButton = screen.getByText('Enregistrer');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Le numéro, la plaque et la capacité sont requis')).toBeInTheDocument();
      });
    });
  });

  describe('Suppression d\'un bus', () => {
    it('supprime un bus après confirmation', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          busNumber: 1,
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes',
          year: 2024,
          capacity: 50,
          status: 'active',
          maintenanceStatus: 'ok',
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(busApi.getAllBuses).mockResolvedValue(mockBuses);
      vi.mocked(busApi.deleteBus).mockResolvedValue();

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      const user = userEvent.setup();
      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bus 1')).toBeInTheDocument();
      });

      const deleteButton = await screen.findByTitle('Supprimer');
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalled();
      await waitFor(() => {
        expect(busApi.deleteBus).toHaveBeenCalled();
        const callArgs = vi.mocked(busApi.deleteBus).mock.calls[0];
        expect(callArgs[0]).toBe('bus-1');
      });

      confirmSpy.mockRestore();
    });

    it('annule la suppression si l\'utilisateur refuse', async () => {
      const mockBuses = [
        {
          id: 'bus-1',
          busNumber: 1,
          plateNumber: 'TU 111 TN 111',
          model: 'Mercedes',
          year: 2024,
          capacity: 50,
          status: 'active',
          maintenanceStatus: 'ok',
          driverId: null,
          routeId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      vi.mocked(busApi.getAllBuses).mockResolvedValue(mockBuses);

      // Mock window.confirm pour retourner false
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

      const user = userEvent.setup();
      render(<BusesManagementPage />, { wrapper: createWrapper() });

      await waitFor(() => {
        expect(screen.getByText('Bus 1')).toBeInTheDocument();
      });

      const deleteButton = await screen.findByTitle('Supprimer');
      await user.click(deleteButton);

      expect(confirmSpy).toHaveBeenCalled();
      expect(busApi.deleteBus).not.toHaveBeenCalled();

      confirmSpy.mockRestore();
    });
  });
});

