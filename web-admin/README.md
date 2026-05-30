# 🚌 Transport Scolaire - Dashboard Web Admin

Dashboard web d'administration pour la gestion et le suivi en temps réel des bus scolaires.

## 🎯 Fonctionnalités

- ✅ **Authentification** sécurisée via Firebase Auth
- 📊 **Dashboard** avec statistiques en temps réel
- 🗺️ **Carte interactive** avec suivi GPS des bus (Mapbox)
- 🚌 **Gestion des bus** avec états et alertes
- 👨‍🎓 **Suivi des élèves** et occupations
- 🔔 **Notifications** temps réel
- 📱 **Interface responsive** et moderne

## 🛠️ Stack Technique

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Carte**: Mapbox GL JS 3.x
- **Backend**: Firebase (Auth + Firestore)
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **State Management**: TanStack Query (React Query)
- **Tests**: Vitest + Testing Library

## 📋 Prérequis

- Node.js >= 18.x
- npm ou yarn
- Compte Firebase
- Token Mapbox

## 🚀 Installation

### 1. Cloner le projet

```bash
cd web-admin
```

### 2. Installer les dépendances

```bash
npm install
```

### 3. Configuration des variables d'environnement

```bash
cp .env.example .env
```

Le dashboard fonctionne selon **deux modes**, déterminés par votre `.env` :

#### 🟢 Mode démo (par défaut — aucun backend requis)

Des bus simulés roulent vers l'école en temps réel. **Seul Mapbox est nécessaire** :

```env
VITE_DEMO_MODE=true
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
```

