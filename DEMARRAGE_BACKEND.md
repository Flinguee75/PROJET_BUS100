# 🚀 Démarrage du Backend

## ⚡ Démarrage rapide

**Depuis la racine du projet** (recommandé) :

```bash
npm run start
```

Cette commande démarre automatiquement :
- ✅ Émulateur Auth (port 9099)
- ✅ Émulateur Firestore (port 8080)
- ✅ Émulateur Functions (port 5001)
- ✅ Interface UI (port 4000)

**Ou depuis le dossier backend** :

```bash
cd backend
npm run serve
```

## ✅ État actuel

- ✅ Connexion au dashboard fonctionne
- ✅ Frontend tourne sur http://localhost:5173
- ✅ Backend configuré avec Auth, Firestore et Functions

## 🔧 Backend Firebase Functions

Les émulateurs Firebase incluent maintenant Auth, Firestore et Functions. Voici comment vérifier :

### 1. Interface des émulateurs

Ouvrez : **http://localhost:4000**

Vous devriez voir l'interface Firebase Emulator Suite avec :
- Functions (liste des fonctions disponibles)
- Firestore (base de données)
- Logs

### 2. Vérifier les fonctions disponibles

Dans l'interface (http://localhost:4000), allez dans **Functions** et cherchez :
- `api` - La fonction HTTP principale
- `helloWorld` - Fonction de test
- `onUserCreated` - Trigger de création d'utilisateur

### 3. Tester l'API

Une fois les fonctions visibles, testez :

```bash
# Health check
curl http://localhost:5001/projet-bus-60a3f/europe-west4/api/health

# Devrait retourner:
# {"status":"ok","service":"Transport Scolaire API","timestamp":"..."}
```

##  URLs importantes

- **Interface émulateurs** : http://localhost:4000
- **API Backend** : http://localhost:5001/projet-bus-60a3f/europe-west4/api
- **Frontend** : http://localhost:5173

## 🐛 Si le backend ne démarre pas

### Vérifier les logs

```bash
cd backend
tail -f firebase-debug.log
```

### Redémarrer manuellement

```bash
# Arrêter
pkill -f firebase

# Recompiler et démarrer (avec Auth, Firestore et Functions)
cd backend
npm run serve
```

Ou depuis la racine du projet:

```bash
# Arrêter
pkill -f firebase

# Démarrer tout (Auth + Firestore + Functions)
firebase emulators:start --only functions,firestore,auth --project projet-bus-60a3f
```

## ⚡ Une fois le backend démarré

Rechargez le frontend et vous devriez voir :
- ✅ Dashboard avec statistiques
- ✅ Gestion des bus fonctionnelle
- ✅ Plus d'erreurs `ERR_CONNECTION_REFUSED`

## 🎯 Prochaines étapes

Une fois le backend accessible :
1. Tester la gestion des bus (ajouter/modifier/supprimer)
2. Implémenter la gestion des élèves
3. Améliorer la carte temps réel

