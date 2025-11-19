# 🌱 Guide Script de Seed - Données Mockées

## 📋 Vue d'ensemble

Le script `seed-mock-data.ts` crée des données de test réalistes pour le système de transport scolaire d'Abidjan.

---

## 🚀 Utilisation

### **Commande Simple**
```bash
cd backend
npm run seed
```

### **Avec ts-node directement**
```bash
cd backend
npx ts-node src/scripts/seed-mock-data.ts
```

---

## 📊 Données Créées

### **8 Conducteurs**
```
- Kouassi Jean (+225 07 12 34 56 78)
- Traoré Mamadou (+225 07 23 45 67 89)
- Koné Awa (+225 07 34 56 78 90)
- Ouattara Ibrahim (+225 07 45 67 89 01)
- Bamba Sébastien (+225 07 56 78 90 12)
- Coulibaly Fatou (+225 07 67 89 01 23)
- Diallo Moussa (+225 07 78 90 12 34)
- Sanogo Adama (+225 07 89 01 23 45)
```

### **5 Routes Abidjan**
```
Route 1: Cocody → Plateau
Route 2: Yopougon → Adjamé
Route 3: Abobo → Plateau
Route 4: Treichville → Cocody
Route 5: Marcory → Plateau
```

### **8 Bus avec Statuts Variés**
```
Bus 1: CI 1000 AB 10 - En route (25 élèves) ✅
Bus 2: CI 1001 AB 11 - En route (30 élèves) ✅
Bus 3: CI 1002 AB 12 - En route (18 élèves) 🚨 RETARD 18 min
Bus 4: CI 1003 AB 13 - Arrêté (15 élèves) ⏸️
Bus 5: CI 1004 AB 14 - En route (28 élèves) 🔴 RETARD 23 min
Bus 6: CI 1005 AB 15 - Ralenti (12 élèves) 🐌
Bus 7: CI 1006 AB 16 - Hors course 🚫
Bus 8: CI 1007 AB 17 - Hors course 🚫
```

**Modèles :**
- Mercedes Sprinter (Bus pairs)
- Toyota Coaster (Bus impairs)

**Années :** 2020-2023 (répartition équitable)

### **100 Élèves**
```
Élève1 Test → parent-1
Élève2 Test → parent-1 (2 enfants par parent)
Élève3 Test → parent-2
...
Élève100 Test → parent-50
```

**Niveaux :** CE1, CE2, CE3, CE4, CE5 (rotation)  
**École :** École Primaire Cocody

### **90 Scans (90% Validation)**
```
student-1 → bus-1 (boarding)
student-2 → bus-2 (boarding)
...
student-90 → bus-6 (boarding)
```

**Date :** Aujourd'hui (dynamique)  
**Type :** Montée (boarding)  
**Localisation :** Coordonnées GPS aléatoires Abidjan

---

## 🎯 Scénarios de Test Inclus

### ✅ **Bus Normaux** (Bus 1, 2, 6)
- Position GPS récente (2-3 min)
- Vitesse normale (30-45 km/h)
- Pas de retard

### 🟠 **Retard Critique** (Bus 3)
- Dernière position : il y a **18 minutes**
- Détection : Retard > 15 min
- Badge Dashboard : ⚠️ Attention (orange)

### 🔴 **Retard Grave** (Bus 5)
- Dernière position : il y a **23 minutes**
- Détection : Retard > 20 min
- Badge Dashboard : 🚨 Urgent (rouge + pulse)

### ⏸️ **Bus en Attente** (Bus 4)
- Vitesse : 0 km/h
- Dernière position : il y a 4 minutes
- État : Arrêt normal (attente élèves)

### 🐌 **Bus au Ralenti** (Bus 6)
- Vitesse : 3 km/h (ralenti)
- Dernière position : il y a 2 minutes
- État : Idle (peut-être en train de stationner)

### 🚫 **Bus Hors Service** (Bus 7 et 8)
- Statut : INACTIVE
- Pas de position GPS
- Pas d'élèves
- Affichage Dashboard : "Bus Immobilisés"

---

## 📍 Zones GPS d'Abidjan

**Coordonnées Réelles Utilisées :**

```typescript
Cocody     : 5.3473, -3.9875
Yopougon   : 5.3365, -4.0872
Abobo      : 5.4235, -4.0196
Adjamé     : 5.3567, -4.0239
Plateau    : 5.3223, -4.0415
Treichville: 5.2947, -4.0093
Marcory    : 5.2886, -3.9863
Koumassi   : 5.2975, -3.9489
```

Les positions GPS des bus sont interpolées le long des routes avec des waypoints intermédiaires.

---

## 🔍 Collections Firestore Créées

### **`/users`** (Conducteurs)
```json
{
  "name": "Kouassi Jean",
  "phone": "+225 07 12 34 56 78",
  "role": "driver",
  "createdAt": Timestamp,
  "updatedAt": Timestamp
}
```

### **`/routes`**
```json
{
  "name": "Cocody → Plateau",
  "fromZone": "Cocody",
  "toZone": "Plateau",
  "stops": [
    { "lat": 5.3473, "lng": -3.9875 },
    // ... waypoints
  ],
  "active": true
}
```

