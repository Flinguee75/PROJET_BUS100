# Guide de Test - Phase 4 : Suivi de Ramassage

## 🧪 Tests Manuels Recommandés

### Prérequis

```bash
# Terminal 1 : Lancer les emulators Firebase
cd backend
firebase emulators:start

# Terminal 2 : Lancer le frontend
cd web-admin
npm run dev
```

---

## Test 1 : Affichage du Popup de Base

### Objectif
Vérifier que le popup s'affiche correctement avec les nouvelles sections.

### Étapes

1. Ouvrir `http://localhost:5173` (ou le port Vite)
2. Se connecter avec un compte admin
3. Aller sur la page **God View**
4. Cliquer sur un bus **EN_ROUTE** sur la carte

### Résultat Attendu

Le popup doit afficher :
- ✅ **Header** : Numéro du bus + ratio géant (ex: 3/6)
- ✅ **Section "Ramassage en cours"** : "X élève(s) à bord • Y restant(s)"
- ✅ **Section "Dernier scan"** (si existe) : Nom + "il y a X min"
- ✅ **Section "Prochain élève"** (si existe) : Nom de l'élève
- ✅ **Statut** : Vitesse + durée du trajet
- ✅ **Chauffeur** : Nom + téléphone
- ✅ **Bouton** : "Centrer sur carte →"

---

## Test 2 : Auto-refresh du Popup

### Objectif
Vérifier que le popup se met à jour automatiquement toutes les 15 secondes.

### Étapes

1. Ouvrir un popup d'un bus EN_ROUTE
2. Noter le temps affiché dans "Dernier scan" (ex: "il y a 5 min")
3. **Attendre 15 secondes** sans fermer le popup
4. Observer si le temps se met à jour (ex: "il y a 5 min" → "il y a 6 min")

### Résultat Attendu

- ✅ Le popup se rafraîchit automatiquement toutes les 15 secondes
- ✅ Le temps "il y a X min" augmente
- ✅ La durée du trajet augmente
- ✅ Le popup ne se ferme pas lors du refresh

---

## Test 3 : Affichage Conditionnel

### Objectif
Vérifier que les sections s'affichent uniquement quand les données existent.

### Cas de Test

#### Cas 3.1 : Bus sans scans
- **Contexte** : Bus EN_ROUTE mais aucun élève scanné
- **Attendu** :
  - ✅ Ratio : 0/6
  - ✅ "Ramassage en cours" : "0 élève à bord • 6 restants"
  - ❌ Pas de section "Dernier scan"
  - ✅ Section "Prochain élève" affichée

#### Cas 3.2 : Bus avec tous les élèves scannés
- **Contexte** : Bus EN_ROUTE avec tous les élèves à bord
- **Attendu** :
  - ✅ Ratio : 6/6 (vert)
  - ✅ "Ramassage en cours" : "6 élèves à bord • 0 restant"
  - ✅ Section "Dernier scan" affichée
  - ❌ Pas de section "Prochain élève" (tous scannés)

#### Cas 3.3 : Bus ARRIVED
- **Contexte** : Bus avec statut ARRIVED
- **Attendu** :
  - ✅ Ratio affiché
  - ✅ "Ramassage en cours" affiché
  - ✅ "Dernier scan" affiché (si existe)
  - ❌ Pas de section "Prochain élève" (bus arrivé)

---

## Test 4 : Intégration avec Backend

### Objectif
Vérifier que les données proviennent bien du backend.

### Étapes

1. Ouvrir la console développeur (F12)
2. Aller dans l'onglet **Network**
3. Cliquer sur un bus EN_ROUTE
4. Chercher une requête vers `/api/buses/{busId}/next-student`

### Résultat Attendu

- ✅ Requête GET vers `/api/buses/{busId}/next-student`
- ✅ Réponse 200 avec JSON :
  ```json
  {
    "success": true,
    "data": {
      "studentId": "...",
      "studentName": "Yao Michel",
      "stopOrder": 3
    }
  }
  ```
  OU
  ```json
  {
    "success": true,
    "data": null  // Si tous les élèves sont scannés
  }
  ```

---

## Test 5 : Calcul du Temps Écoulé

### Objectif
Vérifier que "il y a X min" est calculé correctement.

### Étapes

1. Simuler un scan récent (via Firestore ou script)
2. Ouvrir le popup du bus
3. Vérifier que le temps affiché correspond

### Exemple

- **Scan à** : 14:30:00
- **Heure actuelle** : 14:35:00
- **Attendu** : "il y a 5 min"

### Formule

```typescript
minutesAgo = Math.floor((Date.now() - bus.lastScan.timestamp) / 60000)
```

---

## Test 6 : Format de Durée du Trajet

### Objectif
Vérifier que la durée du trajet s'affiche correctement.

### Cas de Test

| Durée Écoulée | Format Attendu |
|---------------|----------------|
| 5 minutes     | "5 min"        |
| 45 minutes    | "45 min"       |
| 1h 15min      | "1h15"         |
| 2h 30min      | "2h30"         |

