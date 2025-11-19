# Système de Notifications et Temps Réel - PROJET_BUS

Documentation complète du système de notifications en temps réel pour le suivi de bus scolaires.

---

## 📋 Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Architecture](#architecture)
3. [Fonctionnalités implémentées](#fonctionnalités-implémentées)
4. [API Backend](#api-backend)
5. [Application Chauffeur](#application-chauffeur)
6. [Notifications Firebase](#notifications-firebase)
7. [Tests](#tests)
8. [Utilisation](#utilisation)
9. [TODO - Temps réel manquant](#todo---temps-réel-manquant)

---

## Vue d'ensemble

Le système permet de notifier automatiquement les parents en temps réel de tous les événements importants concernant le trajet de leurs enfants :

### ✅ Événements notifiés

| Événement | Déclencheur | Destinataires | Priorité |
|-----------|-------------|---------------|----------|
| **Démarrage trajet** | Chauffeur active GPS | Tous les parents du bus | 🔴 HAUTE |
| **Montée élève** | Chauffeur clique "Monter" | Parents de l'élève | 🟡 MOYENNE |
| **Descente élève** | Chauffeur clique "Descendre" | Parents de l'élève | 🟡 MOYENNE |
| **Arrêt trajet** | Chauffeur désactive GPS | - | 🟢 INFO |

### 📊 Flux de données

```
┌─────────────────┐
│  App Chauffeur  │ (Flutter)
└────────┬────────┘
         │ HTTP POST
         ▼
┌─────────────────────────────────────┐
│  Backend Firebase Functions         │
│  - NotificationService              │
│  - RouteController                  │
│  - AttendanceController             │
└────────┬────────────────────────────┘
         │
         ├─► Firestore (gps_live, attendance, notifications)
         ├─► FCM (Push notifications)
         └─► Parents reçoivent notification
```

---

## Architecture

### Backend (Node.js + TypeScript + Firebase Functions)

```
backend/src/
├── controllers/
│   ├── route.controller.ts          # Démarrage/Arrêt trajet
│   └── attendance.controller.ts     # Montée/Descente élèves
├── services/
│   ├── notification.service.ts      # Logique FCM + Firestore
│   ├── attendance.service.ts        # Logique attendance
│   └── gps.service.ts              # Logique GPS
├── routes/
│   ├── route.routes.ts              # POST /api/routes/start & /stop
│   └── attendance.routes.ts         # POST /api/attendance/board & /exit
└── types/
    └── notification.types.ts        # NotificationType, NotificationPriority
```

### Driver App (Flutter + Dart)

```
mobile-driver/driver_app/lib/
├── services/
│   ├── gps_service.dart             # Envoi GPS + notifications trajet
│   ├── attendance_service.dart      # Montée/Descente API
│   └── auth_service.dart           # Authentification chauffeur
├── providers/
│   └── students_provider.dart       # State management élèves
├── screens/
│   ├── login_screen.dart           # Connexion
│   └── students_list_screen.dart   # Liste élèves + boutons
└── models/
    └── student.dart                 # Student + AttendanceStatus
```

---

## Fonctionnalités implémentées

### 1. Notification de démarrage de trajet

**Quand ?** Le chauffeur clique sur le bouton GPS (🛰️) dans l'app

**Processus :**
1. `GPSService.startTracking()` appelé
2. HTTP POST → `/api/routes/start` avec `{ busId, driverId }`
3. Backend :
   - Récupère le bus (plaque)
   - Récupère le chauffeur (nom)
   - Récupère tous les élèves du bus
   - Collecte tous les parents (déduplication si plusieurs enfants)
   - Crée une notification Firestore
   - Envoie notification FCM à tous les parents
4. Bus.status → `en_route`

**Notification envoyée :**
```json
{
  "type": "bus_arriving",
  "title": "🚌 Trajet démarré",
  "message": "Le bus AB-1234-CI a démarré son trajet avec Jean Dupont. Vous pouvez suivre sa position en temps réel.",
  "priority": "high",
  "data": {
    "busId": "bus-001",
    "driverId": "driver-001",
    "eventType": "route_started",
    "timestamp": "2024-01-15T08:00:00Z"
  }
}
```

**Code clé :**

`backend/src/services/notification.service.ts`
```typescript
async notifyParentsRouteStarted(busId: string, driverId: string) {
  // 1. Récupérer bus + chauffeur
  // 2. Récupérer tous les élèves du bus
  // 3. Collecter parentIds (sans doublons)
  // 4. Envoyer notification FCM à tous
}
```

`mobile-driver/driver_app/lib/services/gps_service.dart`
```dart
Future<void> startTracking({required String busId, required String driverId}) async {
  await _notifyRouteStarted(busId, driverId); // ← Notification parents
  await _sendPosition(busId, driverId);
  _locationTimer = Timer.periodic(Duration(seconds: 5), ...);
}
```

---

### 2. Notification de montée d'élève

**Quand ?** Le chauffeur clique sur le bouton "Monter" (vert) pour un élève

**Processus :**
1. `StudentsProvider.boardStudent()` appelé
2. HTTP POST → `/api/attendance/board` avec `{ studentId, busId, driverId, location }`
3. Backend :
   - Vérifie que l'élève n'est pas déjà monté
   - Crée/met à jour record attendance
   - Récupère les parents de l'élève
   - Envoie notification FCM
4. Statut local élève → `boarded`

**Notification envoyée :**
```json
{
  "type": "student_boarded",
  "title": "Aya Kouassi est monté(e) dans le bus",
  "message": "Votre enfant Aya Kouassi est monté(e) dans le bus à 08:30.",
  "priority": "high",
  "data": {
    "studentId": "student-001",
    "eventType": "board",
    "studentName": "Aya Kouassi",
    "timestamp": "2024-01-15T08:30:00Z"
  }
}
```

**Règles métier :**
- ❌ Impossible de monter 2 fois (erreur 409)
- ✅ Position GPS capturée automatiquement
- ✅ Notification envoyée uniquement aux parents de cet élève

---

### 3. Notification de descente d'élève

**Quand ?** Le chauffeur clique sur le bouton "Descendre" (orange) pour un élève

**Processus :**
1. `StudentsProvider.exitStudent()` appelé
2. HTTP POST → `/api/attendance/exit` avec `{ studentId, busId, driverId, location }`
3. Backend :
   - Vérifie que l'élève est actuellement à bord
   - Met à jour record avec exitTime
   - Envoie notification FCM aux parents
4. Statut local élève → `completed`

**Notification envoyée :**
```json
{
  "type": "student_exited",
  "title": "Aya Kouassi est descendu(e) du bus",
  "message": "Votre enfant Aya Kouassi est descendu(e) du bus à 16:00.",
  "priority": "high",
  "data": {
    "studentId": "student-001",
    "eventType": "exit",
    "studentName": "Aya Kouassi",
    "timestamp": "2024-01-15T16:00:00Z"
  }
}
```

**Règles métier :**
- ❌ Impossible de descendre si pas monté (erreur 409)
- ❌ Impossible de descendre 2 fois (erreur 409)
- ✅ Position GPS capturée automatiquement

---

### 4. Arrêt de trajet

**Quand ?** Le chauffeur clique à nouveau sur le bouton GPS

**Processus :**
1. `GPSService.stopTracking()` appelé
2. HTTP POST → `/api/routes/stop` avec `{ busId }`
3. Backend :
   - Met à jour Bus.status → `hors_service`
4. Timer GPS arrêté

---

## API Backend

### POST `/api/routes/start`

Démarre un trajet et notifie tous les parents du bus.

**Request :**
```json
{
  "busId": "bus-001",
  "driverId": "driver-001"
}
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Route started and parents notified",
  "data": {
    "busId": "bus-001",
    "driverId": "driver-001",
    "timestamp": "2024-01-15T08:00:00.000Z"
  }
}
```

**Erreurs :**
- `400` : busId ou driverId manquant
- `404` : Bus non trouvé
- `500` : Erreur serveur

---

### POST `/api/routes/stop`

Arrête un trajet.

**Request :**
```json
{
  "busId": "bus-001"
}
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Route stopped",
  "data": {
    "busId": "bus-001",
    "timestamp": "2024-01-15T17:00:00.000Z"
  }
}
```

---

### POST `/api/attendance/board`

Enregistre la montée d'un élève.

**Request :**
```json
{
  "studentId": "student-001",
  "busId": "bus-001",
  "driverId": "driver-001",
  "timestamp": 1705305000000,
  "location": {
    "lat": 5.36,
    "lng": -4.008
  },
  "notes": "RAS"
}
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Student successfully boarded",
  "data": {
    "id": "attendance-001",
    "studentId": "student-001",
    "status": "boarded",
    "boardingTime": "2024-01-15T08:30:00.000Z"
  }
}
```

**Erreurs :**
- `400` : Données invalides
- `404` : Élève non trouvé
- `409` : Élève déjà à bord
- `500` : Erreur serveur

---

### POST `/api/attendance/exit`

Enregistre la descente d'un élève.

**Request :**
```json
{
  "studentId": "student-001",
  "busId": "bus-001",
  "driverId": "driver-001",
  "timestamp": 1705327200000,
  "location": {
    "lat": 5.32,
    "lng": -4.03
  }
}
```

**Response 200 :**
```json
{
  "success": true,
  "message": "Student successfully exited",
  "data": {
    "id": "attendance-001",
    "studentId": "student-001",
    "status": "completed",
    "exitTime": "2024-01-15T16:00:00.000Z"
  }
}
```

**Erreurs :**
- `400` : Données invalides
- `404` : Élève non trouvé
- `409` : Élève pas dans le bus / Pas de record de montée

---

## Application Chauffeur

### Interface principale

```
┌─────────────────────────────────────────┐
│  Mes Élèves                    GPS: 🟢  │
│  Bus AB-1234-CI                          │
├─────────────────────────────────────────┤
│  📊 Statistiques                         │
│  ┌──────────────┐  ┌──────────────┐    │
│  │ Total élèves │  │   À bord     │    │
│  │      25      │  │      12      │    │
│  └──────────────┘  └──────────────┘    │
├─────────────────────────────────────────┤
│  👦 Aya Kouassi                 [Monter]│
│  ⚪ Pas encore monté                     │
│                                          │
│  👦 Ibrahim Traoré          [Descendre] │
│  🔵 À bord                               │
│                                          │
│  👦 Fatou Diallo               Terminé   │
│  🟢 Trajet terminé                       │
└─────────────────────────────────────────┘
```

### Workflow chauffeur

**1. Connexion**
```dart
// LoginScreen
Email: chauffeur1@exemple.com
Mot de passe: ••••••••
[Se connecter]
```

**2. Démarrer le trajet**
- Cliquer sur l'icône GPS (🛰️ → 🟢)
- Tous les parents reçoivent une notification
- Position GPS envoyée toutes les 5 secondes

**3. Enregistrer les montées**
- Pour chaque élève : bouton vert "Monter"
- Parents notifiés instantanément
- Statut change à "À bord" (🔵)

**4. Enregistrer les descentes**
- Pour chaque élève à bord : bouton orange "Descendre"
- Parents notifiés instantanément
- Statut change à "Terminé" (🟢)

**5. Arrêter le trajet**
- Cliquer sur l'icône GPS (🟢 → 🛰️)
- Bus passe hors service

---

## Notifications Firebase

### Configuration

**Firestore Collections :**
```
/notifications/{notificationId}
  - type: string (bus_arriving, student_boarded, student_exited)
  - title: string
  - message: string
  - recipientIds: string[] (IDs des parents)
  - priority: string (low, medium, high, urgent)
  - read: boolean
  - sentAt: timestamp
  - data: object (busId, studentId, etc.)
```

**FCM Tokens :**
```
/fcm_tokens/{token}
  - userId: string
  - token: string
  - platform: string (ios, android, web)
  - createdAt: timestamp
  - lastUsedAt: timestamp
```

### Types de notifications

```typescript
enum NotificationType {
  BUS_ARRIVING = 'bus_arriving',
  BUS_DELAYED = 'bus_delayed',
  BUS_BREAKDOWN = 'bus_breakdown',
  STUDENT_ABSENT = 'student_absent',
  STUDENT_BOARDED = 'student_boarded',   // ← Nouveau
  STUDENT_EXITED = 'student_exited',     // ← Nouveau
  ROUTE_CHANGED = 'route_changed',
  MAINTENANCE_DUE = 'maintenance_due',
  GENERAL = 'general',
}

enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}
```

### Déduplication des parents

Si deux élèves ont le même parent :
```typescript
const students = [
  { id: 's1', parentIds: ['p1', 'p2'] },
  { id: 's2', parentIds: ['p2', 'p3'] }, // p2 en commun
];

// Backend déduplique automatiquement
const uniqueParents = new Set();
students.forEach(s => s.parentIds.forEach(p => uniqueParents.add(p)));
// Résultat: ['p1', 'p2', 'p3'] → p2 notifié 1 seule fois
```

---

## Tests

### Tests Backend

#### Tests Unitaires

**NotificationService** (`tests/unit/notification.service.test.ts`)
- ✅ 26 tests qui passent
- ✅ 100% coverage (statements), 96.55% (branches)

Tests `notifyParentsRouteStarted()` :
1. Notification à tous les parents avec déduplication
2. Erreur si bus non trouvé
3. Gestion bus sans élèves
4. Gestion élèves sans parents
5. Nom par défaut si chauffeur non trouvé

**AttendanceService** (`tests/unit/services/attendance.service.test.ts`)
- ✅ 14 tests qui passent
- Tests boarding, exit, history, validation

#### Tests d'Intégration

**Route Routes** (`tests/integration/route.routes.test.ts`)
- ✅ 7 tests qui passent
- ✅ 92% controller coverage

Tests :
1. POST /api/routes/start (succès, erreurs 400, 500)
2. POST /api/routes/stop (succès, erreur 400)

**Attendance Routes** (`tests/integration/attendance.routes.test.ts`)
- ✅ 18 tests qui passent
- Tests tous les endpoints board/exit

### Lancer les tests

```bash
cd backend

# Tous les tests
npm test

# Tests unitaires seulement
npm run test:unit

# Tests intégration seulement
npm run test:integration

# Tests avec coverage
npm test -- --coverage

# Tests spécifiques
npm test -- tests/unit/notification.service.test.ts
npm test -- tests/integration/route.routes.test.ts
```

**Résultats attendus :**
```
Test Suites: 2 passed
Tests:       33 passed (26 unitaires + 7 intégration)
Coverage:    100% statements, 96.55% branches
```

---

## Utilisation

### Scénario complet

**Matin - Aller à l'école**

1. **08:00** - Chauffeur Jean se connecte à l'app
2. **08:05** - Jean clique sur GPS 🟢
   - ✅ Tous les parents reçoivent : "Le bus AB-1234-CI a démarré son trajet avec Jean Dupont"
3. **08:10** - Arrêt 1 : Aya monte
   - ✅ Parents d'Aya reçoivent : "Aya Kouassi est monté(e) dans le bus à 08:10"
4. **08:15** - Arrêt 2 : Ibrahim monte
   - ✅ Parents d'Ibrahim reçoivent la notification
5. **08:40** - Arrivée à l'école : tous descendent
   - ✅ Chaque parent reçoit notification de descente
6. **08:45** - Jean clique sur GPS 🛰️
   - Bus passe hors service

**Après-midi - Retour à la maison**
- Même processus inversé

---

## TODO - Temps réel manquant

### ❌ Dashboard Web (React)

**Problème actuel :** Le dashboard ne se met pas à jour en temps réel.

**Solution nécessaire :** Ajouter Firestore listeners

```typescript
// web-admin/src/hooks/useRealtimeGPS.ts
import { onSnapshot, doc } from 'firebase/firestore';

export function useRealtimeGPS(busId: string) {
  const [position, setPosition] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, 'gps_live', busId),
      (snapshot) => {
        if (snapshot.exists()) {
          setPosition(snapshot.data());
        }
      }
    );

    return () => unsubscribe();
  }, [busId]);

  return position;
}
```

**Pages à mettre à jour :**
- `RealtimeMapPage` : Carte avec position en temps réel
- `DashboardPage` : Stats qui se mettent à jour
- `BusDetailsPage` : Statut du bus en direct

---

### ❌ App Parent (Flutter)

**Problème actuel :** L'app parent ne se met pas à jour en temps réel.

**Solution nécessaire :** Utiliser StreamBuilder

```dart
// mobile-parent/parent_app/lib/screens/main_map_screen.dart
StreamBuilder<DocumentSnapshot>(
  stream: FirebaseFirestore.instance
    .collection('gps_live')
    .doc(busId)
    .snapshots(),
  builder: (context, snapshot) {
    if (snapshot.hasData) {
      final position = snapshot.data!.data();
      // Mettre à jour la carte automatiquement
    }
    return GoogleMap(...);
  },
)
```

**Écrans à mettre à jour :**
- `MainMapScreen` : Position bus en temps réel
- `HomeScreen` : ETA qui se recalcule automatiquement
- Statut élève (monté/descendu) en direct

---

## Statut actuel

| Composant | Backend | Tests | Frontend | Temps réel |
|-----------|---------|-------|----------|------------|
| **Notifications trajet** | ✅ 100% | ✅ 33 tests | ✅ Driver app | ❌ Dashboard |
| **Notifications attendance** | ✅ 100% | ✅ 32 tests | ✅ Driver app | ❌ Dashboard |
| **Position GPS** | ✅ | ✅ | ✅ Driver app | ❌ Parent app |
| **Dashboard web** | ✅ | ✅ | ✅ UI | ❌ Listeners |
| **App parent** | ✅ | ✅ | ✅ UI | ❌ Listeners |

**Prochaine étape :** Implémenter les Firestore listeners pour avoir un système 100% temps réel.

---

## Support & Contact

- **Documentation** : `/docs` dans le repository
- **Issues** : GitHub Issues
- **Tests** : `npm test` dans `/backend`

---

**Version** : 1.0.0
**Dernière mise à jour** : 2024-01-15
**Auteur** : Équipe PROJET_BUS
