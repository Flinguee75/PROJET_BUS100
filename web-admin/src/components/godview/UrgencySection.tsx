/**
 * UrgencySection - Section d'alerte dynamique (Management by Exception)
 * N'apparaît que lorsqu'il y a des urgences réelles (élèves manquants ou bus en retard)
 */

import { AlertTriangle } from 'lucide-react';

interface UrgencySectionProps {
  unscannedCount: number;
  delayedBusCount: number;
  onExpand: () => void;
}

export const UrgencySection: React.FC<UrgencySectionProps> = ({
  unscannedCount,
  delayedBusCount,
  onExpand,
}) => {
  // Ne rien afficher si aucune urgence
  if (unscannedCount === 0 && delayedBusCount === 0) {
    return null;
  }

  return (
    <div
      className="bg-red-600 text-white p-4 border-b border-red-700 animate-slide-down"
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} aria-hidden="true" />
          <div>
            {unscannedCount > 0 && (
              <p className="font-bold text-base">
                {unscannedCount} élève{unscannedCount > 1 ? 's' : ''} manquant{unscannedCount > 1 ? 's' : ''}
              </p>
            )}
            {delayedBusCount > 0 && (
              <p className="text-sm opacity-90">
                {delayedBusCount} bus en retard
              </p>
            )}
          </div>
        </div>
        <button
          onClick={onExpand}
          className="px-3 py-1.5 bg-white text-red-600 rounded-lg text-sm font-semibold hover:bg-red-50 transition-colors flex-shrink-0"
          aria-label="Voir les détails des urgences"
        >
          Voir détails →
        </button>
      </div>
    </div>
  );
};
