# 🔧 Configuration - Résoudre le problème "Rien ne s'affiche"

## ❌ Problème

Si rien ne s'affiche quand vous lancez `npm run dev`, c'est probablement parce que :
1. Le fichier `.env` n'existe pas
2. Les variables d'environnement Firebase ne sont pas configurées

## ✅ Solution Rapide

### Étape 1 : Créer le fichier .env

Créez un fichier `.env` à la racine du dossier `web-admin/` :

```bash
cd web-admin
touch .env
```

### Étape 2 : Remplir le fichier .env

Ouvrez le fichier `.env` et ajoutez ce contenu :

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=votre_api_key_ici
VITE_FIREBASE_AUTH_DOMAIN=projet-bus-60a3f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_FIREBASE_STORAGE_BUCKET=projet-bus-60a3f.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id_ici
VITE_FIREBASE_APP_ID=votre_app_id_ici

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=votre_mapbox_token_ici

# API Configuration
VITE_API_BASE_URL=http://localhost:3000
```

### Étape 3 : Obtenir les credentials Firebase

1. **Aller sur Firebase Console** :
   - https://console.firebase.google.com/project/projet-bus-60a3f/settings/general

2. **Récupérer la configuration** :
   - Cliquez sur **Project Settings** (icône engrenage)
   - Allez dans **Vos applications** → **Web app**
   - Si vous n'avez pas encore créé d'app web, cliquez sur l'icône `</>` pour en créer une
   - Copiez les valeurs de `firebaseConfig` :
     ```javascript
     const firebaseConfig = {
       apiKey: "AIza...",           // → VITE_FIREBASE_API_KEY
       authDomain: "...",           // → VITE_FIREBASE_AUTH_DOMAIN
       projectId: "projet-bus-60a3f", // → VITE_FIREBASE_PROJECT_ID (déjà rempli)
       storageBucket: "...",        // → VITE_FIREBASE_STORAGE_BUCKET
       messagingSenderId: "...",    // → VITE_FIREBASE_MESSAGING_SENDER_ID
       appId: "1:..."               // → VITE_FIREBASE_APP_ID
     };
     ```

### Étape 4 : Obtenir le token Mapbox

1. **Créer un compte Mapbox** (gratuit) :
   - https://account.mapbox.com/auth/signup/

2. **Récupérer le token** :
   - Connectez-vous sur https://account.mapbox.com/
   - Allez dans **Access Tokens**
   - Copiez le **Default public token**
   - Collez-le dans `.env` comme `VITE_MAPBOX_ACCESS_TOKEN`

### Étape 5 : Redémarrer le serveur

```bash
# Arrêtez le serveur (Ctrl+C si en cours)
# Puis relancez :
npm run dev
```

## 🎯 Vérification

Une fois configuré, vous devriez voir :

1. **Page de connexion** sur `http://localhost:5173/login`
   - Si Firebase n'est pas configuré → Page d'erreur avec instructions
   - Si configuré → Formulaire de connexion

2. **Console du navigateur** :
   - ✅ `Firebase initialisé avec succès`

3. **Console terminal** :
   - Pas d'erreur rouge
   - Serveur accessible sur `localhost:5173`

## 🔍 Dépannage

### Erreur : "FIREBASE_NOT_CONFIGURED"

**Cause** : Le fichier `.env` n'existe pas ou est vide.

**Solution** : Créez le fichier `.env` avec les valeurs comme indiqué ci-dessus.

### Erreur : "Invalid API key"

**Cause** : La clé API Firebase est incorrecte.

**Solution** : Vérifiez que vous avez copié la bonne clé depuis Firebase Console.

### Rien ne s'affiche, écran blanc

**Cause** : Erreur JavaScript dans la console.

**Solution** :
1. Ouvrez la console du navigateur (F12)
2. Vérifiez les erreurs affichées
3. Si vous voyez une page avec instructions → Firebase n'est pas configuré
4. Si erreur JavaScript → Vérifiez les imports dans `main.tsx` et `App.tsx`

### Page d'erreur s'affiche avec instructions

C'est normal ! La page vous indique que Firebase n'est pas configuré.

**Solution** : Suivez les étapes 1-5 ci-dessus.

## 📝 Exemple de fichier .env complet

```env
# Firebase Configuration (Projet: projet-bus-60a3f)
VITE_FIREBASE_API_KEY=AIzaSyC_votre_cle_api_ici
VITE_FIREBASE_AUTH_DOMAIN=projet-bus-60a3f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_FIREBASE_STORAGE_BUCKET=projet-bus-60a3f.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ci11c2VybmFtZSIsImEiOiJjbHZyYW5kb20tdG9rZW4taGVyZSJ9.exemple

# API Configuration
VITE_API_BASE_URL=http://localhost:3000
```

## ⚠️ Important

- **Ne commitez JAMAIS** le fichier `.env` dans Git (il est déjà dans `.gitignore`)
- **Gardez vos tokens secrets** - ne les partagez pas publiquement
- **Un fichier `.env` par environnement** :
  - `.env` pour le développement local
  - `.env.production` pour la production (à configurer séparément)

## ✅ Une fois configuré

Après avoir configuré `.env` et redémarré le serveur, vous devriez voir :

1. ✅ La page de connexion
2. ✅ Possibilité de vous connecter (si vous avez créé un utilisateur dans Firebase)
3. ✅ Le dashboard après connexion

---

**Besoin d'aide ?** Consultez `README.md` ou `INSTALLATION.md` pour plus de détails.

