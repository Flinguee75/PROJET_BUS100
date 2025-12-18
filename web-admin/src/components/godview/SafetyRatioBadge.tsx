/**
 * SafetyRatioBadge - Badge affichant le ratio de sécurité (élèves scannés / total)
 * Affiche un badge coloré selon le statut de complétude
 */

import { CheckCircle2 } from 'lucide-react';

interface SafetyRatioBadgeProps {
  scanned: number;
  total: number;
  variant?: 'success' | 'danger' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SafetyRatioBadge: React.FC<SafetyRatioBadgeProps> = ({
  scanned,
  total,
  variant = 'neutral',
  size = 'md',
  className = '',
}) => {
  const isComplete = scanned === total && total > 0;

  // Si variant est "neutral", déterminer automatiquement success/danger
  const displayVariant = variant === 'neutral'
    ? (isComplete ? 'success' : 'danger')
    : variant;

  const colorClasses = {
    success: 'bg-green-50 text-green-700 border-green-200',
    danger: 'bg-red-50 text-red-700 border-red-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-3xl px-4 py-2',
  };

  // Taille de l'icône selon la taille du badge
  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${colorClasses[displayVariant]} ${sizeClasses[size]} ${className}`}
    >
      {isComplete && size !== 'lg' && (
        <CheckCircle2 className={iconSize[size]} strokeWidth={2.5} />
      )}
      <span>
        {scanned}/{total}
      </span>
    </div>
  );
};