---

## Test 7 : Performance

### Objectif
Vérifier que l'auto-refresh ne cause pas de problèmes de performance.

### Étapes

1. Ouvrir un popup
2. Ouvrir la console développeur → onglet **Performance**
3. Laisser le popup ouvert pendant 2 minutes
4. Observer les requêtes réseau et l'utilisation mémoire

### Résultat Attendu

- ✅ Requête `/next-student` toutes les 15 secondes
- ✅ Pas d'augmentation excessive de la mémoire
- ✅ Pas de ralentissement de l'interface

---

## 🐛 Scénarios de Débogage

### Problème : "Prochain élève" ne s'affiche pas

**Causes possibles** :
1. Bus n'est pas EN_ROUTE ou DELAYED
2. Tous les élèves sont déjà scannés
3. Erreur API (vérifier la console)
4. Bus n'a pas de route assignée
5. Route n'a pas de stops

**Solution** :
```javascript
// Console développeur
console.log('Bus status:', bus.liveStatus);
console.log('Scanned count:', counts.scanned);
console.log('Total count:', counts.total);
```

### Problème : Auto-refresh ne fonctionne pas

**Causes possibles** :
1. Popup fermé (vérifier `activePopupBusId`)
2. Bus n'est plus dans `processedBuses`
3. Erreur dans `createPopupHTML`

**Solution** :
```javascript
// Console développeur
console.log('Active popup bus ID:', activePopupBusId);
console.log('Processed buses:', processedBuses.map(b => b.id));
```

### Problème : Temps "il y a X min" incorrect

**Causes possibles** :
1. `bus.lastScan.timestamp` est en secondes au lieu de millisecondes
2. Horloge système désynchronisée

**Solution** :
```javascript
// Console développeur
console.log('Last scan timestamp:', bus.lastScan.timestamp);
console.log('Current time:', Date.now());
console.log('Difference (ms):', Date.now() - bus.lastScan.timestamp);
```

---

## 📊 Checklist de Test Complet

### Affichage
- [ ] Popup s'affiche correctement
- [ ] Ratio géant visible (rouge/vert)
- [ ] Section "Ramassage en cours" affichée
- [ ] Section "Dernier scan" affichée (si existe)
- [ ] Section "Prochain élève" affichée (si existe)
- [ ] Vitesse et durée affichées
- [ ] Infos chauffeur affichées

### Fonctionnalités
- [ ] Auto-refresh toutes les 15 secondes
- [ ] Temps "il y a X min" se met à jour
- [ ] Durée du trajet augmente
- [ ] Popup ne se ferme pas lors du refresh
- [ ] Requête API `/next-student` réussit

### Affichage Conditionnel
- [ ] Sections masquées si pas de données
- [ ] "Prochain élève" masqué si bus ARRIVED
- [ ] "Prochain élève" masqué si tous scannés
- [ ] Ratio vert si complet, rouge sinon

### Performance
- [ ] Pas de ralentissement après 2 minutes
- [ ] Mémoire stable
- [ ] Requêtes réseau raisonnables

---

## 🚀 Test de Déploiement

### Build Production

```bash
cd web-admin
npm run build
```

**Vérifications** :
- [ ] Build réussi sans erreurs critiques
- [ ] Fichiers générés dans `dist/`
- [ ] Taille du bundle raisonnable

### Déploiement Firebase

```bash
firebase deploy --only hosting
```

**Vérifications** :
- [ ] Déploiement réussi
- [ ] URL de production accessible
- [ ] Fonctionnalités identiques à la version locale

---

## 📝 Rapport de Test

### Template

```markdown
## Test Phase 4 - [Date]

### Environnement
- Frontend : [Local / Production]
- Backend : [Emulators / Production]
- Navigateur : [Chrome / Firefox / Safari]

### Tests Réalisés
- [ ] Test 1 : Affichage du popup
- [ ] Test 2 : Auto-refresh
- [ ] Test 3 : Affichage conditionnel
- [ ] Test 4 : Intégration backend
- [ ] Test 5 : Calcul du temps
- [ ] Test 6 : Format de durée
- [ ] Test 7 : Performance

### Bugs Trouvés
1. [Description du bug]
   - Sévérité : [Critique / Majeur / Mineur]
   - Étapes de reproduction : ...
   - Résultat attendu : ...
   - Résultat obtenu : ...

### Conclusion
- ✅ Tous les tests passent
- ⚠️ Tests passent avec réserves
- ❌ Tests échouent

### Recommandations
[Actions à prendre avant déploiement]
```

---

## 🎯 Critères de Validation

La Phase 4 est considérée comme **validée** si :

1. ✅ Tous les tests manuels passent
2. ✅ Auto-refresh fonctionne correctement
3. ✅ Affichage conditionnel correct
4. ✅ Performance acceptable (pas de lag)
5. ✅ Build production sans erreurs
6. ✅ Déploiement réussi

---

**Bon test ! 🚀**

