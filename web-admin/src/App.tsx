/**
 * Composant App - Point d'entrée de l'application
 * Configure le routing et les providers (React Router v7)
 */

import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation
} from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuthContext } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Layout } from '@/components/Layout';
import { FirebaseConfigError } from '@/components/FirebaseConfigError';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { LoginPage } from '@/pages/LoginPage';
import { GodViewPage } from '@/pages/GodViewPage';
import { CSVImportPage } from '@/pages/CSVImportPage';
import { LoadingSpinner } from '@/components/LoadingSpinner';

// Configuration du client React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
  },
});

// Composant pour gérer la redirection après login
function LoginRoute() {
  const { user } = useAuthContext();
  return user ? <Navigate to="/dashboard" replace /> : <LoginPage />;
}

// Composant wrapper pour les routes protégées
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const location = useLocation();
  return user ? <>{children}</> : <Navigate to="/login" state={{ from: location }} replace />;
}

// Composant Routes - séparé pour isolation
function AppRoutes() {
  return (
    <Routes>
      {/* Route publique */}
      <Route path="/login" element={<LoginRoute />} />

      {/* Routes protégées */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <SidebarProvider>
              <Layout />
            </SidebarProvider>
          </ProtectedRoute>
        }
        >
          <Route index element={<Navigate to="/map" replace />} />
          <Route path="map" element={<GodViewPage />} />
          <Route path="import" element={<CSVImportPage />} />
        </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/map" replace />} />
    </Routes>
  );
}

// Wrapper qui gère le loading initial - JAMAIS de démontage
function AppContent() {
  const { loading } = useAuthContext();

  // Structure stable : Routes toujours montées + overlay de loading
  return (
    <div className="relative min-h-screen">
      {/* Overlay de loading - affiché par-dessus sans démonter les Routes */}
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-50">
          <LoadingSpinner message="Initialisation..." />
        </div>
      )}

      {/* Routes toujours montées - jamais démontées */}
      <div className={loading ? 'invisible' : 'visible'}>
        <AppRoutes />
      </div>
    </div>
  );
}

function App() {
  // Vérifier si Firebase est configuré
  const hasConfig = import.meta.env.VITE_FIREBASE_API_KEY &&
                   import.meta.env.VITE_FIREBASE_PROJECT_ID;

  if (!hasConfig) {
    return <FirebaseConfigError />;
  }

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
