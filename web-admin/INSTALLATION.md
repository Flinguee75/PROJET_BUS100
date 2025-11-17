# 📦 Guide d'Installation - Dashboard Web Admin

Guide complet pour installer et configurer le dashboard d'administration.

## ⚡ Installation Rapide

```bash
# 1. Naviguer dans le dossier
cd web-admin

# 2. Installer les dépendances
npm install

# 3. Copier le fichier d'environnement
cp .env.example .env

# 4. Éditer le fichier .env avec vos credentials

# 5. Lancer le serveur de développement
npm run dev
```

## 📋 Installation Détaillée

### Étape 1 : Prérequis

Vérifier que vous avez les bonnes versions :

```bash
node --version  # Doit être >= 18.x
npm --version   # Doit être >= 9.x
```

Si vous n'avez pas Node.js, téléchargez-le depuis [nodejs.org](https://nodejs.org)

### Étape 2 : Installation des dépendances

```bash
npm install
```

Cela installera :
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Mapbox GL JS
- Firebase SDK
- TanStack Query
- Et toutes les dépendances nécessaires

### Étape 3 : Configuration Firebase

#### 3.1. Créer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Cliquer sur "Ajouter un projet"
3. Suivre les étapes de création

#### 3.2. Activer Authentication

1. Dans Firebase Console, aller dans **Authentication**
2. Cliquer sur "Commencer"
3. Activer le fournisseur **Email/Password**

#### 3.3. Créer une base Firestore

1. Dans Firebase Console, aller dans **Firestore Database**
2. Cliquer sur "Créer une base de données"
3. Choisir "Mode test" pour commencer (à sécuriser en production)
4. Sélectionner la région **europe-west4**

#### 3.4. Récupérer les credentials

1. Aller dans **Project Settings** (icône engrenage)
2. Scroller jusqu'à "Vos applications"
3. Cliquer sur l'icône Web `</>`
4. Enregistrer l'app (nom: "web-admin")
5. Copier les valeurs de `firebaseConfig`

### Étape 4 : Configuration Mapbox

#### 4.1. Créer un compte Mapbox

1. Aller sur [Mapbox](https://www.mapbox.com)
2. Créer un compte gratuit

#### 4.2. Générer un token

1. Aller dans **Account** → **Access Tokens**
2. Copier le "Default public token" ou créer un nouveau token
3. Scopes nécessaires : `styles:read`, `fonts:read`

### Étape 5 : Configuration du fichier .env

Créer un fichier `.env` à la racine de `web-admin/` :

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=votre-projet.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=votre-projet
VITE_FIREBASE_STORAGE_BUCKET=votre-projet.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Mapbox Configuration
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1IjoieW91ciIsImEiOiJjbHXXXXXXXXXXXXX

# API Configuration (Backend local)
VITE_API_BASE_URL=http://localhost:3000
```

### Étape 6 : Initialiser les données Firestore

Créer les collections suivantes dans Firestore :

#### Collection `gps_live`

Document exemple (`bus-001`) :

```json
{
  "busNumber": "101",
  "plateNumber": "AB-123-CD",
  "capacity": 50,
  "driverId": "driver-001",
  "driverName": "Jean Dupont",
  "status": "EN_ROUTE",
  "position": {
    "lat": 47.2184,
    "lng": -1.5536,
    "speed": 45.5,
    "timestamp": 1704110400000,
    "heading": 180
  },
  "lastUpdate": 1704110400000,
  "routeId": "route-001",
  "studentsOnBoard": 25
}
```

#### Collection `users`

Document exemple (votre UID utilisateur) :

```json
{
  "email": "admin@transport-scolaire.fr",
  "displayName": "Admin Principal",
  "role": "ADMIN"
}
```

### Étape 7 : Lancer l'application

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### Étape 8 : Créer un compte utilisateur

1. Ouvrir `http://localhost:5173/login`
2. Dans Firebase Console → Authentication → Users
3. Cliquer sur "Add User"
4. Email: `admin@transport-scolaire.fr`
5. Password: `Admin123!`
6. Créer l'utilisateur
7. Copier l'UID généré
8. Dans Firestore, créer un document dans `users` avec cet UID

### Étape 9 : Tester l'application

#### 9.1. Test de connexion

1. Se connecter avec les identifiants créés
2. Vérifier la redirection vers `/dashboard`

#### 9.2. Test du Dashboard

- Vérifier l'affichage des statistiques
- Vérifier la présence du sidebar et header

#### 9.3. Test de la carte temps réel

1. Naviguer vers **Carte temps réel**
2. Vérifier que la carte Mapbox se charge
3. Vérifier l'affichage des marqueurs de bus

## 🔧 Configuration Avancée

### Utiliser les émulateurs Firebase (Recommandé pour dev)

```bash
# Installer les émulateurs
firebase init emulators

# Sélectionner: Authentication, Firestore

# Lancer les émulateurs
firebase emulators:start
```

L'application détectera automatiquement les émulateurs en mode dev.

### Configuration Tailwind personnalisée

Modifier `tailwind.config.js` pour personnaliser les couleurs, fonts, etc.

### Configuration TypeScript stricte

Le projet utilise `strict: true`. Pour modifier :

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,  // ou false
    "noImplicitAny": true
  }
}
```

## 🧪 Lancer les tests

```bash
# Tous les tests
npm test

# Avec couverture
npm run test:coverage

# Avec interface UI
npm run test:ui
```

## 🚀 Build pour production

```bash
# Build
npm run build

# Le résultat sera dans dist/

# Prévisualiser le build
npm run preview
```

## 🐛 Résolution de problèmes

### Erreur "Cannot find module"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Erreur Mapbox "Invalid token"

Vérifier que `VITE_MAPBOX_ACCESS_TOKEN` est bien défini dans `.env`

### Erreur Firebase "Permission denied"

Vérifier les règles Firestore et que l'utilisateur est bien authentifié.

### La carte ne s'affiche pas

1. Vérifier le token Mapbox
2. Vérifier que `mapbox-gl/dist/mapbox-gl.css` est bien importé
3. Ouvrir la console pour voir les erreurs

### Les données temps réel ne se mettent pas à jour

1. Vérifier que Firestore est configuré
2. Vérifier les règles de sécurité Firestore
3. Vérifier que des données existent dans `gps_live`

## 📞 Support

- Documentation: [README.md](./README.md)
- Issues: Créer une issue sur GitHub
- Email: support@transport-scolaire.fr

---

**Installation terminée ! 🎉**

Vous êtes maintenant prêt à développer sur le dashboard d'administration.

