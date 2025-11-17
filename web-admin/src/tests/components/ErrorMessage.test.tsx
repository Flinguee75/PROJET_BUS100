/**
 * Tests pour le composant ErrorMessage
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorMessage } from '@/components/ErrorMessage';

describe('ErrorMessage', () => {
  it('affiche le message d\'erreur', () => {
    render(<ErrorMessage message="Erreur de connexion" />);

    expect(screen.getByText('Erreur de connexion')).toBeInTheDocument();
    expect(screen.getByText(/une erreur est survenue/i)).toBeInTheDocument();
  });

  it('affiche le bouton de réessai quand onRetry est fourni', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Erreur réseau" onRetry={onRetry} />);

    const retryButton = screen.getByText('Réessayer');
    expect(retryButton).toBeInTheDocument();
  });

  it('appelle onRetry quand le bouton est cliqué', () => {
    const onRetry = vi.fn();
    render(<ErrorMessage message="Erreur" onRetry={onRetry} />);

    const retryButton = screen.getByText('Réessayer');
    fireEvent.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('ne affiche pas le bouton de réessai si onRetry n\'est pas fourni', () => {
    render(<ErrorMessage message="Erreur" />);

    expect(screen.queryByText('Réessayer')).not.toBeInTheDocument();
  });

  it('affiche l\'icône d\'erreur', () => {
    render(<ErrorMessage message="Erreur" />);

    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});

