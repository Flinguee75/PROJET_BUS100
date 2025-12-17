import 'package:geolocator/geolocator.dart';
import 'trip_type.dart';

/// Modèle pour persister l'état complet d'un trajet en cours
/// Utilisé pour restaurer un trajet après crash/force-quit de l'app
class TripState {
  final String busId;
  final String driverId;
  final TripType tripType;
  final String courseHistoryId;
  final Map<String, bool> scannedStudents;
  final Position? currentPosition;
  final Map<String, dynamic>? busMetadata;
  final int tripStartTimestamp; // Pour vérifier timeout 30 min

  TripState({
    required this.busId,
    required this.driverId,
    required this.tripType,
    required this.courseHistoryId,
    required this.scannedStudents,
    this.currentPosition,
    this.busMetadata,
    required this.tripStartTimestamp,
  });

  /// Sérialise l'état en JSON pour SharedPreferences
  Map<String, dynamic> toJson() {
    return {
      'busId': busId,
      'driverId': driverId,
      'selectedTripType': tripType.firestoreValue,
      'courseHistoryId': courseHistoryId,
      'scannedStudents': scannedStudents,
      'currentPosition': currentPosition != null
          ? {
              'lat': currentPosition!.latitude,
              'lng': currentPosition!.longitude,
              'speed': currentPosition!.speed,
              'heading': currentPosition!.heading,
              'accuracy': currentPosition!.accuracy,
              'timestamp': currentPosition!.timestamp.millisecondsSinceEpoch,
            }
          : null,
      'busMetadata': busMetadata,
      'tripStartTimestamp': tripStartTimestamp,
    };
  }

  /// Désérialise l'état depuis JSON
  factory TripState.fromJson(Map<String, dynamic> json) {
    Position? position;
    if (json['currentPosition'] != null) {
      final pos = json['currentPosition'];
      position = Position(
        latitude: pos['lat'],
        longitude: pos['lng'],
        timestamp: DateTime.fromMillisecondsSinceEpoch(pos['timestamp']),
        accuracy: pos['accuracy'],
        altitude: 0.0,
        altitudeAccuracy: 0.0,
        heading: pos['heading'],
        headingAccuracy: 0.0,
        speed: pos['speed'],
        speedAccuracy: 0.0,
      );
    }

    return TripState(
      busId: json['busId'],
      driverId: json['driverId'],
      tripType: TripType.values.firstWhere(
        (t) => t.firestoreValue == json['selectedTripType'],
      ),
      courseHistoryId: json['courseHistoryId'],
      scannedStudents: Map<String, bool>.from(json['scannedStudents'] ?? {}),
      currentPosition: position,
      busMetadata: json['busMetadata'] != null
          ? Map<String, dynamic>.from(json['busMetadata'])
          : null,
      tripStartTimestamp: json['tripStartTimestamp'],
    );
  }

  @override
  String toString() {
    return 'TripState(busId: $busId, tripType: ${tripType.label}, courseHistoryId: $courseHistoryId)';
  }
}
