# 🔧 Guide de Résolution : Frontend ne récupère pas les données

## Problème

Le frontend ne récupère pas les données (bus, élèves, etc.) malgré que le backend soit rempli de données.

## Causes possibles

1. **L'utilisateur connecté n'a pas de document dans `/users/{userId}`** avec les champs requis (`role`, `isActive`, `schoolId`)
2. **Les règles Firestore bloquent l'accès** aux collections
3. **La collection `alerts_live` n'existait pas** dans les règles (corrigé)

## Solutions

### ✅ Solution 1 : Vérifier et créer le document utilisateur

Si vous êtes connecté avec un email mais que le document Firestore n'existe pas, utilisez le script :

```bash
cd backend
npm run build
ts-node scripts/fix-user-document.ts <votre-email> admin <schoolId>
```

**Exemple :**
```bash
# Pour un admin avec l'école par défaut
ts-node scripts/fix-user-document.ts admin@test.com admin school-grain-de-soleil

# Pour un admin (l'école sera détectée automatiquement)
ts-node scripts/fix-user-document.ts admin@test.com admin
```

**Rôles disponibles :** `admin`, `driver`, `parent`, `escort`

### ✅ Solution 2 : Utiliser le script de seed complet

Si vous utilisez les émulateurs Firebase, utilisez le script de seed qui crée tout :

```bash
cd backend
npm run seed
```

Ce script crée :
- ✅ Une école (`school-grain-de-soleil`)
- ✅ Des utilisateurs avec les bons champs (`role`, `isActive`, `schoolId`)
- ✅ Des bus avec `schoolId`
- ✅ Des élèves avec `schoolId`
- ✅ Des routes et des données de test

### ✅ Solution 3 : Vérifier manuellement dans Firestore

1. **Ouvrez la console Firebase** : https://console.firebase.google.com/project/projet-bus-60a3f/firestore

2. **Vérifiez que votre utilisateur existe** dans `/users/{userId}` avec :
   - `role`: `"admin"` (ou `"driver"`, `"parent"`)
   - `isActive`: `true`
   - `schoolId`: `"school-grain-de-soleil"` (ou l'ID de votre école)

3. **Vérifiez que les bus ont un `schoolId`** dans `/buses/{busId}`

4. **Vérifiez que les élèves ont un `schoolId`** dans `/students/{studentId}`

### ✅ Solution 4 : Créer manuellement le document utilisateur

Si vous préférez créer le document manuellement dans la console Firebase :

1. Allez dans `/users/{votre-uid}`
2. Créez un document avec ces champs :
```json
{
  "email": "votre-email@example.com",
  "displayName": "Votre Nom",
  "role": "admin",
  "isActive": true,
  "schoolId": "school-grain-de-soleil",
  "createdAt": "2024-01-01T00:00:00Z",
  "updatedAt": "2024-01-01T00:00:00Z"
}
```

## Règles Firestore mises à jour

Les règles Firestore ont été mises à jour pour :

1. ✅ **Ajouter la collection `alerts_live`** (manquante)
2. ✅ **Simplifier les règles pour les admins** (accès complet sans restriction)
3. ✅ **Permettre la lecture des données** pour les utilisateurs authentifiés avec le bon `schoolId`

## Vérification

Après avoir créé/mis à jour le document utilisateur :

1. **Déconnectez-vous** du frontend
2. **Reconnectez-vous** avec votre email
3. **Vérifiez la console du navigateur** - les erreurs Firestore devraient disparaître
4. **Les données devraient maintenant s'afficher** (bus, élèves, etc.)

## Erreurs courantes

### Erreur : "false for 'list' @ L192"

**Cause :** Les règles Firestore bloquent les requêtes de liste car l'utilisateur n'a pas les permissions.

**Solution :** Créez le document utilisateur avec `role: "admin"` et `isActive: true`.

### Erreur : "Erreur Firestore watchActiveAlerts"

**Cause :** La collection `alerts_live` n'était pas définie dans les règles (corrigé).

**Solution :** Les règles ont été mises à jour. Rechargez la page.

### Aucune donnée affichée malgré les données dans Firestore

**Cause :** L'utilisateur connecté n'a pas de `schoolId` ou le `schoolId` ne correspond pas aux données.

**Solution :** 
1. Vérifiez que votre utilisateur a un `schoolId` dans `/users/{userId}`
2. Vérifiez que les bus/élèves ont le même `schoolId`
3. Utilisez le script `fix-user-document.ts` pour corriger

## Support

Si le problème persiste :

1. Vérifiez les logs de la console du navigateur
2. Vérifiez les logs Firebase dans la console
3. Vérifiez que les règles Firestore sont bien déployées : `firebase deploy --only firestore:rules`

