# État des lieux — `GodViewPage.tsx`

> Document mis à jour pour refléter le code réel. La version précédente décrivait
> une page de ~578 lignes basée sur une *simulation de trajectoire* ; ce n'est plus
> exact. La page repose désormais sur des **positions GPS temps réel** (Firestore),
> avec un **mode démo** simulé en option.

**Fichier :** `web-admin/src/pages/GodViewPage.tsx` (~2 200 lignes)
**Rôle :** carte « tour de contrôle » (management by exception) — suivi de la flotte
en temps réel + panneau d'alertes critiques.
**Statut :** fonctionnel (build ✓, typecheck ✓).

---

## 🧭 Vue d'ensemble

La page combine :

- une **carte Mapbox** (`light-v11`) centrée sur l'école,
- des **marqueurs de bus** animés et orientés selon leur déplacement,
- un **panneau latéral d'alertes** (`AlertsSidebar`),
- des **overlays** : barre de statistiques, légende des couleurs, badge « mode démo ».

Deux sources de données possibles, totalement transparentes pour la page :

| Source | Quand | Mécanisme |
|--------|-------|-----------|
| **Firestore (réel)** | Config Firebase complète | `watchSchoolBuses`, `watchActiveAlerts`, `watchBusAttendance`, … |
| **Simulation (démo)** | Sinon / `VITE_DEMO_MODE=true` | `src/demo/simulation.ts` (mêmes signatures) |

---

## ✅ Fonctionnalités implémentées

### Carte & marqueurs
- Initialisation Mapbox, centrage/`flyTo` sur l'école, contrôles de navigation.
- Marqueur d'école fixe.
- Marqueurs de bus avec **flèche directionnelle**, **aura** et **pulsation d'alerte**.
- Couleurs par statut : 🔵 en route · 🔴 en retard · 🟢 arrivé/à l'école · ⚪ inactif.

### Mouvement & lissage
- Animation fluide des marqueurs entre deux positions (`requestAnimationFrame`).
- **Filtre de Kalman** (`utils/gpsKalmanFilter.ts`) pour lisser le bruit GPS.
- **Extrapolation** de position pour masquer la latence Firestore (~8 s).
- Gel des animations pendant les interactions (zoom/déplacement).

### Logique de statut
- `computeDisplayStatus` : un bus `STOPPED` depuis < 15 min est affiché **ARRIVED**,
  puis repasse `STOPPED`.
- `isBusEnCourse` / `isBusAtSchool` / `isBusStationed` : tolérance aux coupures GPS
  (fenêtre de 2 min) pour éviter le clignotement.
- **Zone de stationnement** : les bus à l'école sont regroupés dans un marqueur unique.

### Élèves & ramassage
- Comptage **scannés / total** par bus en temps réel (`watchBusAttendance`).
- Marqueurs d'**arrêts d'élèves** (affichage optionnel), statut scanné/en attente.
- Popups riches : dernier scan, **prochain élève**, durée de trajet, ramassés/oubliés.
- Notifications éphémères (départ, scan, fin de course).

### Supervision
- Panneau d'alertes filtré sur les bus de l'école.
- Suivi (« follow ») d'un bus en course.
- Intégration de l'historique des courses (`watchRecentCourseHistory`).
- **Barre de stats** (bus total / en course / à l'école / élèves à bord) et **légende**.

---

## 🟢 Mode démo

- Connexion automatique (pas de login), école + flotte simulées.
- 5 bus partent de quartiers d'Abidjan et convergent vers l'école le long de
  trajectoires courbes ; les élèves sont scannés au passage des arrêts.
- Un bus est volontairement **en retard** (alerte) et un autre déjà **arrivé**.
- Boucle continue : à l'arrivée, un bus patiente puis repart pour une nouvelle tournée.

Voir `src/demo/` (`config.ts`, `seed.ts`, `simulation.ts`).

---

## ⚠️ Points d'attention / dette technique

1. **Taille du fichier** (~2 200 lignes). Gagnerait à être découpé (hook de carte,
   hook de simulation visuelle, composant `MapView`).
2. **Lint** : plusieurs `as any` historiques (conversion des `Timestamp` Firestore,
   handlers `window.*`) font échouer `npm run lint` (`--max-warnings 0`). Sans impact
   sur le build, mais à nettoyer.
3. **Taille du bundle** : ~2,4 Mo (Mapbox + Firebase). Envisager du code-splitting.
4. **Couverture de tests** : la logique de statut mériterait des tests unitaires dédiés.

---

## 🗺️ Dépendances clés

- `mapbox-gl` (carte) · `lucide-react` (icônes)
- Hooks : `useAuthContext`, `useSchoolBuses`, `useRealtimeAlerts`
- Services : `students.firestore`, `gps_history.firestore`, `courseHistory.firestore`, `bus.api`
- Composants `godview/` : marqueurs et popups (`BusMarkerWithAura`, `SimplifiedBusPopup`, `StudentStopMarker`)
