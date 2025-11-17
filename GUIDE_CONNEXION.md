# 🔐 Guide de Configuration Utilisateur

## Problème actuel
Vous avez créé un utilisateur dans **Firebase Authentication**, mais le document Firestore correspondant n'existe pas encore.

## ✅ Solution rapide (3 minutes)

### Étape 1 : Ouvrir la Console Firebase

1. Allez sur : https://console.firebase.google.com/project/projet-bus-60a3f/firestore
2. Connectez-vous avec votre compte Google

### Étape 2 : Créer le document utilisateur

1. Dans **Firestore Database**, cliquez sur **"Démarrer une collection"** (ou **"+ Ajouter un document"** si la collection existe)

2. **Nom de la collection** : `users` (exactement, sans majuscule)

3. **ID du document** : `WZXQ0GXK8PShj9ux8wTXamZx2tY2` (copiez-collez exactement)

4. **Ajoutez ces champs** (cliquez sur "Ajouter un champ" pour chacun) :

| Champ | Type | Valeur |
|-------|------|--------|
| `email` | string | `redfoo932@gmail.com` |
| `displayName` | string | `Admin` (ou votre nom) |
| `role` | string | `admin` |
| `phoneNumber` | string | `` (laissez vide) |
| `isActive` | boolean | `true` (cochez) |
| `createdAt` | timestamp | Cliquez sur l'icône d'horloge → "Maintenant" |
| `updatedAt` | timestamp | Cliquez sur l'icône d'horloge → "Maintenant" |

5. Cliquez sur **"Enregistrer"**

### Étape 3 : Vérification

Vous devriez voir dans Firestore :

```
📁 users (collection)
  └─ 📄 WZXQ0GXK8PShj9ux8wTXamZx2tY2
      ├─ email: "redfoo932@gmail.com"
      ├─ displayName: "Admin"
      ├─ role: "admin"
      ├─ phoneNumber: ""
      ├─ isActive: true
      ├─ createdAt: [timestamp]
      └─ updatedAt: [timestamp]
```

### Étape 4 : Tester la connexion

1. Ouvrez votre terminal
2. Lancez le serveur web :
   ```bash
   cd web-admin
   npm run dev
   ```

3. Ouvrez votre navigateur : http://localhost:5173

4. Connectez-vous avec :
   - **Email** : `redfoo932@gmail.com`
   - **Mot de passe** : celui que vous avez défini dans Firebase Auth

## 🎉 Résultat attendu

Vous devriez être redirigé vers le **Dashboard** avec accès à toutes les fonctionnalités :
- ✅ Tableau de bord
- ✅ Gestion des bus
- ✅ Carte temps réel
- ✅ Etc.

## 🔮 Pour le futur

La **Cloud Function automatique** a été créée dans :
- `backend/src/triggers/user-created.trigger.ts`

Pour l'activer, déployez-la :

```bash
cd backend
npm run build
npm run deploy
```

Après ce déploiement, **tous les futurs utilisateurs** créés dans Firebase Auth auront automatiquement leur document Firestore créé ! 🚀

## ❓ Problème ?

Si la connexion ne fonctionne toujours pas :

1. **Vérifiez la console du navigateur** (F12) pour voir les erreurs
2. **Vérifiez que le fichier `.env` existe** dans `web-admin/` avec vos credentials Firebase
3. **Vérifiez que le serveur web tourne** sur http://localhost:5173

## 📸 Capture d'écran de référence

Dans Firestore Database, vous devriez voir exactement cette structure après création :

```
Collection: users
└─ Document ID: WZXQ0GXK8PShj9ux8wTXamZx2tY2
   └─ Champs (7 au total)
```

Si vous voyez "0 documents" dans la collection `users`, c'est que le document n'a pas été créé correctement.

