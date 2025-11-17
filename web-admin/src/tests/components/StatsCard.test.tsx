/**
 * Tests pour le composant StatsCard
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '@/components/StatsCard';

describe('StatsCard', () => {
  it('affiche le titre et la valeur correctement', () => {
    render(<StatsCard title="Bus Actifs" value={5} icon="🚌" color="blue" />);

    expect(screen.getByText('Bus Actifs')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('🚌')).toBeInTheDocument();
  });

  it('affiche une valeur string', () => {
    render(<StatsCard title="Statut" value="En ligne" icon="✅" />);

    expect(screen.getByText('En ligne')).toBeInTheDocument();
  });

  it('affiche la tendance positive', () => {
    render(
      <StatsCard
        title="Bus Actifs"
        value={5}
        icon="🚌"
        trend={{ value: 10, isPositive: true }}
      />
    );

    expect(screen.getByText(/↑/)).toBeInTheDocument();
    expect(screen.getByText(/10%/)).toBeInTheDocument();
  });

  it('affiche la tendance négative', () => {
    render(
      <StatsCard
        title="Retards"
        value={2}
        icon="⚠️"
        trend={{ value: 5, isPositive: false }}
      />
    );

    expect(screen.getByText(/↓/)).toBeInTheDocument();
    expect(screen.getByText(/5%/)).toBeInTheDocument();
  });

  it('applique les bonnes classes de couleur', () => {
    const { container } = render(
      <StatsCard title="Test" value={1} icon="🔧" color="red" />
    );

    const iconElement = container.querySelector('.bg-red-100');
    expect(iconElement).toBeInTheDocument();
  });

  it('fonctionne sans tendance', () => {
    render(<StatsCard title="Test" value={10} icon="📊" />);

    expect(screen.queryByText(/↑|↓/)).not.toBeInTheDocument();
  });
});

