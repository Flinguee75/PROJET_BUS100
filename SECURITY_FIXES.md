# Corrections de Sécurité Critiques - Firestore Rules

**Date**: 2025-12-11
**Fichier modifié**: `firestore.rules`
**Gravité**: CRITIQUE (P0 - BLOCKER PRODUCTION)

## ✅ Problèmes Corrigés

### 1. ❌ Escalade de Privilèges (CRITIQUE)

**Problème**: Si un utilisateur était authentifié via Firebase Auth mais n'avait pas de document dans `/users/{uid}`, il obtenait automatiquement le rôle `admin` avec accès complet.

**Avant** (ligne 27):
```javascript
function getUserData() {
  let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
  return userDoc.exists ? userDoc.data : { role: 'admin', isActive: true }; // ❌ DANGEREUX
}
```

**Après** (ligne 27):
```javascript
function getUserData() {
  let userDoc = get(/databases/$(database)/documents/users/$(request.auth.uid));
  return userDoc.exists ? userDoc.data : { role: 'none', isActive: false }; // ✅ Deny par défaut
}
```

**Impact**: Blocage complet des utilisateurs non autorisés. Principe de sécurité "deny by default".

---

### 2. ❌ Pas de Vérification isActive (CRITIQUE)

**Problème**: Les utilisateurs désactivés (`isActive: false`) pouvaient toujours accéder aux données car les fonctions `isAdmin()`, `isDriver()`, `isParent()` ne vérifiaient pas ce champ.

**Avant** (lignes 31-43):
```javascript
function isAdmin() {
  return isAuthenticated() && getUserData().role == 'admin'; // ❌ Pas de check isActive
}

function isDriver() {
  return isAuthenticated() && getUserData().role == 'driver'; // ❌ Pas de check isActive
}

function isParent() {
  return isAuthenticated() && getUserData().role == 'parent'; // ❌ Pas de check isActive
}
```

**Après** (lignes 31-46):
```javascript
function isAdmin() {
  let userData = getUserData();
  return isAuthenticated() && userData.role == 'admin' && userData.isActive == true; // ✅
}

function isDriver() {
  let userData = getUserData();
  return isAuthenticated() && userData.role == 'driver' && userData.isActive == true; // ✅
}

function isParent() {
  let userData = getUserData();
  return isAuthenticated() && userData.role == 'parent' && userData.isActive == true; // ✅
}
```

**Impact**: Révocation immédiate de l'accès pour les utilisateurs désactivés.

---

### 3. ❌ GPS Live Trop Permissif (CRITIQUE)

**Problème**: N'importe quel utilisateur authentifié pouvait lire TOUTES les positions GPS de TOUS les bus, violant la confidentialité.

**Avant** (ligne 68):
```javascript
match /gps_live/{busId} {
  allow read: if isAdmin() || isAuthenticated(); // ❌ TOUS les users
  allow write: if isAssignedDriver(busId);
}
```

**Après** (lignes 78-79):
```javascript
match /gps_live/{busId} {
  allow read: if isAdmin() || isAssignedDriver(busId) || isParentOfBus(busId); // ✅ Restreint
  allow write: if isAssignedDriver(busId);
}
```

**Impact**: Les parents ne voient QUE le bus de leur enfant, pas tous les bus.

---

## 🆕 Nouvelles Fonctionnalités

### Fonction `isParentOfBus(busId)`

**Nouvelle fonction** (lignes 53-60):
```javascript
// Vérifie si le parent a un enfant assigné à ce bus
// Note: Cette fonction suppose que le backend maintient un champ 'assignedBusIds'
// dans le document user (parent) avec la liste des bus de ses enfants
function isParentOfBus(busId) {
  let userData = getUserData();
  return isParent() &&
    (userData.assignedBusIds != null && busId in userData.assignedBusIds);
}
```

**⚠️ IMPORTANT - Requirement Backend**:

Cette fonction nécessite que le backend maintienne un champ `assignedBusIds: string[]` dans le document `/users/{parentId}` avec la liste des bus assignés aux enfants de ce parent.

**Action requise**:
1. Ajouter le type dans `backend/src/types/user.types.ts`:
   ```typescript
   export interface User {
     // ... autres champs existants
     assignedBusIds?: string[]; // Liste des bus des enfants (pour parents)
   }
   ```

2. Créer un service/trigger backend pour maintenir ce champ à jour:
   - Quand un student est créé/modifié avec un nouveau `busId`
   - Mettre à jour tous les documents `/users/{parentId}` où `parentId in student.parentIds`
   - Ajouter `busId` dans le tableau `assignedBusIds`

3. Script de migration (à exécuter une fois):
   ```typescript
   // Parcourir tous les students
   // Pour chaque student avec busId != null
   // Pour chaque parentId dans student.parentIds
   // Ajouter student.busId dans /users/{parentId}.assignedBusIds
   ```

---

## 📋 Autres Améliorations

### Collection `/buses`

**Avant** (ligne 57):
```javascript
allow read: if isAdmin() || isAssignedDriver(busId);
```