### **`/buses`**
```json
{
  "plateNumber": "CI 1000 AB 10",
  "capacity": 35,
  "model": "Mercedes Sprinter",
  "year": 2020,
  "driverId": "driver-1",
  "routeId": "route-1",
  "status": "active",
  "maintenanceStatus": "ok"
}
```

### **`/gps_live`**
```json
{
  "busId": "bus-1",
  "position": {
    "lat": 5.347,
    "lng": -3.988,
    "speed": 35,
    "heading": 90,
    "accuracy": 12,
    "timestamp": 1700000000000
  },
  "driverId": "driver-1",
  "routeId": "route-1",
  "status": "en_route",
  "passengersCount": 25
}
```

### **`/students`**
```json
{
  "firstName": "Élève1",
  "lastName": "Test",
  "parentId": "parent-1",
  "grade": "CE1",
  "school": "École Primaire Cocody"
}
```

### **`/attendance`**
```json
{
  "studentId": "student-1",
  "busId": "bus-1",
  "date": "2024-11-19",
  "type": "boarding",
  "timestamp": Timestamp,
  "location": {
    "lat": 5.35,
    "lng": -4.00
  }
}
```

---

## 🧪 Utilisation pour Tests

### **Test 1 : Dashboard Complet**
```bash
npm run seed
# Puis ouvrir http://localhost:5173
# Attendre 30 secondes pour le rafraîchissement
```

**Résultat attendu :**
- État du Service : 4 en route, 1 arrêté
- Retards Critiques : 2 (dont 1 grave)
- Validation Sécurité : 90%

### **Test 2 : Carte Temps Réel**
```bash
npm run seed
# Aller sur "Carte Temps Réel"
```

**Résultat attendu :**
- 6 bus visibles sur la carte d'Abidjan
- Marqueurs colorés selon statut
- Info-bulles avec détails bus

### **Test 3 : Gestion des Bus**
```bash
npm run seed
# Aller sur "Gestion des Bus"
```

**Résultat attendu :**
- Liste de 8 bus
- Filtres fonctionnels
- Détails bus consultables

---

## 🔄 Recréer les Données

### **Supprimer et Recréer**
```bash
# 1. Ouvrir l'UI Emulator
open http://localhost:4000/firestore

# 2. Cliquer sur "Clear all data"

# 3. Relancer le seed
npm run seed
```

### **Modifier les Données**

**Fichier :** `src/scripts/seed-mock-data.ts`

**Exemples de modifications :**

```typescript
// Changer le nombre d'élèves
const studentCount = 200; // Au lieu de 100

// Changer le taux de validation
const scannedCount = 180; // 90% de 200

// Ajouter un retard différent
const busStatuses = [
  { status: BusLiveStatus.EN_ROUTE, speed: 35, passengersCount: 25, minutesAgo: 30 }, // Retard 30 min
  // ...
];
```

Puis relancer : `npm run seed`

---

## 🚨 Dépannage

### ❌ **"Cannot find module"**

**Solution :**
```bash
npm install
npm run build
npm run seed
```

### ❌ **"Firebase Admin SDK error"**

**Solution :**
```bash
# Vérifier que le fichier service account existe
ls -la projet-bus-60a3f-firebase-adminsdk-*.json

# Si manquant, télécharger depuis Firebase Console
# Settings → Service Accounts → Generate new private key
```

### ❌ **"Firestore not initialized"**

**Solution :**
```bash
# S'assurer que Firebase est configuré
firebase use projet-bus-60a3f

# Vérifier .firebaserc
cat .firebaserc
```

---

## 📈 Statistiques Attendues sur Dashboard

Après `npm run seed`, vous devriez voir :

```
📊 Métriques Dashboard :
  - Bus Totaux : 8
  - Bus Actifs : 6
  - Bus Immobilisés : 0
  - Élèves : 100
  - Scans : 90 (90% validation)
  - En Route : 4
  - Arrêtés : 1
  - Ralenti : 1
  - Retards Critiques : 2
  - Retards Graves : 1
```

---

## 💡 Conseils

### **Performance**
- Le script prend ~5-10 secondes
- 100 élèves créés séquentiellement
- Optimisé avec `Timestamp.now()`

### **Firestore**
- Les données sont dans l'émulateur (pas en prod)
- Utiliser Firebase UI pour visualiser : http://localhost:4000

### **Personnalisation**
- Modifier les zones GPS pour votre ville
- Ajuster les noms de conducteurs
- Changer les modèles de bus
- Adapter les horaires de retard

---

## ✨ Résumé

**En une commande :**
```bash
npm run seed
```

**Vous obtenez :**
- ✅ 8 bus réalistes
- ✅ 100 élèves avec validation 90%
- ✅ Positions GPS temps réel
- ✅ Retards critiques simulés
- ✅ Routes d'Abidjan authentiques
- ✅ Données cohérentes et testables

**Prêt pour tester le Dashboard MVP !** 🎉

---

**Fichier source :** `backend/src/scripts/seed-mock-data.ts`  
**Commande :** `npm run seed`  
**Durée :** ~5-10 secondes

