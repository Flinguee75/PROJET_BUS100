/**
 * Composant Badge Réutilisable (Design Professionnel)
 * Badge avec variantes de couleurs
 */

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'primary' | 'slate' | 'info';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses = {
  success: 'bg-success-50 text-success-700 border-success-200',
  warning: 'bg-warning-50 text-warning-700 border-warning-200',
  danger: 'bg-danger-50 text-danger-700 border-danger-200',
  primary: 'bg-primary-50 text-primary-700 border-primary-200',
  slate: 'bg-slate-100 text-slate-700 border-slate-200',
  info: 'bg-sky-50 text-sky-700 border-sky-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export const Badge = ({ label, variant = 'slate', size = 'md' }: BadgeProps) => {
  return (
    <span className={`inline-flex items-center rounded-md font-semibold border ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {label}
    </span>
  );
};

