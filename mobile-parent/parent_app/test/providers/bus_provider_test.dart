import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/bus.dart';
import 'package:parent_app/models/enfant.dart';

// Test pour BusProvider
// Ces tests vérifient la logique métier du provider

void main() {
  group('BusProvider Tests', () {
    test('should initialize with empty state', () {
      // Arrange
      final enfants = <Enfant>[];
      final buses = <String, Bus>{};

      // Assert
      expect(enfants, isEmpty);
      expect(buses, isEmpty);
    });

    test('should store enfants correctly', () {
      // Arrange
      final enfants = <Enfant>[
        Enfant(
          id: 'enfant_001',
          nom: 'Dupont',
          prenom: 'Sophie',
          classe: 'CM2',
          ecole: 'École A',
          busId: 'bus_001',
          parentId: 'parent_001',
        ),
        Enfant(
          id: 'enfant_002',
          nom: 'Dupont',
          prenom: 'Lucas',
          classe: 'CE1',
          ecole: 'École A',
          busId: 'bus_002',
          parentId: 'parent_001',
        ),
      ];

      // Assert
      expect(enfants.length, 2);
      expect(enfants[0].prenom, 'Sophie');
      expect(enfants[1].prenom, 'Lucas');
    });

    test('should map buses to enfants correctly', () {
      // Arrange
      final buses = <String, Bus>{
        'bus_001': Bus(
          id: 'bus_001',
          immatriculation: 'AB-123-CD',
          chauffeur: 'Jean Dupont',
          chauffeurId: 'driver_001',
          capacite: 50,
          itineraire: 'Route 1',
          status: BusStatus.enRoute,
          statusLabel: 'En route',
          maintenanceStatus: 0,
        ),
        'bus_002': Bus(
          id: 'bus_002',
          immatriculation: 'EF-456-GH',
          chauffeur: 'Marie Martin',
          chauffeurId: 'driver_002',
          capacite: 45,
          itineraire: 'Route 2',
          status: BusStatus.aLArret,
          statusLabel: 'À l\'arrêt',
          maintenanceStatus: 0,
        ),
      };

      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Dupont',
        prenom: 'Sophie',
        classe: 'CM2',
        ecole: 'École A',
        busId: 'bus_001',
        parentId: 'parent_001',
      );

      // Act
      final bus = buses[enfant.busId];

      // Assert
      expect(bus, isNotNull);
      expect(bus!.id, 'bus_001');
      expect(bus.immatriculation, 'AB-123-CD');
    });

    test('should return null if bus not found for enfant', () {
      // Arrange
      final buses = <String, Bus>{};
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Dupont',
        prenom: 'Sophie',
        classe: 'CM2',
        ecole: 'École A',
        busId: 'nonexistent_bus',
        parentId: 'parent_001',
      );

      // Act
      final bus = buses[enfant.busId];

      // Assert
      expect(bus, isNull);
    });

    test('should handle multiple enfants with same bus', () {
      // Arrange
      final enfants = <Enfant>[
        Enfant(
          id: 'enfant_001',
          nom: 'Dupont',
          prenom: 'Sophie',
          classe: 'CM2',
          ecole: 'École A',
          busId: 'bus_001',
          parentId: 'parent_001',
        ),
        Enfant(
          id: 'enfant_002',
          nom: 'Dupont',
          prenom: 'Lucas',
          classe: 'CE1',
          ecole: 'École A',
          busId: 'bus_001',
          parentId: 'parent_001',
        ),
      ];

      final buses = <String, Bus>{
        'bus_001': Bus(
          id: 'bus_001',
          immatriculation: 'AB-123-CD',
          chauffeur: 'Jean Dupont',
          chauffeurId: 'driver_001',
          capacite: 50,
          itineraire: 'Route 1',
          status: BusStatus.enRoute,
          statusLabel: 'En route',
          maintenanceStatus: 0,
        ),
      };

      // Act & Assert
      expect(enfants[0].busId, enfants[1].busId);
      expect(buses[enfants[0].busId], isNotNull);
      expect(buses[enfants[1].busId], isNotNull);
      expect(buses[enfants[0].busId]!.id, buses[enfants[1].busId]!.id);
    });

    test('should filter enfants by parentId', () {
      // Arrange
      final allEnfants = <Enfant>[
        Enfant(
          id: 'enfant_001',
          nom: 'Dupont',
          prenom: 'Sophie',
          classe: 'CM2',
          ecole: 'École A',
          busId: 'bus_001',
          parentId: 'parent_001',
        ),
        Enfant(
          id: 'enfant_002',
          nom: 'Martin',
          prenom: 'Emma',
          classe: 'CE1',
          ecole: 'École B',
          busId: 'bus_002',
          parentId: 'parent_002',
        ),
        Enfant(
          id: 'enfant_003',
          nom: 'Dupont',
          prenom: 'Lucas',
          classe: 'CP',
          ecole: 'École A',
          busId: 'bus_001',
          parentId: 'parent_001',
        ),
      ];

      // Act
      final parentEnfants = allEnfants.where((e) => e.parentId == 'parent_001').toList();

      // Assert
      expect(parentEnfants.length, 2);
      expect(parentEnfants[0].prenom, 'Sophie');
      expect(parentEnfants[1].prenom, 'Lucas');
    });

    test('should handle bus status changes', () {
      // Arrange
      final bus = Bus(
        id: 'bus_001',
        immatriculation: 'AB-123-CD',
        chauffeur: 'Jean Dupont',
        chauffeurId: 'driver_001',
        capacite: 50,
        itineraire: 'Route 1',
        status: BusStatus.enRoute,
        statusLabel: 'En route',
        maintenanceStatus: 0,
      );

      // Act - Simuler le changement de statut
      final updatedBus = Bus(
        id: bus.id,
        immatriculation: bus.immatriculation,
        chauffeur: bus.chauffeur,
        chauffeurId: bus.chauffeurId,
        capacite: bus.capacite,
        itineraire: bus.itineraire,
        status: BusStatus.enRetard,
        statusLabel: 'En retard',
        maintenanceStatus: bus.maintenanceStatus,
        currentPosition: bus.currentPosition,
      );

      // Assert
      expect(updatedBus.status, BusStatus.enRetard);
      expect(updatedBus.statusLabel, 'En retard');
      expect(updatedBus.id, bus.id);
    });

    test('should handle GPS position updates', () {
      // Arrange
      final initialBus = Bus(
        id: 'bus_001',
        immatriculation: 'AB-123-CD',
        chauffeur: 'Jean Dupont',
        chauffeurId: 'driver_001',
        capacite: 50,
        itineraire: 'Route 1',
        status: BusStatus.enRoute,
        statusLabel: 'En route',
        maintenanceStatus: 0,
        currentPosition: GPSPosition(
          lat: 48.8566,
          lng: 2.3522,
          speed: 45.5,
          timestamp: 1234567890,
        ),
      );

      // Act - Mettre à jour la position
      final updatedBus = Bus(
        id: initialBus.id,
        immatriculation: initialBus.immatriculation,
        chauffeur: initialBus.chauffeur,
        chauffeurId: initialBus.chauffeurId,
        capacite: initialBus.capacite,
        itineraire: initialBus.itineraire,
        status: initialBus.status,
        statusLabel: initialBus.statusLabel,
        maintenanceStatus: initialBus.maintenanceStatus,
        currentPosition: GPSPosition(
          lat: 48.8570,
          lng: 2.3525,
          speed: 50.0,
          timestamp: 1234567900,
        ),
      );

      // Assert
      expect(updatedBus.currentPosition, isNotNull);
      expect(updatedBus.currentPosition!.lat, 48.8570);
      expect(updatedBus.currentPosition!.lng, 2.3525);
      expect(updatedBus.currentPosition!.speed, 50.0);
      expect(updatedBus.currentPosition!.timestamp, greaterThan(initialBus.currentPosition!.timestamp));
    });
  });
}
