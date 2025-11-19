# 🎨 Design System - Transport Scolaire (Web Admin)

## Palette de Couleurs Professionnelle

### Couleurs Neutres (Slate)
```
slate-50:  #f8fafc  - Backgrounds légers
slate-100: #f1f5f9  - Backgrounds cards
slate-200: #e2e8f0  - Bordures subtiles
slate-300: #cbd5e1  - Bordures normales
slate-400: #94a3b8  - Texte désactivé
slate-500: #64748b  - Texte secondaire
slate-600: #475569  - Labels
slate-700: #334155  - Texte corps
slate-800: #1e293b  - Texte important
slate-900: #0f172a  - Titres/headers
```

### Couleurs Sémantiques

**Primary (Bleu Corporate)**
```
primary-50:  #eff6ff  - Backgrounds icônes
primary-500: #3b82f6  - Actions principales
primary-600: #2563eb  - Hover states
```

**Success (Vert)**
```
success-50:  #f0fdf4  - Backgrounds badges
success-500: #22c55e  - Statut "OK"
success-600: #16a34a  - Texte success
```

**Warning (Orange)**
```
warning-50:  #fffbeb  - Backgrounds badges
warning-500: #f59e0b  - Alertes mineures
warning-600: #d97706  - Texte warning
```

**Danger (Rouge)**
```
danger-50:  #fef2f2  - Backgrounds badges
danger-500: #ef4444  - Alertes critiques
danger-600: #dc2626  - Texte danger
```

---

## Typographie

### Polices
```css
Titres (Headings):    Poppins (600, 700, 800)
Corps (Body):         Inter (400, 500, 600, 700)
Code (Monospace):     JetBrains Mono
```

### Hiérarchie
```
h1: 3xl (30px)  - font-bold - tracking-tight - Poppins
h2: 2xl (24px)  - font-bold - tracking-tight - Poppins
h3: xl (20px)   - font-semibold - Poppins
h4: lg (18px)   - font-semibold - Poppins

Body:     text-base (16px) - Inter
Small:    text-sm (14px)   - Inter
XSmall:   text-xs (12px)   - Inter
```

### Poids (Font Weight)
```
400 (normal)    - Texte corps
500 (medium)    - Labels
600 (semibold)  - Sous-titres
700 (bold)      - Chiffres KPI, titres
```

---

## Composants

### Card (Carte)
```tsx
// Style de base
className="
  bg-white 
  rounded-xl 
  shadow-card 
  hover:shadow-card-hover 
  transition-all 
  duration-250 
  p-6 
  border 
  border-slate-200/60
"
```

### Badge Status
```tsx
// Success
className="px-2.5 py-1 bg-success-50 text-success-700 text-xs font-semibold rounded-md"

// Warning
className="px-2.5 py-1 bg-warning-50 text-warning-700 text-xs font-semibold rounded-md"

// Danger
className="px-2.5 py-1 bg-danger-50 text-danger-700 text-xs font-semibold rounded-md"
```

### Icône Container
```tsx
// Primary
className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center"
  <Icon className="w-6 h-6 text-primary-600" strokeWidth={2} />

// Neutral
className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center"
  <Icon className="w-6 h-6 text-slate-700" strokeWidth={2} />

// Warning
className="w-12 h-12 bg-warning-50 rounded-xl flex items-center justify-center"
  <Icon className="w-6 h-6 text-warning-600" strokeWidth={2} />

// Danger
className="w-12 h-12 bg-danger-50 rounded-xl flex items-center justify-center"
  <Icon className="w-6 h-6 text-danger-600" strokeWidth={2} />
```

### KPI Display
```tsx
// Grand chiffre
className="text-4xl font-bold text-slate-900 tracking-tight"

// Chiffre moyen
className="text-2xl font-bold text-slate-900"

// Label
className="text-sm font-medium text-slate-600 mb-2"

// Contexte secondaire
className="text-xs text-slate-500"
```

---

## Espacements

### Padding Cards
```
p-4:  16px  - Small cards
p-6:  24px  - Standard cards (défaut)
p-8:  32px  - Large sections
```

### Gap (Espacement entre éléments)
```
gap-2:  8px   - Éléments très proches
gap-3:  12px  - Éléments proches
gap-4:  16px  - Standard
gap-5:  20px  - Grid cards
gap-6:  24px  - Sections
gap-8:  32px  - Grandes sections
```

### Margin Bottom (Séparation verticale)
```
mb-1:   4px   - Très serré
mb-2:   8px   - Serré
mb-4:  16px   - Standard
mb-6:  24px   - Section
mb-8:  32px   - Grande section
```

---

## Ombres (Shadows)

