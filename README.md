# 🚌 Transport Scolaire - Système de Gestion et Tracking GPS

Système complet de gestion de transport scolaire avec tracking GPS en temps réel, notifications push et applications multi-plateformes.

## 📋 Table des Matières

- [Architecture](#architecture)
- [Technologies](#technologies)
- [Installation](#installation)
- [Développement](#développement)
- [Déploiement](#déploiement)
- [Structure du Projet](#structure-du-projet)
- [API Documentation](#api-documentation)

## 🏗️ Architecture

```
PROJET_BUS100/
├── backend/              → Firebase Functions (Node.js + TypeScript)
├── web-admin/           → Interface Web Admin (React + Vite + TypeScript)
├── mobile-parent/       → App Mobile Parents (Flutter)
├── mobile-driver/       → App Mobile Chauffeurs (Flutter)
├── docs/                → Documentation technique
└── .github/workflows/   → CI/CD GitHub Actions
```

### Stack Technique

**Backend:**
- Firebase Functions (Gen 2)
- Node.js 22 + TypeScript 5.7
- Express.js + Zod validation
- Jest (tests)
- Region: `europe-west4` (RGPD)

**Web Admin:**
- React 18 + TypeScript
- Vite (build tool)
- Mapbox GL (cartes)
- TanStack Query (state management)

**Mobile:**
- Flutter 3.24+
- Firebase SDK
- Google Maps Flutter
- Provider (state management)

**Cloud:**
- Firestore (europe-west4)
- Firebase Authentication
- Firebase Cloud Messaging
- Firebase Hosting
- Firebase Storage

## 🚀 Installation

### Prérequis

```bash
# macOS
brew install node firebase-cli flutter

# Vérifier versions
node --version  # >= 22
firebase --version
flutter --version  # >= 3.24
```

### Setup Initial

```bash
# 1. Cloner le projet
git clone <repo-url>
cd PROJET_BUS100

# 2. Installer dépendances backend
cd backend
npm install
npm run build

# 3. Installer dépendances web-admin
cd ../web-admin
npm install

# 4. Installer dépendances Flutter
cd ../mobile-parent
flutter pub get

cd ../mobile-driver
flutter pub get
```

### Configuration Firebase

```bash
# Login Firebase
firebase login

# Vérifier projet
firebase projects:list

# Initialiser (si nécessaire)
firebase use projet-bus-60a3f
```

### Variables d'Environnement

```bash
# backend/.env (local uniquement)
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
NODE_ENV=development

# web-admin/.env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_MAPBOX_TOKEN=your_mapbox_token
```

## 💻 Développement

### Backend (Functions)

```bash
cd backend

# Développement avec émulateurs
npm run serve

# Tests
npm test                  # Tous les tests
npm run test:watch        # Mode watch
npm run test:unit         # Tests unitaires uniquement

# Lint
npm run lint
npm run lint:fix

# Build
npm run build
npm run build:watch       # Auto-rebuild
```

**Endpoints API disponibles:**

- `GET /health` - Health check
- `POST /api/gps/update` - Mise à jour position GPS
- `GET /api/gps/live` - Toutes les positions live
- `GET /api/gps/live/:busId` - Position d'un bus
- `GET /api/gps/history/:busId` - Historique GPS
- `POST /api/gps/calculate-eta` - Calcul ETA

### Web Admin

```bash
cd web-admin

# Serveur de développement
npm run dev  # http://localhost:5173

# Build production
npm run build

# Preview build
npm run preview

# Lint
npm run lint
```

### Mobile (Flutter)

```bash
cd mobile-parent  # ou mobile-driver

# Run sur émulateur/device
flutter run

# Build APK debug
flutter build apk --debug

# Build APK release
flutter build apk --release

# Tests
flutter test
```

## 📦 Déploiement

### Backend (Firebase Functions)

```bash
cd backend

# Déployer toutes les functions
npm run deploy

# Ou via Firebase CLI
firebase deploy --only functions
```

### Web Admin (Firebase Hosting)

```bash
cd web-admin

# Build
npm run build

# Déployer
firebase deploy --only hosting
```

### Mobile

```bash
# Android
cd mobile-parent
flutter build apk --release

# iOS (macOS uniquement)
flutter build ios --release
```

## 📁 Structure du Projet

### Backend

```
backend/
├── src/
│   ├── config/          → Configuration Firebase
│   ├── types/           → Types TypeScript
│   ├── services/        → Logique métier
│   ├── controllers/     → Controllers HTTP
│   ├── routes/          → Définition routes
│   ├── utils/           → Utilitaires
│   └── index.ts         → Point d'entrée
├── tests/
│   ├── unit/            → Tests unitaires
│   └── integration/     → Tests d'intégration
└── package.json
```

### Règles de Développement Backend

1. **Pas de logique métier dans les controllers**
   - Controllers: validation + orchestration
   - Services: toute la logique métier

2. **Validation stricte avec Zod**
   - Tous les inputs API doivent être validés
   - Schémas dans `utils/validation.schemas.ts`

3. **Tests obligatoires**
   - Coverage minimum: 70%
   - Tests unitaires pour tous les services
   - Tests d'intégration pour les endpoints

4. **TypeScript strict mode**
   - Pas de `any` sauf justification
   - Typage explicite des fonctions

### Firestore Collections

```
/buses              → Bus de l'école
/students           → Élèves
/users              → Utilisateurs (admin, driver, parent)
/gps_live           → Positions GPS temps réel
/gps_history        → Historique GPS
/notifications      → Notifications push
/routes             → Parcours
/attendance         → Présences
/fcm_tokens         → Tokens FCM
```

### Sécurité Firestore

**Règles RBAC (Role-Based Access Control):**

- **Admin**: Accès complet lecture/écriture
- **Chauffeur**: Lecture son bus + Écriture GPS position
- **Parent**: Lecture bus + élèves assignés

Voir `firestore.rules` pour détails complets.

## 🧪 Tests

### Backend

```bash
cd backend
npm test                    # Tous les tests + coverage
npm run test:unit          # Tests unitaires
npm run test:integration   # Tests d'intégration
npm run test:watch         # Mode watch
```

**Coverage requis:** 70% minimum (branches, functions, lines, statements)

### Exemples de Tests

```typescript
// tests/unit/gps.service.test.ts
describe('GPSService', () => {
  it('should calculate distance correctly', () => {
    const distance = gpsService.calculateDistance(
      48.8566, 2.3522,  // Paris
      45.7640, 4.8357   // Lyon
    );
    expect(distance).toBeGreaterThan(390);
  });
});
```

## 🔄 CI/CD

### GitHub Actions Workflows

4 workflows séparés (voir `.github/workflows/`):

1. **backend.yml** - Backend Functions
   - Lint → Test → Deploy Functions

2. **web-admin.yml** - Web Admin
   - Lint → Build → Deploy Hosting

3. **mobile-parent.yml** - App Parents
   - Lint → Build APK debug

4. **mobile-driver.yml** - App Chauffeurs
   - Lint → Build APK debug

### Secrets GitHub Requis

```
FIREBASE_SERVICE_ACCOUNT_PROJET_BUS_60A3F
MAPBOX_TOKEN (pour web-admin)
```

## 📚 API Documentation

### POST /api/gps/update

Mettre à jour la position GPS d'un bus.

**Body:**
```json
{
  "busId": "string",
  "lat": number,
  "lng": number,
  "speed": number,
  "heading": number (optionnel),
  "accuracy": number (optionnel),
  "timestamp": number
}
```

**Response 200:**
```json
{
  "success": true,
  "message": "Position GPS mise à jour",
  "data": { /* GPSLiveData */ }
}
```

### GET /api/gps/live

Récupérer toutes les positions GPS en temps réel.

**Response 200:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "busId": "bus123",
      "position": { "lat": 48.8566, "lng": 2.3522, "speed": 50 },
      "status": "en_route",
      "lastUpdate": "2025-11-13T20:00:00Z"
    }
  ]
}
```

## 📖 Documentation Additionnelle

- [CLAUDE.md](./CLAUDE.md) - Guide pour Claude Code
- [docs/SETUP.md](./docs/SETUP.md) - Guide setup détaillé
- [Firestore Rules](./firestore.rules) - Règles de sécurité

## 🤝 Contribution

1. Créer une branche: `git checkout -b feature/ma-feature`
2. Commit: `git commit -m "Add: ma feature"`
3. Push: `git push origin feature/ma-feature`
4. Créer une Pull Request

### Standards de Code

- Suivre les règles ESLint
- Tests obligatoires (coverage >= 70%)
- TypeScript strict mode
- Commits descriptifs

## 📝 License

Propriétaire - Tous droits réservés

## 👥 Support

Pour toute question: contact@transport-scolaire.com
