/**
 * Composant d'erreur de configuration Firebase
 * Affiche un message clair si Firebase n'est pas configuré
 */

export const FirebaseConfigError = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configuration Firebase Manquante
          </h1>
          <p className="text-gray-600">
            Le fichier de configuration Firebase n'est pas trouvé ou incomplet.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <h2 className="font-bold text-yellow-900 mb-3">📝 Étapes pour résoudre :</h2>
          <ol className="list-decimal list-inside space-y-2 text-yellow-800">
            <li>Créez un fichier <code className="bg-yellow-100 px-2 py-1 rounded">.env</code> à la racine du dossier <code className="bg-yellow-100 px-2 py-1 rounded">web-admin</code></li>
            <li>Copiez le contenu de <code className="bg-yellow-100 px-2 py-1 rounded">.env.example</code> vers <code className="bg-yellow-100 px-2 py-1 rounded">.env</code></li>
            <li>Remplissez les variables avec vos credentials Firebase</li>
            <li>Redémarrez le serveur de développement</li>
          </ol>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-2">🔑 Variables requises :</h3>
          <div className="space-y-1 text-sm font-mono text-gray-700">
            <div>VITE_FIREBASE_API_KEY=...</div>
            <div>VITE_FIREBASE_AUTH_DOMAIN=...</div>
            <div>VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f</div>
            <div>VITE_FIREBASE_STORAGE_BUCKET=...</div>
            <div>VITE_FIREBASE_MESSAGING_SENDER_ID=...</div>
            <div>VITE_FIREBASE_APP_ID=...</div>
            <div>VITE_MAPBOX_ACCESS_TOKEN=...</div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-blue-900 mb-2">📚 Où trouver ces informations ?</h3>
          <p className="text-blue-800 text-sm mb-2">
            1. Allez sur{' '}
            <a 
              href="https://console.firebase.google.com/project/projet-bus-60a3f/settings/general" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 underline hover:text-blue-800"
            >
              Firebase Console
            </a>
          </p>
          <p className="text-blue-800 text-sm mb-2">
            2. Project Settings → Vos applications → Web app
          </p>
          <p className="text-blue-800 text-sm">
            3. Copiez les valeurs de <code className="bg-blue-100 px-1 rounded">firebaseConfig</code>
          </p>
        </div>

        <div className="mt-6 text-center">
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            🔄 Recharger la page
          </button>
        </div>
      </div>
    </div>
  );
};

