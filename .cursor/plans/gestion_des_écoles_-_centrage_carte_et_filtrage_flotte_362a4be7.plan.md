---
name: Gestion des Écoles - Centrage Carte et Filtrage Flotte
overview: Ajouter un modèle School dans le backend avec coordonnées GPS, nombre de flotte et nom. Permettre aux utilisateurs affiliés à une école de voir la carte centrée sur leur école avec les bus stationnés et déployés.
todos:
  - id: create-school-types
    content: Créer backend/src/types/school.types.ts avec interfaces School, SchoolCreateInput, SchoolUpdateInput
    status: completed
  - id: update-user-bus-types
    content: Ajouter schoolId dans User et Bus types (backend/src/types/user.types.ts et bus.types.ts)
    status: completed
    dependencies:
      - create-school-types
  - id: create-school-service
    content: Créer backend/src/services/school.service.ts avec CRUD et getSchoolFleetCount
    status: completed
    dependencies:
      - create-school-types
  - id: create-school-controller
    content: Créer backend/src/controllers/school.controller.ts avec tous les endpoints
    status: completed
    dependencies:
      - create-school-service
  - id: create-school-routes
    content: Créer backend/src/routes/school.routes.ts et l'ajouter dans index.ts
    status: completed
    dependencies:
      - create-school-controller
  - id: add-school-validation
    content: Ajouter schoolCreateSchema et schoolUpdateSchema dans validation.schemas.ts
    status: completed
    dependencies:
      - create-school-types
  - id: create-frontend-school-types
    content: Créer web-admin/src/types/school.ts avec interface School
    status: pending
  - id: create-frontend-school-service
    content: Créer web-admin/src/services/school.firestore.ts avec watchSchool et getSchool
    status: pending
    dependencies:
      - create-frontend-school-types
  - id: create-frontend-school-hooks
    content: Créer web-admin/src/hooks/useSchool.ts avec useSchool et useSchoolBuses
    status: pending
    dependencies:
      - create-frontend-school-service
  - id: update-auth-context
    content: Ajouter schoolId dans AuthContext et récupérer l'école de l'utilisateur
    status: pending
    dependencies:
      - create-frontend-school-hooks
  - id: update-godview-center-school
    content: Modifier GodViewPage pour centrer la carte sur l'école et filtrer les bus par schoolId
    status: pending
    dependencies:
      - update-auth-context
  - id: implement-bus-status-distinction
    content: Implémenter la distinction bus stationnés vs déployés basée sur distance et statut
    status: pending
    dependencies:
      - update-godview-center-school
  - id: update-firestore-rules-schools
    content: Ajouter règles Firestore pour /schools avec isolation par école
    status: completed
  - id: update-firestore-indexes-school
    content: Ajouter index Firestore pour schoolId dans buses et users
    status: completed
---

# Gestion des Écoles - Centrage Carte et Filtrage Flotte

## Objectif

Créer un système de gestion des écoles permettant :

1. De stocker les informations d'une école (nom, coordonnées GPS, nombre de flotte)
2. D'affilier les utilisateurs et bus à une école
3. De centrer automatiquement la carte sur l'école de l'utilisateur connecté
4. De filtrer et afficher les bus de l'école (stationnés vs déployés)

## Architecture

### Modèle School

**Collection Firestore:** `/schools/{schoolId}`

**Structure:**

```typescript
interface School {
  id: string;
  name: string;
  location: {
    lat: number;
    lng: number;
  };
  fleetSize: number; // Nombre de bus dans la flotte
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}
```

### Relations

- **User → School**: Ajouter `schoolId: string | null` dans `User`
- **Bus → School**: Ajouter `schoolId: string | null` dans `Bus`
- **Student → School**: Ajouter `schoolId: string | null` dans `Student` (via bus)

## Plan d'Implémentation

### 1. Backend - Modèle et Types

**Fichiers à créer/modifier:**

- `backend/src/types/school.types.ts` - **NOUVEAU**
  - Interface `School`
  - Interface `SchoolCreateInput`
  - Interface `SchoolUpdateInput`

