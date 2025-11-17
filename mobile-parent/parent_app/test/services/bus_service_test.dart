import 'package:flutter_test/flutter_test.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:parent_app/models/bus.dart';

// Nous allons tester la logique du service
// Pour l'instant, nous testons uniquement la logique métier sans les dépendances Firebase

void main() {
  group('BusService Tests', () {
    late FakeFirebaseFirestore fakeFirestore;

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
    });

    test('getBusById should return null if bus does not exist', () async {
      // Arrange - pas de données dans Firestore

      // Act
      final doc = await fakeFirestore.collection('buses').doc('nonexistent').get();

      // Assert
      expect(doc.exists, false);
    });

    test('getBusById should return Bus object if bus exists', () async {
      // Arrange
      final busData = {
        'immatriculation': 'AB-123-CD',
        'chauffeur': 'Jean Dupont',
        'chauffeurId': 'driver_001',
        'capacite': 50,
        'itineraire': 'Route Centre Ville',
        'status': 'EN_ROUTE',
        'statusLabel': 'En route',
        'maintenanceStatus': 0,
      };

      await fakeFirestore.collection('buses').doc('bus_001').set(busData);

      // Act
      final doc = await fakeFirestore.collection('buses').doc('bus_001').get();

      // Assert
      expect(doc.exists, true);
      expect(doc.data()!['immatriculation'], 'AB-123-CD');
      expect(doc.data()!['chauffeur'], 'Jean Dupont');

      // Test de la désérialisation
      final bus = Bus.fromJson({
        'id': doc.id,
        ...doc.data()!,
      });
      expect(bus.id, 'bus_001');
      expect(bus.immatriculation, 'AB-123-CD');
      expect(bus.status, BusStatus.enRoute);
    });

    test('getAllBuses should return empty list if no buses exist', () async {
      // Arrange - pas de données

      // Act
      final snapshot = await fakeFirestore.collection('buses').get();

      // Assert
      expect(snapshot.docs, isEmpty);
    });

    test('getAllBuses should return all buses', () async {
      // Arrange
      await fakeFirestore.collection('buses').doc('bus_001').set({
        'immatriculation': 'AB-123-CD',
        'chauffeur': 'Jean Dupont',
        'chauffeurId': 'driver_001',
        'capacite': 50,
        'itineraire': 'Route 1',
        'status': 'EN_ROUTE',
        'statusLabel': 'En route',
        'maintenanceStatus': 0,
      });

      await fakeFirestore.collection('buses').doc('bus_002').set({
        'immatriculation': 'EF-456-GH',
        'chauffeur': 'Marie Martin',
        'chauffeurId': 'driver_002',
        'capacite': 45,
        'itineraire': 'Route 2',
        'status': 'A_L_ARRET',
        'statusLabel': 'À l\'arrêt',
        'maintenanceStatus': 1,
      });

      // Act
      final snapshot = await fakeFirestore.collection('buses').get();
      final buses = snapshot.docs.map((doc) {
        return Bus.fromJson({
          'id': doc.id,
          ...doc.data(),
        });
      }).toList();

      // Assert
      expect(buses.length, 2);
      expect(buses[0].id, 'bus_001');
      expect(buses[0].immatriculation, 'AB-123-CD');
      expect(buses[1].id, 'bus_002');
      expect(buses[1].immatriculation, 'EF-456-GH');
    });

    test('watchBusPosition should stream GPS live data', () async {
      // Arrange
      final busId = 'bus_001';
      final gpsData = {
        'immatriculation': 'AB-123-CD',
        'chauffeur': 'Jean Dupont',
        'chauffeurId': 'driver_001',
        'capacite': 50,
        'itineraire': 'Route 1',
        'status': 'EN_ROUTE',
        'statusLabel': 'En route',
        'maintenanceStatus': 0,
        'currentPosition': {
          'lat': 48.8566,
          'lng': 2.3522,
          'speed': 45.5,
          'timestamp': 1234567890,
        },
      };

      await fakeFirestore.collection('gps_live').doc(busId).set(gpsData);

      // Act
      final stream = fakeFirestore.collection('gps_live').doc(busId).snapshots();
      final snapshot = await stream.first;

      // Assert
      expect(snapshot.exists, true);
      final bus = Bus.fromJson({
        'id': snapshot.id,
        ...snapshot.data()!,
      });
      expect(bus.currentPosition, isNotNull);
      expect(bus.currentPosition!.lat, 48.8566);
      expect(bus.currentPosition!.lng, 2.3522);
    });

    test('watchBusPosition should handle position updates', () async {
      // Arrange
      final busId = 'bus_001';
      final initialData = {
        'immatriculation': 'AB-123-CD',
        'chauffeur': 'Jean Dupont',
        'chauffeurId': 'driver_001',
        'capacite': 50,
        'itineraire': 'Route 1',
        'status': 'EN_ROUTE',
        'statusLabel': 'En route',
        'maintenanceStatus': 0,
        'currentPosition': {
          'lat': 48.8566,
          'lng': 2.3522,
          'speed': 45.5,
          'timestamp': 1234567890,
        },
      };

      await fakeFirestore.collection('gps_live').doc(busId).set(initialData);

      // Act & Assert
      final stream = fakeFirestore.collection('gps_live').doc(busId).snapshots();

      // Vérifier la première valeur
      final firstSnapshot = await stream.first;
      final firstBus = Bus.fromJson({
        'id': firstSnapshot.id,
        ...firstSnapshot.data()!,
      });
      expect(firstBus.currentPosition!.lat, 48.8566);

      // Mettre à jour la position
      await fakeFirestore.collection('gps_live').doc(busId).update({
        'currentPosition': {
          'lat': 48.8570,
          'lng': 2.3525,
          'speed': 50.0,
          'timestamp': 1234567900,
        },
      });

      // Vérifier la mise à jour
      final updatedSnapshot = await fakeFirestore.collection('gps_live').doc(busId).get();
      final updatedBus = Bus.fromJson({
        'id': updatedSnapshot.id,
        ...updatedSnapshot.data()!,
      });
      expect(updatedBus.currentPosition!.lat, 48.8570);
      expect(updatedBus.currentPosition!.speed, 50.0);
    });

    test('Bus should handle different status changes', () async {
      // Arrange
      final busId = 'bus_001';
      final busData = {
        'immatriculation': 'AB-123-CD',
        'chauffeur': 'Jean Dupont',
        'chauffeurId': 'driver_001',
        'capacite': 50,
        'itineraire': 'Route 1',
        'status': 'EN_ROUTE',
        'statusLabel': 'En route',
        'maintenanceStatus': 0,
      };

      await fakeFirestore.collection('buses').doc(busId).set(busData);

      // Act - Passer en retard
      await fakeFirestore.collection('buses').doc(busId).update({
        'status': 'EN_RETARD',
        'statusLabel': 'En retard',
      });

      // Assert
      final snapshot = await fakeFirestore.collection('buses').doc(busId).get();
      final bus = Bus.fromJson({
        'id': snapshot.id,
        ...snapshot.data()!,
      });
      expect(bus.status, BusStatus.enRetard);
      expect(bus.statusLabel, 'En retard');
    });
  });
}
