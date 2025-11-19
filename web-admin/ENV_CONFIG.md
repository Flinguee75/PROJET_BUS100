# 🔧 Configuration Variables d'Environnement

## 📋 Fichier .env.local

Créez un fichier `.env.local` à la racine de `web-admin/` avec ce contenu :

```env
# URL de base de l'API (SANS /api à la fin !)
VITE_API_BASE_URL=http://localhost:5001/projet-bus-60a3f/europe-west4

# Firebase Configuration (Émulateurs en local)
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_FIREBASE_STORAGE_BUCKET=projet-bus-60a3f.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=demo-sender-id
VITE_FIREBASE_APP_ID=demo-app-id

# Mode émulateur
VITE_USE_EMULATORS=true
```

---

## ⚠️ Important

### **URL de l'API**

❌ **INCORRECT** (causera des erreurs 404) :
```env
VITE_API_BASE_URL=http://localhost:5001/projet-bus-60a3f/europe-west4/api
```
→ Résultat : `/api/api/dashboard/stats` (double `/api`)

✅ **CORRECT** :
```env
VITE_API_BASE_URL=http://localhost:5001/projet-bus-60a3f/europe-west4
```
→ Résultat : `/api/dashboard/stats` (correct)

---

## 🔍 Vérification

### **Tester la Configuration**

```bash
# Démarrer le backend
cd backend
npm run serve

# Dans un nouveau terminal
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/health
```

**Résultat attendu :**
```json
{
  "status": "OK",
  "timestamp": "2024-11-19T04:00:00.000Z",
  "version": "1.0.0",
  "webSocketClients": 0
}
```

---

## 📁 Structure des URLs

### **Services API**

Tous les services doivent utiliser `VITE_API_BASE_URL` **sans** `/api` à la fin :

```typescript
// ✅ CORRECT
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 
  'http://localhost:5001/projet-bus-60a3f/europe-west4';

// Appels API
`${API_BASE_URL}/api/dashboard/stats`  // ✅
`${API_BASE_URL}/api/buses`            // ✅
`${API_BASE_URL}/api/realtime/buses`   // ✅
```

```typescript
// ❌ INCORRECT
const API_URL = import.meta.env.VITE_API_URL || 
  'http://localhost:5001/projet-bus-60a3f/europe-west4/api';

// Appels API
`${API_URL}/api/dashboard/stats`  // ❌ /api/api/dashboard/stats
`${API_URL}/api/buses`            // ❌ /api/api/buses
```

---

## 🚀 Création du Fichier

### **Méthode 1 : Commande Rapide**

```bash
cd web-admin

cat > .env.local << 'EOF'
VITE_API_BASE_URL=http://localhost:5001/projet-bus-60a3f/europe-west4
VITE_FIREBASE_API_KEY=demo-api-key
VITE_FIREBASE_AUTH_DOMAIN=localhost
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_FIREBASE_STORAGE_BUCKET=projet-bus-60a3f.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=demo-sender-id
VITE_FIREBASE_APP_ID=demo-app-id
VITE_USE_EMULATORS=true
EOF
```

### **Méthode 2 : Éditeur**

```bash
cd web-admin
nano .env.local
# Copier-coller le contenu ci-dessus
# Ctrl+X, Y, Enter pour sauvegarder
```

---

## 🔄 Après Modification

**Important :** Vite ne détecte pas les changements de `.env` automatiquement.

```bash
# Arrêter le serveur (Ctrl+C)
# Relancer
npm run dev
```

---

## 🌐 Endpoints Disponibles

Avec la bonne configuration, ces URLs fonctionnent :

### **Health Check**
```
GET http://localhost:5001/projet-bus-60a3f/europe-west4/api/health
```

### **Dashboard**
```
GET http://localhost:5001/projet-bus-60a3f/europe-west4/api/dashboard/stats
```

### **Bus**
```
GET http://localhost:5001/projet-bus-60a3f/europe-west4/api/buses
GET http://localhost:5001/projet-bus-60a3f/europe-west4/api/buses/:id
```

### **GPS**
```
POST http://localhost:5001/projet-bus-60a3f/europe-west4/api/gps
GET http://localhost:5001/projet-bus-60a3f/europe-west4/api/gps/:busId
```

---

## ✅ Checklist

- [ ] Fichier `.env.local` créé dans `web-admin/`
- [ ] `VITE_API_BASE_URL` **sans** `/api` à la fin
- [ ] Backend démarré (`npm run serve`)
- [ ] Web-admin relancé après modification .env
- [ ] Test `curl` fonctionne
- [ ] Console browser : pas d'erreurs 404 sur `/api/api/...`

---

## 🐛 Dépannage

### **Erreur : 404 sur `/api/api/...`**

→ Vérifiez que `VITE_API_BASE_URL` ne contient PAS `/api` à la fin

### **Erreur : CORS Firestore**

→ Normal en émulateur, ignorez ces erreurs ou ajoutez :
```typescript
// Dans firebase.ts
if (import.meta.env.DEV) {
  connectFirestoreEmulator(db, 'localhost', 8080);
}
```

### **Erreur : Variables non chargées**

→ Relancez le serveur Vite après modification `.env`

---

**Fichiers modifiés :**
- ✅ `src/services/realtime.api.ts` (utilise maintenant `VITE_API_BASE_URL`)
- ✅ Créé `ENV_CONFIG.md` (ce fichier)

