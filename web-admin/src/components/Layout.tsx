/**
 * Composant Layout - Structure principale de l'application (Design Professionnel)
 * Sidebar + Contenu avec scroll optimisé
 */

import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

export const Layout = () => {
  return (
    <div className="flex h-screen bg-neutral-50 overflow-hidden">
      {/* Sidebar fixe */}
      <Sidebar />

      {/* Contenu principal avec scroll */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Le contenu des pages s'affiche ici (Header inclus dans chaque page) */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
