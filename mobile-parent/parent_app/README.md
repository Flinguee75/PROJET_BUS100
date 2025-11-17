# 🚌 Application Mobile Parents - Transport Scolaire

Application mobile Flutter pour les parents permettant de suivre en temps réel le bus scolaire de leurs enfants.

## 📱 Fonctionnalités

- ✅ Authentification sécurisée avec Firebase Auth
- ✅ Suivi GPS en temps réel du bus
- ✅ Affichage sur carte interactive (Google Maps)
- ✅ Liste des enfants et bus associés
- ✅ Notifications push (Firebase Messaging)
- ✅ Design moderne et intuitif

## 🛠️ Technologies

- **Framework:** Flutter 3.38.1
- **Langage:** Dart 3.10.0
- **Backend:** Firebase (Auth, Firestore, Messaging)
- **Maps:** Google Maps Flutter
- **State Management:** Provider

## 📦 Structure du projet

```
lib/
├── models/          # Modèles de données (Bus, Enfant, GPSPosition)
├── providers/       # State management (AuthProvider, BusProvider)
├── screens/         # Écrans de l'application
│   ├── splash_screen.dart
│   ├── login_screen.dart
│   ├── home_screen.dart
│   └── map_screen.dart
├── services/        # Services (Firebase, Bus, Enfant)
├── widgets/         # Composants réutilisables
├── utils/           # Utilitaires (couleurs, constantes)
└── main.dart        # Point d'entrée
```

## 🚀 Installation

### 1. Prérequis

- Flutter SDK 3.38.1 ou supérieur
- Dart 3.10.0 ou supérieur
- Android Studio ou Xcode
- Compte Firebase

### 2. Installation des dépendances

```bash
cd mobile-parent/parent_app
flutter pub get
```

### 3. Configuration Firebase

#### Pour Android :

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Sélectionnez votre projet `projet-bus-60a3f`
3. Ajoutez une application Android
4. Téléchargez le fichier `google-services.json`
5. Placez-le dans `android/app/google-services.json`

#### Pour iOS :

1. Dans Firebase Console, ajoutez une application iOS
2. Téléchargez le fichier `GoogleService-Info.plist`
3. Placez-le dans `ios/Runner/GoogleService-Info.plist`

### 4. Configuration Google Maps

#### Pour Android :

Ajoutez votre clé API Google Maps dans `android/app/src/main/AndroidManifest.xml` :

```xml
<manifest ...>
  <application ...>
    <meta-data
        android:name="com.google.android.geo.API_KEY"
        android:value="VOTRE_CLE_API_GOOGLE_MAPS"/>
  </application>
</manifest>
```

#### Pour iOS :

Ajoutez votre clé API dans `ios/Runner/AppDelegate.swift` :

```swift
import GoogleMaps

GMSServices.provideAPIKey("VOTRE_CLE_API_GOOGLE_MAPS")
```

## 🏃 Lancement de l'application

### En mode développement :

```bash
# Lancer sur Android
flutter run -d android

# Lancer sur iOS
flutter run -d ios

# Avec les émulateurs Firebase
flutter run --dart-define=USE_EMULATORS=true
```

### Build pour production :

```bash
# Android APK
flutter build apk --release

# Android App Bundle
flutter build appbundle --release

# iOS
flutter build ios --release
```

## 🔧 Configuration des émulateurs Firebase (Développement)

Pour utiliser les émulateurs Firebase en développement local :

1. Démarrez les émulateurs :
```bash
cd ../../
firebase emulators:start
```

2. Lancez l'app avec la variable d'environnement :
```bash
flutter run --dart-define=USE_EMULATORS=true
```

## 📊 Tests

```bash
# Lancer les tests
flutter test

# Coverage
flutter test --coverage
```

## 🎨 Design

L'application utilise une palette de couleurs cohérente définie dans `lib/utils/app_colors.dart` :

- **Primaire:** Bleu (#2563EB)
- **Secondaire:** Jaune/Orange (#F59E0B)
- **Success:** Vert (#10B981)
- **Danger:** Rouge (#EF4444)

## 📝 Conventions de code

- Utiliser `async`/`await` pour les opérations asynchrones
- Pas de `print()` en production (utiliser un logger)
- Commentaires en français pour la documentation
- Code en anglais pour les variables et fonctions

## 🔐 Sécurité

- Les règles Firestore doivent être configurées pour limiter l'accès
- Un parent ne peut voir que ses propres enfants
- Authentification requise pour toutes les opérations

## 📱 Compatibilité

- **Android:** API 21+ (Android 5.0+)
- **iOS:** iOS 12.0+

## 🤝 Contribution

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add: Amazing Feature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Projet privé - Tous droits réservés

## 👥 Équipe

- **Développement:** Équipe Transport Scolaire
- **Design:** UI/UX Team
- **Backend:** Firebase/GCP

## 📞 Support

Pour toute question ou problème, contactez l'équipe de développement.
