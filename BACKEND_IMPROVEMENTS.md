# Backend Improvements - assignedBusIds & dev:init

**Date**: 2025-12-11
**Version**: 2.0
**Auteur**: Claude Code (Architecture Audit)

## 🎯 Objectif

Compléter les corrections de sécurité Firestore en implémentant:
1. Le champ `assignedBusIds` dans les documents user (parents)
2. Un trigger Firestore pour maintenir ce champ automatiquement
3. Un script de migration pour les données existantes
4. Un script d'initialisation complète de l'environnement de développement

---

## 📋 Changements Implémentés

### 1. Nouveau Champ dans le Type `Parent`

**Fichier**: `backend/src/types/user.types.ts`

```typescript
export interface Parent extends User {
  role: UserRole.PARENT;
  address: string;
  studentIds: string[]; // Liste des enfants
  assignedBusIds?: string[]; // ✨ NOUVEAU - Liste des bus des enfants (maintenu automatiquement)
}
```

**Usage**:
- Ce champ est automatiquement maintenu par le trigger `onStudentChanged`
- Il est utilisé par les Firestore Security Rules dans la fonction `isParentOfBus()`
- Permet de contrôler l'accès des parents aux données GPS de manière performante

---

### 2. Trigger Firestore `onStudentChanged`

**Fichier**: `backend/src/triggers/student-changed.trigger.ts`

**Fonctionnement**:
Ce trigger se déclenche automatiquement à chaque opération sur la collection `students`:
- `onCreate`: Ajoute le busId aux assignedBusIds des parents
- `onUpdate`: Met à jour si le busId ou les parentIds changent
- `onDelete`: Retire le busId des assignedBusIds des parents

**Cas d'usage**:

```typescript
// Cas 1: Création d'un student
await db.collection('students').add({
  firstName: 'Léa',
  lastName: 'Dubois',
  parentIds: ['parent123'],
  busId: 'BUS001',
  // ... autres champs
});
// → Trigger ajoute automatiquement 'BUS001' dans /users/parent123/assignedBusIds

// Cas 2: Changement de bus
await db.collection('students').doc('student456').update({
  busId: 'BUS002', // Ancien: BUS001
});
// → Trigger retire 'BUS001' et ajoute 'BUS002' dans assignedBusIds des parents

// Cas 3: Ajout d'un parent
await db.collection('students').doc('student456').update({
  parentIds: ['parent123', 'parent789'], // Nouveau parent ajouté
});
// → Trigger ajoute le busId dans /users/parent789/assignedBusIds

// Cas 4: Suppression du student
await db.collection('students').doc('student456').delete();
// → Trigger retire le busId des assignedBusIds de tous les parents
```

**Export dans index.ts**:
```typescript
export { onStudentChanged } from './triggers/student-changed.trigger';
```

**Déploiement**:
```bash
cd backend
npm run build
firebase deploy --only functions:onStudentChanged
```

**Logs**:
```bash
firebase functions:log --only onStudentChanged
```

---

### 3. Script de Migration `migrate-assignedBusIds`

**Fichier**: `backend/scripts/migrate-assignedBusIds.ts`

**Objectif**: Peupler le champ `assignedBusIds` pour tous les parents existants en parcourant la collection `students`.

**Usage**:

```bash
# Prérequis: Émulateurs démarrés OU credentials production configurées
firebase emulators:start --only functions,firestore,auth

# Dans un autre terminal
cd backend
npm run migrate:assignedBusIds
```

**Sortie attendue**:
```
🚀 Début de la migration assignedBusIds...

📚 Récupération de tous les students...
   ✅ 15 students trouvés

🔄 Construction de la map parent → busIds...
   ✅ 8 parents à mettre à jour

📊 Résumé de la migration:
   Parent abc123: BUS001, BUS002
   Parent def456: BUS002
   ...

💾 Mise à jour des documents users...
   ✅ Batch 1 commit (8 parents)

✅ Migration terminée!
   📈 Succès: 8 parents

🔍 Vérification (échantillon de 3 parents):
   Parent abc123: assignedBusIds = [BUS001, BUS002]
   Parent def456: assignedBusIds = [BUS002]
   ...

✨ Migration réussie! Les Firestore rules peuvent maintenant être déployées.
```

**Quand exécuter**:
1. **PRODUCTION**: Une seule fois après avoir déployé le trigger, AVANT de déployer les nouvelles Firestore rules
2. **DÉVELOPPEMENT**: Automatiquement inclus dans `npm run dev:init`

---

### 4. Script d'Initialisation `dev:init`

**Fichier**: `backend/scripts/dev-init.ts`

**Objectif**: Initialiser complètement l'environnement de développement local en une seule commande.

