# 🚌 Bus Tracking System

> Système de suivi GPS temps réel pour flottes de transport scolaire
> Solution complète pour aider les écoles et parents à localiser les bus en temps réel

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB)](https://reactjs.org/)
[![Flutter](https://img.shields.io/badge/Flutter-3.10+-02569B)](https://flutter.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-10.7-FFCA28)](https://firebase.google.com/)

**Projet personnel** - Application multi-plateforme de tracking GPS

---

## 📖 Contexte

Ce projet vise à résoudre un problème concret dans le transport scolaire :
- **Parents** : manquent de visibilité sur l'emplacement du bus
- **Écoles** : ont peu de contrôle centralisé sur leur flotte
- **Conducteurs** : manquent d'outils pour signaler leur position et communiquer

La solution proposée est un système complet permettant le suivi GPS en temps réel, la visualisation sur carte, et les notifications automatiques.

---

## ✨ Fonctionnalités

- 📍 **Tracking GPS temps réel** avec Firestore (latence < 5 secondes)
- 🗺️ **Visualisation sur carte** (Mapbox pour web, Google Maps pour mobile)
- 🔔 **Notifications push** via Firebase Cloud Messaging
- 📊 **Dashboard administrateur** avec statistiques en temps réel
- 👨‍👩‍👧‍👦 **Interface parent** pour suivre les trajets de leurs enfants
- 🧪 **Tests automatisés** (11k+ lignes de tests, coverage 100% backend)
- 🚀 **CI/CD automatisé** avec GitHub Actions
- 🔐 **Validation stricte** des inputs avec Zod

---

## 📸 Screenshots

### Dashboard Web Admin
![Dashboard](docs/screenshots/dashboard.png)
*Vue d'ensemble avec statistiques en temps réel*

### Application Mobile Parents
<p>
  <img src="docs/screenshots/mobile-home.png" alt="Mobile Home" width="250"/>
  <img src="docs/screenshots/mobile-map.png" alt="Mobile Map" width="250"/>
</p>

*Interface parent pour suivre le bus (écran d'accueil et carte temps réel)*

---

## 🛠️ Stack Technique

### Backend
- **Runtime:** Node.js 22 + TypeScript 5.7
- **Framework:** Express.js + Firebase Cloud Functions
- **Database:** Cloud Firestore (europe-west4, RGPD compliant)
- **Validation:** Zod schemas pour tous les inputs
- **Tests:** Jest avec 100% coverage requirement

### Web Admin
- **Framework:** React 18 + TypeScript 5.3
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS 3.4
- **Maps:** Mapbox GL JS 3.1
- **Routing:** React Router v7
- **State:** React Query (TanStack) + Context API
- **Tests:** Vitest + React Testing Library

### Mobile (Parents)
- **Framework:** Flutter 3.10+
- **Language:** Dart
- **State Management:** Provider 6.1
- **Maps:** Google Maps Flutter
- **Firebase:** Auth + Firestore + Cloud Messaging

### DevOps
- **CI/CD:** GitHub Actions (lint, test, deploy)
- **Hosting:** Firebase Hosting
- **Functions:** Firebase Cloud Functions (Node.js 22)
- **Coverage:** Codecov integration

---

## 🏗️ Architecture

```
PROJET_BUS100/
├── backend/           # Firebase Cloud Functions + Express API
│   ├── src/
│   │   ├── controllers/    # Thin request handlers
│   │   ├── services/       # Business logic (thick services)
│   │   ├── routes/         # Express route definitions
│   │   ├── triggers/       # Firestore/Auth event triggers
│   │   ├── types/          # Centralized TypeScript types
│   │   └── config/         # Firebase Admin SDK config
│   └── tests/
│       ├── unit/           # Service unit tests
│       └── integration/    # Full endpoint integration tests
│
├── web-admin/         # React Admin Dashboard
│   ├── src/
│   │   ├── components/     # Reusable React components
│   │   ├── pages/          # Route/page components
│   │   ├── services/       # API clients & Firebase services
│   │   └── hooks/          # Custom React hooks
│   └── tests/             # Vitest component tests
│
└── mobile-parent/parent_app/   # Flutter Parent App
    ├── lib/
    │   ├── screens/        # Full-page widgets
    │   ├── services/       # Business logic & API clients
    │   ├── providers/      # State management
    │   └── models/         # Data models
    └── test/              # Flutter widget tests
```

**Architecture Pattern:** Vertical Slice Development
Chaque fonctionnalité est développée de bout en bout (database → backend → tests → frontend) avant de passer à la suivante.

---

## 🚀 Installation

### Prérequis
- Node.js 22+
- Flutter 3.10+
- Firebase CLI
- Compte Firebase (plan Blaze recommandé)
- Compte Mapbox (token gratuit)

### 1. Cloner le repository

```bash
git clone https://github.com/votre-username/projet-bus.git
cd projet-bus
```

### 2. Configurer Firebase

```bash
# Installer Firebase CLI si nécessaire
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Sélectionner votre projet Firebase
firebase use --add
```

### 3. Configuration Backend

```bash
cd backend
npm install

# Copier et configurer les variables d'environnement (si nécessaire)
# cp .env.example .env

# Compiler TypeScript
npm run build

# Lancer les émulateurs Firebase en local
firebase emulators:start
```

### 4. Configuration Web Admin

```bash
cd web-admin
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Éditer .env et ajouter vos clés Firebase et Mapbox
```

**Contenu de `.env` à compléter :**
```bash
VITE_FIREBASE_API_KEY=votre_cle_api
VITE_FIREBASE_PROJECT_ID=votre_projet_id
VITE_MAPBOX_ACCESS_TOKEN=votre_token_mapbox
# ... (voir .env.example pour la liste complète)
```

```bash
# Démarrer le serveur de développement
npm run dev
```

L'application sera accessible sur `http://localhost:5173`

### 5. Configuration Mobile

```bash
cd mobile-parent/parent_app
flutter pub get

# Configurer Firebase pour mobile:
# - Télécharger google-services.json (Android) depuis Firebase Console
# - Télécharger GoogleService-Info.plist (iOS) depuis Firebase Console
# - Placer les fichiers aux emplacements appropriés

# Lancer l'app
flutter run
```

### Développement local avec émulateurs Firebase

```bash
# À la racine du projet
firebase emulators:start

# Dans un autre terminal
cd web-admin && npm run dev
```

Les émulateurs incluent : Functions, Firestore, Authentication

---

## 🎯 Statut du Projet

**Projet personnel - Prototype fonctionnel**

### Fonctionnalités implémentées ✅
- ✅ Tracking GPS en temps réel avec Firestore
- ✅ Dashboard administrateur avec carte interactive (Mapbox)
- ✅ Application mobile pour parents (Flutter)
- ✅ Système de notifications push (Firebase Cloud Messaging)
- ✅ API REST sécurisée avec validation (Zod)
- ✅ Tests automatisés (Jest + Vitest)
- ✅ Historique des trajets (archivage quotidien)
- ✅ Calcul d'ETA (temps d'arrivée estimé)
- ✅ Application mobile conducteur (UI mockups ready)


### Fonctionnalités en développement 🔄
- 🔄 Import CSV en masse pour gestion de données
- 🔄 Comptage automatique de passagers
- 🔄 Calcul automatique de zones géographiques
- 🔄 Optimisation des itinéraires

### Note de sécurité ⚠️
Ce projet utilise actuellement des **règles Firestore en mode développement** pour faciliter les tests.

**Pour un déploiement en production réel**, des règles de sécurité strictes basées sur les rôles doivent être implémentées (voir `CLAUDE.md` pour les spécifications détaillées et `SECURITY.md` pour la checklist).

### Objectif 🎓
Projet personnel démontrant la capacité à développer une solution complète multi-plateforme avec:
- ✅ **Backend cloud-native** (Node.js + TypeScript + Firebase)
- ✅ **Frontend web moderne** (React + Vite + Tailwind)
- ✅ **Application mobile cross-platform** (Flutter)
- ✅ **Infrastructure cloud** (Firebase Functions, Firestore, Hosting)
- ✅ **Pratiques DevOps** (CI/CD, tests automatisés, coverage)
- ✅ **Documentation technique** professionnelle

---

## 🧪 Tests

### Backend (Jest)

```bash
cd backend

# Lancer tous les tests avec coverage
npm test

# Tests unitaires uniquement
npm run test:unit

# Tests d'intégration uniquement
npm run test:integration

# Mode watch (développement)
npm run test:watch
```

**Coverage requirement:** 100% (branches, functions, lines, statements)

### Web Admin (Vitest)

```bash
cd web-admin

# Lancer les tests
npm test

# Tests avec UI visuelle
npm run test:ui

# Coverage
npm run test:coverage
```

### Mobile (Flutter)

```bash
cd mobile-parent/parent_app

# Tests unitaires et widgets
flutter test

# Coverage
flutter test --coverage
```

---

## 📦 Déploiement

### Backend (Cloud Functions)

```bash
cd backend
npm run build
firebase deploy --only functions
```

### Web Admin (Firebase Hosting)

```bash
cd web-admin
npm run build
firebase deploy --only hosting
```

### Mobile

```bash
cd mobile-parent/parent_app

# Android APK
flutter build apk

# iOS
flutter build ios
```

---

## 📝 Documentation

- **[CLAUDE.md](CLAUDE.md)** - Documentation technique complète pour développeurs et IA assistants
- **[SECURITY.md](SECURITY.md)** - Politique de sécurité et vulnérabilités connues
- **[CONTRIBUTING.md](CONTRIBUTING.md)** - Guide de contribution
- **[backend/README.md](backend/README.md)** - Documentation spécifique au backend
- **[web-admin/README.md](web-admin/README.md)** - Documentation spécifique au web admin

---

## 🤝 Contribution

Les contributions sont les bienvenues ! Voir [CONTRIBUTING.md](CONTRIBUTING.md) pour les guidelines.

### Standards de code
- TypeScript strict mode activé
- Tests obligatoires pour nouvelles fonctionnalités
- Commits sémantiques (feat:, fix:, docs:, refactor:, etc.)
- Lint doit passer (`npm run lint`)
- Tests doivent passer (`npm test`)

---

## 📄 License

Ce projet est sous licence MIT. Voir le fichier [LICENSE](LICENSE) pour plus de détails.

---

## 🙏 Remerciements

- **Firebase** pour l'infrastructure backend et hébergement
- **Mapbox** pour la cartographie web
- **Google Maps** pour la cartographie mobile
- **React**, **Flutter**, et la communauté open-source

---

## 📧 Contact

Pour toute question ou suggestion, n'hésitez pas à ouvrir une issue sur GitHub.

---

**Note:** Ce projet est développé à des fins éducatives et de portfolio. Il démontre des compétences en développement fullstack, architecture cloud, et pratiques DevOps modernes.
