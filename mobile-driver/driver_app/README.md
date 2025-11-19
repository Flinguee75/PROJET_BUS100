# Application Chauffeur - Bus Scolaire

Application mobile Flutter pour les chauffeurs de bus scolaires. Permet de gérer les montées/descentes des élèves et d'envoyer automatiquement la position GPS.

## Fonctionnalités

### ✅ Authentification
- Connexion avec email et mot de passe
- Vérification du rôle "chauffeur"
- Déconnexion sécurisée

### ✅ Gestion des élèves
- Liste de tous les élèves assignés au bus du chauffeur
- Affichage du statut d'attendance en temps réel
- Interface simple avec boutons Monter/Descendre

### ✅ Enregistrement d'attendance
- **Bouton "Monter"** : Enregistre la montée d'un élève avec:
  - Horodatage automatique
  - Position GPS actuelle
  - Envoi de notification aux parents

- **Bouton "Descendre"** : Enregistre la descente d'un élève avec:
  - Horodatage automatique
  - Position GPS actuelle
  - Envoi de notification aux parents

### ✅ Suivi GPS automatique
- Bouton GPS dans la barre d'app
- Envoi automatique de la position toutes les 5 secondes
- Mise à jour du statut du bus (en_route / hors_service)
- Indicateur visuel vert/gris pour le statut GPS

### ✅ Statistiques en temps réel
- Nombre total d'élèves assignés
- Nombre d'élèves actuellement à bord
- Rafraîchissement automatique

## Architecture

```
lib/
├── main.dart                    # Point d'entrée, configuration providers
├── models/
│   ├── student.dart            # Modèle Student et AttendanceStatus
│   ├── bus.dart                # Modèle Bus et BusStatus
│   └── driver.dart             # Modèle Driver
├── services/
│   ├── auth_service.dart       # Authentification Firebase
│   ├── attendance_service.dart # API attendance (board/exit)
│   ├── gps_service.dart        # Envoi position GPS
│   └── firestore_service.dart  # Requêtes Firestore
├── providers/
│   ├── auth_provider.dart      # State management auth
│   └── students_provider.dart  # State management élèves & GPS
└── screens/
    ├── login_screen.dart       # Écran de connexion
    └── students_list_screen.dart # Écran principal liste élèves
```

## Installation

### Prérequis
- Flutter SDK ^3.10.0
- Dart SDK
- Firebase CLI
- Android Studio / Xcode

### Dépendances principales
```yaml
dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^3.11.0
  firebase_auth: ^5.4.0
  cloud_firestore: ^5.6.0
  provider: ^6.1.2
  geolocator: ^12.0.0
  http: ^1.2.2
```

### Configuration Firebase

1. **Créer un projet Firebase** (ou utiliser `projet-bus-60a3f`)

2. **Android** : Placer `google-services.json` dans `android/app/`

3. **iOS** : Placer `GoogleService-Info.plist` dans `ios/Runner/`

4. **Permissions GPS Android** (`android/app/src/main/AndroidManifest.xml`) :
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
```

5. **Permissions GPS iOS** (`ios/Runner/Info.plist`) :
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>Nous avons besoin de votre position pour le suivi du bus</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>Nous avons besoin de votre position même en arrière-plan</string>
```

### URL du backend

Modifier `baseUrl` dans les fichiers de services :
- `lib/services/attendance_service.dart`
- `lib/services/gps_service.dart`

**Production** :
```dart
static const String baseUrl = 'https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api';
```

**Émulateur local** :
```dart
static const String baseUrl = 'http://10.0.2.2:5001/projet-bus-60a3f/europe-west4/api';
```

### Lancer l'application

```bash
# Installer les dépendances
cd mobile-driver/driver_app
flutter pub get

# Lancer sur émulateur/appareil
flutter run

# Build APK Android
flutter build apk

# Build iOS
flutter build ios
```

## Utilisation

### 1. Connexion
- Entrer email et mot de passe du chauffeur
- Le système vérifie que le rôle est bien "driver"
- Récupère automatiquement le bus assigné

### 2. Démarrer le GPS
- Appuyer sur l'icône GPS en haut à droite
- L'icône devient verte quand le GPS est actif
- La position est envoyée automatiquement toutes les 5 secondes
- Le statut du bus passe à "en_route"

### 3. Enregistrer les montées
- Trouver l'élève dans la liste
- Appuyer sur le bouton **"Monter"** (vert)
- Le statut change immédiatement à "À bord"
- Les parents reçoivent une notification

### 4. Enregistrer les descentes
- Trouver l'élève avec le statut "À bord"
- Appuyer sur le bouton **"Descendre"** (orange)
- Le statut change à "Trajet terminé"
- Les parents reçoivent une notification

### 5. Arrêter le GPS
- Appuyer à nouveau sur l'icône GPS
- L'icône devient grise
- Le statut du bus passe à "hors_service"

## Statuts d'attendance

| Statut | Description | Couleur | Bouton affiché |
|--------|-------------|---------|----------------|
| `not_boarded` | Pas encore monté | Gris | "Monter" |
| `boarded` | À bord du bus | Bleu | "Descendre" |
| `completed` | Trajet terminé (monté + descendu) | Vert | Badge "Terminé" |
| `absent` | Élève absent | Rouge | Aucun |

## API Backend utilisées

### Attendance
- `POST /api/attendance/board` - Enregistrer montée
- `POST /api/attendance/exit` - Enregistrer descente
- `GET /api/attendance/bus/:busId/count` - Compter élèves à bord
- `GET /api/attendance/student/:studentId` - Statut du jour

### GPS
- `POST /api/gps` - Envoyer position

### Firestore
- `students` (where busId = X) - Liste des élèves
- `buses/:busId` - Informations du bus
- `users/:driverId` - Profil chauffeur

## Sécurité

- ✅ Authentification Firebase requise
- ✅ Vérification du rôle "driver"
- ✅ Géolocalisation avec permissions
- ✅ Communication HTTPS avec le backend
- ✅ Validation des données côté serveur

## Améliorations futures

- [ ] Mode hors ligne avec synchronisation
- [ ] Historique des trajets du chauffeur
- [ ] Scanner QR Code pour les élèves
- [ ] Photos des élèves
- [ ] Navigation GPS vers les arrêts
- [ ] Gestion des absences manuelles
- [ ] Notifications push pour le chauffeur
- [ ] Rapport de fin de journée

## Support

Pour toute question ou problème :
- Vérifier la connexion internet
- Vérifier les permissions GPS
- Consulter les logs avec `flutter logs`
- Vérifier que le backend est déployé et accessible

## Licence

Projet privé - PROJET_BUS - © 2024
