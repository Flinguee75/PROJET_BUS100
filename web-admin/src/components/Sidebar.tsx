/**
 * Composant Sidebar - Navigation latérale (Design Professionnel)
 * Affiche les liens de navigation principaux avec icônes SVG
 * Support du redimensionnement horizontal par drag
 */

import { Link, useLocation } from 'react-router-dom';
import { useRef, useEffect } from 'react';
import {
  Map,
  Upload,
  LucideIcon,
  GripVertical,
  Bus
} from 'lucide-react';
import { useSidebarContext } from '@/contexts/SidebarContext';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { path: '/map', label: 'Tour de Contrôle', icon: Map },
  { path: '/import', label: 'Import CSV', icon: Upload },
];

// Constantes pour les limites de largeur
const MIN_WIDTH = 80;
const MAX_WIDTH = 400;
const COLLAPSED_THRESHOLD = 150; // En dessous de cette largeur, on masque le texte

export const Sidebar = () => {
  const location = useLocation();
  const { width, setWidth } = useSidebarContext();
  const isResizingRef = useRef(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const isActive = (path: string): boolean => {
    // Correspondance exacte ou début de chemin (pour les sous-pages)
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Détermine si on affiche le texte complet ou juste les icônes
  const showText = width > COLLAPSED_THRESHOLD;

  // Gestion du redimensionnement par drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizingRef.current) return;

      const newWidth = e.clientX;

      // Contraintes de largeur
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setWidth]);

  const handleMouseDown = () => {
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  return (
    <aside
      ref={sidebarRef}
      style={{ width: `${width}px` }}
      className="bg-slate-900 text-white flex flex-col border-r border-slate-800 relative transition-all duration-100 ease-out flex-shrink-0"
    >
      {/* Logo et titre */}
      <div className="p-6 border-b border-slate-800">
        <div className={`flex items-center ${showText ? 'space-x-3' : 'justify-center'}`}>
          <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
            <Bus className="w-6 h-6 text-white" strokeWidth={2.5} />
          </div>
          {showText && (
            <div className="overflow-hidden">
              <h1 className="text-lg font-bold font-display tracking-tight whitespace-nowrap">Transport Scolaire</h1>
              <p className="text-xs text-slate-400 font-medium whitespace-nowrap">Administration</p>
            </div>
          )}
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
                group flex items-center px-3 py-2.5 rounded-lg
                transition-all duration-200
                ${showText ? 'space-x-3' : 'justify-center'}
                ${
                  active
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }
              `}
              title={!showText ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 ${
                  active ? 'text-white' : 'text-slate-400 group-hover:text-white'
                }`}
                strokeWidth={2}
              />
              {showText && (
                <>
                  <span className="font-medium text-sm whitespace-nowrap overflow-hidden text-ellipsis">
                    {item.label}
                  </span>

                  {/* Indicateur actif */}
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </>
              )}

              {/* Indicateur actif pour mode collapsed */}
              {!showText && active && (
                <div className="absolute right-2 w-1.5 h-1.5 bg-white rounded-full"></div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      {showText && (
        <div className="p-4 border-t border-slate-800">
          <div className="text-xs text-slate-500 text-center space-y-1">
            <p className="font-medium">Version 1.0.0</p>
            <p className="text-slate-600">© 2024 Transport Scolaire</p>
          </div>
        </div>
      )}

      {/* Handle de redimensionnement */}
      <div
        onMouseDown={handleMouseDown}
        className="absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-primary-500 transition-colors group"
        aria-label="Redimensionner la sidebar"
      >
        {/* Indicateur visuel au centre */}
        <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-12 bg-slate-700 group-hover:bg-primary-500 transition-colors rounded-l-sm flex items-center justify-center">
          <GripVertical className="w-3 h-3 text-slate-500 group-hover:text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </aside>
  );
};
