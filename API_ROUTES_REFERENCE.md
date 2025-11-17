# 📚 Référence des Routes API - PROJET_BUS

## ✅ État de l'uniformisation

**Date:** 2025-11-17
**Statut:** ✅ Routes frontend et backend uniformisées

Tous les décalages entre les routes backend et frontend ont été résolus. Le backend supporte maintenant à la fois les routes originales et les alias de compatibilité.

---

## 🚀 Base URL

### Développement (Émulateurs)
```
http://localhost:5001/projet-bus-60a3f/europe-west4/api
```

### Production
```
https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api
```

---

## 📋 Table des Matières

1. [Routes GPS](#routes-gps)
2. [Routes Bus](#routes-bus)
3. [Routes Dashboard](#routes-dashboard)
4. [Routes Système](#routes-système)
5. [Résumé des décalages corrigés](#résumé-des-décalages-corrigés)

---

## 🛰️ Routes GPS

### 1. Mettre à jour la position GPS
```http
POST /api/gps/update
```

**Utilisé par:** Application mobile conducteur

**Body:**
```json
{
  "busId": "string",
  "lat": -90 à 90,
  "lng": -180 à 180,
  "speed": 0 à 200,
  "heading": 0 à 360 (optionnel),
  "accuracy": number (optionnel),
  "timestamp": number
}
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Position GPS mise à jour",
  "data": {
    "busId": "string",
    "position": { "lat": number, "lng": number, "speed": number },
    "status": "en_route",
    "lastUpdate": "2025-11-17T10:00:00Z"
  }
}
```

---

### 2. Position GPS actuelle (Route originale)
```http
GET /api/gps/live/:busId
```

**Utilisé par:** Backend interne

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "busId": "string",
    "position": { "lat": number, "lng": number, "speed": number },
    "driverId": "string",
    "routeId": "string",
    "status": "en_route",
    "passengersCount": 0,
    "lastUpdate": "2025-11-17T10:00:00Z"
  }
}
```

---

### 2b. Position GPS actuelle (Alias frontend) ✨ NOUVEAU
```http
GET /api/buses/:busId/position
```

**Utilisé par:** Frontend web-admin

**Alias de:** `/api/gps/live/:busId`

**Réponse:** Identique à la route originale ci-dessus

**Exemple:**
```bash
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/buses/bus123/position
```

---

### 3. Toutes les positions GPS en temps réel
```http
GET /api/gps/live
```

**Utilisé par:** Dashboard admin (optionnel, frontend utilise Firestore)

**Réponse (200):**
```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "busId": "string",
      "position": { "lat": number, "lng": number, "speed": number },
      "status": "en_route",
      "lastUpdate": "2025-11-17T10:00:00Z"
    }
  ]
}
```

---

### 4. Historique GPS (Route originale)
```http
GET /api/gps/history/:busId?date=YYYY-MM-DD
```

**Utilisé par:** Backend interne

**Query params:**
- `date` (optionnel): Format YYYY-MM-DD, défaut = aujourd'hui

**Réponse (200):**
```json
{
  "success": true,
  "busId": "bus123",
  "date": "2025-11-17",
  "count": 120,
  "data": [
    {
      "busId": "bus123",
      "position": { "lat": 36.8065, "lng": 10.1815, "speed": 45 },
      "timestamp": "2025-11-17T08:00:00Z",
      "eventType": "departure"
    }
  ]
}
```

---

### 4b. Historique GPS (Alias frontend) ✨ NOUVEAU
```http
GET /api/buses/:busId/history?date=YYYY-MM-DD
```

**Utilisé par:** Frontend web-admin (BusDetailsPage)

**Alias de:** `/api/gps/history/:busId`

**Réponse:** Identique à la route originale ci-dessus

**Exemple:**
```bash
curl "http://localhost:5001/projet-bus-60a3f/europe-west4/api/buses/bus123/history?date=2025-11-17"
```

---

### 5. Calculer ETA (Temps d'arrivée estimé)
```http
POST /api/gps/calculate-eta
```

**Utilisé par:** Application mobile parent (fonctionnalité ETA)

**Body:**
```json
{
  "currentLat": 36.8065,
  "currentLng": 10.1815,
  "destLat": 36.8310,
  "destLng": 10.1929,
  "currentSpeed": 50
}
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "etaMinutes": 12,
    "etaText": "12 minutes"
  }
}
```

**Note:** Retourne `etaMinutes: -1` si `currentSpeed = 0`

---

## 🚌 Routes Bus

### 6. Créer un nouveau bus
```http
POST /api/buses
```

**Body:**
```json
{
  "plateNumber": "TU 123 TN 456",
  "capacity": 50,
  "model": "Mercedes-Benz Sprinter",
  "year": 2023
}
```

**Validation:**
- `plateNumber`: Format `^[A-Z0-9-]+$`
- `capacity`: 10-100
- `year`: 2000 à année courante + 1

**Réponse (201):**
```json
{
  "success": true,
  "data": {
    "id": "bus123",
    "plateNumber": "TU 123 TN 456",
    "capacity": 50,
    "model": "Mercedes-Benz Sprinter",
    "year": 2023,
    "status": "active",
    "maintenanceStatus": "ok",
    "driverId": null,
    "routeId": null,
    "createdAt": "2025-11-17T10:00:00Z",
    "updatedAt": "2025-11-17T10:00:00Z"
  }
}
```

---

### 7. Liste de tous les bus
```http
GET /api/buses?live=true
```

**Query params:**
- `live` (optionnel): `true` pour inclure les positions GPS en temps réel

**Réponse (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "bus123",
      "plateNumber": "TU 123 TN 456",
      "capacity": 50,
      "model": "Mercedes-Benz Sprinter",
      "status": "active",
      "currentPosition": {
        "lat": 36.8065,
        "lng": 10.1815,
        "speed": 45,
        "timestamp": 1700218800000
      }
    }
  ]
}
```

