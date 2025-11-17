/**
 * Tests pour le composant LoadingSpinner
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LoadingSpinner } from '@/components/LoadingSpinner';

describe('LoadingSpinner', () => {
  it('affiche le spinner', () => {
    const { container } = render(<LoadingSpinner />);
    
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('affiche un message optionnel', () => {
    render(<LoadingSpinner message="Chargement en cours..." />);

    expect(screen.getByText('Chargement en cours...')).toBeInTheDocument();
  });

  it('fonctionne sans message', () => {
    render(<LoadingSpinner />);

    expect(screen.queryByText(/chargement/i)).not.toBeInTheDocument();
  });

  it('applique la bonne taille (small)', () => {
    const { container } = render(<LoadingSpinner size="sm" />);
    
    const spinner = container.querySelector('.w-6');
    expect(spinner).toBeInTheDocument();
  });

  it('applique la bonne taille (medium)', () => {
    const { container } = render(<LoadingSpinner size="md" />);
    
    const spinner = container.querySelector('.w-12');
    expect(spinner).toBeInTheDocument();
  });

  it('applique la bonne taille (large)', () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    
    const spinner = container.querySelector('.w-16');
    expect(spinner).toBeInTheDocument();
  });
});

