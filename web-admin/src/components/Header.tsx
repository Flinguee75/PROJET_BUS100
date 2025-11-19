/**
 * Composant Header - En-tête de page (Design Professionnel)
 * Affiche le titre de la page et les infos utilisateur
 */

import { useNavigate } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export const Header = ({ title, subtitle }: HeaderProps) => {
  const { user, logout } = useAuthContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    const name = user?.displayName || user?.email || 'Admin';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="bg-white border-b border-slate-200 px-6 lg:px-8 py-4 sticky top-0 z-20 shadow-sm">
      <div className="flex items-center justify-between">
        {/* Titre de la page */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 font-display tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-600 mt-0.5 font-medium">
              {subtitle}
            </p>
          )}
        </div>

        {/* Informations utilisateur */}
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button
            className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all duration-200"
            aria-label="Notifications"
            title="Notifications"
          >
            <Bell className="w-5 h-5" strokeWidth={2} />
            {/* Badge de notification */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* Séparateur vertical */}
          <div className="h-8 w-px bg-slate-200"></div>

          {/* Profil utilisateur */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-slate-900">
                {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-slate-500 font-medium">
                {user?.role || 'Administrateur'}
              </p>
            </div>
            
            {/* Avatar */}
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
              {getUserInitials()}
            </div>

            {/* Bouton déconnexion */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-600 hover:text-danger-600 hover:bg-danger-50 rounded-lg transition-all duration-200 group"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

