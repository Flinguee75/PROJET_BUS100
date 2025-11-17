# 🔥 Configuration Firebase - Guide Complet

Ce guide vous explique comment configurer Firebase pour l'application mobile Parents.

## 📋 Prérequis

- Accès au projet Firebase `projet-bus-60a3f`
- Flutter CLI installé
- Firebase CLI installé (`npm install -g firebase-tools`)

## 1️⃣ Configuration Android

### Étape 1 : Ajouter l'application dans Firebase Console

1. Allez sur https://console.firebase.google.com/
2. Sélectionnez le projet `projet-bus-60a3f`
3. Cliquez sur l'icône Android
4. Remplissez les informations :
   - **Package name:** `com.transportscolaire.parent_app`
   - **App nickname:** "Parent App Android"
   - **Debug signing certificate (optionnel):** Laissez vide pour le moment

### Étape 2 : Télécharger google-services.json

1. Téléchargez le fichier `google-services.json`
2. Placez-le dans le dossier :
```
parent_app/android/app/google-services.json
```

### Étape 3 : Configurer build.gradle

Le fichier `android/build.gradle` doit contenir :

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.2'
    }
}
```

Le fichier `android/app/build.gradle` doit contenir :

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:33.9.0')
}
```

### Étape 4 : Configurer Google Maps

Dans `android/app/src/main/AndroidManifest.xml`, ajoutez :

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>

    <application>
        <!-- Clé API Google Maps -->
        <meta-data
            android:name="com.google.android.geo.API_KEY"
            android:value="VOTRE_CLE_API_GOOGLE_MAPS"/>
    </application>
</manifest>
```

## 2️⃣ Configuration iOS

### Étape 1 : Ajouter l'application dans Firebase Console

1. Dans Firebase Console, cliquez sur l'icône iOS
2. Remplissez les informations :
   - **Bundle ID:** `com.transportscolaire.parentApp`
   - **App nickname:** "Parent App iOS"

### Étape 2 : Télécharger GoogleService-Info.plist

1. Téléchargez le fichier `GoogleService-Info.plist`
2. Ouvrez Xcode : `open ios/Runner.xcworkspace`
3. Glissez-déposez le fichier dans le dossier `Runner` (cochez "Copy items if needed")

### Étape 3 : Configurer Podfile

Le fichier `ios/Podfile` doit contenir :

```ruby
platform :ios, '12.0'

target 'Runner' do
  use_frameworks!
  
  # Firebase
  pod 'Firebase/Core'
  pod 'Firebase/Auth'
  pod 'Firebase/Firestore'
  pod 'Firebase/Messaging'
  
  # Google Maps
  pod 'GoogleMaps'
end
```

Installez les pods :
```bash
cd ios
pod install
cd ..
```

### Étape 4 : Configurer Google Maps

Dans `ios/Runner/AppDelegate.swift`, ajoutez :

```swift
import UIKit
import Flutter
import GoogleMaps

@main
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    GMSServices.provideAPIKey("VOTRE_CLE_API_GOOGLE_MAPS")
    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

## 3️⃣ Obtenir les clés API

### Google Maps API

1. Allez sur https://console.cloud.google.com/
2. Sélectionnez le projet `projet-bus-60a3f`
3. Allez dans "APIs & Services" > "Credentials"
4. Créez une clé API (si elle n'existe pas)
5. Restreignez la clé à "Maps SDK for Android" et "Maps SDK for iOS"

### Firebase Configuration

Votre Firebase est déjà configuré avec :
- **Project ID:** `projet-bus-60a3f`
- **Region:** `europe-west4`

## 4️⃣ Règles de Sécurité Firestore

Assurez-vous que les règles Firestore permettent :
- Lecture des enfants uniquement par leur parent
- Lecture des bus uniquement pour les bus assignés aux enfants du parent
- Lecture des positions GPS en temps réel

Exemple de règles :

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Les parents peuvent lire leurs enfants
    match /students/{studentId} {
      allow read: if request.auth != null && 
                    resource.data.parentId == request.auth.uid;
    }
    
    // Les parents peuvent lire les positions GPS des bus de leurs enfants
    match /gps_live/{busId} {
      allow read: if request.auth != null;
    }
    
    // Les parents peuvent lire les informations des bus
    match /buses/{busId} {
      allow read: if request.auth != null;
    }
  }
}
```

## 5️⃣ Vérification

### Vérifier la configuration Android :

```bash
flutter run -d android
```

Si Firebase est bien configuré, vous verrez dans les logs :
```
✅ Firebase initialized successfully
```

### Vérifier la configuration iOS :

```bash
flutter run -d ios
```

## 🐛 Dépannage

### Erreur "google-services.json not found"
- Vérifiez que le fichier est bien dans `android/app/`
- Lancez `flutter clean` puis `flutter pub get`

### Erreur "GoogleService-Info.plist not found"
- Ouvrez Xcode et vérifiez que le fichier est dans le dossier Runner
- Assurez-vous qu'il est coché dans "Target Membership"

### Google Maps ne s'affiche pas
- Vérifiez que la clé API est correcte
- Activez "Maps SDK for Android/iOS" dans Google Cloud Console
- Vérifiez les permissions de localisation dans le manifest

## 📚 Ressources

- [Firebase Flutter Setup](https://firebase.google.com/docs/flutter/setup)
- [Google Maps Flutter Plugin](https://pub.dev/packages/google_maps_flutter)
- [Firebase Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## ✅ Checklist

- [ ] `google-services.json` ajouté (Android)
- [ ] `GoogleService-Info.plist` ajouté (iOS)
- [ ] Clé API Google Maps configurée (Android + iOS)
- [ ] Pods installés (iOS)
- [ ] Règles Firestore configurées
- [ ] Application testée sur émulateur
- [ ] Authentification fonctionnelle
- [ ] Carte s'affiche correctement

