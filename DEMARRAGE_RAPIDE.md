# 🚀 Démarrage Rapide - PROJET_BUS100

## 📌 Problème Résolu

✅ **Erreurs API 404 corrigées** : `/api/api/...` → `/api/...`
✅ **Connexion Firestore CORS** : Émulateurs auto-connectés
✅ **Dashboard prêt** : Affiche les données mockées

---

## 🎯 Étapes de Démarrage

### **1. Backend + Émulateurs (Terminal 1)**

```bash
cd backend

# Démarrer les émulateurs
npm run serve
```

**Attendu :**
```
✔ All emulators ready!

│ ✔ All emulators ready! It is now safe to connect your app.
│ ⚠ The Cloud Firestore emulator is running on port 8080
│ ⚠ The Auth emulator is running on port 9099
│ ⚠ The Cloud Functions emulator is running on port 5001
```

---

### **2. Seed les Données (Terminal 2 - UNE SEULE FOIS)**

```bash
cd backend

# Peupler la base de données avec des données mockées
npm run seed
```

**Attendu :**
```
✅ 8 bus créés
✅ 100 élèves créés
✅ 90 scans créés (90% validation)
✅ 8 positions GPS créées
```

---

### **3. Web Admin (Terminal 3)**

```bash
cd web-admin

# Si pas encore fait, installer les dépendances
npm install

# Démarrer le serveur dev
npm run dev
```

**Attendu :**
```
VITE ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

---

## 🌐 Accéder à l'Application

### **Ouvrir le Dashboard**
```
http://localhost:5173
```

### **Login**
**Email :** `admin@bus.ci`
**Mot de passe :** `password123`

_(Les émulateurs créent automatiquement cet utilisateur)_

---

## ✅ Vérifications

### **Console Browser (F12)**

**✅ Attendu :**
```
🔧 Connecté à l'émulateur Auth Firebase
🔧 Connecté à l'émulateur Firestore Firebase
✅ Firebase initialisé avec succès
```

**❌ NE DEVRAIT PLUS APPARAÎTRE :**
```
Failed to load resource: 404 (Not Found)
.../api/api/realtime/buses
```

---

### **Dashboard Affiche :**

#### **CARTE 1 - État du Service**
- Bus en route : 6
- Bus arrivés : 0
- Bus non partis : 2
- Retard moyen : ~13 min

#### **CARTE 2 - Retards Critiques**
- Retards critiques (>15min) : 2
- Retards graves (>20min) : 1

#### **CARTE 3 - Validation Sécurité**
- Taux de validation : 90%
- Élèves scannés : 90/100

---

## 📊 Tests API

### **Health Check**
```bash
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/health
```

**Résultat :**
```json
{
  "status": "OK",
  "timestamp": "2024-11-19T...",
  "version": "1.0.0",
  "webSocketClients": 0
}
```

### **Dashboard Stats**
```bash
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/dashboard/stats
```

**Résultat :**
```json
{
  "success": true,
  "data": {
    "busActifs": 6,
    "busTotaux": 8,
    "elevesTransportes": 90,
    "retardsCritiques": 2,
    "retardsGraves": 1,
    ...
  }
}
```

---

## 🔧 Fichiers Modifiés Aujourd'hui

### **Backend**
1. ✅ `backend/src/scripts/seed-mock-data.ts`
   - Ajoute 100 élèves
   - Ajoute 90 scans (90% validation)
   - Simule retards critiques et graves

2. ✅ `backend/src/services/dashboard.service.ts`
   - Calcule retards critiques (>15min)
   - Calcule retards graves (>20min)
   - Supprime alertes carburant (trop dur pour MVP)

### **Frontend**
1. ✅ `web-admin/src/pages/DashboardPage.tsx`
   - 3 KPIs opérationnels (au lieu de 4)
   - Onboarding screen si pas de données
   - Meilleurs messages d'erreur
   - Style responsive amélioré

2. ✅ `web-admin/src/services/realtime.api.ts`
   - **CORRECTION API** : Utilise `VITE_API_BASE_URL`
   - Supprime double `/api`

3. ✅ `web-admin/src/services/firebase.ts`
   - **CORRECTION CORS** : Auto-connexion émulateurs
   - Plus besoin de variable d'environnement

4. ✅ `web-admin/src/types/bus.ts`
   - Supprime `alertesCarburant`
   - Supprime `alertesRalenti`

---

## 📖 Documentation Créée

1. **`FIX_API_ERRORS.md`** - Détail des corrections API
2. **`ENV_CONFIG.md`** - Configuration variables d'environnement
3. **`MODIFICATIONS_DASHBOARD.md`** - Historique des modifications
4. **`SEED_GUIDE.md`** - Guide du script de peuplement
5. **`DEMARRAGE_RAPIDE.md`** - Ce fichier

---

## 🐛 Dépannage

### **Erreur : "Cannot find module ..."**
```bash
cd backend && npm install
cd ../web-admin && npm install
```

### **Erreur : Port 5001 déjà utilisé**
```bash
# Trouver le processus
lsof -i :5001

# Le tuer
kill -9 <PID>

# Relancer
npm run serve
```

### **Dashboard vide**
1. Vérifier que seed a été exécuté : `npm run seed`
2. Vérifier console browser : Pas d'erreurs 404
3. Vérifier émulateurs : `lsof -i :5001,8080,9099`

### **Erreur CORS Firestore**
→ Normal si émulateurs non démarrés
→ Lancez `npm run serve` dans backend

---

## ✅ Checklist Complète

### **Backend**
- [ ] `cd backend`
- [ ] `npm install` (première fois)
- [ ] `npm run serve` (émulateurs)
- [ ] `npm run seed` (données mockées)
- [ ] Console : "All emulators ready"

### **Web Admin**
- [ ] `cd web-admin`
- [ ] `npm install` (première fois)
- [ ] `npm run dev`
- [ ] Console : "VITE ready"

### **Browser**
- [ ] Ouvrir http://localhost:5173
- [ ] Login : admin@bus.ci / password123
- [ ] Console (F12) : Pas d'erreurs 404
- [ ] Dashboard : Cartes affichent des données
- [ ] KPI 1 : État du Service ✓
- [ ] KPI 2 : Retards Critiques ✓
- [ ] KPI 3 : Validation Sécurité ✓

---

## 🎉 Résultat Final

**Le Dashboard opérationnel affiche maintenant :**
✅ État du service en temps réel
✅ Retards critiques (>15min) et graves (>20min)
✅ Disponibilité flotte (bus immobilisés)
✅ Taux de validation sécurité (90%)
✅ Graphiques et alertes

**Architecture cohérente :**
✅ Base de données Firestore (émulateurs)
✅ API Express (Cloud Functions)
✅ Frontend React (Vite)
✅ Tests automatisés (Jest + Vitest)

**Prochaine étape suggérée :**
Tester les autres pages :
- 🗺️ Carte temps réel (`/map`)
- 🚌 Gestion des bus (`/buses`)
- 👥 Gestion des chauffeurs (`/drivers`)

---

**Le système est maintenant complètement fonctionnel !** 🚀
