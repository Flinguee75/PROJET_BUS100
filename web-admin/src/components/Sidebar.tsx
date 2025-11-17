/**
 * Composant Sidebar - Navigation latérale
 * Affiche les liens de navigation principaux
 */

import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Tableau de bord', icon: '📊' },
  { path: '/realtime-map', label: 'Carte temps réel', icon: '🗺️' },
  { path: '/buses', label: 'Gestion des bus', icon: '🚌' },
  { path: '/students', label: 'Élèves', icon: '👨‍🎓' },
  { path: '/drivers', label: 'Chauffeurs', icon: '👨‍✈️' },
  { path: '/maintenance', label: 'Maintenance', icon: '🔧' },
  { path: '/reports', label: 'Rapports', icon: '📈' },
];

export const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string): boolean => {
    return location.pathname === path;
  };

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col">
      {/* Logo et titre */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-2xl">
            🚌
          </div>
          <div>
            <h1 className="text-xl font-bold">Transport Scolaire</h1>
            <p className="text-xs text-gray-400">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`
              flex items-center space-x-3 px-4 py-3 rounded-lg
              transition-colors duration-200
              ${
                isActive(item.path)
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }
            `}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <div className="text-xs text-gray-500 text-center">
          <p>Version 1.0.0</p>
          <p className="mt-1">© 2024 Transport Scolaire</p>
        </div>
      </div>
    </aside>
  );
};