**Ce que fait le script**:
1. ✅ Vérifie que les émulateurs Firebase sont démarrés
2. 👥 Crée des utilisateurs de test (admin, drivers, parents)
3. 🚌 Crée des bus de test
4. 👦 Crée des students de test avec liens parents/bus
5. 🔄 Exécute la migration assignedBusIds
6. 📊 Affiche un résumé des identifiants créés

**Usage**:

```bash
# Terminal 1: Démarrer les émulateurs
firebase emulators:start --only functions,firestore,auth

# Terminal 2: Initialiser l'environnement
cd backend
npm run dev:init
```

**Sortie attendue**:
```
🚀 Initialisation de l'environnement de développement

📡 Vérification des émulateurs...
   ✅ Auth Emulator: localhost:9099
   ✅ Firestore Emulator: localhost:8080

👥 Création des utilisateurs de test...
   Création: admin@test.com (admin)
      ✅ UID: xyz123
   Création: driver1@test.com (driver)
      ✅ UID: abc456
   ...

🚌 Création des bus de test...
   Création: AB-123-CD (Mercedes Sprinter)
      ✅ Chauffeur assigné: driver1@test.com
      ✅ Bus créé: BUS001
   ...

👦 Création des students de test...
   Création: Léa Dubois (CM2)
      ✅ Student créé: student123
      ✅ Parent mis à jour avec studentId
      ✅ Bus assigné: BUS001
   ...

🔄 Exécution de la migration assignedBusIds...
   ✅ 2 parent(s) mis à jour avec assignedBusIds

═══════════════════════════════════════════════════════════
✅ Environnement de développement initialisé avec succès!
═══════════════════════════════════════════════════════════

🔑 IDENTIFIANTS DE TEST:

👨‍💼 ADMIN:
   Email:    admin@test.com
   Password: Admin123!
   UID:      xyz123

🚗 DRIVERS:
   Email:    driver1@test.com
   Password: Driver123!
   UID:      abc456

👨‍👩‍👧‍👦 PARENTS:
   Email:    parent1@test.com
   Password: Parent123!
   UID:      def789

🚌 BUS CRÉÉS:
   BUS001: AB-123-CD (Mercedes Sprinter)
   BUS002: EF-456-GH (Iveco Daily)
   BUS003: IJ-789-KL (Renault Master)

🎯 PROCHAINES ÉTAPES:

   1. Connectez-vous à l'application web avec un des comptes ci-dessus
   2. Les émulateurs Firebase sont accessibles à:
      - UI: http://localhost:4000
      - Auth: http://localhost:9099
      - Firestore: http://localhost:8080
   3. Les données sont automatiquement sauvegardées dans les émulateurs
```

**Données créées**:
- **5 utilisateurs**: 1 admin, 2 drivers, 2 parents
- **3 bus**: Mercedes Sprinter, Iveco Daily, Renault Master
- **3 students**: Léa Dubois (CM2), Lucas Dubois (CE1), Emma Moreau (CM1)
- **Liens**: Students → Parents → assignedBusIds, Drivers → Buses

**Personnalisation**:
Modifiez les constantes dans le script pour créer vos propres données:
```typescript
const USERS = [
  {
    email: 'admin@test.com',
    password: 'Admin123!',
    displayName: 'Admin Test',
    role: 'admin',
    phoneNumber: '+33601020304',
  },
  // ... ajoutez vos users
];

const BUSES = [
  {
    id: 'BUS001',
    plateNumber: 'AB-123-CD',
    capacity: 50,
    model: 'Mercedes Sprinter',
    year: 2020,
    status: 'active',
  },
  // ... ajoutez vos bus
];
```

---

## 📊 Architecture Complète

```
┌─────────────────────────────────────────────────────────────┐
│                    Création/Modification                     │
│                    d'un Student                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Firestore Trigger: onStudentChanged                         │
│  - Détecte changement busId                                  │
│  - Détecte changement parentIds                              │
│  - Détecte suppression student                               │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Mise à jour automatique:                                    │
│  /users/{parentId}/assignedBusIds                            │
│  - arrayUnion(busId) si ajout                                │
│  - arrayRemove(busId) si retrait                             │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Firestore Security Rules                                    │
│  function isParentOfBus(busId) {                             │
│    return busId in getUserData().assignedBusIds;             │
│  }                                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🧪 Tests

### Test du Trigger

```typescript
// tests/integration/student-trigger.test.ts
import { getDb } from '../src/config/firebase.config';

describe('onStudentChanged trigger', () => {
  it('should add busId to parent assignedBusIds when student created', async () => {
    const db = getDb();

    // Créer un parent
    const parentRef = await db.collection('users').add({
      role: 'parent',
      assignedBusIds: [],
    });

    // Créer un student avec ce parent
    await db.collection('students').add({
      firstName: 'Test',
      lastName: 'Student',
      parentIds: [parentRef.id],
      busId: 'BUS001',
    });

    // Attendre que le trigger s'exécute
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Vérifier que assignedBusIds a été mis à jour
    const parentDoc = await parentRef.get();
    const parentData = parentDoc.data();
    expect(parentData?.assignedBusIds).toContain('BUS001');
  });
});
```

### Test Manuel

```bash
# 1. Démarrer les émulateurs
firebase emulators:start --only functions,firestore,auth