**Après** (ligne 69):
```javascript
allow read: if isAdmin() || isAssignedDriver(busId) || isParentOfBus(busId);
```

### Collection `/gps_history`

**Avant** (ligne 79):
```javascript
allow read: if isAdmin();
```

**Après** (ligne 91):
```javascript
allow read: if isAdmin() || isAssignedDriver(busId) || isParentOfBus(busId);
```

### Collection `/students`

**Avant** (ligne 90):
```javascript
allow read: if isAdmin();
```

**Après** (lignes 102-104):
```javascript
allow read: if isAdmin() ||
  (isParent() && request.auth.uid in resource.data.parentIds) ||
  (isDriver() && resource.data.busId == getUserData().busId);
```

**Impact**: Les parents peuvent maintenant lire les informations de leurs enfants, les chauffeurs peuvent lire les élèves de leur bus.

---

## 🧪 Comment Tester

### Option 1: Firestore Emulator (Recommandé)

```bash
# Installer les dépendances
npm install

# Lancer l'émulateur Firestore
firebase emulators:start --only firestore

# Dans un autre terminal, créer des données de test
# Vérifier que:
# - Utilisateur sans document user est DENY
# - Utilisateur avec isActive=false est DENY
# - Parent ne peut pas lire GPS de bus non assigné
# - Parent peut lire GPS du bus de son enfant
```

### Option 2: Tests Unitaires des Rules

Créer un fichier `firestore.rules.test.ts` (voir [Firebase Testing Documentation](https://firebase.google.com/docs/rules/unit-tests)):

```typescript
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  it('should DENY access to user without user document', async () => {
    const db = getFirestore('nouser@test.com', { uid: 'test-uid' });
    await assertFails(db.collection('buses').doc('bus1').get());
  });

  it('should DENY access to inactive user', async () => {
    // Créer user avec isActive=false
    // Tenter d'accéder à /buses
    // Expect: PERMISSION_DENIED
  });

  it('should ALLOW parent to read assigned bus only', async () => {
    // Créer parent avec assignedBusIds=['bus1']
    // assertSucceeds: read /gps_live/bus1
    // assertFails: read /gps_live/bus2
  });
});
```

### Option 3: Test Manuel en Production (⚠️ Dangereux)

**NE PAS FAIRE** sans backup et environnement de staging.

---

## 📊 Résumé des Modifications

| Fichier | Lignes modifiées | Type de changement |
|---------|------------------|-------------------|
| firestore.rules | 27 | CRITIQUE: Fallback deny |
| firestore.rules | 31-46 | CRITIQUE: Vérification isActive |
| firestore.rules | 53-60 | NOUVEAU: Fonction isParentOfBus |
| firestore.rules | 69 | AMÉLIORATION: Buses read access |
| firestore.rules | 78-79 | CRITIQUE: GPS live access restreint |
| firestore.rules | 91 | AMÉLIORATION: GPS history access |
| firestore.rules | 102-104 | AMÉLIORATION: Students read access |

**Total**: 7 modifications dont 3 critiques

---

## ⚠️ Actions Requises Avant Déploiement

### ✅ OBLIGATOIRE (BLOCKER)

- [x] Corriger les Firestore rules (FAIT)
- [ ] **Ajouter champ `assignedBusIds` dans le type `User`**
- [ ] **Créer service backend pour maintenir `assignedBusIds` à jour**
- [ ] **Exécuter script de migration pour peupler `assignedBusIds` existants**
- [ ] Tester avec émulateur Firestore
- [ ] Tester avec données réelles en staging
- [ ] Vérifier que les apps mobile/web continuent de fonctionner

### 🔍 RECOMMANDÉ

- [ ] Créer tests unitaires pour Firestore rules
- [ ] Ajouter monitoring pour erreurs PERMISSION_DENIED
- [ ] Documenter la structure de données dans CLAUDE.md
- [ ] Créer script de vérification de cohérence assignedBusIds

---

## 🚀 Déploiement

```bash
# Déployer UNIQUEMENT les rules Firestore (pas les functions/hosting)
firebase deploy --only firestore:rules

# Ou déploiement complet
firebase deploy
```

**⚠️ ATTENTION**: Les nouvelles règles prendront effet **immédiatement** après déploiement. Si le champ `assignedBusIds` n'est pas populé, les parents ne pourront plus accéder aux données GPS.

**Ordre de déploiement recommandé**:
1. Déployer backend avec migration `assignedBusIds`
2. Exécuter script de migration (peupler données existantes)
3. Vérifier en staging que tout fonctionne
4. Déployer les nouvelles Firestore rules

---

## 📞 Support

En cas de problème après déploiement:

1. Vérifier Firebase Console → Firestore → Rules → Playground
2. Tester un accès avec un user spécifique
3. Si blocage massif: rollback immédiat
   ```bash
   # Revenir à la version précédente des rules
   git revert HEAD
   firebase deploy --only firestore:rules
   ```

---

**Auteur**: Claude Code (Audit Architecture)
**Date**: 2025-12-11
**Version**: 1.0
