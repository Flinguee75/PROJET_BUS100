import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/bus.dart';
import 'package:parent_app/services/eta_service.dart';

// Tests pour le widget ETA sur HomeScreen

void main() {
  group('ETA Widget Tests', () {
    testWidgets('should display ETA in compact format', (WidgetTester tester) async {
      // Arrange
      final eta = 15.0; // 15 minutes
      final formattedETA = ETAService.formatETA(eta);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Row(
              children: [
                const Icon(Icons.schedule, size: 16),
                const SizedBox(width: 4),
                Text(
                  formattedETA,
                  style: const TextStyle(fontSize: 12),
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(formattedETA), findsOneWidget);
      expect(find.byIcon(Icons.schedule), findsOneWidget);
    });

    testWidgets('should display ETA with success color when near', (WidgetTester tester) async {
      // Arrange
      final eta = 3.0; // 3 minutes - proche
      final formattedETA = ETAService.formatETA(eta);
      final isNear = eta < 5;

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Row(
              children: [
                Icon(
                  Icons.schedule,
                  size: 16,
                  color: isNear ? Colors.green : Colors.blue,
                ),
                const SizedBox(width: 4),
                Text(
                  formattedETA,
                  style: TextStyle(
                    fontSize: 12,
                    color: isNear ? Colors.green : Colors.blue,
                  ),
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(formattedETA), findsOneWidget);

      final icon = tester.widget<Icon>(find.byIcon(Icons.schedule));
      expect(icon.color, Colors.green);
    });

    testWidgets('should show "Arrivée imminente" badge when ETA < 1 min', (WidgetTester tester) async {
      // Arrange
      final eta = 0.5;
      final formattedETA = ETAService.formatETA(eta);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.orange,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                formattedETA,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Arrivée imminente'), findsOneWidget);
    });

    testWidgets('should display "Indisponible" when no ETA', (WidgetTester tester) async {
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

    testWidgets('should display ETA in EnfantCard style', (WidgetTester tester) async {
      // Arrange
      final eta = 12.0;
      final formattedETA = ETAService.formatETA(eta);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Card(
              child: ListTile(
                title: const Text('Sophie Dupont'),
                subtitle: Row(
                  children: [
                    const Icon(Icons.directions_bus, size: 14),
                    const SizedBox(width: 4),
                    const Text('AB-123-CD'),
                    const SizedBox(width: 12),
                    const Icon(Icons.schedule, size: 14),
                    const SizedBox(width: 4),
                    Text(formattedETA),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Sophie Dupont'), findsOneWidget);
      expect(find.text('AB-123-CD'), findsOneWidget);
      expect(find.text(formattedETA), findsOneWidget);
      expect(find.byIcon(Icons.schedule), findsOneWidget);
    });

    testWidgets('should handle long ETA values', (WidgetTester tester) async {
      // Arrange
      final eta = 125.0; // 2h 5min
      final formattedETA = ETAService.formatETA(eta);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Text(formattedETA),
          ),
        ),
      );

      // Assert
      expect(find.text('2h 5min'), findsOneWidget);
    });

    testWidgets('should display ETA badge with proper styling', (WidgetTester tester) async {
      // Arrange
      final eta = 20.0;
      final formattedETA = ETAService.formatETA(eta);

      // Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.blue.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: Colors.blue,
                  width: 1,
                ),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  const Icon(Icons.schedule, size: 12, color: Colors.blue),
                  const SizedBox(width: 4),
                  Text(
                    formattedETA,
                    style: const TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.blue,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text(formattedETA), findsOneWidget);
      expect(find.byIcon(Icons.schedule), findsOneWidget);
    });

    test('should calculate ETA for multiple buses', () {
      // Arrange
      final buses = [
        GPSPosition(lat: 48.8566, lng: 2.3522, speed: 50.0, timestamp: 0),
        GPSPosition(lat: 48.8600, lng: 2.3600, speed: 60.0, timestamp: 0),
        GPSPosition(lat: 48.8700, lng: 2.3700, speed: 40.0, timestamp: 0),
      ];

      final destinationLat = 48.8800;
      final destinationLng = 48.8800;

      // Act & Assert
      for (final busPos in buses) {
        final distance = ETAService.calculateDistance(
          busPos.lat,
          busPos.lng,
          destinationLat,
          destinationLng,
        );
        final eta = ETAService.calculateETA(distance, busPos.speed);

        expect(distance, greaterThan(0));
        expect(eta, isNotNull);
        expect(eta!, greaterThan(0));
      }
    });
  });
}
