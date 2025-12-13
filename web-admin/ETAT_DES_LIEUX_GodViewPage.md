# État des Lieux - GodViewPage.tsx

## 📊 Vue d'ensemble

**Fichier:** `web-admin/src/pages/GodViewPage.tsx`  
**Lignes de code:** 578  
**Statut:** Fonctionnel avec améliorations possibles

---

## ✅ Fonctionnalités Implémentées

### 1. **Carte Mapbox**
- ✅ Initialisation de la carte avec style satellite-streets
- ✅ Centrage automatique sur l'école
- ✅ Zoom configuré (16, min: 13, max: 18)
- ✅ Contrôles de navigation (zoom in/out, rotation)
- ✅ Marqueur fixe pour l'école avec icône

### 2. **Affichage des Bus**
- ✅ Marqueurs de bus avec couleurs selon statut :
  - 🟢 Vert : EN_ROUTE
  - 🟠 Orange : DELAYED (avec animation clignotante)
  - 🔴 Rouge : Stationné (non utilisé actuellement car filtré)
  - ⚪ Gris : Inactif
- ✅ Popup avec informations détaillées :
  - Numéro du bus
  - Informations chauffeur (nom, téléphone)
  - Comptages élèves (scannés/non scannés/total)
  - Distance de l'école
  - Statut actuel

### 3. **Simulation de Trajectoire**
- ✅ Simulation de mouvement des bus depuis les quartiers vers l'école
- ✅ Trajectoire progressive avec interpolation linéaire
- ✅ Légère courbe pour simuler les routes réelles
- ✅ Vitesse variable par bus (basée sur busId)
- ✅ Mise à jour toutes les 5 secondes

### 4. **Gestion d'Arrivée**
- ✅ Détection automatique d'arrivée (progress >= 1 ou distance < 100m)
- ✅ Mise à jour du statut dans Firestore (`arrived`)
- ✅ Prévention des mises à jour multiples (ref Set)
- ✅ Position fixe à l'école pour les bus arrivés

### 5. **Filtrage des Bus**
- ✅ Affichage uniquement des bus EN_ROUTE, DELAYED ou ARRIVED
- ✅ Masquage des bus STOPPED, IDLE ou inactifs
- ✅ Filtrage basé sur `isActive`

### 6. **Comptages d'Élèves**
- ✅ Récupération des comptages scannés/non scannés par bus
- ✅ Affichage dans le popup
- ✅ Affichage dans la sidebar (via props)
- ⚠️ **Workaround:** Inversion des valeurs (getScannedStudents/getUnscannedStudents retournent les valeurs inversées)

### 7. **Sidebar d'Alertes**
- ✅ Intégration avec `AlertsSidebar`
- ✅ Passage des données nécessaires (alerts, buses, studentsCounts)
- ✅ Filtrage des alertes par bus de l'école

### 8. **Gestion d'Erreurs**
- ✅ Affichage des erreurs de chargement
- ✅ Gestion des erreurs de récupération des comptages
- ✅ Gestion des erreurs de mise à jour Firestore
- ✅ Message d'erreur si token Mapbox manquant

---

## ⚠️ Problèmes Identifiés

### 1. **Inversion des Valeurs Scannés/Non Scannés**
**Ligne:** 425-429  
**Problème:** Les fonctions `getScannedStudents` et `getUnscannedStudents` retournent les valeurs inversées  
**Solution actuelle:** Workaround avec inversion manuelle  
**Solution recommandée:** Corriger les fonctions dans `students.firestore.ts`

```typescript
// Actuel (workaround)
scanned: unscanned.length, // Utiliser unscanned.length pour les scannés
unscanned: scanned.length, // Utiliser scanned.length pour les non scannés
```

### 2. **Cycle de Simulation Infini**
**Ligne:** 142  
**Problème:** Le cycle recommence automatiquement après arrivée (modulo)  
**Impact:** Les bus repartent automatiquement après arrivée sans contrôle  
**Solution recommandée:** Ajouter une logique pour gérer les bus arrivés différemment

### 3. **Pas de Gestion des Bus qui Repartent**
**Problème:** Une fois arrivé, le bus reste à l'école indéfiniment  
**Solution recommandée:** Ajouter une logique pour remettre le bus en route après un délai ou action manuelle

### 4. **Performance - Mise à Jour de Tous les Bus**
**Ligne:** 456-511  
**Problème:** Tous les marqueurs sont mis à jour même si hors écran  
**Solution recommandée:** Utiliser `map.getBounds()` pour ne mettre à jour que les bus visibles

### 5. **Pas de Nettoyage du Ref `arrivedBusesRef`**
**Ligne:** 114  
**Problème:** Le Set ne se vide jamais, peut causer des fuites mémoire  
**Solution recommandée:** Nettoyer périodiquement ou lors du changement d'école

---

## 🔧 Fonctionnalités Partiellement Implémentées

### 1. **Classification des Bus**
**Ligne:** 54-82  
**Statut:** Implémenté mais peu utilisé  
**Problème:** La classification `stationed` n'est jamais utilisée car les bus stationnés sont filtrés  
**Note:** Pourrait être utile pour afficher les bus à l'école différemment

