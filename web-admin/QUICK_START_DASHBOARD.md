# 🚀 Quick Start - Nouveau Dashboard

## Lancer l'application

### 1. Installer les dépendances (si pas déjà fait)

```bash
cd "/Users/tidianecisse/PROJET INFO/PROJET_BUS100/web-admin"
npm install
```

**Nouvelles dépendances installées :**
- ✅ `lucide-react` - Icônes SVG professionnelles

### 2. Lancer le serveur de développement

```bash
npm run dev
```

L'application sera accessible sur : **http://localhost:5173**

### 3. Se connecter

Utilisez les identifiants admin Firebase pour accéder au dashboard.

**Après connexion, vous serez redirigé vers `/dashboard`**

---

## 📊 Ce que vous verrez

### Section 1 : En-tête avec Statut Global
**Badge dynamique en haut à droite :**
- 🟢 **"Opérationnel"** - Tout fonctionne normalement
- 🟠 **"Surveillance requise"** - Il y a des retards
- 🔴 **"Action requise"** - Alertes maintenance urgentes

### Section 2 : 4 Cartes KPI Principales

#### 1. Bus Actifs
- Icône : Bus (bleu)
- Badge : "En ligne" (si > 0)
- Affiche : `X / Y` (actifs/total)

#### 2. Élèves Transportés
- Icône : Users (gris)
- Affiche : Nombre total aujourd'hui
- Format : Avec séparateur de milliers (ex: 1 234)

#### 3. Bus en Retard
- Icône : Clock (orange si > 0, sinon gris)
- Badge : "Attention" (si > 0)
- Couleur : Orange si retards détectés
- Affiche : Sur X trajets actifs

#### 4. Alertes Maintenance
- Icône : AlertTriangle (rouge si > 0, sinon gris)
- Badge : "Urgent" (si > 0)
- Couleur : Rouge si alertes
- Affiche : Nombre d'alertes ou "Aucune alerte"

### Section 3 : Résumé de l'Activité

3 mini-cartes :
1. **Taux d'activité** - % de bus actifs sur la flotte
2. **Ponctualité** - "Excellente" (vert) ou "À surveiller" (orange)
3. **Maintenance** - "À jour" (vert) ou nombre d'alertes (rouge)

---

## 🎨 Changements Visuels

### Avant → Après

| Élément | Avant | Après |
|---------|-------|-------|
| Icônes | 🚌 👥 🕐 ⚠️ | Lucide SVG professionnelles |
| Couleurs fond | `bg-blue-100`, `bg-yellow-100` | `bg-primary-50`, `bg-slate-100` |
| Couleurs texte | `text-blue-600`, `text-yellow-600` | `text-slate-900`, accents conditionnels |
| Police | Système | **Inter** (corps) + **Poppins** (titres) |
| Badges | Absents | Dynamiques (En ligne, Urgent, Attention) |
| Statut global | Absent | **Badge en haut** (Opérationnel/Action requise) |
| Résumé | Absent | **Section dédiée** avec 3 indicateurs |

---

## 🛠️ Commandes Utiles

### Development

```bash
# Lancer le dev server
npm run dev

# Lancer avec le backend Firebase (émulateurs)
firebase emulators:start

# Build de production
npm run build

# Preview du build
npm run preview
```

### Linting & Tests

```bash
# Vérifier le code
npm run lint

# Tester les composants
npm test

# Coverage
npm run test:coverage
```

---

## 📁 Fichiers Modifiés

```
web-admin/
├── tailwind.config.js        ← Nouvelle palette + typographie
├── index.html                 ← Polices Google Fonts ajoutées
├── src/
│   ├── index.css             ← Styles globaux professionnels
│   └── pages/
│       └── DashboardPage.tsx ← Refonte complète
├── package.json               ← lucide-react ajouté
├── DASHBOARD_REFONTE.md       ← Documentation des changements
├── DESIGN_SYSTEM.md           ← Guide du design system
└── QUICK_START_DASHBOARD.md  ← Ce fichier
```

---

## 🔍 Inspecter le Design

### Dans le navigateur

1. Ouvrir les **DevTools** (F12)
2. Inspecter les cartes KPI
3. Observer les classes Tailwind appliquées :
   - `shadow-card` → ombre subtile
   - `hover:shadow-card-hover` → ombre au survol
   - `text-slate-900` → couleur neutre professionnelle
   - `tracking-tight` → espacement réduit sur les chiffres

### Tester la responsivité

```
Mobile    (< 768px):  1 colonne
Tablette  (768-1279): 2 colonnes
Desktop   (≥ 1280px): 4 colonnes
```

**Astuce :** Réduire la fenêtre pour voir les breakpoints en action.

---

## ✅ Checklist UX

- [ ] Les 4 KPI sont clairement lisibles
- [ ] Le badge de statut global reflète l'état réel du système
- [ ] Les icônes SVG remplacent les emojis
- [ ] Les couleurs sont sobres (pas de saturation)
- [ ] La typographie est claire (Inter + Poppins)
- [ ] Les badges apparaissent conditionnellement
- [ ] Le résumé de l'activité affiche les 3 indicateurs
- [ ] Hover states fonctionnent (ombres + transitions)
- [ ] Les chiffres sont formatés (séparateur de milliers)
- [ ] Responsive fonctionne (mobile → desktop)

---

## 🎯 Scénarios de Test

### Scénario 1 : Tout est opérationnel
**État :**
- `busActifs > 0`
- `busEnRetard = 0`
- `alertesMaintenance = 0`

**Attendu :**
- Badge global : 🟢 "Opérationnel"
- Badge "En ligne" sur Bus Actifs
- Icônes Clock et AlertTriangle en gris
- Ponctualité : "Excellente" (vert)
- Maintenance : "À jour" (vert)

### Scénario 2 : Retards détectés
**État :**
- `busEnRetard > 0`
- `alertesMaintenance = 0`

**Attendu :**
- Badge global : 🟠 "Surveillance requise"
- Badge "Attention" sur Bus en Retard
- Icône Clock en orange
- Ponctualité : "À surveiller" (orange)

### Scénario 3 : Alertes maintenance
**État :**
- `alertesMaintenance > 0`

**Attendu :**
- Badge global : 🔴 "Action requise"
- Badge "Urgent" sur Alertes Maintenance
- Icône AlertTriangle en rouge
- Maintenance : "X alerte(s)" (rouge)

---

## 🐛 Problèmes Connus

### Build TypeScript
Les erreurs TypeScript dans le build concernent **uniquement les tests** (pas le code de production) :
- `BusMarker.test.tsx`
- `AuthContext.test.tsx`
- `useRealtimeGPS.test.ts`

**Ces erreurs n'affectent PAS le Dashboard refondé.**

Le code du Dashboard est **100% valide** et sans erreur.

---

## 📞 Support

Si vous rencontrez des problèmes :
1. Vérifier que les polices se chargent (Network tab)
2. Vérifier que lucide-react est installé (`npm ls lucide-react`)
3. Vider le cache Vite (`rm -rf node_modules/.vite`)
4. Redémarrer le dev server

---

## 🎉 Prochaines Étapes

Une fois le Dashboard validé, nous pourrons :
1. **Refondre la Sidebar** (même design system)
2. **Refondre RealtimeMapPage** (carte + cartes bus)
3. **Refondre BusesManagementPage** (tableaux)
4. **Créer des composants réutilisables** (`<StatCard />`, `<Badge />`)
5. **Ajouter des graphiques** (recharts/chart.js)

---

*Guide créé le 19 novembre 2024*  
*Pour toute question : voir DASHBOARD_REFONTE.md et DESIGN_SYSTEM.md*

