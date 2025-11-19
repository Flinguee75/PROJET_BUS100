# Plan de Test - Application Mobile Parent (Navigation Uber-Style)

**Date:** 2025-11-19
**Branch:** `claude/mobile-login-android-01MQFQYj6UjnkoU1BNoba96J`
**Testeur:** _____________

## Fonctionnalités Implémentées

### 1. Modèle de Données - Champ `arret`
- ✅ Ajout du champ `arret` (GPSPosition) au modèle `Enfant`
- ✅ Parsing JSON avec/sans arrêt
- ✅ Serialization JSON avec/sans arrêt

### 2. Navigation Style Uber
- ✅ Connexion → Carte directe (plus de liste d'enfants)
- ✅ Affichage automatique du premier enfant
- ✅ Nouvel écran principal: `MainMapScreen`

### 3. Menu Drawer (Gauche)
- ✅ Email du parent affiché
- ✅ Nom de l'enfant affiché
- ✅ Navigation vers Profil
- ✅ Paramètres (placeholder)
- ✅ Déconnexion

### 4. Carte Interactive
- ✅ Centrage sur l'arrêt de l'enfant
- ✅ Fallback sur Abidjan si pas d'arrêt
- ✅ Marqueur rouge pour l'arrêt
- ✅ Marqueur coloré pour le bus

### 5. Statut du Bus
- ✅ Message "Pas de course en cours" si inactif
- ✅ Affichage du statut en temps réel
- ✅ Calcul ETA/Distance

---

## Tests Automatisés

### Exécuter les Tests

```bash
cd mobile-parent/parent_app

# Tous les tests
flutter test

# Tests du modèle Enfant uniquement
flutter test test/models/enfant_test.dart

# Tests du MainMapScreen uniquement
flutter test test/screens/main_map_screen_test.dart

# Avec coverage
flutter test --coverage
```

### Tests Unitaires - Modèle Enfant

**Fichier:** `test/models/enfant_test.dart`

| Test Case | Description | Statut |
|-----------|-------------|--------|
| `Enfant.fromJson with arret` | Parse JSON avec coordonnées d'arrêt | ⬜ |
| `Enfant.fromJson without arret` | Parse JSON sans arrêt (null) | ⬜ |
| `Enfant.toJson with arret` | Sérialise avec arrêt | ⬜ |
| `Enfant.toJson without arret` | Sérialise sans arrêt (null) | ⬜ |
| `Abidjan coordinates handling` | Gestion des coordonnées d'Abidjan | ⬜ |

**Commande:**
```bash
flutter test test/models/enfant_test.dart -r expanded
```

**Résultat attendu:** Tous les tests passent ✅

---

### Tests Widget - MainMapScreen

**Fichier:** `test/screens/main_map_screen_test.dart`

| Test Case | Description | Statut |
|-----------|-------------|--------|
| `Loading indicator` | Affiche loader pendant chargement | ⬜ |
| `No children message` | Message si aucun enfant | ⬜ |
| `AppBar with child name` | AppBar avec nom de l'enfant | ⬜ |
| `Drawer opens` | Menu drawer s'ouvre | ⬜ |
| `Drawer header` | Email et nom dans drawer | ⬜ |
| `"Pas de course en cours"` | Statut bus inactif | ⬜ |
| `Bus information display` | Infos bus actif | ⬜ |
| `ETA and distance` | Calcul ETA/distance | ⬜ |
| `Profile navigation` | Navigation vers profil | ⬜ |
| `Settings snackbar` | Snackbar paramètres | ⬜ |
| `Map with arret` | Carte centrée sur arrêt | ⬜ |
| `Map without arret` | Carte centrée sur Abidjan | ⬜ |

**Commande:**
```bash
flutter test test/screens/main_map_screen_test.dart -r expanded
```

**Résultat attendu:** Tous les tests passent ✅

---

## Tests Manuels

### Prérequis

1. **Données Firestore** - Créer un enfant avec arrêt:

```json
// Collection: students
// Document: enfant_test_001
{
  "id": "enfant_test_001",
  "nom": "Kouassi",
  "prenom": "Aya",
  "classe": "CE2",
  "ecole": "École Plateau",
  "busId": "bus_001",
  "parentId": "parent_001",
  "arret": {
    "lat": 5.3600,
    "lng": -4.0083,
    "speed": 0.0,
    "timestamp": 1640000000000
  }
}
```

2. **Bus actif** (optionnel):

```json
// Collection: gps_live
// Document: bus_001
{
  "lat": 5.3200,
  "lng": -4.0300,
  "speed": 35.0,
  "timestamp": 1640000000000
}
```

3. **Compte parent** avec email/mot de passe

---

### TEST 1: Connexion et Navigation

**Objectif:** Vérifier que la connexion redirige vers la carte

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Lancer l'application | Splash screen s'affiche | ⬜ |
| 2 | Attendre 2 secondes | Redirection vers LoginScreen | ⬜ |
| 3 | Entrer email/mot de passe | Champs remplis correctement | ⬜ |
| 4 | Cliquer "Se connecter" | Loader s'affiche | ⬜ |
| 5 | Connexion réussie | **Redirection vers carte directement** (pas de liste) | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 2: Affichage de la Carte

**Objectif:** Vérifier le centrage et les marqueurs

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Observer la carte | Carte Google Maps affichée | ⬜ |
| 2 | Vérifier position initiale | Carte centrée sur l'arrêt de l'enfant (5.36°N, -4.01°W) | ⬜ |
| 3 | Compter les marqueurs | **2 marqueurs** si bus actif, **1 marqueur** sinon | ⬜ |
| 4 | Identifier marqueur arrêt | Marqueur **rouge** à la position de l'arrêt | ⬜ |
| 5 | Cliquer sur marqueur arrêt | Info window: "Arrêt de Aya" | ⬜ |
| 6 | Identifier marqueur bus | Marqueur **vert/bleu/orange** (selon statut) | ⬜ |
| 7 | Cliquer sur marqueur bus | Info window avec immatriculation et statut | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 3: Menu Drawer

**Objectif:** Vérifier le menu latéral gauche

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Cliquer sur icône menu (☰) | Drawer s'ouvre depuis la gauche | ⬜ |
| 2 | Vérifier header | Email du parent affiché | ⬜ |
| 3 | Vérifier header | "Enfant: Aya Kouassi" affiché | ⬜ |
| 4 | Vérifier menu items | "Mon Profil" présent | ⬜ |
| 5 | Vérifier menu items | "Paramètres" présent | ⬜ |
| 6 | Vérifier menu items | "Déconnexion" présent (rouge) | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 4: Navigation Drawer - Profil

**Objectif:** Tester la navigation vers le profil

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Ouvrir drawer | Menu visible | ⬜ |
| 2 | Cliquer "Mon Profil" | Drawer se ferme | ⬜ |
| 3 | Vérifier navigation | ProfileScreen s'affiche | ⬜ |
| 4 | Retour arrière | Retour à la carte | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 5: Navigation Drawer - Paramètres

**Objectif:** Vérifier le placeholder paramètres

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Ouvrir drawer | Menu visible | ⬜ |
| 2 | Cliquer "Paramètres" | Drawer se ferme | ⬜ |
| 3 | Vérifier snackbar | Message "Paramètres - À venir" affiché | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 6: Navigation Drawer - Déconnexion

**Objectif:** Tester la déconnexion

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Ouvrir drawer | Menu visible | ⬜ |
| 2 | Cliquer "Déconnexion" (rouge) | Drawer se ferme | ⬜ |
| 3 | Vérifier navigation | Retour au LoginScreen | ⬜ |
| 4 | Vérifier état | Utilisateur déconnecté | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 7: Statut Bus - Pas de Course

**Objectif:** Vérifier l'affichage quand bus inactif

**Données:** Supprimer la position GPS du bus ou mettre `status: HORS_SERVICE`

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Observer card en bas | Card info visible | ⬜ |
| 2 | Vérifier badge statut | Badge "Pas de course en cours" (violet) | ⬜ |
| 3 | Vérifier informations | Immatriculation du bus affiché | ⬜ |
| 4 | Vérifier informations | Nom du chauffeur affiché | ⬜ |
| 5 | Vérifier absence | **Pas d'ETA/Distance** affiché | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 8: Statut Bus - En Route

**Objectif:** Vérifier l'affichage quand bus actif

**Données:** Bus avec position GPS et `status: EN_ROUTE`

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Observer card en bas | Card info visible | ⬜ |
| 2 | Vérifier badge statut | Badge "En route" (vert) | ⬜ |
| 3 | Vérifier ETA | Section ETA avec icône horloge | ⬜ |
| 4 | Vérifier Distance | Section Distance avec icône règle | ⬜ |
| 5 | Vérifier calcul | Valeurs calculées (ex: "5 min", "2.3 km") | ⬜ |
| 6 | Vérifier informations | Immatriculation, chauffeur, itinéraire | ⬜ |
| 7 | Vérifier vitesse | Vitesse du bus affichée (ex: "35.0 km/h") | ⬜ |
| 8 | Vérifier timestamp | "Mis à jour: ..." affiché | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 9: Temps Réel - Mise à Jour GPS

**Objectif:** Vérifier que les positions se mettent à jour en temps réel

**Prérequis:** Simuler des mises à jour GPS dans Firestore

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Observer position bus | Marqueur à position initiale | ⬜ |
| 2 | Modifier GPS dans Firestore | (via console Firebase) | ⬜ |
| 3 | Observer carte | Marqueur se déplace (sans recharger) | ⬜ |
| 4 | Observer ETA/Distance | Valeurs se mettent à jour | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 10: Sans Arrêt - Centrage Abidjan

**Objectif:** Vérifier le fallback sur Abidjan

**Données:** Enfant sans champ `arret`

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Se connecter avec enfant sans arrêt | Carte s'affiche | ⬜ |
| 2 | Vérifier position initiale | Carte centrée sur Abidjan (5.36°N, -4.01°W) | ⬜ |
| 3 | Compter marqueurs | **1 seul marqueur** (bus, pas d'arrêt) | ⬜ |
| 4 | Vérifier card info | Infos bus affichées sans ETA/Distance | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 11: Plusieurs Enfants

**Objectif:** Vérifier l'affichage avec plusieurs enfants

**Données:** Parent avec 2+ enfants

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Se connecter | Carte affichée | ⬜ |
| 2 | Vérifier AppBar | Nom du **premier enfant** affiché | ⬜ |
| 3 | Vérifier drawer | Nom du premier enfant dans header | ⬜ |
| 4 | Vérifier carte | Arrêt du premier enfant affiché | ⬜ |

**Note:** Actuellement, seul le premier enfant est affiché (pas de sélection).

**Résultat:** ⬜ Réussi / ⬜ Échec

---

### TEST 12: Aucun Enfant

**Objectif:** Vérifier l'affichage si parent sans enfant

**Données:** Parent sans enfants assignés

| Étape | Action | Résultat Attendu | ✅/❌ |
|-------|--------|------------------|-------|
| 1 | Se connecter | Pas de carte | ⬜ |
| 2 | Vérifier message | "Aucun enfant enregistré" affiché | ⬜ |
| 3 | Vérifier sous-message | "Contactez l'école..." affiché | ⬜ |
| 4 | Vérifier drawer | Menu accessible | ⬜ |

**Résultat:** ⬜ Réussi / ⬜ Échec

---

## Tests de Performance

### TEST 13: Chargement Initial

| Métrique | Cible | Mesure | ✅/❌ |
|----------|-------|--------|-------|
| Temps splash screen | 2 secondes | _____ s | ⬜ |
| Connexion Firebase | < 2 secondes | _____ s | ⬜ |
| Chargement enfants | < 1 seconde | _____ s | ⬜ |
| Affichage carte | < 1 seconde | _____ s | ⬜ |

---

### TEST 14: Réactivité

| Interaction | Temps de réponse cible | Mesure | ✅/❌ |
|-------------|------------------------|--------|-------|
| Ouverture drawer | Instantané | _____ ms | ⬜ |
| Navigation profil | < 300 ms | _____ ms | ⬜ |
| Zoom/Pan carte | Fluide (60 fps) | _____ fps | ⬜ |
| Mise à jour GPS | < 1 seconde | _____ s | ⬜ |

---

## Tests de Robustesse

### TEST 15: Connexion Réseau

| Scénario | Action | Résultat Attendu | ✅/❌ |
|----------|--------|------------------|-------|
| Pas de connexion au démarrage | Lancer app hors ligne | Message d'erreur approprié | ⬜ |
| Perte de connexion | Désactiver WiFi/Data pendant utilisation | Carte reste visible, pas de crash | ⬜ |
| Reconnexion | Réactiver connexion | Données se synchronisent | ⬜ |

---

### TEST 16: Cas Limites

| Scénario | Résultat Attendu | ✅/❌ |
|----------|------------------|-------|
| Nom enfant très long | Texte tronqué ou multi-lignes | ⬜ |
| Email parent très long | Texte tronqué dans drawer | ⬜ |
| Bus sans chauffeur assigné | Affichage par défaut ("Non assigné") | ⬜ |
| Coordonnées GPS invalides | Fallback sur Abidjan | ⬜ |

---

## Checklist de Régression

Vérifier que les fonctionnalités existantes fonctionnent toujours :

- [ ] L'ancien `HomeScreen` (liste enfants) fonctionne si accédé directement
- [ ] `MapScreen` (ancien écran carte) fonctionne toujours
- [ ] `ProfileScreen` accessible et fonctionnel
- [ ] `EnfantSettingsScreen` accessible et fonctionnel
- [ ] Providers `AuthProvider` et `BusProvider` fonctionnent
- [ ] Services Firestore (`EnfantService`, `BusService`) fonctionnent

---

## Rapport de Test

### Résumé des Tests

- **Tests Automatisés Exécutés:** _____ / _____
- **Tests Automatisés Réussis:** _____ / _____
- **Tests Manuels Exécutés:** _____ / 16
- **Tests Manuels Réussis:** _____ / 16

### Bugs Identifiés

| ID | Sévérité | Description | Statut |
|----|----------|-------------|--------|
| 1 | ⬜ Critique / ⬜ Majeur / ⬜ Mineur | | ⬜ Ouvert / ⬜ Résolu |
| 2 | ⬜ Critique / ⬜ Majeur / ⬜ Mineur | | ⬜ Ouvert / ⬜ Résolu |
| 3 | ⬜ Critique / ⬜ Majeur / ⬜ Mineur | | ⬜ Ouvert / ⬜ Résolu |

### Recommandations

1. _________________________________________________
2. _________________________________________________
3. _________________________________________________

### Validation Finale

- [ ] Tous les tests critiques passent
- [ ] Aucun bug bloquant
- [ ] Performance acceptable
- [ ] UX conforme aux spécifications

**Prêt pour Production:** ⬜ Oui / ⬜ Non

---

**Signé:**
**Date:** _____________
**Testeur:** _____________