- `backend/src/types/user.types.ts` - **MODIFIER**
  - Ajouter `schoolId: string | null` dans `User`

- `backend/src/types/bus.types.ts` - **MODIFIER**
  - Ajouter `schoolId: string | null` dans `Bus` et `BusCreateInput`

### 2. Backend - Service School

**Fichier à créer:**

- `backend/src/services/school.service.ts` - **NOUVEAU**
  - `createSchool(data: SchoolCreateInput)`: Créer une école
  - `getSchoolById(schoolId: string)`: Récupérer une école
  - `getAllSchools()`: Récupérer toutes les écoles
  - `updateSchool(schoolId: string, data: SchoolUpdateInput)`: Mettre à jour
  - `deleteSchool(schoolId: string)`: Supprimer (soft delete)
  - `getSchoolFleetCount(schoolId: string)`: Compter les bus de l'école

### 3. Backend - Controller School

**Fichier à créer:**

- `backend/src/controllers/school.controller.ts` - **NOUVEAU**
  - `createSchool(req, res)`: POST /api/schools
  - `getSchoolById(req, res)`: GET /api/schools/:schoolId
  - `getAllSchools(req, res)`: GET /api/schools
  - `updateSchool(req, res)`: PUT /api/schools/:schoolId
  - `deleteSchool(req, res)`: DELETE /api/schools/:schoolId
  - `getSchoolFleet(req, res)`: GET /api/schools/:schoolId/fleet (bus de l'école)

### 4. Backend - Routes School

**Fichier à créer:**

- `backend/src/routes/school.routes.ts` - **NOUVEAU**
  - Définir toutes les routes pour les écoles
  - Ajouter dans `backend/src/index.ts`

### 5. Backend - Validation Schemas

**Fichier à modifier:**

- `backend/src/utils/validation.schemas.ts`
  - Ajouter `schoolCreateSchema` avec Zod
  - Ajouter `schoolUpdateSchema`

### 6. Backend - Mise à jour User et Bus

**Fichiers à modifier:**

- `backend/src/triggers/user-created.trigger.ts`
  - Ajouter `schoolId` lors de la création d'utilisateur (si fourni)

- `backend/src/services/bus.service.ts`
  - Vérifier que `schoolId` est assigné lors de la création/modification

### 7. Frontend - Types et Services

**Fichiers à créer/modifier:**

- `web-admin/src/types/school.ts` - **NOUVEAU**
  - Interface `School` (identique au backend)

- `web-admin/src/services/school.firestore.ts` - **NOUVEAU**
  - `watchSchool(schoolId, onUpdate, onError)`: Écouter une école
  - `getSchool(schoolId)`: Récupérer une école (one-shot)
  - `watchSchoolBuses(schoolId, onUpdate, onError)`: Écouter les bus d'une école

- `web-admin/src/hooks/useSchool.ts` - **NOUVEAU**
  - `useSchool(schoolId)`: Hook pour récupérer une école
  - `useSchoolBuses(schoolId)`: Hook pour les bus d'une école

### 8. Frontend - Authentification et User Context

**Fichiers à modifier:**

- `web-admin/src/contexts/AuthContext.tsx` (ou équivalent)
  - Ajouter `schoolId` dans le contexte utilisateur
  - Récupérer l'école de l'utilisateur lors de la connexion

- `web-admin/src/services/auth.firebase.ts` (ou équivalent)
  - Récupérer `schoolId` depuis le profil utilisateur Firestore

### 9. Frontend - GodViewPage - Centrage sur École

**Fichier à modifier:**

- `web-admin/src/pages/GodViewPage.tsx`
  - Récupérer `schoolId` depuis le contexte utilisateur
  - Utiliser `useSchool(schoolId)` pour récupérer les coordonnées
  - Centrer la carte sur `school.location` au lieu de `ABIDJAN_CENTER`
  - Filtrer les bus par `schoolId` avant d'afficher les marqueurs

**Logique de filtrage:**

```typescript
const schoolBuses = buses.filter(bus => bus.schoolId === schoolId);
```

### 10. Frontend - Distinction Bus Stationnés vs Déployés

**Fichier à modifier:**

- `web-admin/src/pages/GodViewPage.tsx`
  - Calculer la distance entre chaque bus et l'école
  - Bus "stationné" = distance < seuil (ex: 100m) ET `liveStatus === 'idle'` ou `'stopped'`
  - Bus "déployé" = distance >= seuil OU `liveStatus === 'en_route'` ou `'delayed'`
  - Afficher visuellement la distinction (couleur, icône, etc.)

**Fonction de calcul de distance:**

```typescript
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  // Formule Haversine pour distance en mètres
}
```

### 11. Frontend - AlertsSidebar - Filtrage Automatique

**Note importante:**

- Les alertes sont automatiquement filtrées car elles sont liées aux bus
- Les bus sont déjà filtrés par `schoolId` dans `GodViewPage`
- Les alertes affichées dans `AlertsSidebar` proviennent des bus filtrés
- **Aucune modification nécessaire** dans `AlertsSidebar.tsx` - le filtrage est implicite

### 12. Backend - Règles Firestore

**Fichier à modifier:**

- `firestore.rules`
  - Ajouter règles pour `/schools/{schoolId}`
  - Admin: lecture/écriture complète
  - Utilisateurs: lecture uniquement leur école (`schoolId == getUserData().schoolId`)

### 13. Backend - Index Firestore

**Fichier à modifier:**

- `firestore.indexes.json`
  - Ajouter index pour `/buses` avec `schoolId`
  - Ajouter index pour `/users` avec `schoolId`

## Ordre d'Exécution Recommandé

1. **Étape 1-2**: Créer le modèle School et les types (backend)
2. **Étape 3-6**: Créer service, controller, routes (backend)
3. **Étape 7-8**: Créer services et hooks frontend
4. **Étape 9**: Modifier GodViewPage pour centrer sur l'école et filtrer les bus par schoolId
5. **Étape 10**: Implémenter distinction stationné/déployé
6. **Étape 11**: Les alertes sont automatiquement filtrées (via les bus filtrés)
7. **Étape 12-13**: Mettre à jour règles Firestore et index

## Fichiers à Créer

### Backend

- `backend/src/types/school.types.ts`
- `backend/src/services/school.service.ts`
- `backend/src/controllers/school.controller.ts`
- `backend/src/routes/school.routes.ts`

### Frontend

- `web-admin/src/types/school.ts`
- `web-admin/src/services/school.firestore.ts`
- `web-admin/src/hooks/useSchool.ts`

## Fichiers à Modifier

### Backend

- `backend/src/types/user.types.ts` - Ajouter `schoolId`
- `backend/src/types/bus.types.ts` - Ajouter `schoolId`
- `backend/src/utils/validation.schemas.ts` - Ajouter schémas School
- `backend/src/index.ts` - Ajouter routes School
- `backend/src/triggers/user-created.trigger.ts` - Gérer `schoolId`
- `firestore.rules` - Ajouter règles `/schools`
- `firestore.indexes.json` - Ajouter index `schoolId`

### Frontend

- `web-admin/src/pages/GodViewPage.tsx` - Centrer sur école, filtrer bus par schoolId
- `web-admin/src/contexts/AuthContext.tsx` - Ajouter `schoolId` au contexte

## Notes Importantes

- **Multi-tenancy**: Chaque école est isolée, les utilisateurs ne voient que leur école
- **Performance**: Filtrer les bus par `schoolId` réduit les données à traiter
- **Sécurité**: Les règles Firestore doivent garantir l'isolation entre écoles
- **Migration**: Les données existantes devront avoir un `schoolId` assigné (migration script)
- **Filtrage automatique**: Les alertes sont automatiquement filtrées car elles proviennent des bus déjà filtrés par `schoolId`. Aucun filtrage supplémentaire nécessaire dans `AlertsSidebar`.