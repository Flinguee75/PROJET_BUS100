# 📘 Guide de Setup Complet - Transport Scolaire

Ce guide détaille étape par étape comment setup le projet depuis zéro.

## 🎯 Sommaire

1. [Prérequis](#prérequis)
2. [Installation Backend](#installation-backend)
3. [Installation Web Admin](#installation-web-admin)
4. [Installation Mobile](#installation-mobile)
5. [Configuration Firebase](#configuration-firebase)
6. [Premier Déploiement](#premier-déploiement)
7. [Troubleshooting](#troubleshooting)

## 🔧 Prérequis

### macOS

```bash
# Installer Homebrew (si pas déjà installé)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Installer Node.js 22
brew install node@22
brew link node@22

# Installer Firebase CLI
npm install -g firebase-tools

# Installer Flutter
brew install --cask flutter

# Vérifier installations
node --version      # doit afficher v22.x.x
npm --version
firebase --version
flutter --version   # doit afficher >= 3.24.0
```

### Vérifications Additionnelles

```bash
# Vérifier Flutter doctor
flutter doctor

# Si des erreurs, suivre les instructions
# Ex: installer Android Studio, Xcode (macOS), etc.

# Accepter licenses Android
flutter doctor --android-licenses
```

## 🔥 Installation Backend

### Étape 1: Setup Firebase

```bash
# Login Firebase
firebase login

# Vérifier le projet actif
firebase projects:list

# Activer le projet
firebase use projet-bus-60a3f

# Vérifier configuration
firebase projects:info
```

### Étape 2: Installer Dépendances

```bash
cd backend

# Installer packages
npm install

# Vérifier qu'il n'y a pas d'erreurs
npm list
```

### Étape 3: Configuration Environnement

Créer `.env` dans `backend/`:

```env
# backend/.env
GOOGLE_APPLICATION_CREDENTIALS=./service-account-key.json
NODE_ENV=development
```

**IMPORTANT:** Ne JAMAIS commit ce fichier !

### Étape 4: Service Account Key

1. Aller sur Firebase Console
2. Project Settings → Service Accounts
3. Generate New Private Key
4. Télécharger le JSON
5. Renommer en `service-account-key.json`
6. Placer dans `backend/`
7. Ajouter à `.gitignore`

### Étape 5: Build & Test

```bash
# Build TypeScript
npm run build

# Vérifier que /lib est créé
ls -la lib/

# Lancer tests
npm test

# Lint
npm run lint
```

### Étape 6: Test Émulateurs Locaux

```bash
# Lancer émulateurs Firebase
npm run serve

# Devrait afficher:
# ✔  functions: Loaded functions: api
# ✔  functions[us-central1-api]: http function initialized
```

Tester l'API:

```bash
# Health check
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/health

# Devrait retourner:
# {"status":"ok","service":"Transport Scolaire API",...}
```

## 🌐 Installation Web Admin

### Étape 1: Créer Structure

```bash
cd web-admin
mkdir -p src/{components,pages,services,hooks,types,config}
```

### Étape 2: Installer Dépendances

```bash
npm install
```

### Étape 3: Configuration Mapbox

1. Créer compte sur [mapbox.com](https://mapbox.com)
2. Obtenir Access Token (gratuit jusqu'à 50k vues/mois)
3. Créer `.env` dans `web-admin/`:

```env
# web-admin/.env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=projet-bus-60a3f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_FIREBASE_STORAGE_BUCKET=projet-bus-60a3f.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_MAPBOX_TOKEN=your_mapbox_token
```

**Trouver ces valeurs:**
- Firebase Console → Project Settings → General → Your apps
- Cliquer sur "Web app" et copier config

### Étape 4: Lancer Dev Server

```bash
npm run dev
```

Ouvrir http://localhost:5173

## 📱 Installation Mobile

### Mobile Parent

```bash
cd mobile-parent

# Créer projet Flutter
flutter create . --org com.transportsc olaire --platforms android,ios

# Installer dépendances
flutter pub get

# Configure Firebase
flutterfire configure --project=projet-bus-60a3f

# Suivre les instructions
# Choisir: Android, iOS (si macOS)
```

### Mobile Driver

```bash
cd mobile-driver

# Même processus
flutter create . --org com.transportscolaire --platforms android,ios
flutter pub get
flutterfire configure --project=projet-bus-60a3f
```

### Test Sur Émulateur

```bash
# Lister devices disponibles
flutter devices

# Lancer sur Android
flutter run -d android

# Lancer sur iOS (macOS uniquement)
flutter run -d ios
```

## 🚀 Configuration Firebase

### Firestore

```bash
# Déployer règles Firestore
firebase deploy --only firestore:rules

# Déployer indexes
firebase deploy --only firestore:indexes

# Vérifier dans Firebase Console
# Firestore Database → Rules
# Firestore Database → Indexes
```

### Storage

```bash
# Déployer règles Storage
firebase deploy --only storage
```

### Authentication

1. Firebase Console → Authentication
2. Sign-in method → Email/Password → Enable
3. (Optionnel) Ajouter autres providers (Google, Apple, etc.)

## 🎉 Premier Déploiement

### Backend (Functions)

```bash
cd backend

# Build
npm run build

# Deploy
firebase deploy --only functions

# Vérifier dans Firebase Console → Functions
# URL: https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api
```

### Web Admin (Hosting)

```bash
cd web-admin

# Build
npm run build

# Deploy
firebase deploy --only hosting

# URL: https://projet-bus-60a3f.web.app
```

## 🔍 Vérifications Post-Déploiement

### Backend

```bash
# Test API en production
curl https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api/health

# Devrait retourner 200 OK
```

### Firestore

```bash
# Tester connexion Firestore
firebase firestore:data

# Vérifier règles
firebase firestore:rules get
```

### Logs

```bash
# Voir logs Functions
firebase functions:log

# Filtrer par fonction
firebase functions:log --only api
```

## 🐛 Troubleshooting

### Erreur: "Firebase project not found"

```bash
# Re-login
firebase logout
firebase login

# Réassocier projet
firebase use --add
# Choisir: projet-bus-60a3f
# Alias: default
```

### Erreur: "Permission denied" sur Firestore

- Vérifier que les règles Firestore sont déployées
- Vérifier l'authentification de l'utilisateur
- Check Firebase Console → Firestore → Rules

### Erreur: Node version

```bash
# Si version incorrecte
nvm install 22
nvm use 22

# Ou avec brew
brew unlink node
brew link node@22
```

### Erreur: Flutter doctor

```bash
# Android SDK manquant
flutter doctor --android-licenses

# Xcode manquant (macOS)
xcode-select --install

# CocoaPods manquant (macOS)
sudo gem install cocoapods
```

### Erreur Build TypeScript

```bash
cd backend

# Nettoyer node_modules
rm -rf node_modules package-lock.json

# Réinstaller
npm install

# Rebuild
npm run build
```

### Tests échouent

```bash
# Vérifier setup Jest
npm test -- --verbose

# Si problème avec Firebase mock
# Vérifier tests/setup.ts
```

## ✅ Checklist Setup Complet

- [ ] Node 22 installé
- [ ] Firebase CLI installé
- [ ] Flutter installé
- [ ] Backend: npm install success
- [ ] Backend: npm run build success
- [ ] Backend: npm test success (coverage >= 70%)
- [ ] Firestore rules déployées
- [ ] Functions déployées (europe-west4)
- [ ] Web Admin: npm install success
- [ ] Web Admin: npm run build success
- [ ] Mobile Parent: flutter pub get success
- [ ] Mobile Driver: flutter pub get success
- [ ] GitHub Actions secrets configurés
- [ ] Mapbox token obtenu
- [ ] Firebase service account créée
- [ ] Tous les tests passent

## 📞 Support

Si blocage, vérifier:

1. **Logs Firebase Console** → Functions → Logs
2. **GitHub Actions** → Vérifier derniers runs
3. **Flutter doctor** → `flutter doctor -v`
4. **npm outdated** → Vérifier versions packages

Pour aide: contact@transportscolaire.com
