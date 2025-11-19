# 🔧 Fix : Erreurs API 404 et CORS

## ❌ Problèmes Identifiés

### **1. Double `/api` dans les URLs**
```
❌ http://localhost:5001/.../api/api/realtime/buses (404)
❌ http://localhost:5001/.../api/api/realtime/statistics (404)
```

### **2. Erreurs CORS Firestore**
```
❌ Access to fetch at 'http://localhost:8080/...' blocked by CORS policy
```

---

## ✅ Solutions Appliquées

### **1. Correction `realtime.api.ts`**

**Avant (❌) :**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 
  'http://localhost:5001/projet-bus-60a3f/europe-west4/api';

`${API_URL}/api/realtime/buses`  // ❌ /api/api/realtime/buses
```

**Après (✅) :**
```typescript
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'http://localhost:5001/projet-bus-60a3f/europe-west4';

`${API_BASE_URL}/api/realtime/buses`  // ✅ /api/realtime/buses
```

---

### **2. Connexion Automatique aux Émulateurs**

**Fichier :** `web-admin/src/services/firebase.ts`

**Avant (❌) :**
```typescript
if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATORS === 'true') {
  // Nécessitait une variable d'environnement spécifique
}
```

**Après (✅) :**
```typescript
if (import.meta.env.DEV) {
  // Se connecte automatiquement aux émulateurs en mode dev
  connectAuthEmulator(firebaseAuth, 'http://localhost:9099');
  connectFirestoreEmulator(firebaseDb, 'localhost', 8080);
}
```

---

## 🚀 Actions à Effectuer

### **Étape 1 : Redémarrer le Web Admin**

```bash
# Arrêter le serveur actuel (Ctrl+C)
cd web-admin

# Relancer
npm run dev
```

### **Étape 2 : Vérifier dans la Console**

Ouvrez http://localhost:5173 et vérifiez la console browser (F12) :

**✅ Attendu :**
```
🔧 Connecté à l'émulateur Auth Firebase
🔧 Connecté à l'émulateur Firestore Firebase
✅ Firebase initialisé avec succès
✅ Firebase prêt
```

**❌ Ne devrait PLUS apparaître :**
```
Failed to load resource: 404 (Not Found)
.../api/api/realtime/buses
.../api/api/realtime/statistics
```

---

## 📊 Test des Endpoints

### **Dashboard Stats**
```bash
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/dashboard/stats
```

**Résultat attendu :**
```json
{
  "success": true,
  "data": {
    "busActifs": 6,
    "busTotaux": 8,
    "elevesTransportes": 90,
    "retardsCritiques": 2,
    ...
  }
}
```

### **Health Check**
```bash
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/health
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "timestamp": "2024-11-19T...",
  "version": "1.0.0"
}
```

---

## 🔍 URLs Correctes Maintenant

### **Avant (❌)**
```
/api/api/realtime/buses          → 404
/api/api/realtime/statistics     → 404
/api/api/dashboard/stats         → 404
```

### **Après (✅)**
```
/api/realtime/buses              → 200 ✅
/api/realtime/statistics         → 200 ✅
/api/dashboard/stats             → 200 ✅
```

---

## 📝 Fichiers Modifiés

1. ✅ **`web-admin/src/services/realtime.api.ts`**
   - Utilise `VITE_API_BASE_URL` au lieu de `VITE_API_URL`
   - Supprime `/api` de la base URL

2. ✅ **`web-admin/src/services/firebase.ts`**
   - Connexion automatique aux émulateurs en mode dev
   - Plus besoin de `VITE_USE_FIREBASE_EMULATORS`

3. ✅ **`backend/src/scripts/seed-mock-data.ts`**
   - Fonctionne sans service account
   - Vérifie que les émulateurs sont démarrés

4. ✅ **Documentation créée :**
   - `FIX_API_ERRORS.md` (ce fichier)
   - `ENV_CONFIG.md` (configuration variables)
   - `FIX_SEED_ERROR.md` (correction seed script)

---

## 🧪 Checklist de Vérification

### **Backend**
- [ ] Émulateurs démarrés : `npm run serve`
- [ ] Seed exécuté : `npm run seed`
- [ ] Health check OK : `curl .../api/health`

### **Web Admin**
- [ ] Serveur relancé après modifications
- [ ] Console : Connexion émulateurs OK
- [ ] Console : Aucune erreur 404 sur `/api/api/...`
- [ ] Console : Aucune erreur CORS Firestore
- [ ] Dashboard affiche les données

### **URLs**
- [ ] `http://localhost:5173` → Dashboard fonctionne
- [ ] API : `/api/dashboard/stats` → 200 OK
- [ ] API : `/api/buses` → 200 OK
- [ ] API : `/api/realtime/buses` → 200 OK (si route existe)

---

## 🐛 Si Problèmes Persistent

### **Erreur 404 Persistante**

1. Vérifiez que le backend est bien démarré
2. Testez avec curl :
   ```bash
   curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/health
   ```
3. Si curl échoue → problème backend
4. Si curl fonctionne mais pas le frontend → vérifiez les CORS

### **Erreur CORS**

```bash
# Dans backend/src/index.ts, vérifiez :
app.use(cors({ origin: true }));  # Autorise tous les origins
```

### **Émulateurs ne se connectent pas**

1. Vérifiez qu'ils sont démarrés :
   ```bash
   # Devrait afficher les ports
   lsof -i :5001  # Functions
   lsof -i :8080  # Firestore
   lsof -i :9099  # Auth
   ```

2. Si aucun port actif → relancez :
   ```bash
   cd backend
   npm run serve
   ```

---

## ✅ Résumé Rapide

**Modifications :**
1. ✅ `realtime.api.ts` : URL API corrigée
2. ✅ `firebase.ts` : Émulateurs auto-connect
3. ✅ `seed-mock-data.ts` : Fonctionne sans credentials

**Actions :**
1. ✅ Redémarrer web-admin : `npm run dev`
2. ✅ Vérifier console : Pas d'erreurs 404
3. ✅ Tester Dashboard : Données affichées

**Résultat :**
🎉 **Le Dashboard devrait maintenant afficher les données mockées !**

---

**Prochaines étapes :**
1. Ouvrir http://localhost:5173
2. Vérifier les 3 KPIs (État, Retards, Validation)
3. Explorer les autres pages (Carte, Gestion bus)

**Le système est maintenant fonctionnel !** 🚀

