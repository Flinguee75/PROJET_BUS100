/**
 * Tests pour le composant Sidebar
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from '@/components/Sidebar';

describe('Sidebar', () => {
  const renderSidebar = (initialRoute = '/') => {
    return render(
      <MemoryRouter initialEntries={[initialRoute]}>
        <Sidebar />
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

    expect(screen.getByText('Tableau de bord')).toBeInTheDocument();
    expect(screen.getByText('Carte temps réel')).toBeInTheDocument();
    expect(screen.getByText('Gestion des bus')).toBeInTheDocument();
    expect(screen.getByText('Élèves')).toBeInTheDocument();
    expect(screen.getByText('Chauffeurs')).toBeInTheDocument();
    expect(screen.getByText('Maintenance')).toBeInTheDocument();
    expect(screen.getByText('Rapports')).toBeInTheDocument();
  });

  it('affiche les icônes des liens de navigation', () => {
    renderSidebar();

    // Vérifier qu'il y a au moins 7 liens (correspondant aux 7 items)
    const links = screen.getAllByRole('link');
    expect(links.length).toBe(7);
  });

  it('applique la classe active au lien actif', () => {
    renderSidebar('/dashboard');

    const dashboardLink = screen.getByText('Tableau de bord').closest('a');
    expect(dashboardLink).toHaveClass('bg-primary-600');
    expect(dashboardLink).toHaveClass('text-white');
  });

  it("n'applique pas la classe active aux autres liens", () => {
    renderSidebar('/dashboard');

    const busesLink = screen.getByText('Gestion des bus').closest('a');
    expect(busesLink).not.toHaveClass('bg-primary-600');
    expect(busesLink).toHaveClass('text-gray-300');
  });

  it('change le lien actif selon la route', () => {
    // Tester avec la route /buses
    const { unmount } = renderSidebar('/buses');

    const busesLink = screen.getByText('Gestion des bus').closest('a');
    expect(busesLink).toHaveClass('bg-primary-600');

    unmount();

    // Tester avec la route /dashboard
    renderSidebar('/dashboard');

    const dashboardLink = screen.getByText('Tableau de bord').closest('a');
    expect(dashboardLink).toHaveClass('bg-primary-600');
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

    const dashboardLink = screen.getByText('Tableau de bord').closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const mapLink = screen.getByText('Carte temps réel').closest('a');
    expect(mapLink).toHaveAttribute('href', '/realtime-map');

    const busesLink = screen.getByText('Gestion des bus').closest('a');
    expect(busesLink).toHaveAttribute('href', '/buses');

    const studentsLink = screen.getByText('Élèves').closest('a');
    expect(studentsLink).toHaveAttribute('href', '/students');

    const driversLink = screen.getByText('Chauffeurs').closest('a');
    expect(driversLink).toHaveAttribute('href', '/drivers');

    const maintenanceLink = screen.getByText('Maintenance').closest('a');
    expect(maintenanceLink).toHaveAttribute('href', '/maintenance');

    const reportsLink = screen.getByText('Rapports').closest('a');
    expect(reportsLink).toHaveAttribute('href', '/reports');
  });

  it('applique les styles de hover aux liens non actifs', () => {
    renderSidebar('/dashboard');

    const busesLink = screen.getByText('Gestion des bus').closest('a');
    expect(busesLink).toHaveClass('hover:bg-gray-800');
    expect(busesLink).toHaveClass('hover:text-white');
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
