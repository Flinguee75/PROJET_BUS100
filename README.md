# Prototype – Gestion et supervision de transport scolaire

## Contexte
Ce projet est un **prototype logiciel** visant à explorer la conception d’un système de **gestion et de supervision de transport scolaire**, destiné à améliorer la visibilité et la coordination entre **écoles, parents et chauffeurs**.

Le projet s’inscrit dans un contexte de **flotte scolaire à énergie solaire**, avec des besoins de suivi des trajets et de communication entre les acteurs.

---

## Problème
Dans de nombreux systèmes de transport scolaire :
- les parents manquent de visibilité sur les trajets,
- les écoles ont peu de contrôle centralisé sur la flotte,
- le suivi GPS et la communication sont fragmentés ou inexistants.

---

## Solution proposée
Un système client-serveur permettant :
- le **suivi GPS des véhicules**,
- la **visualisation centralisée de la flotte**,
- la **séparation claire des rôles** (administration, chauffeur, parent).

Le projet est conçu comme un **prototype technique**, non comme un produit final.

---

## Architecture générale

```

PROJET_BUS100/
├── backend/        → API backend (Node.js + TypeScript)
├── web-admin/     → Interface d’administration (React)
├── mobile-parent/ → Application mobile parents (Flutter)
├── mobile-driver/ → Application mobile chauffeurs (Flutter)

````

---

## Stack technique

### Backend
- Node.js + TypeScript
- Firebase Functions
- Express.js
- Validation des entrées avec Zod

### Frontend (Admin)
- React
- TypeScript
- Vite
- Cartographie (Mapbox)

### Mobile
- Flutter
- Firebase SDK

### Infrastructure
- Firebase (Firestore, Auth, Hosting)
- Notifications via Firebase Cloud Messaging

---

## Fonctionnalités couvertes (prototype)
- Mise à jour et récupération de positions GPS
- Visualisation de la flotte en temps réel
- Gestion des utilisateurs par rôle
- Historique de trajets (basique)

---

## Lancement du projet (local)

### Prérequis
- Node.js ≥ 18
- Firebase CLI
- Flutter (pour les apps mobiles)

### Démarrage backend
```bash
cd backend
npm install
npm run serve
````

### Démarrage interface admin

```bash
cd web-admin
npm install
npm run dev
```

---

## Statut du projet

* **Statut** : Prototype expérimental
* **Objectif** : exploration technique et architecture
* **Limites connues** :

  * sécurité et conformité incomplètes,
  * fonctionnalités partielles,
  * non prêt pour une exploitation en production.


## Objectif pédagogique

Ce projet vise à démontrer :

* la conception d’un système distribué multi-clients,
* la structuration d’une API backend,
* l’intégration frontend, mobile et services cloud,
* la gestion de rôles et de flux de données temps réel.
