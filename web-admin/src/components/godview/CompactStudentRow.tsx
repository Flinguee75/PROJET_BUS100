/**
 * CompactStudentRow - Ligne compacte horizontale pour l'affichage des élèves
 * Remplace les grandes cartes verticales pour économiser l'espace (Phase 4)
 */

import { CheckCircle2, XCircle, Clock } from 'lucide-react';

export interface CompactStudentRowProps {
  firstName: string;
  lastName: string;
  status: 'scanned' | 'unscanned' | 'absent';
  scanTime?: string; // Format: "08:45" ou timestamp formaté
  className?: string;
}

/**
 * Ligne compacte pour afficher un élève avec son statut
 * Layout: [Icône] Prénom Nom                    Heure
 */
export const CompactStudentRow: React.FC<CompactStudentRowProps> = ({
  firstName,
  lastName,
  status,
  scanTime,
  className = '',
}) => {
  // Icône et couleur selon le statut
  const getStatusIcon = () => {
    switch (status) {
      case 'scanned':
        return <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2.5} />;
      case 'unscanned':
        return <XCircle className="w-4 h-4 text-red-600" strokeWidth={2.5} />;
      case 'absent':
        return <Clock className="w-4 h-4 text-slate-400" strokeWidth={2.5} />;
      default:
        return null;
    }
  };

  const getBgColor = () => {
    switch (status) {
      case 'scanned':
        return 'bg-green-50 hover:bg-green-100';
      case 'unscanned':
        return 'bg-red-50 hover:bg-red-100';
      case 'absent':
        return 'bg-slate-50 hover:bg-slate-100';
      default:
        return 'bg-white';
    }
  };

  const getTextColor = () => {
    switch (status) {
      case 'scanned':
        return 'text-slate-900';
      case 'unscanned':
        return 'text-red-900 font-semibold';
      case 'absent':
        return 'text-slate-500';
      default:
        return 'text-slate-900';
    }
  };

  return (
    <div
      className={`flex items-center justify-between px-3 py-2 border-b border-slate-200 transition-colors ${getBgColor()} ${className}`}
    >
      {/* Left: Icon + Name */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {getStatusIcon()}
        <span className={`text-sm truncate ${getTextColor()}`}>
          {firstName} {lastName}
        </span>
      </div>

      {/* Right: Scan time (if available) */}
      {scanTime && (
        <span className="text-xs text-slate-500 ml-2 flex-shrink-0">
          {scanTime}
        </span>
      )}
    </div>
  );
};