```css
/* Ombre subtile - État normal */
shadow-card: 0 1px 3px 0 rgba(0, 0, 0, 0.08)

/* Ombre élevée - État hover */
shadow-card-hover: 0 4px 12px 0 rgba(0, 0, 0, 0.12)

/* Ombre focus - Accessibilité */
shadow-card-focus: 0 0 0 3px rgba(59, 130, 246, 0.12)
```

---

## Transitions

```css
/* Transition standard */
transition-all duration-250

/* Timing function */
cubic-bezier(0.4, 0, 0.2, 1)  /* Ease-in-out naturel */
```

---

## Grid Layouts

### Dashboard KPIs
```tsx
className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5"
```

### Résumé Activité
```tsx
className="grid grid-cols-1 md:grid-cols-3 gap-4"
```

---

## Règles de Contraste (WCAG AA)

| Type | Ratio Minimum | Couleur Texte | Couleur Fond |
|------|---------------|---------------|--------------|
| **Titres** | 4.5:1 | slate-900 | white/neutral-50 |
| **Corps** | 4.5:1 | slate-700 | white/neutral-50 |
| **Labels** | 4.5:1 | slate-600 | white/neutral-50 |
| **KPI Principal** | 7:1 | slate-900 | white |
| **Badge Success** | 4.5:1 | success-700 | success-50 |
| **Badge Warning** | 4.5:1 | warning-700 | warning-50 |
| **Badge Danger** | 4.5:1 | danger-700 | danger-50 |

---

## Icônes (Lucide React)

### Tailles Standard
```tsx
w-4 h-4    (16px)  - Badges, petits éléments
w-5 h-5    (20px)  - Résumé, éléments moyens
w-6 h-6    (24px)  - Cards KPI principales
```

### Stroke Width
```tsx
strokeWidth={1.5}  - Icônes secondaires
strokeWidth={2}    - Standard (défaut)
strokeWidth={2.5}  - Icônes importantes (badges)
```

### Mapping Sémantique
```tsx
Bus           - Transport/véhicules
Users         - Élèves/personnes
Clock         - Retards/ponctualité
AlertTriangle - Maintenance/alertes
Activity      - Taux d'activité
CheckCircle2  - Statut OK/validé
TrendingUp    - Croissance/amélioration
```

---

## États Interactifs

### Hover
```tsx
hover:shadow-card-hover
hover:bg-slate-50
hover:text-primary-600
```

### Focus (Accessibilité)
```css
:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 4px;
}
```

### Active
```tsx
active:scale-98
active:shadow-sm
```

---

## Responsive Breakpoints

```css
sm:  640px   - Mobile large
md:  768px   - Tablette
lg:  1024px  - Desktop
xl:  1280px  - Grand écran
2xl: 1536px  - Très grand écran
```

### Usage Dashboard
```
Mobile (< 768px):    1 colonne
Tablette (768-1279): 2 colonnes
Desktop (≥ 1280px):  4 colonnes
```

---

## Animation Guidelines

### Timing
```
Micro-interactions:  150-200ms
Transitions:         250ms
Modals/overlays:     300ms
```

### Règles
- ✅ Toujours utiliser `cubic-bezier(0.4, 0, 0.2, 1)`
- ✅ Limiter à `transform` et `opacity` (performance)
- ❌ Éviter `width`, `height` (reflow)
- ❌ Pas d'animations > 500ms (impatience utilisateur)

---

## Accessibilité (WCAG AA)

### Checklist
- ✅ Contraste minimum 4.5:1 (texte normal)
- ✅ Contraste minimum 3:1 (texte large > 18px)
- ✅ Focus states visibles (outline bleu 2px)
- ✅ Tailles tactiles minimum 44x44px
- ✅ Labels explicites (pas d'icônes seules)
- ✅ Navigation au clavier
- ✅ Hiérarchie sémantique (h1 → h6)
- ✅ Alt text sur images

---

## Exemples de Composants Réutilisables

### StatCard
```tsx
<div className="bg-white rounded-xl shadow-card hover:shadow-card-hover transition-all duration-250 p-6 border border-slate-200/60">
  <div className="flex items-start justify-between mb-5">
    <div className="w-12 h-12 bg-primary-50 rounded-xl flex items-center justify-center">
      <Icon className="w-6 h-6 text-primary-600" strokeWidth={2} />
    </div>
    {hasBadge && (
      <span className="px-2.5 py-1 bg-success-50 text-success-700 text-xs font-semibold rounded-md">
        Badge
      </span>
    )}
  </div>
  <div>
    <p className="text-sm font-medium text-slate-600 mb-2">Label</p>
    <div className="flex items-baseline gap-2 mb-1">
      <span className="text-4xl font-bold text-slate-900 tracking-tight">123</span>
    </div>
    <p className="text-xs text-slate-500">Contexte</p>
  </div>
</div>
```

---

*Design System v1.0 - Créé le 19 novembre 2024*  
*Basé sur Tailwind CSS 3.4, Inter/Poppins, et Lucide React*

