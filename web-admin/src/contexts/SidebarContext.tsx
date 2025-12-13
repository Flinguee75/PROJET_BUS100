/**
 * Contexte SidebarContext - Gestion de la largeur de la sidebar (redimensionnable)
 */

import { createContext, useContext, useState, ReactNode } from 'react';

interface SidebarContextType {
  width: number;
  setWidth: (width: number) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

// Largeur par défaut : 220px (réduite pour éviter coupure du titre)
const DEFAULT_WIDTH = 220;

export const SidebarProvider = ({ children }: SidebarProviderProps) => {
  const [width, setWidth] = useState(DEFAULT_WIDTH);

  return (
    <SidebarContext.Provider value={{ width, setWidth }}>
      {children}
    </SidebarContext.Provider>
  );
};
