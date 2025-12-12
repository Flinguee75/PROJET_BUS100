# 🌱 Script de Seeding - Données de Test

Ce document explique comment utiliser le script de seeding pour peupler la base de données avec des données réalistes.

## 📋 Vue d'ensemble

Le script `seed-data.ts` crée un environnement complet de test avec :

- **5 bus** dans différentes communes d'Abidjan (Cocody, Yopougon, Abobo, Adjamé, Marcory)
- **5 chauffeurs** assignés aux bus
- **5 escortes (convoyeurs)** assignées aux bus
- **15 parents**
- **30 élèves** répartis entre les 5 bus (6 élèves par bus)
- **5 routes** avec arrêts réalistes et horaires multi-périodes
- **3 positions GPS** en temps réel pour les bus en mouvement

## 🎯 Profils des élèves

Les élèves sont créés avec 4 profils différents pour simuler la réalité :

| Profil | Description | Trajets | Pourcentage |
|--------|-------------|---------|-------------|
| **Matin + Soir uniquement** | Élèves demi-pensionnaires | `morning_outbound`, `evening_return` | 50% |
| **Full day (4 trajets)** | Élèves qui rentrent à midi | Tous les 4 trajets | 30% |
| **Matin + Midi sortie** | Élèves qui ne reviennent pas l'après-midi | `morning_outbound`, `midday_outbound` | 15% |
| **Midi retour + Soir** | Élèves qui arrivent à midi | `midday_return`, `evening_return` | 5% |

## 🚀 Utilisation

### Prérequis

1. **Démarrer les émulateurs Firebase** (obligatoire) :
   ```bash
   cd backend
   npm run serve
   ```

   Les émulateurs doivent être accessibles sur :
   - Firestore : `localhost:8080`
   - Auth : `localhost:9099`

### Lancer le seeding

Dans un **nouveau terminal** :

```bash
cd backend
npm run seed
```

### Résultat attendu

```
🚀 Début du seeding des données...

👨‍✈️ Création des chauffeurs...
  ✓ Kouassi Traoré - Permis CI-DL-2024001
  ✓ Mamadou Ouattara - Permis CI-DL-2024002
  ...
✅ 5 chauffeurs créés

👥 Création des escortes (convoyeurs)...
  ✓ Aya Sanogo - CNI CI-123456789
  ...
✅ 5 escortes créés

👪 Création des parents...
✅ 15 parents créés

🚌 Création des bus...
  ✓ Bus 1 - CI 1000 AB 10 - Cocody
    Chauffeur: Kouassi Traoré
    Escorte: Aya Sanogo
  ...
✅ 5 bus créés

👶 Création des élèves...

  Bus 1 (Cocody):
    ✓ Ibrahim Coulibaly (CE2) - Matin + Soir uniquement
    ✓ Fatou Diallo (CM1) - Full day (4 trajets)
    ...

✅ 30 élèves créés avec différents profils

🛣️  Création des routes...
  ✓ Route Cocody - École - R-COC-001
    7 arrêts - 6 élèves
  ...
✅ 5 routes créées

📍 Création des positions GPS...
  ✓ Bus 1 - Position GPS créée
  ✓ Bus 2 - Position GPS créée
  ✓ Bus 3 - Position GPS créée
✅ 3 positions GPS créées

🎉 Seeding terminé avec succès !

📊 Résumé des données créées :
  ✓ 5 chauffeurs
  ✓ 5 escortes (convoyeurs)
  ✓ 15 parents
  ✓ 5 bus (tous avec chauffeur + escorte)
  ✓ 30 élèves
  ✓ 5 routes avec horaires multiples
  ✓ 3 bus avec positions GPS en temps réel

📈 Profils des élèves :
  • Matin + Soir uniquement: 15 élèves (50%)
  • Full day (4 trajets): 9 élèves (30%)
  • Matin + Midi sortie: 4 élèves (15%)
  • Midi retour + Soir: 2 élèves (5%)

✨ Vous pouvez maintenant tester le système !
```

## 🗂️ Structure des données créées

### Bus (5)
```typescript
{
  busNumber: 1,
  plateNumber: "CI 1000 AB 10",
  capacity: 35,
  model: "Mercedes Sprinter",
  driverId: "driver-1",
  escortId: "escort-1",      // ✨ NOUVEAU
  studentIds: [              // ✨ NOUVEAU
    "student-1",
    "student-2",
    ...
  ],
  assignedCommune: "Cocody",
  assignedQuartiers: ["Riviera", "II Plateaux", "Angré"]
}
```

### Élèves (30)
```typescript
{
  firstName: "Ibrahim",
  lastName: "Coulibaly",
  grade: "CE2",
  commune: "Cocody",
  quartier: "Riviera",
  locations: {               // ✨ NOUVEAU
    morningPickup: {
      address: "456 Riviera, Cocody",
      lat: 5.3602,
      lng: -4.0085
    },
    eveningDropoff: {
      address: "456 Riviera, Cocody",
      lat: 5.3602,
      lng: -4.0085
    }
  },
  activeTrips: [            // ✨ NOUVEAU
    "morning_outbound",
    "evening_return"
  ],
  busId: "bus-1",
  routeId: "route-1"
}
```

### Routes (5)
```typescript
{
  name: "Route Cocody - École",
  code: "R-COC-001",
  commune: "Cocody",
  stops: [
    {
      name: "Arrêt Ibrahim Coulibaly",
      location: { lat: 5.3602, lng: -4.0085 },
      type: "pickup",
      activeTimeSlots: [      // ✨ NOUVEAU
        "morning_outbound",
        "evening_return"
      ],
      studentId: "student-1"
    },
    ...
  ],
  schedule: {                // ✨ NOUVEAU FORMAT
    morningOutbound: {
      departure: "07:00",
      arrival: "08:00"
    },
    middayOutbound: {
      departure: "11:45",
      arrival: "12:45"
    },
    middayReturn: {
      departure: "13:00",
      arrival: "14:00"
    },
    eveningReturn: {
      departure: "15:30",
      arrival: "16:30"
    }
  },
  busId: "bus-1",
  driverId: "driver-1"
}
```

## 🧪 Tester avec le Web Admin

Après le seeding, vous pouvez visualiser les données dans le web-admin :

```bash
cd web-admin
npm run dev
```

Ouvrez `http://localhost:5173` et vous verrez :

- **Dashboard** : Statistiques sur les 5 bus, 30 élèves, 5 chauffeurs
- **Carte en temps réel** : 3 bus en mouvement avec positions GPS
- **Gestion des bus** : Liste des 5 bus avec chauffeur + escorte
- **Gestion des élèves** : 30 élèves avec différents profils
- **Gestion des routes** : 5 routes avec arrêts multiples

## 🔄 Réinitialiser les données

Pour effacer les données et recommencer :

1. Arrêter les émulateurs (`Ctrl+C`)
2. Redémarrer les émulateurs : `npm run serve`
3. Relancer le seed : `npm run seed`

## 📝 Notes

- Les données sont créées dans les **émulateurs Firebase** uniquement
- **Aucune donnée n'est créée en production**
- Les coordonnées GPS sont réelles pour Abidjan
- Les noms et prénoms sont typiques de la Côte d'Ivoire
- Les numéros de téléphone suivent le format ivoirien (+225)

## 🆚 Ancien script

L'ancien script de seed est toujours disponible via :

```bash
npm run seed:old
```

Mais il utilise l'ancien format de données (sans escortes, sans locations multiples, etc.).