---

### 8. Détails d'un bus spécifique
```http
GET /api/buses/:busId
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "bus123",
    "plateNumber": "TU 123 TN 456",
    "capacity": 50,
    "model": "Mercedes-Benz Sprinter",
    "year": 2023,
    "status": "active",
    "maintenanceStatus": "ok"
  }
}
```

**Erreur (404):**
```json
{
  "success": false,
  "error": "Bus not found"
}
```

---

### 9. Mettre à jour un bus
```http
PUT /api/buses/:busId
```

**Body (tous les champs optionnels):**
```json
{
  "plateNumber": "TU 999 TN 888",
  "capacity": 60,
  "status": "in_maintenance",
  "driverId": "driver456",
  "routeId": "route789"
}
```

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "id": "bus123",
    "plateNumber": "TU 999 TN 888",
    "capacity": 60,
    "status": "in_maintenance"
  }
}
```

---

### 10. Supprimer un bus
```http
DELETE /api/buses/:busId
```

**Réponse (200):**
```json
{
  "success": true,
  "message": "Bus with ID bus123 deleted successfully"
}
```

---

## 📊 Routes Dashboard

### 11. Statistiques du dashboard
```http
GET /api/dashboard/stats
```

**Utilisé par:** Page d'accueil admin (rafraîchi toutes les 30s)

**Réponse (200):**
```json
{
  "success": true,
  "data": {
    "busActifs": 12,
    "busTotaux": 15,
    "elevesTransportes": 320,
    "busEnRetard": 2,
    "totalTrajets": 8,
    "alertesMaintenance": 3
  }
}
```

---

## ⚙️ Routes Système

### 12. Health Check
```http
GET /health
```

**Réponse (200):**
```json
{
  "status": "ok",
  "service": "Transport Scolaire API",
  "timestamp": "2025-11-17T10:00:00Z",
  "websocketClients": 5
}
```

---

## 🔧 Résumé des décalages corrigés

### ✅ Problèmes résolus

#### 1. Position GPS actuelle
- **Avant:** Frontend appelait `/api/buses/{busId}/position` → ❌ 404 Not Found
- **Après:** Route alias ajoutée → ✅ Fonctionne
- **Fichier:** `backend/src/routes/bus.routes.ts:31`

#### 2. Historique GPS
- **Avant:** Frontend appelait `/api/buses/{busId}/history` → ❌ 404 Not Found
- **Après:** Route alias ajoutée → ✅ Fonctionne
- **Fichier:** `backend/src/routes/bus.routes.ts:40`

### 📝 Routes compatibles

Les routes backend supportent maintenant **deux conventions** :

| Frontend (web-admin) | Backend (original) | Statut |
|---------------------|-------------------|--------|
| `GET /api/buses/:busId/position` | `GET /api/gps/live/:busId` | ✅ Alias ajouté |
| `GET /api/buses/:busId/history` | `GET /api/gps/history/:busId` | ✅ Alias ajouté |
| `GET /api/buses` | `GET /api/buses` | ✅ Déjà compatible |
| `POST /api/buses` | `POST /api/buses` | ✅ Déjà compatible |
| `GET /api/dashboard/stats` | `GET /api/dashboard/stats` | ✅ Déjà compatible |

---

## 🚀 Démarrage des émulateurs

### Option 1 : Depuis la racine
```bash
npm run start
```

### Option 2 : Depuis /backend
```bash
cd backend
npm run serve
```

### Émulateurs démarrés
- ✅ Auth (port 9099)
- ✅ Firestore (port 8080)
- ✅ Functions (port 5001)
- ✅ UI (port 4000)

---

## 📚 Fichiers modifiés

1. **firebase.json** - Ajout de l'émulateur Auth
2. **backend/package.json** - Script `serve` mis à jour
3. **backend/src/routes/bus.routes.ts** - Routes alias ajoutées
4. **package.json** (racine) - Scripts de démarrage simplifiés
5. **DEMARRAGE_BACKEND.md** - Documentation mise à jour

---

## 🎯 Prochaines étapes

1. ✅ Routes uniformisées
2. ✅ Émulateur Auth configuré
3. ✅ Scripts de démarrage simplifiés
4. ⏳ Tester l'intégration complète
5. ⏳ Déployer en production

---

**Documentation générée le:** 2025-11-17
**Version API:** 1.0.0
**Projet:** PROJET_BUS (projet-bus-60a3f)
