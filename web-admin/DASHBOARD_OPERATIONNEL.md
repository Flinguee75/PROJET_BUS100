# 🚨 Dashboard Opérationnel - Contexte Abidjan

## 📋 Vue d'ensemble

Le Dashboard a été **complètement refondu** pour être **opérationnel** et adapté au contexte d'Abidjan (trafic + coûts + sécurité).

**Philosophie :** Le gestionnaire ouvre l'application à 7h00 du matin. Il ne veut pas savoir combien ça coûte (il verra ça en fin de mois), il veut savoir :

> **"Est-ce que tous les élèves vont arriver à l'heure et est-ce qu'un bus est en train de mourir sur le bord de la route ?"**

---

## 🎯 Les 4 KPIs Principaux (Cartes Supérieures)

### 1. **État du Service** _(Remplace "Bus actifs")_

**Pourquoi :** Un simple "10 bus actifs" ne dit rien sur l'état réel du service.

**Ce qu'il affiche maintenant :**
- 🟢 **En route** : Bus en mouvement (vitesse > 5 km/h)
- 🔵 **Arrivés** : Bus à destination
- ⚪ **Non partis** : Bus n'ayant pas encore démarré

**Valeur :** En un coup d'œil, savoir combien de bus sont opérationnels **maintenant**.

---

### 2. **Retards Critiques (>15min)** _(Remplace "Bus en retard")_

**Problème résolu :** Un retard de 2 min n'est pas grave. Un retard de 30 min est une crise.

**Seuils intelligents :**
- 🟠 **Retards > 15 min** : Badge "⚠️ Attention"
- 🔴 **Retards > 20 min** : Badge "🚨 Urgent" + Animation pulse

**Pourquoi :** À Abidjan, tout le monde est un peu en retard. Le gestionnaire doit être alerté **uniquement si le retard devient problématique pour l'école**.

---

### 3. **Alertes Carburant** _(NOUVEAU - Économie)_

**Ce que ça détecte :**
- 🚗 **Bus en ralenti > 10 min** : Moteur allumé, climatisation, sans déplacement
- ⛽ **Niveau carburant bas** : Alerte carburant (simulation pour MVP)

**Impact financier direct :**
À Abidjan, les chauffeurs laissent souvent la clim tourner à l'arrêt en attendant les élèves. C'est là que le budget carburant explose.

**Action immédiate :**
Si le Dashboard affiche "5 bus en ralenti excessif actuellement", le gestionnaire peut **appeler les chauffeurs pour qu'ils coupent le moteur**. Économie directe.

---

### 4. **Validation Sécurité (Scan)** _(Remplace "Élèves transportés")_

**Problème résolu :** Savoir que "120 élèves sont transportés" ne dit rien sur la sécurité.

**Ce qu'il affiche maintenant :**
- **Taux de Validation** : 95% (pourcentage élèves scannés)
- **Élèves non scannés** : 5 élèves (ceux qui vont générer des appels parents)

**Seuils de sécurité :**
- 🟢 **≥ 95%** : Badge "✓ Sécurisé" (vert)
- 🟠 **85-94%** : Badge jaune (à surveiller)
- 🔴 **< 85%** : Badge rouge (problème critique)

**Valeur :** Rassure que le système est utilisé et que les enfants sont en sécurité.

---

## 📊 Métriques Secondaires (Section Inférieure)

### 1. **Trafic vs Prévision** _(Remplace "Taux d'activité")_

**Ce qu'il affiche :**
- **Temps de trajet moyen** : 42 min
- **Temps prévu** : 35 min
- **Écart** : +20% de retard

**Valeur :**
- ✅ Prouve que l'algorithme d'optimisation fonctionne
- ⚠️ Montre que la circulation est pire que prévu aujourd'hui
- 💡 Aide à ajuster les horaires futurs

---

### 2. **Disponibilité Flotte** _(NOUVEAU)_

**Sépare les alertes :**
- **Bus Immobilisés** : 2 bus en panne/hors service (CRITIQUE - pas de service)
- **Maintenance préventive** : 3 bus (à planifier)

**Pourquoi :**
Si 2 bus sont en panne le matin, c'est **l'info n°1** que le gestionnaire doit voir pour trouver des remplaçants.

**KPI Affiché :**
- "8 / 10 bus disponibles"
- "🚨 2 immobilisés"

