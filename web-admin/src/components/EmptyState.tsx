/**
 * Composant EmptyState Réutilisable (Design Professionnel)
 * État vide avec icône, titre et action
 */

import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: LucideIcon;
  };
}

export const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => {
  const ActionIcon = action?.icon;
  
  return (
    <div className="bg-white rounded-xl shadow-card border border-slate-200 p-12 text-center">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-10 h-10 text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2 font-display">
        {title}
      </h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        {description}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all shadow-md hover:shadow-lg font-medium inline-flex items-center gap-2"
        >
          {ActionIcon && <ActionIcon className="w-5 h-5" strokeWidth={2} />}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};

