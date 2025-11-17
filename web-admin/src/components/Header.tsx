/**
 * Composant Header - En-tête de page
 * Affiche le titre de la page et les infos utilisateur
 */

import { useNavigate } from 'react-router-dom';
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

  return (
    <header className="bg-white border-b border-gray-200 px-8 py-4 sticky top-0 z-10">
      <div className="flex items-center justify-between">
        {/* Titre de la page */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>

        {/* Informations utilisateur */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button
            className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Notifications"
          >
            <span className="text-xl">🔔</span>
            {/* Badge de notification */}
            <span className="absolute top-1 right-1 w-2 h-2 bg-danger-500 rounded-full"></span>
          </button>

          {/* Profil utilisateur */}
          <div className="flex items-center space-x-3">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">
                {user?.displayName || user?.email?.split('@')[0] || 'Admin'}
              </p>
              <p className="text-xs text-gray-600">{user?.role || 'Administrateur'}</p>
            </div>
            
            {/* Avatar */}
            <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center text-white font-semibold">
              {(user?.displayName || user?.email || 'A')[0].toUpperCase()}
            </div>

            {/* Menu déroulant (simplifié) */}
            <button
              onClick={handleLogout}
              className="p-2 text-gray-600 hover:text-danger-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Déconnexion"
              aria-label="Déconnexion"
            >
              <span className="text-xl">🚪</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

