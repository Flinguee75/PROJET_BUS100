# Guide de Setup - Application Chauffeur

Guide complet pour installer et configurer l'application chauffeur Flutter.

---

## Table des matières

1. [Prérequis](#1-prérequis)
2. [Installation Flutter](#2-installation-flutter)
3. [Configuration Firebase](#3-configuration-firebase)
4. [Configuration Android](#4-configuration-android)
5. [Configuration iOS](#5-configuration-ios)
6. [Installation des dépendances](#6-installation-des-dépendances)
7. [Configuration du Backend](#7-configuration-du-backend)
8. [Création des comptes chauffeurs](#8-création-des-comptes-chauffeurs)
9. [Lancer l'application](#9-lancer-lapplication)
10. [Dépannage](#10-dépannage)

---

## 1. Prérequis

### Outils nécessaires

- **Flutter SDK** : Version 3.10.0 ou supérieure
- **Android Studio** : Pour le développement Android
- **Xcode** : Pour le développement iOS (Mac uniquement)
- **Firebase CLI** : Pour la configuration Firebase
- **Git** : Pour cloner le projet

### Vérifier les installations

```bash
# Vérifier Flutter
flutter --version

# Vérifier Flutter Doctor
flutter doctor

# Vérifier Firebase CLI
firebase --version

# Vérifier Git
git --version
```

---

## 2. Installation Flutter

### Windows

1. Télécharger Flutter SDK : https://docs.flutter.dev/get-started/install/windows
2. Extraire l'archive dans `C:\src\flutter`
3. Ajouter `C:\src\flutter\bin` au PATH
4. Ouvrir un nouveau terminal et exécuter :
```bash
flutter doctor
```

### macOS

```bash
# Télécharger Flutter
cd ~/development
git clone https://github.com/flutter/flutter.git -b stable

# Ajouter au PATH (dans ~/.zshrc ou ~/.bash_profile)
export PATH="$PATH:$HOME/development/flutter/bin"

# Vérifier l'installation
flutter doctor
```

### Linux

```bash
# Télécharger Flutter
cd ~/development
git clone https://github.com/flutter/flutter.git -b stable

# Ajouter au PATH (dans ~/.bashrc)
export PATH="$PATH:$HOME/development/flutter/bin"

# Vérifier l'installation
flutter doctor
```

### Installer les outils manquants

Suivre les instructions de `flutter doctor` pour installer :
- Android toolchain
- Android Studio
- Xcode (macOS uniquement)
- VS Code plugins (optionnel)

---

## 3. Configuration Firebase

### 3.1. Créer/Utiliser un projet Firebase

1. Aller sur https://console.firebase.google.com
2. Utiliser le projet existant : **`projet-bus-60a3f`**
   - OU créer un nouveau projet si nécessaire

### 3.2. Activer les services Firebase

Dans la console Firebase :

1. **Authentication**
   - Aller dans "Authentication" → "Sign-in method"
   - Activer "Email/Password"

2. **Firestore Database**
   - Aller dans "Firestore Database"
   - Créer la base de données en mode "production"
   - Région : `europe-west4`

3. **Cloud Functions** (déjà configuré)
   - Le backend doit être déployé (voir section 7)

### 3.3. Installer Firebase CLI

```bash
# Installer Firebase CLI
npm install -g firebase-tools

# Se connecter à Firebase
firebase login

# Vérifier que vous avez accès au projet
firebase projects:list
```

### 3.4. Installer FlutterFire CLI

```bash
# Installer FlutterFire CLI
dart pub global activate flutterfire_cli

# Vérifier l'installation
flutterfire --version
```

---

## 4. Configuration Android

### 4.1. Générer le fichier google-services.json

**Méthode automatique (recommandée) :**

```bash
# Aller dans le dossier de l'app
cd mobile-driver/driver_app

# Configurer Firebase automatiquement
flutterfire configure --project=projet-bus-60a3f
```

Cette commande va :
- Créer automatiquement `google-services.json` pour Android
- Créer `GoogleService-Info.plist` pour iOS
- Générer `lib/firebase_options.dart`

**Méthode manuelle (alternative) :**

1. Aller dans Firebase Console → Paramètres du projet
2. Cliquer sur "Ajouter une application" → Android
3. Package name : `com.projet_bus.driver_app` (ou votre package)
4. Télécharger `google-services.json`
5. Placer le fichier dans : `android/app/google-services.json`

### 4.2. Configurer Android

Vérifier que `android/build.gradle` contient :

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.3.15'
    }
}
```

Vérifier que `android/app/build.gradle` contient :

```gradle
// En bas du fichier
apply plugin: 'com.google.gms.google-services'

android {
    defaultConfig {
        applicationId "com.projet_bus.driver_app"
        minSdkVersion 21  // Important pour Firebase
        targetSdkVersion 33
    }
}
```

### 4.3. Ajouter les permissions GPS

Éditer `android/app/src/main/AndroidManifest.xml` :

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <!-- AJOUTER CES PERMISSIONS -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />

    <application
        android:label="Chauffeur Bus"
        android:name="${applicationName}"
        android:icon="@mipmap/ic_launcher">
        ...
    </application>
</manifest>
```

---

## 5. Configuration iOS

### 5.1. Prérequis

- **macOS uniquement**
- **Xcode** installé (version 14.0 ou supérieure)
- **CocoaPods** installé

```bash
# Installer CocoaPods si nécessaire
sudo gem install cocoapods
```

### 5.2. Générer le fichier GoogleService-Info.plist

Si vous avez utilisé `flutterfire configure`, le fichier est déjà créé.

**Sinon, méthode manuelle :**

1. Firebase Console → Paramètres du projet
2. Cliquer sur "Ajouter une application" → iOS
3. Bundle ID : `com.projetBus.driverApp` (ou votre bundle ID)
4. Télécharger `GoogleService-Info.plist`
5. Placer dans : `ios/Runner/GoogleService-Info.plist`

### 5.3. Configurer les permissions GPS

Éditer `ios/Runner/Info.plist` :

```xml
<dict>
    <!-- AJOUTER CES CLÉS -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>Nous avons besoin de votre position pour suivre le bus en temps réel</string>

    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>Nous avons besoin de votre position même en arrière-plan pour le suivi GPS continu</string>

    <key>NSLocationAlwaysUsageDescription</key>
    <string>Le suivi GPS en arrière-plan permet d'envoyer votre position automatiquement</string>

    <!-- Reste de la configuration -->
</dict>
```

### 5.4. Installer les pods

```bash
cd ios
pod install
cd ..
```

---

## 6. Installation des dépendances

```bash
# Se placer dans le dossier de l'app
cd mobile-driver/driver_app

# Installer toutes les dépendances Flutter
flutter pub get

# Vérifier qu'il n'y a pas d'erreurs
flutter pub outdated
```

**Dépendances installées :**
- `firebase_core` - Firebase SDK
- `firebase_auth` - Authentification
- `cloud_firestore` - Base de données
- `provider` - State management
- `geolocator` - GPS
- `http` - Requêtes API

---

## 7. Configuration du Backend

### 7.1. Vérifier que le backend est déployé

```bash
# Se placer à la racine du projet
cd ../../backend

# Déployer les Cloud Functions si nécessaire
npm install
npm run build
firebase deploy --only functions
```

### 7.2. Obtenir l'URL du backend

L'URL de production est :
```
https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api
```

### 7.3. Configurer les URLs dans l'app

**Fichier 1 : `lib/services/attendance_service.dart`**

```dart
class AttendanceService {
  // PRODUCTION
  static const String baseUrl =
      'https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api';

  // Pour tester en local avec l'émulateur :
  // static const String baseUrl = 'http://10.0.2.2:5001/projet-bus-60a3f/europe-west4/api';
```

**Fichier 2 : `lib/services/gps_service.dart`**

```dart
class GPSService {
  // PRODUCTION
  static const String baseUrl =
      'https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api';

  // Pour tester en local avec l'émulateur :
  // static const String baseUrl = 'http://10.0.2.2:5001/projet-bus-60a3f/europe-west4/api';
```

**Note :** `10.0.2.2` est l'adresse localhost pour l'émulateur Android.

---

## 8. Création des comptes chauffeurs

### 8.1. Créer un utilisateur dans Firebase Authentication

**Option A : Via la console Firebase**

1. Aller dans Firebase Console → Authentication
2. Cliquer sur "Add user"
3. Email : `chauffeur1@exemple.com`
4. Mot de passe : `motdepasse123`
5. Copier l'UID généré (ex: `abc123xyz`)

**Option B : Via Firebase CLI**

```bash
# Installer firebase-admin
npm install -g firebase-tools

# Créer un script temporaire create-driver.js
```

### 8.2. Ajouter le profil dans Firestore

1. Aller dans Firestore Database
2. Collection `users` → Ajouter un document
3. ID du document : **l'UID de l'utilisateur créé à l'étape 8.1**
4. Données :

```json
{
  "email": "chauffeur1@exemple.com",
  "firstName": "Jean",
  "lastName": "Dupont",
  "phone": "+225 07 00 00 00 00",
  "licenseNumber": "CI123456789",
  "role": "driver",
  "busId": "bus-001",
  "isActive": true,
  "createdAt": [Timestamp actuel],
  "updatedAt": [Timestamp actuel]
}
```

**⚠️ IMPORTANT :** Le champ `role` doit être **exactement** `"driver"` sinon la connexion sera refusée.

### 8.3. Créer un bus pour le chauffeur

1. Collection `buses` → Ajouter un document
2. ID du document : `bus-001`
3. Données :

```json
{
  "plate": "AB-1234-CI",
  "capacity": 45,
  "driverId": "[UID du chauffeur]",
  "status": "hors_service",
  "createdAt": [Timestamp actuel],
  "updatedAt": [Timestamp actuel]
}
```

### 8.4. Ajouter des élèves au bus

1. Collection `students` → Ajouter des documents
2. Exemple :

```json
{
  "firstName": "Aya",
  "lastName": "Kouassi",
  "busId": "bus-001",
  "parentIds": ["parent-001"],
  "classe": "CM2",
  "ecole": "École Primaire Cocody",
  "photoUrl": null,
  "createdAt": [Timestamp actuel]
}
```

Répéter pour plusieurs élèves avec le même `busId`.

---

## 9. Lancer l'application

### 9.1. Connecter un appareil/émulateur

**Android :**
```bash
# Lister les appareils
flutter devices

# Lancer un émulateur Android
flutter emulators
flutter emulators --launch Pixel_5_API_33
```

**iOS :**
```bash
# Ouvrir le simulateur
open -a Simulator

# Lister les appareils
flutter devices
```

### 9.2. Lancer l'app en mode debug

```bash
# Se placer dans le dossier
cd mobile-driver/driver_app

# Lancer sur l'appareil connecté
flutter run

# Ou spécifier un appareil
flutter run -d <device-id>
```

### 9.3. Tester la connexion

1. L'app s'ouvre sur l'écran de connexion
2. Entrer :
   - Email : `chauffeur1@exemple.com`
   - Mot de passe : `motdepasse123`
3. Cliquer sur "Se connecter"
4. Vous devez voir la liste des élèves du bus

### 9.4. Tester les fonctionnalités

**Test 1 : Démarrer le GPS**
- Cliquer sur l'icône GPS en haut à droite
- L'icône devient verte
- Vérifier dans Firestore → `gps_live/{busId}` que la position se met à jour

**Test 2 : Monter un élève**
- Cliquer sur le bouton vert "Monter" pour un élève
- Le statut change à "À bord" (bleu)
- Vérifier dans Firestore → `attendance` qu'un record est créé

**Test 3 : Descendre un élève**
- Cliquer sur le bouton orange "Descendre" pour l'élève monté
- Le statut change à "Trajet terminé" (vert)
- Vérifier que le record attendance est mis à jour avec `exitTime`

---

## 10. Dépannage

### Problème : "Flutter command not found"

```bash
# Vérifier que Flutter est dans le PATH
echo $PATH

# Ajouter Flutter au PATH (exemple macOS/Linux)
export PATH="$PATH:$HOME/development/flutter/bin"

# Recharger le terminal
source ~/.zshrc  # ou ~/.bashrc
```

### Problème : "google-services.json not found"

1. Vérifier que le fichier existe : `android/app/google-services.json`
2. Relancer `flutterfire configure`
3. Nettoyer le build : `flutter clean && flutter pub get`

### Problème : "FirebaseException: no such project"

1. Vérifier le projectId dans `google-services.json`
2. S'assurer d'être connecté au bon compte Firebase :
```bash
firebase logout
firebase login
firebase use projet-bus-60a3f
```

### Problème : "Permission denied" pour le GPS

**Android :**
- Aller dans Paramètres → Apps → Chauffeur Bus → Permissions
- Autoriser "Position" en "Autoriser tout le temps"

**iOS :**
- Réglages → Confidentialité → Service de localisation
- Activer pour l'app et choisir "Toujours"

### Problème : "Connection refused" à l'API

1. Vérifier que le backend est déployé :
```bash
curl https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api/health
```

2. Vérifier les URLs dans les services :
   - `lib/services/attendance_service.dart`
   - `lib/services/gps_service.dart`

3. Pour tester en local avec l'émulateur :
```bash
# Terminal 1 : Lancer les émulateurs Firebase
cd backend
firebase emulators:start

# Terminal 2 : Lancer l'app avec l'URL locale
# Modifier baseUrl = 'http://10.0.2.2:5001/...'
flutter run
```

### Problème : "This account is not a driver account"

1. Vérifier dans Firestore → `users/{uid}`
2. Le champ `role` doit être exactement `"driver"` (pas "chauffeur", pas "Driver")
3. Modifier si nécessaire et réessayer

### Problème : Build Android échoue

```bash
# Nettoyer le cache
cd android
./gradlew clean
cd ..
flutter clean
flutter pub get

# Rebuild
flutter build apk
```

### Problème : Build iOS échoue

```bash
# Nettoyer les pods
cd ios
pod deintegrate
pod install
cd ..

# Rebuild
flutter clean
flutter pub get
flutter build ios
```

### Logs et débogage

```bash
# Voir les logs en temps réel
flutter logs

# Voir les logs Firebase
firebase functions:log

# Analyser les erreurs
flutter analyze
```

---

## Résumé : Checklist rapide

- [ ] Flutter installé (`flutter doctor`)
- [ ] Firebase CLI installé (`firebase login`)
- [ ] FlutterFire CLI installé (`flutterfire --version`)
- [ ] `flutterfire configure` exécuté
- [ ] `google-services.json` présent dans `android/app/`
- [ ] Permissions GPS ajoutées dans `AndroidManifest.xml`
- [ ] `GoogleService-Info.plist` présent dans `ios/Runner/`
- [ ] Permissions GPS ajoutées dans `Info.plist`
- [ ] `flutter pub get` exécuté
- [ ] URLs backend configurées dans les services
- [ ] Backend déployé et accessible
- [ ] Compte chauffeur créé dans Firebase Auth
- [ ] Profil chauffeur créé dans Firestore avec `role: "driver"`
- [ ] Bus créé et assigné au chauffeur
- [ ] Élèves ajoutés au bus
- [ ] App lancée avec `flutter run`
- [ ] Connexion réussie
- [ ] GPS fonctionnel
- [ ] Boutons Monter/Descendre fonctionnels

---

## Support

Si vous rencontrez des problèmes non couverts par ce guide :

1. Vérifier les logs : `flutter logs`
2. Vérifier la console Firebase pour les erreurs
3. Consulter la documentation Flutter : https://docs.flutter.dev
4. Consulter la documentation Firebase : https://firebase.google.com/docs

---

**Bon développement ! 🚀**
