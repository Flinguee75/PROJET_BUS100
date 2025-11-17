import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/bus.dart';
import 'dart:math';

// Tests pour ETA Service (Estimated Time of Arrival)

void main() {
  group('ETA Service Tests', () {
    test('should calculate distance between two GPS coordinates', () {
      // Arrange - Paris to Lyon (environ 465 km)
      final parisLat = 48.8566;
      final parisLng = 2.3522;
      final lyonLat = 45.7640;
      final lyonLng = 4.8357;

      // Act
      final distance = _calculateDistance(parisLat, parisLng, lyonLat, lyonLng);

      // Assert - Distance should be approximately 465 km
      expect(distance, greaterThan(450));
      expect(distance, lessThan(480));
    });

    test('should calculate distance for short distances', () {
      // Arrange - 1km distance
      final lat1 = 48.8566;
      final lng1 = 2.3522;
      final lat2 = 48.8656; // ~1 km north
      final lng2 = 2.3522;

      // Act
      final distance = _calculateDistance(lat1, lng1, lat2, lng2);

      // Assert - Distance should be approximately 1 km
      expect(distance, greaterThan(0.8));
      expect(distance, lessThan(1.2));
    });

    test('should calculate ETA based on distance and speed', () {
      // Arrange
      final distance = 30.0; // 30 km
      final speed = 60.0; // 60 km/h

      // Act
      final eta = _calculateETA(distance, speed);

      // Assert - Should be 30 minutes (0.5 hours)
      expect(eta, closeTo(30, 0.1)); // 30 minutes ± 0.1
    });

    test('should handle zero speed for ETA calculation', () {
      // Arrange
      final distance = 30.0;
      final speed = 0.0;

      // Act
      final eta = _calculateETA(distance, speed);

      // Assert - ETA should be null or very high when speed is 0
      expect(eta, isNull);
    });

    test('should calculate ETA for slow speeds', () {
      // Arrange
      final distance = 10.0; // 10 km
      final speed = 20.0; // 20 km/h

      // Act
      final eta = _calculateETA(distance, speed);

      // Assert - Should be 30 minutes
      expect(eta, closeTo(30, 0.1));
    });

    test('should calculate ETA for high speeds', () {
      // Arrange
      final distance = 100.0; // 100 km
      final speed = 120.0; // 120 km/h

      // Act
      final eta = _calculateETA(distance, speed);

      // Assert - Should be 50 minutes
      expect(eta, closeTo(50, 0.1));
    });

    test('should format ETA in human readable format', () {
      // Test cases
      expect(_formatETA(5), '5 min');
      expect(_formatETA(30), '30 min');
      expect(_formatETA(60), '1h 0min');
      expect(_formatETA(90), '1h 30min');
      expect(_formatETA(125), '2h 5min');
    });

    test('should calculate ETA with GPS position and destination', () {
      // Arrange - Bus is 10 km away moving at 50 km/h
      final busPosition = GPSPosition(
        lat: 48.8566,
        lng: 2.3522,
        speed: 50.0,
        timestamp: DateTime.now().millisecondsSinceEpoch,
      );

      final destinationLat = 48.8566;
      final destinationLng = 2.5; // ~10 km east

      // Act
      final distance = _calculateDistance(
        busPosition.lat,
        busPosition.lng,
        destinationLat,
        destinationLng,
      );
      final eta = _calculateETA(distance, busPosition.speed);

      // Assert
      expect(distance, greaterThan(9));
      expect(distance, lessThan(11));
      expect(eta, greaterThan(10)); // At 50 km/h, ~12 minutes
      expect(eta, lessThan(15));
    });

    test('should handle same origin and destination', () {
      // Arrange
      final lat = 48.8566;
      final lng = 2.3522;

      // Act
      final distance = _calculateDistance(lat, lng, lat, lng);

      // Assert
      expect(distance, 0);
    });

    test('should calculate average speed from positions', () {
      // Arrange - Multiple GPS positions
      final positions = [
        GPSPosition(lat: 48.8566, lng: 2.3522, speed: 50.0, timestamp: 0),
        GPSPosition(lat: 48.8570, lng: 2.3530, speed: 55.0, timestamp: 1000),
        GPSPosition(lat: 48.8574, lng: 2.3538, speed: 60.0, timestamp: 2000),
      ];

      // Act
      final avgSpeed = _calculateAverageSpeed(positions);

      // Assert
      expect(avgSpeed, closeTo(55.0, 0.1)); // Average of 50, 55, 60
    });

    test('should use average speed when current speed is unreliable', () {
      // Arrange - Current speed is very low but average is normal
      final currentSpeed = 5.0; // May be stuck in traffic
      final averageSpeed = 50.0;
      final distance = 25.0;

      // Act - Use average speed if current speed is too low
      final speed = currentSpeed < 10.0 ? averageSpeed : currentSpeed;
      final eta = _calculateETA(distance, speed);

      // Assert - Should use average speed (50 km/h)
      expect(eta, closeTo(30, 0.1)); // 25km at 50km/h = 30 min
    });
  });
}

/// Calculate distance between two GPS coordinates using Haversine formula
double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
  const double earthRadius = 6371; // Earth's radius in kilometers

  final dLat = _degreesToRadians(lat2 - lat1);
  final dLon = _degreesToRadians(lon2 - lon1);

  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(_degreesToRadians(lat1)) *
          cos(_degreesToRadians(lat2)) *
          sin(dLon / 2) *
          sin(dLon / 2);

  final c = 2 * atan2(sqrt(a), sqrt(1 - a));

  return earthRadius * c;
}

double _degreesToRadians(double degrees) {
  return degrees * pi / 180;
}

/// Calculate ETA in minutes
double? _calculateETA(double distanceKm, double speedKmh) {
  if (speedKmh <= 0) return null;
  return (distanceKm / speedKmh) * 60; // Convert hours to minutes
}

/// Format ETA for display
String _formatETA(double minutes) {
  if (minutes < 60) {
    return '${minutes.toInt()} min';
  }

  final hours = (minutes / 60).floor();
  final mins = (minutes % 60).toInt();
  return '${hours}h ${mins}min';
}

/// Calculate average speed from list of GPS positions
double _calculateAverageSpeed(List<GPSPosition> positions) {
  if (positions.isEmpty) return 0;

  final totalSpeed = positions.fold<double>(0, (sum, pos) => sum + pos.speed);
  return totalSpeed / positions.length;
}
