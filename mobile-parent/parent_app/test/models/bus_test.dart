import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/bus.dart';

void main() {
  group('Bus Model Tests', () {
    test('Bus.fromJson should correctly parse JSON data', () {
      // Arrange
      final json = {
        'id': 'bus_001',
        'immatriculation': 'AB-123-CD',
        'chauffeur': 'Jean Dupont',
        'chauffeurId': 'driver_001',
        'capacite': 50,
        'itineraire': 'Route Centre Ville',
        'status': 'EN_ROUTE',
        'statusLabel': 'En route',
        'maintenanceStatus': 0,
        'currentPosition': {
          'lat': 48.8566,
          'lng': 2.3522,
          'speed': 45.5,
          'timestamp': 1234567890,
        },
        'lastGPSUpdate': '2025-01-15T10:30:00Z',
      };

      // Act
      final bus = Bus.fromJson(json);

      // Assert
      expect(bus.id, 'bus_001');
      expect(bus.immatriculation, 'AB-123-CD');
      expect(bus.chauffeur, 'Jean Dupont');
      expect(bus.chauffeurId, 'driver_001');
      expect(bus.capacite, 50);
      expect(bus.itineraire, 'Route Centre Ville');
      expect(bus.status, BusStatus.enRoute);
      expect(bus.statusLabel, 'En route');
      expect(bus.maintenanceStatus, 0);
      expect(bus.currentPosition, isNotNull);
      expect(bus.currentPosition!.lat, 48.8566);
      expect(bus.currentPosition!.lng, 2.3522);
      expect(bus.currentPosition!.speed, 45.5);
      expect(bus.currentPosition!.timestamp, 1234567890);
      expect(bus.lastGPSUpdate, '2025-01-15T10:30:00Z');
    });

    test('Bus.fromJson should handle null currentPosition', () {
      // Arrange
      final json = {
        'id': 'bus_002',
        'immatriculation': 'EF-456-GH',
        'chauffeur': 'Marie Martin',
        'chauffeurId': 'driver_002',
        'capacite': 45,
        'itineraire': 'Route Banlieue',
        'status': 'A_L_ARRET',
        'statusLabel': 'À l\'arrêt',
        'maintenanceStatus': 1,
      };

      // Act
      final bus = Bus.fromJson(json);

      // Assert
      expect(bus.currentPosition, isNull);
      expect(bus.lastGPSUpdate, isNull);
    });

    test('Bus.toJson should correctly serialize to JSON', () {
      // Arrange
      final bus = Bus(
        id: 'bus_003',
        immatriculation: 'IJ-789-KL',
        chauffeur: 'Pierre Bernard',
        chauffeurId: 'driver_003',
        capacite: 55,
        itineraire: 'Route Nord',
        status: BusStatus.enRetard,
        statusLabel: 'En retard',
        maintenanceStatus: 0,
        currentPosition: GPSPosition(
          lat: 48.8584,
          lng: 2.2945,
          speed: 30.0,
          timestamp: 1234567891,
        ),
        lastGPSUpdate: '2025-01-15T11:00:00Z',
      );

      // Act
      final json = bus.toJson();

      // Assert
      expect(json['id'], 'bus_003');
      expect(json['immatriculation'], 'IJ-789-KL');
      expect(json['chauffeur'], 'Pierre Bernard');
      expect(json['chauffeurId'], 'driver_003');
      expect(json['capacite'], 55);
      expect(json['itineraire'], 'Route Nord');
      expect(json['status'], 'enRetard');
      expect(json['statusLabel'], 'En retard');
      expect(json['maintenanceStatus'], 0);
      expect(json['currentPosition'], isNotNull);
      expect(json['currentPosition']['lat'], 48.8584);
      expect(json['lastGPSUpdate'], '2025-01-15T11:00:00Z');
    });

    test('BusStatus parsing should handle all status types', () {
      // Test EN_ROUTE
      final busEnRoute = Bus.fromJson({
        'id': 'bus_1',
        'immatriculation': 'AA-111-AA',
        'chauffeur': 'Test',
        'chauffeurId': 'test_1',
        'capacite': 50,
        'itineraire': 'Test Route',
        'status': 'EN_ROUTE',
        'statusLabel': 'En route',
        'maintenanceStatus': 0,
      });
      expect(busEnRoute.status, BusStatus.enRoute);

      // Test EN_RETARD
      final busEnRetard = Bus.fromJson({
        'id': 'bus_2',
        'immatriculation': 'BB-222-BB',
        'chauffeur': 'Test',
        'chauffeurId': 'test_2',
        'capacite': 50,
        'itineraire': 'Test Route',
        'status': 'EN_RETARD',
        'statusLabel': 'En retard',
        'maintenanceStatus': 0,
      });
      expect(busEnRetard.status, BusStatus.enRetard);

      // Test A_L_ARRET
      final busArret = Bus.fromJson({
        'id': 'bus_3',
        'immatriculation': 'CC-333-CC',
        'chauffeur': 'Test',
        'chauffeurId': 'test_3',
        'capacite': 50,
        'itineraire': 'Test Route',
        'status': 'A_L_ARRET',
        'statusLabel': 'À l\'arrêt',
        'maintenanceStatus': 0,
      });
      expect(busArret.status, BusStatus.aLArret);

      // Test HORS_SERVICE
      final busHorsService = Bus.fromJson({
        'id': 'bus_4',
        'immatriculation': 'DD-444-DD',
        'chauffeur': 'Test',
        'chauffeurId': 'test_4',
        'capacite': 50,
        'itineraire': 'Test Route',
        'status': 'HORS_SERVICE',
        'statusLabel': 'Hors service',
        'maintenanceStatus': 2,
      });
      expect(busHorsService.status, BusStatus.horsService);
    });

    test('BusStatus parsing should default to enRoute for unknown status', () {
      // Arrange
      final json = {
        'id': 'bus_unknown',
        'immatriculation': 'XX-999-XX',
        'chauffeur': 'Test',
        'chauffeurId': 'test_unknown',
        'capacite': 50,
        'itineraire': 'Test Route',
        'status': 'UNKNOWN_STATUS',
        'statusLabel': 'Inconnu',
        'maintenanceStatus': 0,
      };

      // Act
      final bus = Bus.fromJson(json);

      // Assert
      expect(bus.status, BusStatus.enRoute);
    });
  });

  group('GPSPosition Model Tests', () {
    test('GPSPosition.fromJson should correctly parse JSON data', () {
      // Arrange
      final json = {
        'lat': 45.764,
        'lng': 4.8357,
        'speed': 60.5,
        'timestamp': 1234567890,
      };

      // Act
      final position = GPSPosition.fromJson(json);

      // Assert
      expect(position.lat, 45.764);
      expect(position.lng, 4.8357);
      expect(position.speed, 60.5);
      expect(position.timestamp, 1234567890);
    });

    test('GPSPosition.toJson should correctly serialize to JSON', () {
      // Arrange
      final position = GPSPosition(
        lat: 43.6047,
        lng: 1.4442,
        speed: 25.0,
        timestamp: 1234567891,
      );

      // Act
      final json = position.toJson();

      // Assert
      expect(json['lat'], 43.6047);
      expect(json['lng'], 1.4442);
      expect(json['speed'], 25.0);
      expect(json['timestamp'], 1234567891);
    });

    test('GPSPosition should handle integer to double conversion', () {
      // Arrange
      final json = {
        'lat': 48,
        'lng': 2,
        'speed': 50,
        'timestamp': 1234567890,
      };

      // Act
      final position = GPSPosition.fromJson(json);

      // Assert
      expect(position.lat, 48.0);
      expect(position.lng, 2.0);
      expect(position.speed, 50.0);
    });
  });
}
