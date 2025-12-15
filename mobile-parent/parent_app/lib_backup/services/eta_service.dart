import 'dart:math';
import '../models/bus.dart';

/// Service pour calculer l'ETA (Estimated Time of Arrival)
class ETAService {
  /// Calcule la distance entre deux coordonnées GPS (formule de Haversine)
  /// Retourne la distance en kilomètres
  static double calculateDistance(
    double lat1,
    double lon1,
    double lat2,
    double lon2,
  ) {
    const double earthRadius = 6371; // Rayon de la Terre en kilomètres

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

  /// Convertit les degrés en radians
  static double _degreesToRadians(double degrees) {
    return degrees * pi / 180;
  }

  /// Calcule l'ETA en minutes
  /// Retourne null si la vitesse est <= 0
  static double? calculateETA(double distanceKm, double speedKmh) {
    if (speedKmh <= 0) return null;
    return (distanceKm / speedKmh) * 60; // Convertir heures en minutes
  }

  /// Calcule l'ETA avec une position GPS et une destination
  static double? calculateETAFromPosition({
    required GPSPosition busPosition,
    required double destinationLat,
    required double destinationLng,
  }) {
    final distance = calculateDistance(
      busPosition.lat,
      busPosition.lng,
      destinationLat,
      destinationLng,
    );

    return calculateETA(distance, busPosition.speed);
  }

  /// Formate l'ETA pour l'affichage
  static String formatETA(double? minutes) {
    if (minutes == null) return 'Indisponible';

    if (minutes < 1) {
      return 'Arrivée imminente';
    }

    if (minutes < 60) {
      return '${minutes.toInt()} min';
    }

    final hours = (minutes / 60).floor();
    final mins = (minutes % 60).toInt();

    if (mins == 0) {
      return '${hours}h';
    }

    return '${hours}h ${mins}min';
  }

  /// Calcule la vitesse moyenne à partir d'une liste de positions GPS
  static double calculateAverageSpeed(List<GPSPosition> positions) {
    if (positions.isEmpty) return 0;

    final totalSpeed = positions.fold<double>(
      0,
      (sum, pos) => sum + pos.speed,
    );

    return totalSpeed / positions.length;
  }

  /// Calcule l'ETA avec vitesse moyenne si la vitesse actuelle est peu fiable
  /// (par exemple, si le bus est arrêté temporairement)
  static double? calculateETAWithAverageSpeed({
    required GPSPosition currentPosition,
    required List<GPSPosition> recentPositions,
    required double destinationLat,
    required double destinationLng,
    double minSpeedThreshold = 10.0,
  }) {
    final distance = calculateDistance(
      currentPosition.lat,
      currentPosition.lng,
      destinationLat,
      destinationLng,
    );

    double speed = currentPosition.speed;

    // Si la vitesse actuelle est trop basse, utiliser la moyenne
    if (speed < minSpeedThreshold && recentPositions.isNotEmpty) {
      speed = calculateAverageSpeed(recentPositions);
    }

    return calculateETA(distance, speed);
  }

  /// Calcule le pourcentage de progression sur un trajet
  /// startPosition: point de départ
  /// currentPosition: position actuelle
  /// endPosition: point d'arrivée
  static double calculateProgress({
    required GPSPosition startPosition,
    required GPSPosition currentPosition,
    required double destinationLat,
    required double destinationLng,
  }) {
    final totalDistance = calculateDistance(
      startPosition.lat,
      startPosition.lng,
      destinationLat,
      destinationLng,
    );

    final remainingDistance = calculateDistance(
      currentPosition.lat,
      currentPosition.lng,
      destinationLat,
      destinationLng,
    );

    if (totalDistance == 0) return 100.0;

    final progress = ((totalDistance - remainingDistance) / totalDistance) * 100;

    // Limiter entre 0 et 100
    return progress.clamp(0.0, 100.0);
  }

  /// Détermine si le bus est proche de la destination
  /// threshold en kilomètres (par défaut 0.5 km = 500m)
  static bool isNearDestination({
    required GPSPosition busPosition,
    required double destinationLat,
    required double destinationLng,
    double thresholdKm = 0.5,
  }) {
    final distance = calculateDistance(
      busPosition.lat,
      busPosition.lng,
      destinationLat,
      destinationLng,
    );

    return distance <= thresholdKm;
  }
}
