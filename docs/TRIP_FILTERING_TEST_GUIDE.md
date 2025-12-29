# Guide de Test - Filtrage par Type de Trajet

Ce document décrit comment tester manuellement le système de filtrage des notifications par type de trajet.

## Vue d'ensemble

Le système de filtrage garantit que :
- Les parents ne reçoivent des informations que si leur enfant est inscrit au trajet actuel
- Les notifications sont contextuelles (messages clairs indiquant où est l'enfant)
- L'interface mobile affiche les bonnes informations selon l'inscription de l'enfant

## Prérequis

### Données de test dans Firestore

Créer les documents suivants dans Firestore :

#### 1. Élève inscrit uniquement aux trajets du matin et du soir

```json
// Collection: students/{studentId}
{
  "firstName": "Emma",
  "lastName": "Martin",
  "grade": "CM1",
  "schoolId": "school123",
  "busId": "bus123",
  "parentIds": ["parent1"],
  "activeTrips": ["morning_outbound", "evening_return"],
  "locations": {
    "morningPickup": {
      "address": "123 Rue du Matin",
      "lat": 5.35,
      "lng": -4.00
    },
    "eveningDropoff": {
      "address": "123 Rue du Matin",
      "lat": 5.35,
      "lng": -4.00
    }
  }
}
```

#### 2. Élève inscrit uniquement aux trajets du midi

```json
// Collection: students/{studentId2}
{
  "firstName": "Lucas",
  "lastName": "Dubois",
  "grade": "CM2",
  "schoolId": "school123",
  "busId": "bus123",
  "parentIds": ["parent2"],
  "activeTrips": ["midday_outbound", "midday_return"],
  "locations": {
    "middayDropoff": {
      "address": "456 Avenue du Midi",
      "lat": 5.36,
      "lng": -4.01
    },
    "middayPickup": {
      "address": "456 Avenue du Midi",
      "lat": 5.36,
      "lng": -4.01
    }
  }
}
```

#### 3. Bus avec trajet actif

```json
// Collection: buses/{bus123}
{
  "plateNumber": "ABC-123",
  "capacity": 50,
  "driverId": "driver123",
  "currentTrip": {
    "tripType": "morning_outbound",  // Changer selon le test
    "routeId": "route1",
    "startTime": 1234567890,
    "scannedStudentIds": []
  },
  "currentPosition": {
    "lat": 5.34,
    "lng": -3.99,
    "speed": 30,
    "timestamp": 1234567890
  }
}
```

## Scénarios de Test

### Test 1 : Trajet du matin (morning_outbound) à 7h30

**Configuration :**
- Bus avec `currentTrip.tripType = "morning_outbound"`
- Heure du test : 7h30 (dans la plage 6h-9h)

**Comportement attendu pour Emma (inscrite) :**
- ✅ Voit le marqueur du bus sur la carte
- ✅ Voit son arrêt de ramassage (morningPickup)
- ✅ Voit l'ETA dans la card "Ramassage"
- ✅ Reçoit notification de démarrage : "Le bus vient de démarrer le ramassage du matin"
- ✅ Reçoit notification de proximité : "Le bus arrive dans X min pour récupérer Emma (trajet du matin)"
- ✅ Reçoit notification d'arrivée : "Votre enfant a été déposé à l'école (matin)"

**Comportement attendu pour Lucas (NON inscrit) :**
- ❌ Ne voit PAS le marqueur du bus sur la carte
- ❌ Ne voit PAS son arrêt sur la carte
- ✅ Voit card "Non inscrit au trajet" : "Lucas n'est pas inscrit pour le ramassage du matin"
- ❌ Ne reçoit AUCUNE notification

### Test 2 : Trajet du midi sortie (midday_outbound) à 12h30

**Configuration :**
- Bus avec `currentTrip.tripType = "midday_outbound"`
- Heure du test : 12h30 (dans la plage 12h-14h)

**Comportement attendu pour Lucas (inscrit) :**
- ✅ Voit le marqueur du bus sur la carte
- ✅ Voit son arrêt de dépôt (middayDropoff)
- ✅ Voit l'ETA dans la card "Dépôt"
- ✅ Reçoit notification de démarrage : "Le bus vient de démarrer le trajet retour du midi"
- ✅ Reçoit notification de proximité : "Le bus arrive dans X min pour ramener Lucas à la maison (pause midi)"
- ✅ Reçoit notification d'arrivée : "Votre enfant est en route vers la maison (pause midi)"

**Comportement attendu pour Emma (NON inscrite) :**
- ❌ Ne voit PAS le marqueur du bus
- ❌ Ne voit PAS son arrêt
- ✅ Voit card "Non inscrit" : "Emma n'est pas inscrite pour le dépôt du midi"
- ❌ Ne reçoit AUCUNE notification

### Test 3 : Trajet du retour midi (midday_return) à 14h15

**Configuration :**
- Bus avec `currentTrip.tripType = "midday_return"`
- Heure du test : 14h15 (dans la plage 14h-15h)

**Comportement attendu pour Lucas (inscrit) :**
- ✅ Voit le bus et son arrêt (middayPickup)
- ✅ Card "Ramassage" avec ETA
- ✅ Notification démarrage : "Le bus vient de démarrer le ramassage de midi"
- ✅ Notification proximité : "Le bus arrive dans X min pour récupérer Lucas (retour de la pause)"
- ✅ Notification arrivée : "Votre enfant a été déposé à l'école (retour midi)"

**Comportement attendu pour Emma (NON inscrite) :**
- ❌ Pas de bus/arrêt visible
- ✅ Card "Non inscrit" affichée
- ❌ Aucune notification

### Test 4 : Trajet du soir (evening_return) à 16h30

**Configuration :**
- Bus avec `currentTrip.tripType = "evening_return"`
- Heure du test : 16h30 (dans la plage 15h-18h)

**Comportement attendu pour Emma (inscrite) :**
- ✅ Voit le bus et son arrêt (eveningDropoff)
- ✅ Card "Dépôt" avec ETA
- ✅ Notification démarrage : "Le bus vient de démarrer le trajet retour du soir"
- ✅ Notification proximité : "Le bus arrive dans X min pour ramener Emma à la maison (fin de journée)"
- ✅ Notification arrivée : "Votre enfant est en route vers la maison (fin de journée)"

**Comportement attendu pour Lucas (NON inscrit) :**
- ❌ Pas de bus/arrêt visible
- ✅ Card "Non inscrit"
- ❌ Aucune notification

### Test 5 : Changement de profil d'enfant

**Scénario :**
1. Parent avec 2 enfants (Emma et Lucas)
2. Trajet actif : `morning_outbound`
3. Utiliser le dropdown pour changer d'enfant

**Comportement attendu :**
- Lorsque Emma est sélectionnée :
  - ✅ Bus visible, ETA affiché
- Lorsque Lucas est sélectionné (pas inscrit à morning_outbound) :
  - ❌ Bus disparaît
  - ✅ Card "Non inscrit" s'affiche
  - ✅ Message : "Lucas n'est pas inscrit pour le ramassage du matin"

### Test 6 : Bus sans trajet actif (inactive)

**Configuration :**
- Bus SANS `currentTrip` (ou `currentTrip = null`)

**Comportement attendu pour tous les parents :**
- ❌ Pas de marqueur de bus
- ✅ Arrêt de l'enfant visible (fallback sur propriété `arret`)
- ✅ Card "Bus pas en course" affichée
- ✅ Affichage : immatriculation du bus et nom du chauffeur
- ❌ Aucune notification

## Tests Automatisés

### Tests unitaires Flutter (✅ 33 tests passent)

Exécuter :
```bash
cd mobile-parent/parent_app
flutter test test/models/enfant_trip_test.dart
flutter test test/utils/trip_type_helper_test.dart
```

**Résultats attendus :**
- ✅ 12 tests pour `Enfant` (isActiveForTrip, getLocationForTrip)
- ✅ 21 tests pour `TripTypeHelper` (getCurrentTimeOfDay, detectTripType)

### Tests backend

Les tests backend sont complexes à cause des mocks Firestore imbriqués. Les tests manuels avec des données réelles dans l'émulateur Firestore sont recommandés.

## Checklist de Vérification

Pour chaque trajet (morning_outbound, midday_outbound, midday_return, evening_return) :

- [ ] Les parents d'enfants inscrits reçoivent les notifications
- [ ] Les parents d'enfants NON inscrits ne reçoivent RIEN
- [ ] Les messages de notification sont clairs et spécifiques au trajet
- [ ] La carte affiche uniquement le bus si l'enfant est inscrit
- [ ] La card "Non inscrit" s'affiche si l'enfant n'est pas inscrit
- [ ] Le changement de profil d'enfant met à jour l'affichage correctement
- [ ] L'ETA est calculé vers la bonne location (morningPickup, middayDropoff, etc.)

## Problèmes Connus

### Si les notifications ne filtrent pas correctement :

1. **Vérifier Firestore :**
   - L'élève a-t-il le champ `activeTrips` ?
   - Le bus a-t-il `currentTrip.tripType` ?

2. **Vérifier les logs backend :**
   ```bash
   firebase functions:log
   ```
   - Chercher : "Aucun parent concerné pour le trip"
   - Vérifier le nombre de parents notifiés

3. **Vérifier les logs Flutter :**
   - Chercher : "Nouveau trajet détecté"
   - Chercher : "Notification de proximité envoyée"

### Si la carte ne filtre pas correctement :

1. **Vérifier MainMapScreen :**
   - `_isEnfantActiveForCurrentTrip()` retourne-t-il la bonne valeur ?
   - Print debug : `print('Enfant actif pour trip: $isActiveForTrip')`

2. **Vérifier les données :**
   - L'enfant a-t-il les bonnes `locations` ?
   - `bus.currentTrip?.tripType` est-il défini ?

## Conclusion

Le système de filtrage par trajet garantit que les parents :
- Ne sont pas spammés par des notifications non pertinentes
- Reçoivent des informations claires et contextuelles
- Voient uniquement les informations pertinentes pour leur enfant

Tous les tests unitaires Flutter passent avec succès, validant la logique de base du système.
