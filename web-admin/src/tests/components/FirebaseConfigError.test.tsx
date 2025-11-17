/**
 * Tests pour le composant FirebaseConfigError
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FirebaseConfigError } from '@/components/FirebaseConfigError';

describe('FirebaseConfigError', () => {
  it('affiche le titre principal', () => {
    render(<FirebaseConfigError />);
    expect(screen.getByText('Configuration Firebase Manquante')).toBeInTheDocument();
  });

  it('affiche l\'icône d\'avertissement', () => {
    render(<FirebaseConfigError />);
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('affiche le message de description', () => {
    render(<FirebaseConfigError />);
    expect(
      screen.getByText(/Le fichier de configuration Firebase n'est pas trouvé ou incomplet/)
    ).toBeInTheDocument();
  });

  it('affiche les étapes de résolution', () => {
    render(<FirebaseConfigError />);

    expect(screen.getByText('📝 Étapes pour résoudre :')).toBeInTheDocument();
    expect(screen.getByText(/Créez un fichier/)).toBeInTheDocument();
    expect(screen.getByText(/Copiez le contenu de/)).toBeInTheDocument();
    expect(screen.getByText(/Remplissez les variables avec vos credentials Firebase/)).toBeInTheDocument();
    expect(screen.getByText(/Redémarrez le serveur de développement/)).toBeInTheDocument();
  });

  it('affiche toutes les variables d\'environnement requises', () => {
    render(<FirebaseConfigError />);

    expect(screen.getByText('🔑 Variables requises :')).toBeInTheDocument();
    expect(screen.getByText(/VITE_FIREBASE_API_KEY=/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_FIREBASE_AUTH_DOMAIN=/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_FIREBASE_STORAGE_BUCKET=/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_FIREBASE_MESSAGING_SENDER_ID=/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_FIREBASE_APP_ID=/)).toBeInTheDocument();
    expect(screen.getByText(/VITE_MAPBOX_ACCESS_TOKEN=/)).toBeInTheDocument();
  });

  it('affiche les instructions pour trouver les informations', () => {
    render(<FirebaseConfigError />);

    expect(screen.getByText('📚 Où trouver ces informations ?')).toBeInTheDocument();
    expect(screen.getByText(/Allez sur/)).toBeInTheDocument();
    expect(screen.getByText(/Project Settings → Vos applications → Web app/)).toBeInTheDocument();
  });

  it('affiche un lien vers Firebase Console', () => {
    render(<FirebaseConfigError />);

    const link = screen.getByText('Firebase Console');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute(
      'href',
      'https://console.firebase.google.com/project/projet-bus-60a3f/settings/general'
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('affiche le bouton de rechargement', () => {
    render(<FirebaseConfigError />);

    const button = screen.getByRole('button', { name: /Recharger la page/i });
    expect(button).toBeInTheDocument();
  });

  it('recharge la page quand on clique sur le bouton', async () => {
    const user = userEvent.setup();
    const reloadMock = vi.fn();

    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(<FirebaseConfigError />);

    const button = screen.getByRole('button', { name: /Recharger la page/i });
    await user.click(button);

    expect(reloadMock).toHaveBeenCalled();
  });

  it('affiche .env en code formaté', () => {
    const { container } = render(<FirebaseConfigError />);

    const codeElements = container.querySelectorAll('code');
    const envCode = Array.from(codeElements).find((el) => el.textContent === '.env');

    expect(envCode).toBeInTheDocument();
    expect(envCode).toHaveClass('bg-yellow-100');
  });

  it('affiche .env.example en code formaté', () => {
    const { container } = render(<FirebaseConfigError />);

    const codeElements = container.querySelectorAll('code');
    const envExampleCode = Array.from(codeElements).find((el) => el.textContent === '.env.example');

    expect(envExampleCode).toBeInTheDocument();
    expect(envExampleCode).toHaveClass('bg-yellow-100');
  });

  it('affiche web-admin en code formaté', () => {
    const { container } = render(<FirebaseConfigError />);

    const codeElements = container.querySelectorAll('code');
    const webAdminCode = Array.from(codeElements).find((el) => el.textContent === 'web-admin');

    expect(webAdminCode).toBeInTheDocument();
    expect(webAdminCode).toHaveClass('bg-yellow-100');
  });

  it('utilise les bonnes couleurs pour les différentes sections', () => {
    render(<FirebaseConfigError />);

    // Section étapes (jaune)
    const stepsSection = screen.getByText('📝 Étapes pour résoudre :').closest('div');
    expect(stepsSection).toHaveClass('bg-yellow-50');
    expect(stepsSection).toHaveClass('border-yellow-200');

    // Section variables (gris)
    const variablesSection = screen.getByText('🔑 Variables requises :').closest('div');
    expect(variablesSection).toHaveClass('bg-gray-50');

    // Section informations (bleu)
    const infoSection = screen.getByText('📚 Où trouver ces informations ?').closest('div');
    expect(infoSection).toHaveClass('bg-blue-50');
    expect(infoSection).toHaveClass('border-blue-200');
  });

  it('affiche le contenu dans une carte centrée', () => {
    const { container } = render(<FirebaseConfigError />);

    const mainContainer = container.firstChild;
    expect(mainContainer).toHaveClass('min-h-screen');
    expect(mainContainer).toHaveClass('flex');
    expect(mainContainer).toHaveClass('items-center');
    expect(mainContainer).toHaveClass('justify-center');
  });

  it('affiche toutes les sections dans le bon ordre', () => {
    const { container } = render(<FirebaseConfigError />);

    const sections = container.querySelectorAll('div.rounded-lg');

    // Il devrait y avoir au moins 3 sections (étapes, variables, informations)
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });

  it('affiche firebaseConfig en code formaté', () => {
    const { container } = render(<FirebaseConfigError />);

    const codeElements = container.querySelectorAll('code');
    const configCode = Array.from(codeElements).find((el) => el.textContent === 'firebaseConfig');

    expect(configCode).toBeInTheDocument();
    expect(configCode).toHaveClass('bg-blue-100');
  });
});
