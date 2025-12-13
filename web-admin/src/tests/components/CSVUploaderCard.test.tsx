/**
 * Tests pour CSVUploaderCard
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Users } from 'lucide-react';
import { CSVUploaderCard } from '@/components/CSVUploaderCard';

describe('CSVUploaderCard', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
  });

  it('should render without crashing', () => {
    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );
    expect(screen.getByText('Élèves')).toBeInTheDocument();
  });

  it('should display download template link', () => {
    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );
    const linkText = screen.getByText('Télécharger le modèle CSV');
    expect(linkText).toBeInTheDocument();
    const link = linkText.closest('a');
    expect(link).toHaveAttribute('href', '/templates/students.csv');
  });

  it('should display description when provided', () => {
    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
        description="Importer la liste des élèves"
      />
    );
    expect(screen.getByText('Importer la liste des élèves')).toBeInTheDocument();
  });

  it('should have disabled upload button when no file selected', () => {
    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );
    const uploadButton = screen.getByText('Importer').closest('button');
    expect(uploadButton).toBeDisabled();
  });

  it('should accept CSV file selection', async () => {
    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['firstName,lastName\nJohn,Doe'], 'students.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/students.csv/)).toBeInTheDocument();
    });
  });

  it('should show file size after selection', async () => {
    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['firstName,lastName\nJohn,Doe'], 'students.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/Ko/)).toBeInTheDocument();
    });
  });

  it('should reject non-CSV files', async () => {
    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText('Veuillez sélectionner un fichier CSV')).toBeInTheDocument();
    });
  });

  it('should reject files larger than 10MB', async () => {
    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    // Créer un fichier fictif de 11 MB
    const largeContent = 'a'.repeat(11 * 1024 * 1024);
    const file = new File([largeContent], 'large.csv', { type: 'text/csv' });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    await waitFor(() => {
      expect(screen.getByText(/trop volumineux/i)).toBeInTheDocument();
    });
  });

  it('should call onUpload when upload button clicked', async () => {
    mockOnUpload.mockResolvedValue(undefined);

    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['firstName,lastName\nJohn,Doe'], 'students.csv', {
      type: 'text/csv',
    });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    const uploadButton = await screen.findByText('Importer');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(mockOnUpload).toHaveBeenCalledWith(file);
    });
  });

  it('should display loading state during upload', async () => {
    mockOnUpload.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    const uploadButton = await screen.findByText('Importer');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Import en cours...')).toBeInTheDocument();
    });
  });

  it('should display success message after successful upload', async () => {
    mockOnUpload.mockResolvedValue(undefined);

    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    const uploadButton = await screen.findByText('Importer');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Import réussi !')).toBeInTheDocument();
    });
  });

  it('should display error message when upload fails', async () => {
    mockOnUpload.mockRejectedValue(new Error('Upload failed'));

    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    const uploadButton = await screen.findByText('Importer');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Upload failed')).toBeInTheDocument();
    });
  });

  it('should clear file after successful upload', async () => {
    mockOnUpload.mockResolvedValue(undefined);

    render(
      <CSVUploaderCard
        title="Élèves"
        icon={Users}
        templateUrl="/templates/students.csv"
        onUpload={mockOnUpload}
      />
    );

    const file = new File(['test'], 'students.csv', { type: 'text/csv' });

    const input = screen.getByLabelText('Sélectionner un fichier') as HTMLInputElement;

    Object.defineProperty(input, 'files', {
      value: [file],
      writable: false,
    });

    fireEvent.change(input);

    const uploadButton = await screen.findByText('Importer');
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Import réussi !')).toBeInTheDocument();
    });

    // Le fichier devrait être cleared
    const newUploadButton = screen.getByText('Importer').closest('button');
    expect(newUploadButton).toBeDisabled();
  });
});
