/**
 * Tests pour le composant Sidebar
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

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

describe('Sidebar', () => {
  const renderSidebar = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <AuthProvider>
          <SidebarProvider>
            <Sidebar />
          </SidebarProvider>
        </AuthProvider>
      </MemoryRouter>
    );
  };

  it('affiche le logo et le titre', () => {
    renderSidebar();
    expect(screen.getByText('Transport Scolaire')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
  });

  it('affiche tous les liens de navigation', () => {
    renderSidebar();

    // Nouvelle structure MVP avec 2 items seulement
    expect(screen.getByText('Tour de Contrôle')).toBeInTheDocument();
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
  });

  it('affiche les icônes des liens de navigation', () => {
    renderSidebar();

    // Vérifier qu'il y a 2 liens (correspondant aux 2 items MVP)
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(2);
  });

  it('applique la classe active au lien actif', () => {
    renderSidebar('/map');

    const mapLink = screen.getByText('Tour de Contrôle').closest('a');
    expect(mapLink).toHaveClass('bg-primary-600');
    expect(mapLink).toHaveClass('text-white');
  });

  it("n'applique pas la classe active aux autres liens", () => {
    renderSidebar('/map');

    const importLink = screen.getByText('Import CSV').closest('a');
    expect(importLink).not.toHaveClass('bg-primary-600');
    expect(importLink).toHaveClass('text-slate-300');
  });

  it('change le lien actif selon la route', () => {
    // Tester avec la route /import
    const { unmount } = renderSidebar('/import');

    const importLink = screen.getByText('Import CSV').closest('a');
    expect(importLink).toHaveClass('bg-primary-600');

    unmount();

    // Tester avec la route /map
    renderSidebar('/map');

    const mapLink = screen.getByText('Tour de Contrôle').closest('a');
    expect(mapLink).toHaveClass('bg-primary-600');
  });

  it('affiche la version dans le footer', () => {
    renderSidebar();
    expect(screen.getByText('Version 1.0.0')).toBeInTheDocument();
  });

  it('affiche le copyright dans le footer', () => {
    renderSidebar();
    expect(screen.getByText('© 2024 Transport Scolaire')).toBeInTheDocument();
  });

  it('les liens pointent vers les bonnes routes', () => {
    renderSidebar();

    const mapLink = screen.getByText('Tour de Contrôle').closest('a');
    expect(mapLink).toHaveAttribute('href', '/map');

    const importLink = screen.getByText('Import CSV').closest('a');
    expect(importLink).toHaveAttribute('href', '/import');
  });

  it('applique les styles de hover aux liens non actifs', () => {
    renderSidebar('/map');

    const importLink = screen.getByText('Import CSV').closest('a');
    expect(importLink).toHaveClass('hover:bg-slate-800');
    expect(importLink).toHaveClass('hover:text-white');
  });

  it('tous les liens sont des éléments Link de React Router', () => {
    renderSidebar();

    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      // Vérifier que c'est un lien React Router (a avec href)
      expect(link.tagName).toBe('A');
      expect(link).toHaveAttribute('href');
    });
  });
});
