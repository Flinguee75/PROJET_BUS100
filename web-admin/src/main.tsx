/**
 * Point d'entrée principal de l'application
 */

import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Vérifier que les variables d'environnement nécessaires sont définies
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_PROJECT_ID',
];

const missingEnvVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingEnvVars.length > 0) {
  console.warn(
    `⚠️ Variables d'environnement manquantes: ${missingEnvVars.join(', ')}`
  );
  console.warn('📝 Créez un fichier .env basé sur .env.example');
}

// Charger l'application
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ Element #root non trouvé dans le DOM');
} else {
  // Ne pas utiliser StrictMode pour éviter les doubles rendus en développement
  // qui causent des problèmes avec les navigateurs et ProtectedRoute
  ReactDOM.createRoot(rootElement).render(
    <App />
  );
}
