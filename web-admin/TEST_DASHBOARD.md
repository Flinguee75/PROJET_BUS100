# 🧪 Guide de Test - Dashboard Opérationnel

## 🚀 Démarrage Rapide

### 1. Lancer le Backend
```bash
cd backend
npm run serve
```

### 2. Lancer le Web Admin
```bash
cd web-admin
npm run dev
```

### 3. Accéder au Dashboard
Ouvrir : http://localhost:5173/ (ou le port Vite affiché)
Se connecter avec un compte admin

---

## 📋 Scénarios de Test

### ✅ Test 1 : État du Service

**Objectif :** Vérifier que les bus sont correctement classés

**Étapes :**
1. Créer/modifier des bus avec différents statuts GPS
2. Observer la carte "État du Service"

**Données de test :**
```json
// Bus en route (gps_live)
{
  "busId": "bus_001",
  "position": {
    "lat": 5.3599,
    "lng": -4.0083,
    "speed": 25,
    "timestamp": Date.now()
  }
}

// Bus à l'arrêt (attente élèves)
{
  "busId": "bus_002",
  "position": {
    "lat": 5.3500,
    "lng": -4.0000,
    "speed": 0,
    "timestamp": Date.now() - (3 * 60 * 1000) // 3 min ago
  }
}

// Bus non parti
{
  "busId": "bus_003",
  "position": {
    "lat": 5.3400,
    "lng": -3.9900,
    "speed": 0,
    "timestamp": Date.now() - (25 * 60 * 1000) // 25 min ago
  }
}
```

**Résultat attendu :**
- Bus 001 → "En route" (vert pulse)
- Bus 002 → "En attente" 
- Bus 003 → "Non parti" ou "Arrivé"

---

### ✅ Test 2 : Retards Critiques

**Objectif :** Vérifier la détection des retards > 15 min et > 20 min

**Étapes :**
1. Créer des positions GPS avec timestamps anciens
2. Observer la carte "Retards Critiques"
3. Vérifier la couleur et le badge

**Données de test :**
```json
// Retard léger (10 min) - ne doit PAS compter
{
  "busId": "bus_ok",
  "position": {
    "timestamp": Date.now() - (10 * 60 * 1000)
  }
}

// Retard critique (17 min) - badge ORANGE
{
  "busId": "bus_retard",
  "position": {
    "timestamp": Date.now() - (17 * 60 * 1000)
  }
}

// Retard grave (25 min) - badge ROUGE PULSE
{
  "busId": "bus_crise",
  "position": {
    "timestamp": Date.now() - (25 * 60 * 1000)
  }
}
```

**Résultat attendu :**
- Retards Critiques : 2
- Retards Graves : 1 (affiché en sous-texte)
- Badge : 🚨 Urgent (rouge, animé)
- Statut global : "Retards Critiques" (rouge)

---

### ✅ Test 3 : Alertes Carburant / Ralenti

**Objectif :** Détecter les bus en ralenti excessif (> 10 min)

**Étapes :**
1. Créer une position GPS : vitesse 0, timestamp il y a 12 min
2. Observer la carte "Alertes Carburant"

**Données de test :**
```json
// Bus en ralenti (moteur allumé, sans bouger)
{
  "busId": "bus_ralenti",
  "position": {
    "speed": 0,
    "timestamp": Date.now() - (12 * 60 * 1000) // 12 min
  }
}

// Bus en panne sèche potentiel (immobilisé > 30 min)
{
  "busId": "bus_carburant",
  "position": {
    "speed": 0,
    "timestamp": Date.now() - (35 * 60 * 1000) // 35 min
  }
}
```

**Résultat attendu :**
- Alertes Carburant : 2
- Badge : 💰 Économie (orange)
- Sous-texte : "2 bus en ralenti > 10 min" ou "2 alertes carburant"

---

### ✅ Test 4 : Validation Sécurité

**Objectif :** Vérifier le taux de validation (scan élèves)

