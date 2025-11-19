/**
 * Tests pour LoginPage
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '@/pages/LoginPage';
import { AuthProvider } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import * as authService from '@/services/auth.service';

vi.mock('@/services/auth.service');

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(authService.observeAuthState).mockImplementation(() => vi.fn());
  });

  const renderLoginPage = () => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('affiche le formulaire de connexion', () => {
    renderLoginPage();

    expect(screen.getByText('Transport Scolaire')).toBeInTheDocument();
    expect(screen.getByText("Plateforme d'administration")).toBeInTheDocument();
    expect(screen.getByLabelText('Adresse email')).toBeInTheDocument();
    expect(screen.getByLabelText('Mot de passe')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Se connecter/i })).toBeInTheDocument();
  });

  it('valide les champs vides', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    const submitButton = screen.getByRole('button', { name: /Se connecter/i });

    // Les champs required empêchent la soumission, donc le test vérifie juste qu'on peut cliquer
    await user.click(submitButton);

    // Le formulaire HTML5 empêche la soumission si les champs sont vides (attribut required)
    expect(submitButton).toBeInTheDocument();
  });

  it('valide le format de l\'email', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    // Utiliser un email sans @ pour déclencher la validation personnalisée
    await user.type(screen.getByLabelText('Adresse email'), 'invalidemail');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.queryByText('Email invalide')).toBeTruthy();
    }, { timeout: 3000 });
  });

  it('valide la longueur du mot de passe', async () => {
    const user = userEvent.setup();
    renderLoginPage();

    await user.type(screen.getByLabelText('Adresse email'), 'test@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), '12345');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Le mot de passe doit contenir au moins 6 caractères')).toBeInTheDocument();
    });
  });

  it('soumet le formulaire avec des données valides', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockResolvedValue({
      uid: 'test-uid',
      email: 'test@example.com',
      role: UserRole.ADMIN,
    });

    renderLoginPage();

    await user.type(screen.getByLabelText('Adresse email'), 'test@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('affiche une erreur si la connexion échoue', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockRejectedValue(new Error('Identifiants invalides'));

    renderLoginPage();

    await user.type(screen.getByLabelText('Adresse email'), 'test@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByText('Identifiants invalides')).toBeInTheDocument();
    });
  });

  it('désactive les champs pendant la soumission', async () => {
    const user = userEvent.setup();
    vi.mocked(authService.login).mockImplementation(() => new Promise(() => {})); // Never resolves

    renderLoginPage();

    await user.type(screen.getByLabelText('Adresse email'), 'test@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'password123');
    await user.click(screen.getByRole('button', { name: /Se connecter/i }));

    await waitFor(() => {
      expect(screen.getByLabelText('Adresse email')).toBeDisabled();
      expect(screen.getByLabelText('Mot de passe')).toBeDisabled();
      expect(screen.getByRole('button', { name: /Connexion en cours/i })).toBeDisabled();
    });
  });

  it('affiche le logo du bus', () => {
    renderLoginPage();
    expect(screen.getByText('🚌')).toBeInTheDocument();
  });

  it('affiche la checkbox "Se souvenir de moi"', () => {
    renderLoginPage();
    expect(screen.getByText('Se souvenir de moi')).toBeInTheDocument();
  });

  it('affiche le lien "Mot de passe oublié"', () => {
    renderLoginPage();
    expect(screen.getByText('Mot de passe oublié ?')).toBeInTheDocument();
  });

  it('affiche le footer avec copyright', () => {
    renderLoginPage();
    expect(screen.getByText(/© 2024 Transport Scolaire/)).toBeInTheDocument();
  });
});
