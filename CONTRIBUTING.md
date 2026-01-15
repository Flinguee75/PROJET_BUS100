# Contributing to Bus Tracking System

Merci de votre intérêt pour contribuer à ce projet ! Ce guide vous aidera à démarrer.

## 🚀 Quick Start

### Prérequis
- Node.js 22+
- Flutter 3.10+
- Firebase CLI
- Git

### Setup Développement

1. **Fork et cloner le repository**
```bash
git clone https://github.com/your-username/projet-bus.git
cd projet-bus
```

2. **Installer les dépendances**
```bash
# Backend
cd backend && npm install

# Web Admin
cd ../web-admin && npm install

# Mobile
cd ../mobile-parent/parent_app && flutter pub get
```

3. **Configurer l'environnement**
```bash
# Web admin
cd web-admin
cp .env.example .env
# Éditer .env avec vos credentials Firebase/Mapbox
```

4. **Lancer les émulateurs Firebase**
```bash
firebase emulators:start
```

5. **Démarrer l'application**
```bash
# Web admin (dans un nouveau terminal)
cd web-admin && npm run dev
```

## 📝 Standards de Code

### TypeScript
- **Strict mode activé** - Pas de `any`, pas d'implicit returns
- **Centralized types** - Tous les types dans `/types/` (backend)
- **Validation** - Utiliser Zod pour valider tous les inputs API

### Architecture
- **Thick Services, Thin Controllers** - Toute la logique métier dans `/services/`
- **Vertical Slice** - Implémenter chaque feature de bout en bout (DB → Backend → Tests → Frontend)
- **Separation of Concerns** - Ne pas mélanger logique métier et présentation

### Tests
- **Tests obligatoires** pour toute nouvelle fonctionnalité
- **Backend:** Jest avec 100% coverage requirement
- **Frontend:** Vitest + React Testing Library
- **Mobile:** Flutter test

```bash
# Backend
cd backend && npm test

# Web admin
cd web-admin && npm test

# Mobile
cd mobile-parent/parent_app && flutter test
```

### Commits
Utiliser les **commits sémantiques** :

```
feat: ajouter suivi GPS en temps réel
fix: corriger calcul d'ETA pour trajets longs
docs: mettre à jour README avec instructions Firebase
refactor: simplifier service de notifications
test: ajouter tests pour validation Zod
chore: mettre à jour dépendances Firebase
```

**Format:**
```
<type>(<scope optionnel>): <description>

<corps optionnel>

<footer optionnel>
```

**Types valides:**
- `feat` - Nouvelle fonctionnalité
- `fix` - Correction de bug
- `docs` - Documentation uniquement
- `style` - Formatting, point-virgules manquants, etc.
- `refactor` - Refactoring de code
- `test` - Ajout/modification de tests
- `chore` - Maintenance (dépendances, config, etc.)

### Linting
Le code doit passer les checks de lint :

```bash
# Backend
cd backend && npm run lint

# Web admin
cd web-admin && npm run lint

# Mobile
cd mobile-parent/parent_app && flutter analyze
```

## 🔄 Workflow Git

### Créer une branche

```bash
git checkout -b feature/ma-nouvelle-feature
# ou
git checkout -b fix/correction-bug
```

**Convention de nommage des branches:**
- `feature/nom-feature` - Nouvelles fonctionnalités
- `fix/nom-bug` - Corrections de bugs
- `docs/sujet` - Documentation
- `refactor/sujet` - Refactoring

### Faire un Pull Request

1. **Push ta branche**
```bash
git push origin feature/ma-nouvelle-feature
```

2. **Créer la PR sur GitHub**
   - Donner un titre clair et descriptif
   - Décrire ce qui a été changé et pourquoi
   - Référencer les issues liées (`Fixes #123`)
   - Ajouter des screenshots si changements UI

3. **Template de PR:**
```markdown
## Description
[Décrire les changements]

## Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Documentation

## Comment tester
1. [Étape 1]
2. [Étape 2]
3. [Résultat attendu]

## Checklist
- [ ] Mon code suit les standards du projet
- [ ] J'ai commenté les parties complexes
- [ ] J'ai mis à jour la documentation
- [ ] Mes changements ne génèrent pas de warnings
- [ ] J'ai ajouté des tests qui prouvent mon fix/feature
- [ ] Les tests unitaires passent localement
- [ ] Le lint passe sans erreurs
```

## 🐛 Rapporter un Bug

Utiliser les GitHub Issues avec le template suivant :

```markdown
**Description du bug**
[Description claire et concise]

**Étapes pour reproduire**
1. Aller à '...'
2. Cliquer sur '...'
3. Scroll down to '...'
4. Voir l'erreur

**Comportement attendu**
[Ce qui devrait se passer]

**Screenshots**
[Si applicable]

**Environnement:**
 - OS: [e.g. macOS, Windows, Linux]
 - Browser: [e.g. Chrome, Safari]
 - Version: [e.g. 22]
```

## 💡 Proposer une Fonctionnalité

Utiliser les GitHub Issues:

```markdown
**Problème à résoudre**
[Décrire le problème que cette feature résout]

**Solution proposée**
[Décrire la solution envisagée]

**Alternatives considérées**
[Autres approches possibles]

**Contexte additionnel**
[Mockups, exemples, etc.]
```

## 🏗️ Structure du Projet

```
PROJET_BUS100/
├── backend/           # Firebase Cloud Functions + Express
│   ├── src/
│   │   ├── controllers/    # Handlers HTTP (validation + appel services)
│   │   ├── services/       # Logique métier
│   │   ├── routes/         # Définition des routes Express
│   │   ├── types/          # Types TypeScript centralisés
│   │   └── triggers/       # Triggers Firestore/Auth
│   └── tests/
│       ├── unit/           # Tests unitaires (services)
│       └── integration/    # Tests d'intégration (endpoints)
│
├── web-admin/         # Dashboard React
│   ├── src/
│   │   ├── components/     # Composants réutilisables
│   │   ├── pages/          # Pages/Routes
│   │   ├── services/       # API clients
│   │   └── hooks/          # Custom hooks
│   └── tests/             # Tests Vitest
│
└── mobile-parent/parent_app/   # App Flutter
    ├── lib/
    │   ├── screens/        # Écrans complets
    │   ├── services/       # Logique métier
    │   ├── providers/      # State management (Provider)
    │   └── models/         # Modèles de données
    └── test/              # Tests Flutter
```

## 🔐 Sécurité

- **Ne jamais commiter de credentials** (`.env`, clés API, tokens)
- **Ne pas commiter de données utilisateur** réelles
- **Utiliser `.env.example`** pour les templates
- Signaler les vulnérabilités via **GitHub Security Advisory**

## 📚 Ressources

- [Documentation Firebase](https://firebase.google.com/docs)
- [React Documentation](https://react.dev/)
- [Flutter Documentation](https://docs.flutter.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Conventional Commits](https://www.conventionalcommits.org/)

## ❓ Questions

Si tu as des questions:
- Ouvre une **GitHub Discussion**
- Consulte la documentation dans [CLAUDE.md](CLAUDE.md)
- Vérifie les **issues existantes**

## 🙏 Remerciements

Merci de contribuer à ce projet ! Chaque contribution, petite ou grande, est appréciée.

---

**Note:** Ce projet est développé à des fins éducatives. Les contributions doivent respecter cet esprit d'apprentissage et de partage de connaissances.