**Étapes :**
1. Créer des élèves dans `students` collection
2. Créer des scans dans `attendance` collection (date = aujourd'hui)
3. Observer la carte "Validation Sécurité"

**Données de test :**
```javascript
// Créer 100 élèves
for (let i = 1; i <= 100; i++) {
  db.collection('students').add({
    firstName: `Élève${i}`,
    lastName: `Test`,
    parentId: 'parent_test'
  });
}

// Créer 90 scans (90% validation)
const today = new Date().toISOString().split('T')[0];
for (let i = 1; i <= 90; i++) {
  db.collection('attendance').add({
    studentId: `student_${i}`,
    busId: 'bus_001',
    date: today,
    type: 'boarding',
    timestamp: new Date()
  });
}
```

**Résultat attendu :**
- Taux Validation : 90%
- Badge : (aucun - entre 85-94%)
- Sous-texte : "10 élèves non scannés"
- Couleur : Orange (warning)

Si 95+ élèves scannés :
- Badge : "✓ Sécurisé" (vert)

---

### ✅ Test 5 : Bus Immobilisés (Disponibilité Flotte)

**Objectif :** Détecter les bus en panne/hors service

**Étapes :**
1. Créer des bus avec status `out_of_service` ou `in_maintenance`
2. Observer :
   - Carte "Disponibilité Flotte" (section secondaire)
   - Badge statut global (doit devenir ROUGE)

**Données de test :**
```javascript
// Créer 10 bus
const busStatuses = [
  { id: 'bus_1', status: 'active' },           // OK
  { id: 'bus_2', status: 'active' },           // OK
  { id: 'bus_3', status: 'active' },           // OK
  { id: 'bus_4', status: 'active' },           // OK
  { id: 'bus_5', status: 'active' },           // OK
  { id: 'bus_6', status: 'active' },           // OK
  { id: 'bus_7', status: 'active' },           // OK
  { id: 'bus_8', status: 'active' },           // OK
  { id: 'bus_9', status: 'out_of_service' },   // 🚨 IMMOBILISÉ
  { id: 'bus_10', status: 'in_maintenance' },  // 🚨 IMMOBILISÉ
];

busStatuses.forEach(bus => {
  db.collection('buses').add({
    plateNumber: `AB-${bus.id}`,
    capacity: 40,
    model: 'Coaster',
    year: 2020,
    status: bus.status,
    maintenanceStatus: 'ok'
  });
});
```

**Résultat attendu :**
- Bus Totaux : 10
- Bus Immobilisés : 2
- Bus Disponibles : 8
- Statut global : **🔴 "Crise Opérationnelle"** (priorité maximale)
- Carte Disponibilité Flotte :
  - Couleur : Rouge
  - Texte : "8 / 10 bus"
  - Sous-texte : "🚨 2 immobilisés"

---

### ✅ Test 6 : Trafic vs Prévision

**Objectif :** Comparer temps réel vs temps prévu

**Calcul automatique :**
Le backend calcule automatiquement :
- `tempsTrajetPrevu` = 35 min (valeur par défaut Abidjan)
- `tempsTrajetMoyen` = calculé en fonction des retards détectés
- `retardMoyen` = moyenne des retards de tous les bus

**Scénarios :**

1. **Circulation fluide**
   - Tous les bus à l'heure
   - `tempsTrajetMoyen` ≤ 35 min
   - Couleur : Vert ✅
   - Texte : "✓ Circulation fluide"

2. **Circulation normale** (+10%)
   - Quelques retards légers
   - `tempsTrajetMoyen` = 38 min
   - Couleur : Orange 🟠
   - Texte : "+9% de retard"

3. **Circulation dense** (+30%)
   - Beaucoup de retards
   - `tempsTrajetMoyen` = 46 min
   - Couleur : Rouge 🔴
   - Texte : "+31% de retard"

**Pas de données à créer manuellement**, tout est calculé en temps réel depuis les GPS.

---

## 🎯 Checklist de Validation

### Fonctionnel
- [ ] Les 4 KPIs principaux s'affichent correctement
- [ ] Les couleurs changent selon les seuils
- [ ] Les badges d'alerte apparaissent au bon moment
- [ ] L'animation pulse fonctionne sur les alertes critiques
- [ ] Le statut global reflète la priorité correcte
- [ ] Les 3 métriques secondaires s'affichent
- [ ] Mise à jour automatique (toutes les 30 secondes)

### UX
- [ ] Design responsive (mobile, tablet, desktop)
- [ ] Icônes appropriées
- [ ] Textes clairs et actionnables
- [ ] Hiérarchie visuelle cohérente
- [ ] Aucune erreur console

### Performance
- [ ] Temps de chargement < 2 secondes
- [ ] Pas de lag lors du rafraîchissement
- [ ] Backend répond < 500ms

---

## 🐛 Dépannage

### Problème : "Les stats ne se mettent pas à jour"
**Solution :**
- Vérifier que le backend est démarré
- Vérifier l'API URL dans `.env` (web-admin)
- Regarder la console réseau (F12)

### Problème : "Toutes les valeurs sont à 0"
**Solution :**
- Vérifier que Firestore contient des données
- Vérifier les permissions Firestore
- Regarder les logs backend : `firebase functions:log`

### Problème : "Bus Immobilisés ne s'affiche pas"
**Solution :**
- Vérifier que des bus ont `status: 'out_of_service'` ou `'in_maintenance'`
- Vérifier le backend `dashboard.service.ts` ligne 71-76

### Problème : "Retards Critiques toujours à 0"
**Solution :**
- Créer des positions GPS avec `timestamp` > 15 min dans le passé
- Collection : `gps_live`
- Exemple : `timestamp: Date.now() - (20 * 60 * 1000)` // 20 min

---

## 📊 Données de Test Complètes (Script)

```javascript
// Script à exécuter dans Firebase Console ou backend

const testData = async () => {
  const db = admin.firestore();
  const now = Date.now();

  // 1. Créer 10 bus
  const buses = [
    { id: 'bus_001', status: 'active', maintenance: 'ok' },
    { id: 'bus_002', status: 'active', maintenance: 'ok' },
    { id: 'bus_003', status: 'active', maintenance: 'ok' },
    { id: 'bus_004', status: 'active', maintenance: 'ok' },
    { id: 'bus_005', status: 'active', maintenance: 'ok' },
    { id: 'bus_006', status: 'active', maintenance: 'warning' }, // Maintenance préventive
    { id: 'bus_007', status: 'active', maintenance: 'warning' },
    { id: 'bus_008', status: 'active', maintenance: 'ok' },
    { id: 'bus_009', status: 'out_of_service', maintenance: 'critical' }, // Immobilisé
    { id: 'bus_010', status: 'in_maintenance', maintenance: 'critical' }, // Immobilisé
  ];

  for (const bus of buses) {
    await db.collection('buses').doc(bus.id).set({
      plateNumber: `AB-${bus.id.slice(-3)}`,
      capacity: 40,
      model: 'Toyota Coaster',
      year: 2020,
      status: bus.status,
      maintenanceStatus: bus.maintenance,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  // 2. Créer positions GPS (mix de situations)
  const gpsData = [
    { busId: 'bus_001', speed: 25, minutesAgo: 1 },   // En route
    { busId: 'bus_002', speed: 30, minutesAgo: 2 },   // En route
    { busId: 'bus_003', speed: 0, minutesAgo: 3 },    // En attente
    { busId: 'bus_004', speed: 0, minutesAgo: 12 },   // Ralenti excessif
    { busId: 'bus_005', speed: 0, minutesAgo: 18 },   // Retard critique
    { busId: 'bus_006', speed: 0, minutesAgo: 23 },   // Retard grave
    { busId: 'bus_007', speed: 15, minutesAgo: 4 },   // En route
    { busId: 'bus_008', speed: 0, minutesAgo: 65 },   // Arrivé
  ];

  for (const gps of gpsData) {
    await db.collection('gps_live').doc(gps.busId).set({
      position: {
        lat: 5.35 + Math.random() * 0.1,
        lng: -4.00 + Math.random() * 0.1,
        speed: gps.speed,
        heading: 90,
        accuracy: 10,
        timestamp: now - (gps.minutesAgo * 60 * 1000)
      },
      status: gps.speed > 0 ? 'moving' : 'stopped',
      updatedAt: new Date()
    });
  }

  // 3. Créer 100 élèves
  for (let i = 1; i <= 100; i++) {
    await db.collection('students').add({
      firstName: `Élève${i}`,
      lastName: `Test`,
      parentId: `parent_${i}`,
      createdAt: new Date()
    });
  }

  // 4. Créer 90 scans (90% validation)
  const today = new Date().toISOString().split('T')[0];
  for (let i = 1; i <= 90; i++) {
    await db.collection('attendance').add({
      studentId: `student_${i}`,
      busId: 'bus_001',
      date: today,
      type: 'boarding',
      timestamp: new Date()
    });
  }

  console.log('✅ Données de test créées avec succès !');
  console.log('📊 Résumé attendu :');
  console.log('  - Bus Totaux: 10');
  console.log('  - Bus Immobilisés: 2');
  console.log('  - Bus En Route: 3');
  console.log('  - Retards Critiques: 2');
  console.log('  - Retards Graves: 1');
  console.log('  - Alertes Ralenti: 1');
  console.log('  - Taux Validation: 90%');
};

testData();
```

---

## ✅ Validation Finale

Après avoir exécuté tous les tests, le Dashboard doit afficher :

**KPIs Principaux :**
- 🟢 **État du Service** : 3 en route, 1 arrivé, 0 non parti
- 🔴 **Retards Critiques** : 2 (dont 1 > 20 min)
- 🟠 **Alertes Carburant** : 1 bus en ralenti
- 🟠 **Validation Sécurité** : 90%

**Statut Global :**
- 🔴 **"Crise Opérationnelle"** (à cause des 2 bus immobilisés)

**Métriques Secondaires :**
- **Trafic vs Prévision** : ~42 min / 35 min prévu (+20%)
- **Disponibilité Flotte** : 8 / 10 bus (2 immobilisés)
- **Maintenance** : 2 bloquants + 2 préventives

---

**Date :** 19 novembre 2024  
**Version Dashboard :** 2.0.0 Opérationnel  
**Statut Tests :** ✅ Prêt pour exécution