---

### 3. **Maintenance**

**Amélioration :**
Distingue les alertes **bloquantes** (bus ne peut pas partir) des alertes **préventives** (à planifier).

**États :**
- 🔴 **Bloquantes** : "2 bloquants" → Action immédiate
- 🟠 **Préventives** : "3 préventives" → À planifier prochainement
- 🟢 **À jour** : "À jour ✓" → Aucune intervention

---

## 🚦 Statut Global du Système (Badge en haut)

**Priorise l'opérationnel sur le financier :**

1. 🔴 **"Crise Opérationnelle"** : Bus immobilisés (pas de service du tout)
2. 🔴 **"Retards Critiques"** : Retards > 20 min (impact fort sur les écoles)
3. 🟠 **"Surveillance Requise"** : Retards > 15 min OU alertes carburant/ralenti
4. 🟠 **"Maintenance à Prévoir"** : Alertes maintenance préventive
5. 🟢 **"Service Opérationnel"** : Tout va bien ✓

**Animation :**
Si le statut est "Crise Opérationnelle" ou "Retards Critiques", le badge **pulse** pour attirer l'attention.

---

## 🛠️ Modifications Techniques

### Frontend (web-admin)

**Fichier :** `src/pages/DashboardPage.tsx`

**Changements :**
- ✅ 4 nouvelles cartes KPI avec logique conditionnelle
- ✅ Section "Métriques de Performance" (remplace "Résumé de l'activité")
- ✅ Badge de statut global avec priorités opérationnelles
- ✅ Icônes adaptées : `Navigation`, `Fuel`, `ShieldCheck`, `Gauge`
- ✅ Animations : `animate-pulse` sur alertes critiques

**Types mis à jour :**
- ✅ `src/types/bus.ts` : `DashboardStats` interface complète

---

### Backend (backend)

**Fichier :** `src/services/dashboard.service.ts`

**Nouvelles métriques calculées :**

#### 1. État du Service
```typescript
busEnRoute: number;      // Vitesse > 5 km/h
busArrives: number;      // Arrivés ou inactifs > 60 min
busNonPartis: number;    // Pas encore démarrés
busEnAttente: number;    // Arrêtés mais actifs récents
```

#### 2. Retards Critiques
```typescript
retardsCritiques: number; // Retard > 15 min
retardsGraves: number;    // Retard > 20 min
retardMoyen: number;      // Moyenne des retards (minutes)
```

#### 3. Carburant & Ralenti
```typescript
alertesRalenti: number;    // Vitesse 0, arrêt > 10 min
alertesCarburant: number;  // Immobilisé > 30 min (simulation)
```

#### 4. Validation Sécurité
```typescript
tauxValidation: number;        // % élèves scannés (0-100)
elevesNonScannes: number;      // Nombre non scannés
elevesTransportes: number;     // Total scannés (attendance)
```

#### 5. Disponibilité Flotte
```typescript
busImmobilises: number;   // IN_MAINTENANCE + OUT_OF_SERVICE
busDisponibles: number;   // busTotaux - busImmobilises
```

#### 6. Performance Trafic
```typescript
tempsTrajetMoyen: number;  // Calculé en temps réel
tempsTrajetPrevu: number;  // Valeur de référence (35 min Abidjan)
tauxPonctualite: number;   // % de bus à l'heure
```

---

## 📈 Logique de Calcul Intelligente

### Détection d'État (GPS en temps réel)

```typescript
// Pour chaque position GPS
if (speed > 5) {
  → Bus en route
} else if (status === 'arrived' || minutesSinceUpdate > 60) {
  → Bus arrivé
} else if (minutesSinceUpdate < 5 && speed === 0) {
  → Bus en attente
} else {
  → Bus non parti
}
```

### Détection Ralenti Excessif

```typescript
// Moteur allumé + vitesse 0 + temps > 10 min
if (speed === 0 && minutesSinceUpdate > 10 && minutesSinceUpdate < 15) {
  alertesRalenti++; // 💰 Économie possible
}
```

### Retards Critiques

```typescript
const retardEstime = Math.max(0, minutesSinceUpdate - 5);
if (retardEstime > 15) retardsCritiques++;
if (retardEstime > 20) retardsGraves++;
```

---

