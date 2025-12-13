/**
 * Tests pour CSVImportPage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CSVImportPage } from '@/pages/CSVImportPage';
import { AuthProvider } from '@/contexts/AuthContext';

// Mock auth service
vi.mock('@/services/auth.service', () => ({
  observeAuthState: vi.fn((callback) => {
    callback({
      uid: 'test-user-id',
      email: 'admin@test.com',
      displayName: 'Admin User',
      role: 'admin',
    });
    return vi.fn();
  }),
  login: vi.fn(),
  logout: vi.fn(),
}));

describe('CSVImportPage', () => {
  const renderPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <CSVImportPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('should render without crashing', () => {
    renderPage();
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
  });

  it('should display page title and subtitle', () => {
    renderPage();
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
    expect(
      screen.getByText(/Importez vos données en masse/i)
    ).toBeInTheDocument();
  });

  it('should display instructions section', () => {
    renderPage();
    expect(screen.getByText('Comment ça marche ?')).toBeInTheDocument();
    expect(
      screen.getByText(/Téléchargez le modèle CSV/i)
    ).toBeInTheDocument();
  });

  it('should display all 4 uploader cards', () => {
    renderPage();
    expect(screen.getByText('Élèves')).toBeInTheDocument();
    expect(screen.getByText('Parents')).toBeInTheDocument();
    expect(screen.getByText('Bus')).toBeInTheDocument();
    expect(screen.getByText('Chauffeurs')).toBeInTheDocument();
  });

  it('should display template download links', () => {
    renderPage();
    const links = screen.getAllByText('Télécharger le modèle CSV');
    expect(links).toHaveLength(4);
  });

  it('should display empty state message when no imports', () => {
    renderPage();
    expect(screen.getByText('Aucun import pour l\'instant')).toBeInTheDocument();
    expect(
      screen.getByText(/Importez vos premiers fichiers CSV/i)
    ).toBeInTheDocument();
  });

  it('should display import history table after successful upload', async () => {
    renderPage();

    // Simuler un upload de fichier
    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    // Trouver le premier input file (Élèves)
    const inputs = screen.getAllByLabelText('Sélectionner un fichier');
    const studentsInput = inputs[0] as HTMLInputElement;

    Object.defineProperty(studentsInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(studentsInput);

    // Trouver et cliquer sur le bouton Importer
    const uploadButtons = await screen.findAllByText('Importer');
    fireEvent.click(uploadButtons[0]);

    // Attendre que l'historique apparaisse
    await waitFor(
      () => {
        expect(screen.getByText('Historique des Imports')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should display import statistics in history table', async () => {
    renderPage();

    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    const inputs = screen.getAllByLabelText('Sélectionner un fichier');
    const studentsInput = inputs[0] as HTMLInputElement;

    Object.defineProperty(studentsInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(studentsInput);

    const uploadButtons = await screen.findAllByText('Importer');
    fireEvent.click(uploadButtons[0]);

    await waitFor(
      () => {
        expect(screen.getByText(/98 importés/i)).toBeInTheDocument();
        expect(screen.getByText(/2 erreurs/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should display entity type badge in history', async () => {
    renderPage();

    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    const inputs = screen.getAllByLabelText('Sélectionner un fichier');
    const studentsInput = inputs[0] as HTMLInputElement;

    Object.defineProperty(studentsInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(studentsInput);

    const uploadButtons = await screen.findAllByText('Importer');
    fireEvent.click(uploadButtons[0]);

    await waitFor(
      () => {
        expect(screen.getByText('Élèves')).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should display status badge in history', async () => {
    renderPage();

    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    const inputs = screen.getAllByLabelText('Sélectionner un fichier');
    const studentsInput = inputs[0] as HTMLInputElement;

    Object.defineProperty(studentsInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(studentsInput);

    const uploadButtons = await screen.findAllByText('Importer');
    fireEvent.click(uploadButtons[0]);

    await waitFor(
      () => {
        expect(screen.getByText(/Partiel/i)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });

  it('should handle multiple file uploads', async () => {
    renderPage();

    // Upload 1: Élèves
    const studentsFile = new File(['test'], 'students.csv', { type: 'text/csv' });
    const inputs1 = screen.getAllByLabelText('Sélectionner un fichier');
    const studentsInput = inputs1[0] as HTMLInputElement;

    Object.defineProperty(studentsInput, 'files', {
      value: [studentsFile],
      writable: false,
    });

    fireEvent.change(studentsInput);

    const uploadButtons1 = await screen.findAllByText('Importer');
    fireEvent.click(uploadButtons1[0]);

    await waitFor(() => {
      expect(screen.getByText('Historique des Imports')).toBeInTheDocument();
    }, { timeout: 5000 });

    // Upload 2: Parents
    const parentsFile = new File(['test'], 'parents.csv', { type: 'text/csv' });
    const inputs2 = screen.getAllByLabelText('Sélectionner un fichier');
    const parentsInput = inputs2[1] as HTMLInputElement;

    Object.defineProperty(parentsInput, 'files', {
      value: [parentsFile],
      writable: false,
    });

    fireEvent.change(parentsInput);

    const uploadButtons2 = await screen.findAllByText('Importer');
    fireEvent.click(uploadButtons2[1]);

    await waitFor(() => {
      // Devrait avoir 2 imports dans l'historique
      const rows = screen.getByRole('table').querySelectorAll('tbody tr');
      expect(rows.length).toBe(2);
    }, { timeout: 5000 });
  });

  it('should display instruction tip', () => {
    renderPage();
    expect(
      screen.getByText(/Importez d'abord les Parents et Chauffeurs/i)
    ).toBeInTheDocument();
  });

  it('should have correct template URLs for each entity', () => {
    renderPage();

    const templateLinkTexts = screen.getAllByText('Télécharger le modèle CSV');

    expect(templateLinkTexts[0].closest('a')).toHaveAttribute('href', '/templates/students.csv');
    expect(templateLinkTexts[1].closest('a')).toHaveAttribute('href', '/templates/parents.csv');
    expect(templateLinkTexts[2].closest('a')).toHaveAttribute('href', '/templates/buses.csv');
    expect(templateLinkTexts[3].closest('a')).toHaveAttribute('href', '/templates/drivers.csv');
  });

  it('should display formatted timestamp in history', async () => {
    renderPage();

    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    const inputs = screen.getAllByLabelText('Sélectionner un fichier');
    const studentsInput = inputs[0] as HTMLInputElement;

    Object.defineProperty(studentsInput, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(studentsInput);

    const uploadButtons = await screen.findAllByText('Importer');
    fireEvent.click(uploadButtons[0]);

    await waitFor(
      () => {
        // Devrait afficher une date formatée (ex: 13/12/2025, 08:30)
        const dateRegex = /\d{2}\/\d{2}\/\d{4}/;
        expect(screen.getByText(dateRegex)).toBeInTheDocument();
      },
      { timeout: 5000 }
    );
  });
});
