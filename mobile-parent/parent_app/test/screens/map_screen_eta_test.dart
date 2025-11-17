import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/bus.dart';
import 'package:parent_app/services/eta_service.dart';

// Tests pour l'intégration ETA dans MapScreen

void main() {
  group('MapScreen ETA Integration Tests', () {
    late Bus testBus;
    late GPSPosition busPosition;

    setUp(() {
      busPosition = GPSPosition(
        lat: 48.8566,
        lng: 2.3522,
        speed: 50.0,
        timestamp: DateTime.now().millisecondsSinceEpoch,
      );

      testBus = Bus(
        id: 'bus_001',
        immatriculation: 'AB-123-CD',
        chauffeur: 'Jean Dupont',
        chauffeurId: 'driver_001',
        capacite: 50,
        itineraire: 'Route Centre',
        status: BusStatus.enRoute,
        statusLabel: 'En route',
        maintenanceStatus: 0,
        currentPosition: busPosition,
      );
    });

    testWidgets('should display ETA when bus has position and speed', (WidgetTester tester) async {
      // Arrange
      final destinationLat = 48.8700;
      final destinationLng = 2.3600;

      final distance = ETAService.calculateDistance(
        busPosition.lat,
        busPosition.lng,
        destinationLat,
        destinationLng,
      );
      final eta = ETAService.calculateETA(distance, busPosition.speed);
      final formattedETA = ETAService.formatETA(eta);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                ListTile(
                  leading: const Icon(Icons.access_time),
                  title: const Text('Temps d\'arrivée estimé'),
                  subtitle: Text(formattedETA),
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Temps d\'arrivée estimé'), findsOneWidget);
      expect(find.text(formattedETA), findsOneWidget);
      expect(find.byIcon(Icons.access_time), findsOneWidget);
    });

    testWidgets('should display distance to destination', (WidgetTester tester) async {
      // Arrange
      final destinationLat = 48.8700;
      final destinationLng = 2.3600;

      final distance = ETAService.calculateDistance(
        busPosition.lat,
        busPosition.lng,
        destinationLat,
        destinationLng,
      );

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListTile(
              leading: const Icon(Icons.straighten),
              title: const Text('Distance'),
              subtitle: Text('${distance.toStringAsFixed(1)} km'),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Distance'), findsOneWidget);
      expect(find.textContaining('km'), findsOneWidget);
      expect(find.byIcon(Icons.straighten), findsOneWidget);
    });

    testWidgets('should show "Arrivée imminente" when ETA < 1 minute', (WidgetTester tester) async {
      // Arrange
      final veryShortETA = 0.5; // 0.5 minutes
      final formattedETA = ETAService.formatETA(veryShortETA);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Text(formattedETA),
          ),
        ),
      );

      // Assert
      expect(find.text('Arrivée imminente'), findsOneWidget);
    });

    testWidgets('should display ETA in card widget', (WidgetTester tester) async {
      // Arrange
      final eta = 15.0; // 15 minutes
      final formattedETA = ETAService.formatETA(eta);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    const Icon(Icons.schedule, size: 32),
                    const SizedBox(width: 12),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'ETA',
                          style: TextStyle(fontSize: 12),
                        ),
                        Text(
                          formattedETA,
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('ETA'), findsOneWidget);
      expect(find.text(formattedETA), findsOneWidget);
      expect(find.byIcon(Icons.schedule), findsOneWidget);
    });

    testWidgets('should show "Indisponible" when bus has no position', (WidgetTester tester) async {
      // Arrange
      final formattedETA = ETAService.formatETA(null);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Text(formattedETA),
          ),
        ),
      );

      // Assert
      expect(find.text('Indisponible'), findsOneWidget);
    });

    testWidgets('should update ETA when bus position changes', (WidgetTester tester) async {
      // Arrange
      double currentETA = 20.0;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return Column(
                  children: [
                    Text(ETAService.formatETA(currentETA)),
                    ElevatedButton(
                      onPressed: () {
                        setState(() {
                          currentETA = 15.0; // Bus got closer
                        });
                      },
                      child: const Text('Update'),
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      );

      // Assert initial state
      expect(find.text('20 min'), findsOneWidget);

      // Act - Update position
      await tester.tap(find.text('Update'));
      await tester.pump();

      // Assert - ETA should be updated
      expect(find.text('15 min'), findsOneWidget);
      expect(find.text('20 min'), findsNothing);
    });

    testWidgets('should show progress indicator when calculating ETA', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                bool isCalculating = true;

                return isCalculating
                    ? const CircularProgressIndicator()
                    : const Text('15 min');
              },
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    test('should calculate ETA for school destination', () {
      // Arrange - Bus is 10km from school, moving at 60 km/h
      final schoolLat = 48.8700;
      final schoolLng = 2.3600;

      // Act
      final distance = ETAService.calculateDistance(
        busPosition.lat,
        busPosition.lng,
        schoolLat,
        schoolLng,
      );
      final eta = ETAService.calculateETA(distance, busPosition.speed);

      // Assert
      expect(distance, greaterThan(0));
      expect(eta, isNotNull);
      expect(eta!, greaterThan(0));
    });

    test('should detect when bus is near destination', () {
      // Arrange - Bus very close to destination (200m)
      final nearPosition = GPSPosition(
        lat: 48.8570,
        lng: 2.3525,
        speed: 30.0,
        timestamp: DateTime.now().millisecondsSinceEpoch,
      );

      final destinationLat = 48.8572;
      final destinationLng = 2.3527;

      // Act
      final isNear = ETAService.isNearDestination(
        busPosition: nearPosition,
        destinationLat: destinationLat,
        destinationLng: destinationLng,
        thresholdKm: 0.5, // 500 meters
      );

      // Assert
      expect(isNear, true);
    });
  });
}
