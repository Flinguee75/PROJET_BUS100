/**
 * Composant StatCard Réutilisable (Design Professionnel)
 * Carte de statistique avec icône SVG et badge optionnel
 */

import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  badge?: {
    label: string;
    variant: 'success' | 'warning' | 'danger' | 'primary' | 'slate';
  };
  iconColor?: 'primary' | 'success' | 'warning' | 'danger' | 'slate';
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const iconColorClasses = {
  primary: 'bg-primary-50 text-primary-600',
  success: 'bg-success-50 text-success-600',
  warning: 'bg-warning-50 text-warning-600',
  danger: 'bg-danger-50 text-danger-600',
  slate: 'bg-slate-100 text-slate-700',
};

const badgeColorClasses = {
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
};

export const StatCard = ({
  title,
  value,
  icon: Icon,
  subtitle,
  badge,
  iconColor = 'primary',
  trend,
}: StatCardProps) => {
  return (
    <div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
      <div className="flex items-start justify-between mb-5">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${iconColorClasses[iconColor]}`}>
          <Icon className="w-6 h-6" strokeWidth={2} />
        </div>
        
        {badge && (
          <span className={`px-2.5 py-1 rounded-md text-xs font-semibold border ${badgeColorClasses[badge.variant]}`}>
            {badge.label}
          </span>
        )}
      </div>
      
      <div>
        <p className="text-sm font-medium text-slate-600 mb-2">
          {title}
        </p>
        <div className="flex items-baseline gap-2 mb-1">
          <span className="text-4xl font-bold text-slate-900 tracking-tight">
            {value}
          </span>
        </div>
        
        {subtitle && (
          <p className="text-xs text-slate-500 mt-1.5">
            {subtitle}
          </p>
        )}
        
        {trend && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className={`text-sm font-semibold ${trend.isPositive ? 'text-success-600' : 'text-danger-600'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
            <span className="text-xs text-slate-500">vs. hier</span>
          </div>
        )}
      </div>
    </div>
  );
};

