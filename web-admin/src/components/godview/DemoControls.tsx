/**
 * Contrôles de présentation du mode démo.
 *
 * Petit panneau intégré au badge "MODE DÉMO" qui permet à l'orateur de :
 *   - mettre la simulation en pause (figer la scène pour expliquer)
 *   - reprendre où on s'était arrêté
 *   - réinitialiser à l'état seed initial pour recommencer proprement
 */

import { Pause, Play, RotateCcw } from 'lucide-react';

interface DemoControlsProps {
  isPaused: boolean;
  onTogglePause: () => void;
  onReset: () => void;
  /** Vitesse courante (1, 2, 5…). Omettre pour cacher le bouton vitesse. */
  speed?: number;
  /** Callback de cycle de vitesse. Omettre pour cacher le bouton vitesse. */
  onCycleSpeed?: () => void;
}

export const DemoControls = ({
  isPaused,
  onTogglePause,
  onReset,
  speed,
  onCycleSpeed,
}: DemoControlsProps) => {
  const toggleLabel = isPaused ? 'Reprendre la simulation' : 'Pause la simulation';
  const speedLabel = speed != null ? `Vitesse ${speed}×` : '';
  return (
    <div className="godview-demo-controls" role="group" aria-label="Contrôles démo">
      <button
        type="button"
        className="godview-demo-controls__btn"
        aria-label={toggleLabel}
        title={toggleLabel}
        onClick={onTogglePause}
      >
        {isPaused ? <Play size={14} aria-hidden /> : <Pause size={14} aria-hidden />}
      </button>
      <button
        type="button"
        className="godview-demo-controls__btn"
        aria-label="Reset — recommencer la démo"
        title="Reset — recommencer la démo"
        onClick={onReset}
      >
        <RotateCcw size={14} aria-hidden />
      </button>
      {speed != null && onCycleSpeed && (
        <button
          type="button"
          className="godview-demo-controls__btn godview-demo-controls__btn--speed"
          aria-label={speedLabel}
          title={speedLabel}
          onClick={onCycleSpeed}
        >
          {speed}×
        </button>
      )}
    </div>
  );
};
