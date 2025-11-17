# 🔧 Solution au problème ERR_BLOCKED_BY_CLIENT

## ✅ Règles Firestore mises à jour !

Les règles Firestore ont été déployées avec succès. Elles acceptent maintenant les utilisateurs même si leur document n'existe pas encore.

## 🎯 Actions à faire MAINTENANT

### Étape 1 : Créer le fichier .env

**Créez le fichier** : `web-admin/.env` avec ce contenu :

```env
VITE_FIREBASE_API_KEY=AIzaSyDuGO8kYZGLIvuBkWbG4L3MzoZ4xQjNrE0
VITE_FIREBASE_AUTH_DOMAIN=projet-bus-60a3f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_FIREBASE_STORAGE_BUCKET=projet-bus-60a3f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_API_BASE_URL=http://localhost:3000
VITE_MAPBOX_ACCESS_TOKEN=
VITE_USE_FIREBASE_EMULATORS=false
```

**⚠️ Important** : Remplacez les valeurs par les vraies depuis :
- Console Firebase : https://console.firebase.google.com/project/projet-bus-60a3f/settings/general
- Section **"Vos applications"** → Choisissez votre app web
- Copiez la configuration

### Étape 2 : Désactiver le bloqueur de publicités

L'erreur `ERR_BLOCKED_BY_CLIENT` vient d'un bloqueur de publicités (AdBlock, uBlock Origin, etc.).

**Dans votre navigateur** :
1. Cliquez sur l'icône du bloqueur (en haut à droite)
2. **Désactivez-le pour localhost** ou ajoutez `localhost` aux exceptions
3. Rechargez la page

Ou utilisez un **navigateur en mode privé** (Incognito/Private) pour tester.

### Étape 3 : Redémarrer le serveur web

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez
cd web-admin
npm run dev
```

### Étape 4 : Tester la connexion

1. Ouvrez http://localhost:5173
2. Connectez-vous avec :
   - **Email** : `redfoo923@gmail.com`
   - **Mot de passe** : celui que vous avez défini

## 🔍 Comment obtenir les vraies valeurs Firebase

### Méthode 1 : Via la Console
1. https://console.firebase.google.com/project/projet-bus-60a3f/settings/general
2. Descendez jusqu'à **"Vos applications"**
3. Cliquez sur l'app web (icône `</>`
4. Copiez les valeurs de `firebaseConfig`

### Méthode 2 : Via CLI
```bash
firebase apps:sdkconfig web
```

## 📝 Fichier .env complet

Voici à quoi devrait ressembler votre fichier `.env` final :

```env
VITE_FIREBASE_API_KEY=AIza...votre_vraie_clé
VITE_FIREBASE_AUTH_DOMAIN=projet-bus-60a3f.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=projet-bus-60a3f
VITE_FIREBASE_STORAGE_BUCKET=projet-bus-60a3f.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=votre_sender_id
VITE_FIREBASE_APP_ID=1:votre_id:web:votre_app_id
VITE_API_BASE_URL=http://localhost:3000
VITE_MAPBOX_ACCESS_TOKEN=
```

## ⚡ Ordre d'actions

1. ✅ Créer manuellement le document utilisateur dans Firestore (vous l'avez fait)
2. ✅ Règles Firestore déployées (fait automatiquement)
3. ⏳ Créer le fichier `.env` avec les vraies valeurs
4. ⏳ Désactiver le bloqueur de publicités pour localhost
5. ⏳ Redémarrer le serveur web
6. ⏳ Tester la connexion

Une fois le fichier `.env` créé et le bloqueur désactivé, ça devrait fonctionner ! 🚀

