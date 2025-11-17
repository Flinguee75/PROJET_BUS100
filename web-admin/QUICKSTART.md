# 🚀 Démarrage Rapide

Guide ultra-rapide pour lancer le dashboard en 5 minutes.

## ⚡ Installation Express

```bash
# 1. Installer les dépendances
cd web-admin
npm install

# 2. Configurer l'environnement
cp .env.example .env
# Éditer .env avec vos credentials Firebase et Mapbox

# 3. Lancer l'application
npm run dev
```

**Application accessible sur:** `http://localhost:5173`

## 🔑 Credentials Firebase (Projet existant)

Le projet Firebase `projet-bus-60a3f` est déjà configuré :

```env
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_FIREBASE_API_KEY=<votre_clé_api>
VITE_FIREBASE_AUTH_DOMAIN=projet-bus-60a3f.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=projet-bus-60a3f.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=<votre_sender_id>
VITE_FIREBASE_APP_ID=<votre_app_id>
```

## 🗺️ Token Mapbox

1. Créer un compte sur [mapbox.com](https://www.mapbox.com)
2. Copier le token par défaut
3. Ajouter dans `.env`:

```env
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1...
```

## 👤 Créer un utilisateur admin

### Via Firebase Console

1. Aller sur [Firebase Console](https://console.firebase.google.com/u/0/project/projet-bus-60a3f)
2. Authentication → Users → Add User
3. Email: `admin@transport-scolaire.fr`
4. Password: `Admin123!` (ou votre choix)

### Via Firestore - Ajouter le rôle

1. Firestore Database → Collection `users`
2. Document ID = UID de l'utilisateur créé
3. Données:

```json
{
  "email": "admin@transport-scolaire.fr",
  "displayName": "Admin Principal",
  "role": "ADMIN"
}
```

## 🚌 Données de test (GPS)

Créer un document dans `gps_live` :

**Document ID:** `bus-001`

```json
{
  "busNumber": "101",
  "plateNumber": "AB-123-CD",
  "capacity": 50,
  "driverId": "driver-001",
  "driverName": "Jean Dupont",
  "status": "EN_ROUTE",
  "position": {
    "lat": 47.2184,
    "lng": -1.5536,
    "speed": 45.5,
    "timestamp": 1704110400000,
    "heading": 180
  },
  "lastUpdate": 1704110400000,
  "routeId": "route-001",
  "studentsOnBoard": 25
}
```

## ✅ Vérification

1. **Login**: `http://localhost:5173/login`
   - Se connecter avec les identifiants créés
   - ✅ Redirection vers `/dashboard`

2. **Dashboard**: Voir les statistiques
   - ✅ 4 widgets affichés
   - ✅ Liste des bus

3. **Carte Temps Réel**: `/realtime-map`
   - ✅ Carte Mapbox chargée
   - ✅ Marqueurs de bus affichés

## 🧪 Tests

```bash
# Tous les tests
npm test

# Avec couverture
npm run test:coverage

# Tests en mode watch
npm run test -- --watch
```

## 🔍 Lint

```bash
# Vérifier
npm run lint

# Auto-corriger
npm run lint:fix
```

## 📦 Build Production

```bash
npm run build
npm run preview
```

## 🐛 Problèmes Courants

### Carte ne s'affiche pas
→ Vérifier `VITE_MAPBOX_ACCESS_TOKEN` dans `.env`

### Erreur Firebase
→ Vérifier les credentials dans `.env`

### Permission denied Firestore
→ Vérifier les règles de sécurité Firestore

## 📚 Documentation Complète

- [README.md](./README.md) - Documentation complète
- [INSTALLATION.md](./INSTALLATION.md) - Guide détaillé

## 🆘 Support

Email: support@transport-scolaire.fr

---

**Prêt à démarrer ! 🎉**

