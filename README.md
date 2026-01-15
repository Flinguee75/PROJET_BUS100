# Prototype – Bus Tracking System (Transport scolaire)

## Contexte
Ce projet est un **prototype logiciel** visant à explorer la conception d’un système de **suivi GPS pour le transport scolaire**, afin d’améliorer la visibilité et la coordination entre **écoles, parents et chauffeurs**.

Le projet a été développé comme un **exercice de conception full-stack**, avec une architecture multi-clients (web et mobile) et un backend cloud.

---

## Problématique
Dans le transport scolaire :
- les parents manquent de visibilité sur les trajets,
- les écoles ont peu de supervision centralisée de leur flotte,
- le suivi des véhicules repose souvent sur des processus manuels.

---

## Solution proposée
Un système client-serveur permettant :
- le **suivi GPS des bus**,
- la **visualisation des positions sur carte**,
- la **séparation des rôles** (administration, parents),
- la **centralisation des données** via un backend cloud.

Le projet est conçu comme un **prototype technique**, non comme un produit prêt pour la production.

---

## Architecture générale

```

PROJET_BUS100/
├── backend/           # API backend (Node.js + TypeScript)
├── web-admin/         # Interface web d’administration (React)
└── mobile-parent/     # Application mobile parents (Flutter)

````

---

## Stack technique

### Backend
- Node.js
- TypeScript
- Firebase Cloud Functions
- Firestore
- Validation des entrées (Zod)

### Frontend Web
- React
- TypeScript
- Vite
- Cartographie (Mapbox)

### Mobile
- Flutter
- Firebase SDK
- Google Maps

---

## Fonctionnalités couvertes (prototype)
- Mise à jour et lecture de positions GPS
- Visualisation de la flotte sur carte
- Gestion basique des utilisateurs par rôle
- Historique simple des trajets

---

## Lancer le projet (local)

### Prérequis
- Node.js ≥ 18
- Firebase CLI
- Flutter (pour l’application mobile)

### Backend
```bash
cd backend
npm install
firebase emulators:start
````

### Web admin

```bash
cd web-admin
npm install
npm run dev
```

> Remarque : le projet nécessite un **projet Firebase configuré** pour fonctionner correctement.

---

## Statut du projet

* **Statut** : Prototype fonctionnel
* **Objectif** : démonstration technique et exploration d’architecture
* **Limites connues** :

  * règles de sécurité simplifiées,
  * dépendance à Firebase,
  * non prêt pour un usage en production.

---

## Ce que ce projet démontre

* Conception d’une **architecture full-stack**
* Intégration backend cloud + frontend web + mobile
* Manipulation de données temps réel
* Structuration d’un projet multi-clients
* Raisonnement produit sous forme de prototype

---

## Licence

MIT – Projet à vocation éducative et de démonstration.

