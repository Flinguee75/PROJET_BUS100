/**
 * Tests des contrôles de présentation du mode démo (pause/reprise/reset).
 * Composant isolé pour permettre un test simple sans Mapbox.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DemoControls } from './DemoControls';

describe('DemoControls', () => {
  it('affiche un bouton pause quand la simulation tourne', () => {
    render(<DemoControls isPaused={false} onTogglePause={() => {}} onReset={() => {}} />);

    const pauseButton = screen.getByRole('button', { name: /pause/i });
    expect(pauseButton).toBeInTheDocument();
  });

  it('affiche un bouton reprendre quand la simulation est en pause', () => {
    render(<DemoControls isPaused={true} onTogglePause={() => {}} onReset={() => {}} />);

    const resumeButton = screen.getByRole('button', { name: /reprend/i });
    expect(resumeButton).toBeInTheDocument();
  });

  it('affiche toujours un bouton reset', () => {
    render(<DemoControls isPaused={false} onTogglePause={() => {}} onReset={() => {}} />);

    const resetButton = screen.getByRole('button', { name: /reset|recommenc/i });
    expect(resetButton).toBeInTheDocument();
  });

  it('appelle onTogglePause au clic sur le bouton pause/play', () => {
    const onTogglePause = vi.fn();
    render(<DemoControls isPaused={false} onTogglePause={onTogglePause} onReset={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(onTogglePause).toHaveBeenCalledTimes(1);
  });

  it('appelle onReset au clic sur le bouton reset', () => {
    const onReset = vi.fn();
    render(<DemoControls isPaused={false} onTogglePause={() => {}} onReset={onReset} />);

    fireEvent.click(screen.getByRole('button', { name: /reset|recommenc/i }));
    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it('affiche un bouton de vitesse avec le multiplicateur courant', () => {
    render(
      <DemoControls
        isPaused={false}
        onTogglePause={() => {}}
        onReset={() => {}}
        speed={2}
        onCycleSpeed={() => {}}
      />
    );

    const speedButton = screen.getByRole('button', { name: /vitesse/i });
    expect(speedButton).toHaveTextContent('2×');
  });

  it('appelle onCycleSpeed au clic sur le bouton vitesse', () => {
    const onCycleSpeed = vi.fn();
    render(
      <DemoControls
        isPaused={false}
        onTogglePause={() => {}}
        onReset={() => {}}
        speed={1}
        onCycleSpeed={onCycleSpeed}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /vitesse/i }));
    expect(onCycleSpeed).toHaveBeenCalledTimes(1);
  });

  it('omet le bouton vitesse quand onCycleSpeed n’est pas fourni', () => {
    render(<DemoControls isPaused={false} onTogglePause={() => {}} onReset={() => {}} />);
    expect(screen.queryByRole('button', { name: /vitesse/i })).toBeNull();
  });
});