> Le mode démo s'active aussi **automatiquement** dès que la configuration Firebase
> est incomplète. Vous êtes connecté automatiquement (pas d'écran de login).

#### 🔵 Mode réel (données live Firestore)

Renseignez l'intégralité de la configuration Firebase (et laissez `VITE_DEMO_MODE` vide) :

```env
VITE_MAPBOX_ACCESS_TOKEN=your_mapbox_token_here
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_BASE_URL=http://localhost:5001/<project-id>/europe-west4
```

### 4. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

## 🧪 Tests

### Lancer tous les tests

```bash
npm test
```

### Lancer les tests avec interface UI

```bash
npm run test:ui
```

### Générer le rapport de couverture

```bash
npm run test:coverage
```

**Objectif de couverture**: 80% minimum

## 🏗️ Build pour production

```bash
npm run build
```

Les fichiers de production seront dans le dossier `dist/`

### Prévisualiser le build

```bash
npm run preview
```

## 📁 Structure du projet

```
web-admin/
├── src/
│   ├── demo/                     # 🟢 MODE DÉMO (simulation autonome, sans backend)
│   │   ├── config.ts             #   Détection du mode démo (IS_DEMO)
│   │   ├── seed.ts               #   École, bus, chauffeurs et élèves simulés
│   │   ├── simulation.ts         #   Moteur : déplacement des bus, scans, alertes
│   │   └── index.ts
│   ├── pages/
│   │   ├── GodViewPage.tsx       # 🗺️  Carte « tour de contrôle » (cœur de l'app)
│   │   ├── LoginPage.tsx
│   │   ├── CourseHistoryPage.tsx #   Historique des courses
│   │   └── CSVImportPage.tsx     #   Import CSV en masse
│   ├── components/
│   │   ├── godview/              #   Marqueurs et popups de la carte
│   │   ├── AlertsSidebar.tsx     #   Panneau latéral d'alertes
│   │   ├── Layout.tsx · Header.tsx · Sidebar.tsx · ...
│   ├── hooks/                    # useSchool, useRealtimeBuses, useRealtimeAlerts, ...
│   ├── services/                 # Firestore + API (firebase.ts, *.firestore.ts, *.api.ts)
│   ├── contexts/                 # AuthContext, SidebarContext
│   ├── types/                    # realtime.ts, school.ts, alerts.ts, auth.ts, bus.ts
│   ├── utils/                    # gpsKalmanFilter.ts (lissage des positions GPS)
│   ├── styles/godview.css
│   ├── tests/                    # Tests Vitest (composants, hooks, services, pages)
│   ├── App.tsx · main.tsx · index.css
├── public/
├── .env.example
└── vite.config.ts · tsconfig.json · tailwind.config.js · postcss.config.js
```

## 🎨 Architecture & Bonnes Pratiques

### Principes suivis

1. **TypeScript strict** - Pas de `any`
2. **Separation of Concerns** - Logique métier séparée des composants
3. **Custom Hooks** - Réutilisabilité du code
4. **Error Boundaries** - Gestion des erreurs
5. **Loading States** - UX optimale
6. **Responsive Design** - Mobile-first approach

### Conventions de code

- **Composants**: PascalCase (`BusMarker.tsx`)
- **Hooks**: camelCase avec préfixe `use` (`useAuth.ts`)
- **Services**: camelCase avec suffix `.service` (`auth.service.ts`)
- **Types**: PascalCase (`BusStatus`, `GPSPosition`)

## 🔥 Firebase Setup

### 1. Créer un projet Firebase

1. Aller sur [Firebase Console](https://console.firebase.google.com)
2. Créer un nouveau projet
3. Activer Authentication (Email/Password)
4. Créer une base Firestore
5. Récupérer les credentials dans Project Settings

### 2. Structure Firestore

```
/gps_live/{busId}
  - position: {lat, lng, speed, timestamp, heading}
  - busNumber: string
  - driverName: string
  - status: string
  - studentsOnBoard: number
  - lastUpdate: timestamp

/users/{userId}
  - email: string
  - displayName: string
  - role: string

/buses/{busId}
  - busNumber: string
  - plateNumber: string
  - capacity: number
  - driverId: string
```

### 3. Règles de sécurité Firestore

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // GPS Live - lecture pour tous les utilisateurs authentifiés
    match /gps_live/{busId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role == 'DRIVER';
    }
    
    // Buses
    match /buses/{busId} {
      allow read: if request.auth != null;
      allow write: if request.auth.token.role in ['ADMIN', 'DAF'];
    }
  }
}
```

## 🗺️ Mapbox Setup

1. Créer un compte sur [Mapbox](https://www.mapbox.com)
2. Générer un token d'accès
3. Ajouter le token dans `.env` : `VITE_MAPBOX_ACCESS_TOKEN`

## 🔍 Lint & Formatage

### Lancer ESLint

```bash
npm run lint
```

### Corriger automatiquement

```bash
npm run lint:fix
```

## 🐛 Debugging

### Mode développement avec émulateurs Firebase

L'application se connecte automatiquement aux émulateurs Firebase en mode dev :

- Auth Emulator: `http://localhost:9099`
- Firestore Emulator: `http://localhost:8080`

### React Query DevTools

En mode développement, les DevTools sont accessibles en bas à gauche de l'écran.

## 📝 Scripts disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Build pour production |
| `npm run preview` | Prévisualise le build de production |
| `npm run lint` | Vérifie le code avec ESLint |
| `npm run lint:fix` | Corrige automatiquement les erreurs |
| `npm test` | Lance les tests |
| `npm run test:ui` | Lance les tests avec interface UI |
| `npm run test:coverage` | Génère le rapport de couverture |

## 🚀 Déploiement

### Firebase Hosting

```bash
# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Autres plateformes

Le projet est compatible avec :
- Vercel
- Netlify
- AWS Amplify
- GitHub Pages

## 🤝 Contribution

1. Créer une branche feature : `git checkout -b feature/ma-feature`
2. Commit : `git commit -m 'Ajout de ma feature'`
3. Push : `git push origin feature/ma-feature`
4. Créer une Pull Request

## 📄 Licence

© 2024 Transport Scolaire. Tous droits réservés.

## 🆘 Support

Pour toute question ou problème :
- 📧 Email: support@transport-scolaire.fr
- 📚 Documentation: [docs.transport-scolaire.fr]
- 🐛 Issues: [GitHub Issues]

---

**Développé avec ❤️ pour la sécurité et le confort des élèves**

