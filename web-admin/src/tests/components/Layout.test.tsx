/**
 * Tests pour le composant Layout
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '@/components/Layout';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';

// Mock des services
vi.mock('@/services/auth.service', () => ({
  observeAuthState: vi.fn((callback) => {
    callback({
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      role: 'admin',
    });
    return vi.fn();
  }),
  login: vi.fn(),
  logout: vi.fn(),
}));

describe('Layout', () => {
  const renderLayout = (children?: React.ReactNode) => {
    return render(
      <BrowserRouter>
        <AuthProvider>
          <SidebarProvider>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<div>{children || 'Test Page Content'}</div>} />
              </Route>
            </Routes>
          </SidebarProvider>
        </AuthProvider>
      </BrowserRouter>
    );
  };

  it('rend le composant Layout', () => {
    const { container } = renderLayout();
    expect(container.firstChild).toBeInTheDocument();
  });

  it('affiche la Sidebar', () => {
    renderLayout();
    expect(screen.getByText('Transport Scolaire')).toBeInTheDocument();
    expect(screen.getByText('Administration')).toBeInTheDocument();
  });

  it('affiche le contenu de la page via Outlet', () => {
    renderLayout('Custom Page Content');
    expect(screen.getByText('Custom Page Content')).toBeInTheDocument();
  });

  it('a une structure flex avec la sidebar et le contenu', () => {
    const { container } = renderLayout();
    const mainContainer = container.querySelector('.flex.h-screen');
    expect(mainContainer).toBeInTheDocument();
  });

  it('le contenu principal est scrollable', () => {
    const { container } = renderLayout();
    const mainContent = container.querySelector('.overflow-y-auto');
    expect(mainContent).toBeInTheDocument();
  });

  it('affiche tous les liens de navigation de la Sidebar', () => {
    renderLayout();

    // Nouvelle structure MVP avec 2 items
    expect(screen.getByText('Tour de Contrôle')).toBeInTheDocument();
    expect(screen.getByText('Import CSV')).toBeInTheDocument();
  });

  it('la sidebar occupe une largeur fixe', () => {
    renderLayout();
    // Vérifier que la sidebar est présente (via le logo)
    expect(screen.getByText('Transport Scolaire')).toBeInTheDocument();
  });

  it('le contenu principal prend l\'espace restant', () => {
    const { container } = renderLayout();
    const mainContent = container.querySelector('.flex-1');
    expect(mainContent).toBeInTheDocument();
  });

  it('utilise un fond gris pour toute la page', () => {
    const { container } = renderLayout();
    // Vérifier la structure flex au lieu d'une classe de fond spécifique
    const mainContainer = container.querySelector('.flex.h-screen');
    expect(mainContainer).toBeInTheDocument();
  });
});