### 2. **Position Réelle vs Simulée**
**Ligne:** 168-174  
**Statut:** Gère les deux cas mais logique simplifiée  
**Problème:** Si position réelle existe, interpolation directe (pas de trajectoire réaliste)  
**Amélioration:** Utiliser la position réelle comme point de départ pour la simulation

---

## ❌ Fonctionnalités Manquantes

### 1. **Affichage de la Trajectoire**
- ❌ Pas de ligne de trajectoire visible sur la carte
- ❌ Pas d'historique de mouvement
- ❌ Pas de polyline pour montrer le chemin parcouru

### 2. **Légende des Couleurs**
- ❌ Pas de légende expliquant les couleurs des marqueurs
- ❌ Pas d'aide visuelle pour comprendre les statuts

### 3. **Contrôles de Simulation**
- ❌ Pas de bouton pause/play
- ❌ Pas de contrôle de vitesse de simulation
- ❌ Pas de reset de simulation

### 4. **Statistiques Globales**
- ❌ Pas de compteur total de bus en cours
- ❌ Pas de compteur total d'élèves
- ❌ Pas de statistiques de temps réel

### 5. **Filtres Avancés**
- ❌ Pas de filtre par route
- ❌ Pas de filtre par statut sur la carte
- ❌ Pas de recherche de bus

### 6. **Gestion des Bus Arrivés**
- ❌ Pas de logique pour remettre les bus en route
- ❌ Pas de délai avant redépart
- ❌ Pas d'action manuelle pour redémarrer un bus

### 7. **Optimisations**
- ❌ Pas de debounce/throttle pour les mises à jour
- ❌ Pas de mise à jour conditionnelle (seulement si changement)
- ❌ Pas de lazy loading des popups

### 8. **Accessibilité**
- ❌ Pas d'attributs ARIA sur les marqueurs
- ❌ Pas de navigation au clavier
- ❌ Pas de support lecteur d'écran

### 9. **Tests**
- ❌ Pas de tests unitaires
- ❌ Pas de tests d'intégration
- ❌ Pas de tests E2E

### 10. **Documentation**
- ❌ Pas de JSDoc sur les fonctions complexes
- ❌ Pas de commentaires expliquant la logique de simulation
- ❌ Pas de documentation des constantes

---

## 🎯 Priorités d'Implémentation

### **Priorité Haute (P1)**
1. **Corriger l'inversion scannés/non scannés** - Corriger les fonctions dans `students.firestore.ts`
2. **Gestion des bus arrivés** - Logique pour remettre en route ou rester à l'école
3. **Nettoyage du ref `arrivedBusesRef`** - Prévenir les fuites mémoire

### **Priorité Moyenne (P2)**
4. **Légende des couleurs** - Aide visuelle pour comprendre les statuts
5. **Statistiques globales** - Compteurs en temps réel
6. **Optimisation performance** - Mise à jour seulement des bus visibles
7. **Trajectoire visible** - Ligne sur la carte montrant le chemin

### **Priorité Basse (P3)**
8. **Contrôles de simulation** - Pause/play/vitesse
9. **Filtres avancés** - Par route, par statut
10. **Tests** - Unitaires et intégration
11. **Accessibilité** - ARIA, navigation clavier

---

## 📝 Notes Techniques

### **Constantes à Vérifier**
- `STATIONED_DISTANCE_THRESHOLD_METERS = 150` - Utilisé mais bus stationnés filtrés
- `ABIDJAN_CENTER` - Coordonnées hardcodées, devrait utiliser `school.location`
- Vitesse de simulation : `0.02 + (seed % 100) / 100 * 0.03` - Valeurs arbitraires

### **Dépendances**
- `mapboxgl` - Version non spécifiée dans package.json
- `lucide-react` - Pour les icônes
- Hooks personnalisés : `useAuthContext`, `useSchoolBuses`, `useRealtimeAlerts`

### **Performance**
- Intervalle de mise à jour : 5 secondes (5000ms)
- Pas de memoization des calculs de distance
- Re-render complet à chaque tick de simulation

---

## 🔄 Améliorations Suggérées

1. **Refactoriser la logique de simulation** dans un hook personnalisé `useBusSimulation`
2. **Séparer la logique de carte** dans un composant `MapView`
3. **Créer un service** pour gérer les comptages d'élèves
4. **Ajouter un contexte** pour l'état global de la simulation
5. **Utiliser React.memo** pour optimiser les re-renders
6. **Implémenter un système d'événements** pour les changements de statut

---

## 📈 Métriques Actuelles

- **Lignes de code:** 578
- **Fonctions:** ~15
- **useEffect:** 6
- **useMemo:** 2
- **useCallback:** 3
- **Complexité cyclomatique:** Moyenne-Élevée (logique de simulation imbriquée)

---

## ✅ Conclusion

Le composant `GodViewPage.tsx` est **fonctionnel** et répond aux besoins de base :
- ✅ Affichage de la carte avec bus en temps réel
- ✅ Simulation de mouvement vers l'école
- ✅ Détection d'arrivée automatique
- ✅ Intégration avec la sidebar

**Points d'attention :**
- ⚠️ Workaround pour inversion des valeurs (à corriger)
- ⚠️ Cycle infini de simulation (à améliorer)
- ⚠️ Pas de gestion des bus qui repartent

**Recommandation:** Prioriser les corrections (P1) avant d'ajouter de nouvelles fonctionnalités.

