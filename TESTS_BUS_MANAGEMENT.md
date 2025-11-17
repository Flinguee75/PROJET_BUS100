# Tests - Gestion des Bus (CRUD)

## Vue d'ensemble

Cette documentation décrit les tests créés pour couvrir la fonctionnalité de gestion des bus (CRUD complet).

## Structure des tests

### Backend

#### 1. Tests unitaires - BusService (`backend/tests/unit/services/bus.service.test.ts`)

**Couverture:** Service de logique métier pour les opérations CRUD sur les bus.

**Tests inclus:**

- **createBus**
  - ✅ Crée un nouveau bus avec succès
  - ✅ Initialise les valeurs par défaut (driverId: null, routeId: null, status: ACTIVE)

- **getAllBuses**
  - ✅ Retourne une liste vide quand aucun bus
  - ✅ Retourne tous les bus existants

- **getBusById**
  - ✅ Retourne null si le bus n'existe pas
  - ✅ Retourne le bus s'il existe

- **updateBus**
  - ✅ Met à jour un bus existant
  - ✅ Lance une erreur si le bus n'existe pas

- **deleteBus**
  - ✅ Supprime un bus existant
  - ✅ Lance une erreur si le bus n'existe pas

**Exécuter:**
```bash
cd backend
npm run test:unit -- bus.service
```

#### 2. Tests d'intégration - Routes API (`backend/tests/integration/bus.routes.test.ts`)

**Couverture:** Endpoints REST complets pour la gestion des bus.

**Tests inclus:**

- **POST /api/buses**
  - ✅ Crée un nouveau bus avec des données valides (201)
  - ✅ Retourne 400 si des champs requis manquent
  - ✅ Retourne 400 en cas d'erreur de création

- **GET /api/buses**
  - ✅ Retourne la liste de tous les bus (200)
  - ✅ Retourne les bus avec positions GPS si live=true
  - ✅ Retourne une liste vide si aucun bus

- **GET /api/buses/:busId**
  - ✅ Retourne un bus spécifique (200)
  - ✅ Retourne 404 si le bus n'existe pas

- **PUT /api/buses/:busId**
  - ✅ Met à jour un bus existant (200)
  - ✅ Retourne 404 si le bus n'existe pas

- **DELETE /api/buses/:busId**
  - ✅ Supprime un bus existant (200)
  - ✅ Retourne 404 si le bus n'existe pas

**Exécuter:**
```bash
cd backend
npm run test:integration -- bus.routes
```

### Frontend

#### 3. Tests de composants - BusesManagementPage (`web-admin/src/tests/pages/BusesManagementPage.test.tsx`)

**Couverture:** Interface utilisateur complète de gestion des bus.

**Tests inclus:**

- **Affichage initial**
  - ✅ Affiche le titre et le bouton d'ajout
  - ✅ Affiche un état de chargement
  - ✅ Affiche un message d'erreur en cas d'échec

- **Liste des bus**
  - ✅ Affiche la liste des bus
  - ✅ Affiche le compteur de bus
  - ✅ Affiche un message si aucun bus

- **Badges de statut**
  - ✅ Affiche le bon badge pour statut actif

- **Modal de création**
  - ✅ Ouvre le modal de création au clic
  - ✅ Ferme le modal au clic sur Annuler

- **Création d'un bus**
  - ✅ Crée un nouveau bus avec succès
  - ✅ Affiche une erreur si des champs sont manquants

- **Suppression d'un bus**
  - ✅ Supprime un bus après confirmation
  - ✅ Annule la suppression si l'utilisateur refuse

**Exécuter:**
```bash
cd web-admin
npm test -- BusesManagementPage
```

#### 4. Tests de service API - bus.api (`web-admin/src/tests/services/bus.api.test.ts`)

**Couverture:** Appels API pour la gestion des bus côté client.

**Tests inclus:**

- **createBus**
  - ✅ Crée un bus avec succès
  - ✅ Lance une erreur en cas d'échec
  - ✅ Lance une erreur générique si pas de message

- **getAllBuses**
  - ✅ Récupère tous les bus sans positions GPS
  - ✅ Récupère tous les bus avec positions GPS (live=true)
  - ✅ Lance une erreur en cas d'échec

- **getBusById**
  - ✅ Récupère un bus spécifique
  - ✅ Lance une erreur si le bus n'existe pas

- **updateBus**
  - ✅ Met à jour un bus avec succès
  - ✅ Lance une erreur en cas d'échec

- **deleteBus**
  - ✅ Supprime un bus avec succès
  - ✅ Lance une erreur en cas d'échec

**Exécuter:**
```bash
cd web-admin
npm test -- bus.api
```

## Commandes de test

### Tous les tests backend

```bash
cd backend
npm test
```

### Tous les tests frontend

```bash
cd web-admin
npm test
```

### Tests avec couverture

```bash
# Backend
cd backend
npm run test:coverage

# Frontend
cd web-admin
npm run test:coverage
```

### Tests en mode watch (développement)

```bash
# Backend
cd backend
npm run test:watch

# Frontend
cd web-admin
npm run test:watch
```

## Couverture des tests

### Backend
- **Services:** 100% des méthodes CRUD testées
- **Controllers:** 100% des endpoints testés
- **Routes:** 100% des routes testées

### Frontend
- **Pages:** Tous les scénarios utilisateur principaux testés
- **Services API:** 100% des appels API testés
- **Composants:** Tests d'intégration complets

## Scénarios de test critiques

### 1. Cycle de vie complet d'un bus
```
Création → Lecture → Mise à jour → Suppression
```

### 2. Gestion des erreurs
- Champs manquants (400)
- Bus introuvable (404)
- Erreurs réseau (500)

### 3. Validation des données
- Format des champs
- Valeurs par défaut
- Contraintes métier

### 4. Interface utilisateur
- États de chargement
- Messages d'erreur
- Confirmations utilisateur
- Rafraîchissement des données après mutations

## Prochains tests à ajouter

### Backend
- [ ] Tests de performance (charge)
- [ ] Tests de sécurité (authentification/autorisation)
- [ ] Tests de validation stricte (Zod schemas)

### Frontend
- [ ] Tests E2E avec Playwright
- [ ] Tests d'accessibilité
- [ ] Tests de responsiveness

## Notes importantes

1. **Isolation des tests:** Chaque test est indépendant et n'affecte pas les autres
2. **Mocks:** Les dépendances externes (Firestore, axios) sont mockées
3. **Nettoyage:** Les mocks sont réinitialisés avant chaque test (`beforeEach`)
4. **Assertions:** Tests clairs avec des assertions explicites
5. **Couverture:** Tests couvrent les cas nominaux ET les cas d'erreur

## Commandes rapides

```bash
# Lancer tous les tests du projet
npm run test:all  # (à la racine)

# Lancer uniquement les tests bus
npm test -- bus

# Lancer les tests en mode interactif
npm test -- --watch

# Générer un rapport de couverture
npm run test:coverage
```

## Intégration CI/CD

Ces tests sont automatiquement exécutés :
- ✅ À chaque Pull Request
- ✅ Avant chaque merge sur `main`
- ✅ Dans le pipeline GitHub Actions

**Règle:** Si un test échoue → PR bloquée → pas de merge.

