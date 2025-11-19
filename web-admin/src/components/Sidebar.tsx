/**
 * Composant Sidebar - Navigation latérale (Design Professionnel)
 * Affiche les liens de navigation principaux avec icônes SVG
 */

import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Map, 
  Bus, 
  Users, 
  UserCheck, 
  Wrench,
  FileText,
  Settings,
  Route,
  LucideIcon
} from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { path: '/map', label: 'Carte temps réel', icon: Map },
  { path: '/buses', label: 'Gestion des bus', icon: Bus },
  { path: '/students', label: 'Élèves', icon: Users },
  { path: '/drivers', label: 'Chauffeurs', icon: UserCheck },
  { path: '/routes', label: 'Itinéraires', icon: Route },
  { path: '/maintenance', label: 'Maintenance', icon: Wrench },
  { path: '/reports', label: 'Rapports', icon: FileText },
  { path: '/settings', label: 'Paramètres', icon: Settings },
];

export const Sidebar = () => {
  const location = useLocation();

  const isActive = (path: string): boolean => {
    // Correspondance exacte ou début de chemin (pour les sous-pages)
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800">
      {/* Logo et titre */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
            <Bus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-lg font-bold font-display tracking-tight">Transport Scolaire</h1>
            <p className="text-xs text-slate-400 font-medium">Administration</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`
                group flex items-center space-x-3 px-3 py-2.5 rounded-lg
                transition-all duration-200
                ${
                  active
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
            >
              <Icon 
                className={`w-5 h-5 flex-shrink-0 ${
                  active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`} 
                strokeWidth={2} 
              />
              <span className="font-medium text-sm">{item.label}</span>
              
              {/* Indicateur actif */}
              {active && (
                <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800">
        <div className="text-xs text-slate-500 text-center space-y-1">
          <p className="font-medium">Version 1.0.0</p>
          <p className="text-slate-600">© 2024 Transport Scolaire</p>
        </div>
      </div>
    </aside>
  );
};

