# 🚀 Quick Start - Transport Scolaire

## ⚡ Démarrage Rapide (5 minutes)

### 1️⃣ Vérifier le Setup

```bash
# Exécuter le script de vérification
bash verify-setup.sh

# Devrait afficher: ✅ Setup complet validé!
```

### 2️⃣ Démarrer le Backend

```bash
cd backend

# Build TypeScript
npm run build

# Lancer les tests
npm test

# Démarrer l'émulateur Firebase
npm run serve
```

L'API est disponible sur: `http://localhost:5001/projet-bus-60a3f/europe-west4/api`

### 3️⃣ Tester l'API

```bash
# Health check
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/health

# Test GPS update
curl -X POST http://localhost:5001/projet-bus-60a3f/europe-west4/api/api/gps/update \
  -H "Content-Type: application/json" \
  -d '{
    "busId": "bus-test-001",
    "lat": 48.8566,
    "lng": 2.3522,
    "speed": 50,
    "timestamp": 1731526800000
  }'

# Récupérer position
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/api/gps/live/bus-test-001
```

### 4️⃣ (Optionnel) Démarrer Web Admin

```bash
cd web-admin

# Installer dépendances
npm install

# Créer .env (voir docs/SETUP.md)
# Ajouter VITE_FIREBASE_API_KEY, VITE_MAPBOX_TOKEN, etc.

# Lancer dev server
npm run dev
```

Ouvrir: `http://localhost:5173`

## 📚 Documentation Complète

- **README.md** - Vue d'ensemble complète
- **SETUP_COMPLETE.md** - Résumé du setup et fichiers créés
- **docs/SETUP.md** - Guide d'installation détaillé
- **CLAUDE.md** - Guide pour développeurs

## 🎯 Endpoints API Disponibles

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| POST | `/api/gps/update` | Mise à jour GPS |
| GET | `/api/gps/live` | Toutes positions |
| GET | `/api/gps/live/:busId` | Position d'un bus |
| GET | `/api/gps/history/:busId` | Historique |
| POST | `/api/gps/calculate-eta` | Calcul ETA |

## 🔥 Commandes Firebase

```bash
# Déployer règles Firestore
firebase deploy --only firestore:rules

# Déployer indexes
firebase deploy --only firestore:indexes

# Déployer Functions
firebase deploy --only functions

# Déployer Hosting
firebase deploy --only hosting

# Tout déployer
firebase deploy
```

## ✅ Checklist Premier Démarrage

- [ ] `bash verify-setup.sh` → 30+ checks passent
- [ ] `cd backend && npm run build` → ✅ Compiled successfully
- [ ] `cd backend && npm test` → ✅ All tests passed
- [ ] `cd backend && npm run serve` → ✅ Emulators running
- [ ] `curl http://localhost:5001/.../health` → ✅ {"status":"ok"}
- [ ] Firebase Console accessible
- [ ] Firestore rules déployées
- [ ] Premier GPS update testé

## 🆘 Problèmes Courants

**Erreur: Firebase project not found**
```bash
firebase login
firebase use projet-bus-60a3f
```

**Erreur: npm test fails**
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
npm test
```

**Erreur: Port 5001 déjà utilisé**
```bash
# Tuer le processus
lsof -ti:5001 | xargs kill -9
# Relancer
npm run serve
```

## 🚀 Prêt pour Production?

Avant de déployer en production:

1. ✅ Tous les tests passent (coverage >= 70%)
2. ✅ Firebase service account configurée
3. ✅ GitHub Secrets configurés
4. ✅ Firestore rules production déployées
5. ✅ Monitoring configuré (Cloud Logging)
6. ✅ Backup strategy définie

Puis:
```bash
firebase deploy
```

---

**Besoin d'aide?** Voir `docs/SETUP.md` pour le guide complet.