# 2. Initialiser les données
cd backend && npm run dev:init

# 3. Vérifier dans l'UI des émulateurs
# Ouvrir http://localhost:4000
# Aller dans Firestore → users → parent1
# Vérifier que le champ assignedBusIds contient ['BUS001']

# 4. Tester modification
# Dans l'UI Firestore, modifier un student: changer son busId
# Vérifier que les parents sont mis à jour automatiquement

# 5. Vérifier les logs du trigger
firebase functions:log --only onStudentChanged
```

---

## 🚀 Déploiement en Production

### Ordre OBLIGATOIRE:

```bash
# 1. Déployer le trigger (backend)
cd backend
npm run lint
npm test
npm run build
firebase deploy --only functions:onStudentChanged

# 2. Attendre que le trigger soit déployé (vérifier dans Firebase Console)

# 3. Exécuter la migration (PRODUCTION)
# ⚠️ ATTENTION: Configurer GOOGLE_APPLICATION_CREDENTIALS pour la production
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
npm run migrate:assignedBusIds

# 4. Vérifier que la migration est réussie
# Firebase Console → Firestore → users → Vérifier quelques parents

# 5. Déployer les nouvelles Firestore rules
firebase deploy --only firestore:rules

# 6. Tester l'accès avec un compte parent
# L'app mobile/web doit continuer de fonctionner normalement
```

### Rollback en cas de problème:

```bash
# Si les parents n'ont pas accès aux données GPS après déploiement:

# 1. Vérifier les logs
firebase functions:log --only onStudentChanged

# 2. Vérifier un document user (parent) dans Firestore
# Le champ assignedBusIds doit exister et contenir les busIds

# 3. Si assignedBusIds est vide/manquant, relancer la migration
npm run migrate:assignedBusIds

# 4. Si toujours problème, rollback les rules
git revert HEAD~1  # Revenir aux anciennes rules
firebase deploy --only firestore:rules
```

---

## 📝 Checklist de Déploiement

- [ ] Tests backend passent: `npm test`
- [ ] Trigger testé localement avec émulateurs
- [ ] Script de migration testé localement
- [ ] Script dev:init fonctionne correctement
- [ ] Documentation mise à jour (CLAUDE.md, SECURITY_FIXES.md)
- [ ] Trigger déployé en production
- [ ] Migration exécutée en production
- [ ] Vérification manuelle: 3-5 parents ont bien assignedBusIds peuplé
- [ ] Firestore rules déployées
- [ ] Test avec un compte parent réel: accès GPS fonctionne
- [ ] Monitoring activé sur le trigger (Firebase Console → Functions → Metrics)

---

## 🔗 Fichiers Associés

| Fichier | Description |
|---------|-------------|
| `backend/src/types/user.types.ts` | Type Parent avec assignedBusIds |
| `backend/src/triggers/student-changed.trigger.ts` | Trigger Firestore |
| `backend/src/index.ts` | Export du trigger |
| `backend/scripts/migrate-assignedBusIds.ts` | Script de migration |
| `backend/scripts/dev-init.ts` | Script d'initialisation dev |
| `backend/package.json` | Scripts npm ajoutés |
| `firestore.rules` | Rules utilisant assignedBusIds |
| `SECURITY_FIXES.md` | Documentation sécurité |
| `BACKEND_IMPROVEMENTS.md` | Ce fichier |

---

## 📞 Support & Troubleshooting

### Problème: Le trigger ne s'exécute pas localement

**Solution**:
- Vérifier que les émulateurs sont démarrés avec `functions` inclus
- Vérifier que le trigger est bien exporté dans `index.ts`
- Vérifier que le build est à jour: `npm run build`
- Regarder les logs: `firebase functions:log`

### Problème: Migration échoue

**Solution**:
- Vérifier que les émulateurs sont accessibles
- Vérifier que les documents students existent
- Vérifier que les documents users (parents) existent
- Vérifier les permissions: `GOOGLE_APPLICATION_CREDENTIALS` en production

### Problème: Parents n'ont pas accès aux données GPS après déploiement

**Solution**:
1. Vérifier dans Firestore Console qu'un document user (parent) a bien le champ `assignedBusIds` peuplé
2. Vérifier dans Firestore Rules Playground si la règle fonctionne:
   ```
   Match: /gps_live/BUS001
   Auth: parent123
   Read → Should allow
   ```
3. Si `assignedBusIds` est vide, relancer la migration
4. Si la règle échoue, vérifier la syntaxe dans firestore.rules

---

**Auteur**: Claude Code
**Date**: 2025-12-11
**Version**: 2.0