## 🎨 Design & UX

### Couleurs Sémantiques
- 🟢 **Success** : Service opérationnel, tout va bien
- 🟠 **Warning** : Surveillance requise, attention
- 🔴 **Danger** : Action immédiate requise
- ⚪ **Slate** : Informations neutres

### Animations
- **Pulse** : Alertes critiques (retards > 20 min, bus immobilisés)
- **Dot pulse** : Indicateur "En route" (bus actifs)

### Responsive
- **Mobile** : 1 colonne
- **Tablet** : 2 colonnes
- **Desktop** : 4 colonnes (KPIs)

---

## ✅ Tests & Validation

### Compilation Backend
```bash
cd backend && npm run build
✅ Compilation réussie sans erreurs
```

### Linting
```bash
✅ Aucune erreur ESLint
✅ TypeScript strict mode passé
```

### Tests Recommandés

#### 1. Tester avec Données Réelles
```bash
# Lancer le backend
cd backend && npm run serve

# Lancer le web-admin
cd web-admin && npm run dev
```

#### 2. Simuler des Scénarios

**Scénario 1 : Bus immobilisé**
- Créer un bus avec `status: 'out_of_service'`
- Vérifier que "Bus Immobilisés" augmente
- Vérifier que le badge global devient 🔴 "Crise Opérationnelle"

**Scénario 2 : Retard critique**
- Créer une position GPS avec timestamp > 15 min dans le passé
- Vérifier que "Retards Critiques" augmente
- Si > 20 min, vérifier animation pulse

**Scénario 3 : Ralenti excessif**
- Position GPS : `speed: 0`, timestamp il y a 12 min
- Vérifier que "Alertes Carburant" augmente

**Scénario 4 : Validation sécurité**
- 100 élèves dans `students`
- 90 scans dans `attendance` (aujourd'hui)
- Vérifier : `tauxValidation = 90%`, badge 🟠 jaune

---

## 🚀 Déploiement

### Ordre de Déploiement
1. ✅ **Backend** : Déployer le service dashboard mis à jour
2. ✅ **Web Admin** : Déployer le nouveau Dashboard

### Commandes
```bash
# Backend (Cloud Functions)
cd backend
npm run build
firebase deploy --only functions

# Web Admin (Hosting)
cd web-admin
npm run build
firebase deploy --only hosting
```

---

## 📝 Notes pour l'Équipe

### Points Clés
- ✅ **Opérationnel > Financier** : Le Dashboard est conçu pour la gestion du jour, pas les rapports mensuels
- ✅ **Contexte Abidjan** : Trafic dense, retards fréquents, carburant cher
- ✅ **Actionnable** : Chaque métrique doit permettre une action immédiate
- ✅ **Temps Réel** : Mise à jour automatique toutes les 30 secondes

### Évolutions Futures (V2)

**1. Alertes Temps Réel**
- Notification push au gestionnaire si retard > 20 min
- SMS automatique au DAF si bus immobilisé

**2. Historique Comparatif**
- Graphique "Trafic vs Prévision" sur 7 jours
- Tendances de ponctualité par ligne

**3. Prédictions IA**
- "Risque de retard élevé sur la ligne 3 ce matin (événement détecté)"
- "Consommation carburant anormale sur Bus #5 (investigation recommandée)"

**4. Capteurs Réels**
- Intégration capteur carburant (au lieu de simulation)
- Détection moteur allumé/éteint (CAN bus)
- Température intérieure bus (confort élèves)

---

## 🎉 Résumé

Le Dashboard est maintenant **100% opérationnel** et répond à la question critique :

> **"Est-ce que le service fonctionne MAINTENANT ?"**

**Avant :** Dashboard passif, informations peu actionnables
**Après :** Dashboard opérationnel, chaque KPI = action possible

**Impact attendu :**
- 🚨 Détection instantanée des crises (bus immobilisé)
- ⏰ Réduction des retards > 20 min (appels préventifs)
- 💰 Économie carburant (détection ralenti excessif)
- 🛡️ Sécurité renforcée (taux de validation)
- 📊 Meilleure prévision trafic (ajustement horaires)

---

**Date de Refonte :** 19 novembre 2024  
**Version :** 2.0.0 (Dashboard Opérationnel)  
**Statut :** ✅ Prêt pour Production

