import 'package:geolocator/geolocator.dart';

/// Modèle pour un enregistrement GPS en file d'attente SQLite
/// Utilisé pour la persistance offline des positions GPS
class GpsQueueRecord {
  final int? id;
  final String busId;
  final double positionLat;
  final double positionLng;
  final double positionSpeed;
  final double positionHeading;
  final double positionAccuracy;
  final int positionTimestamp;
  final String? driverId;
  final String? routeId;
  final String? tripType;
  final String? status;
  final int retryCount;
  final int createdAt;
  final int uploaded; // 0 = non uploadé, 1 = uploadé

  GpsQueueRecord({
    this.id,
    required this.busId,
    required this.positionLat,
    required this.positionLng,
    required this.positionSpeed,
    required this.positionHeading,
    required this.positionAccuracy,
    required this.positionTimestamp,
    this.driverId,
    this.routeId,
    this.tripType,
    this.status,
    this.retryCount = 0,
    required this.createdAt,
    this.uploaded = 0,
  });

  /// Crée un GpsQueueRecord depuis une Position geolocator
  factory GpsQueueRecord.fromPosition({
    required String busId,
    required Position position,
    String? driverId,
    String? routeId,
    String? tripType,
    String? status,
  }) {
    final now = DateTime.now().millisecondsSinceEpoch;
    return GpsQueueRecord(
      busId: busId,
      positionLat: position.latitude,
      positionLng: position.longitude,
      positionSpeed: position.speed,
      positionHeading: position.heading,
      positionAccuracy: position.accuracy,
      positionTimestamp: position.timestamp.millisecondsSinceEpoch,
      driverId: driverId,
      routeId: routeId,
      tripType: tripType,
      status: status,
      createdAt: now,
    );
  }

  /// Convertit l'enregistrement en Map pour SQLite
  Map<String, dynamic> toMap() {
    return {
      'id': id,
      'busId': busId,
      'position_lat': positionLat,
      'position_lng': positionLng,
      'position_speed': positionSpeed,
      'position_heading': positionHeading,
      'position_accuracy': positionAccuracy,
      'position_timestamp': positionTimestamp,
      'driverId': driverId,
      'routeId': routeId,
      'tripType': tripType,
      'status': status,
      'retry_count': retryCount,
      'created_at': createdAt,
      'uploaded': uploaded,
    };
  }

  /// Crée un GpsQueueRecord depuis une Map SQLite
  factory GpsQueueRecord.fromMap(Map<String, dynamic> map) {
    return GpsQueueRecord(
      id: map['id'] as int?,
      busId: map['busId'] as String,
      positionLat: map['position_lat'] as double,
      positionLng: map['position_lng'] as double,
      positionSpeed: map['position_speed'] as double,
      positionHeading: map['position_heading'] as double,
      positionAccuracy: map['position_accuracy'] as double,
      positionTimestamp: map['position_timestamp'] as int,
      driverId: map['driverId'] as String?,
      routeId: map['routeId'] as String?,
      tripType: map['tripType'] as String?,
      status: map['status'] as String?,
      retryCount: map['retry_count'] as int? ?? 0,
      createdAt: map['created_at'] as int,
      uploaded: map['uploaded'] as int? ?? 0,
    );
  }

  /// Convertit l'enregistrement en Position geolocator
  Position toPosition() {
    return Position(
      latitude: positionLat,
      longitude: positionLng,
      timestamp: DateTime.fromMillisecondsSinceEpoch(positionTimestamp),
      accuracy: positionAccuracy,
      altitude: 0.0,
      altitudeAccuracy: 0.0,
      heading: positionHeading,
      headingAccuracy: 0.0,
      speed: positionSpeed,
      speedAccuracy: 0.0,
    );
  }

  /// Crée une copie avec des modifications
  GpsQueueRecord copyWith({
    int? id,
    String? busId,
    double? positionLat,
    double? positionLng,
    double? positionSpeed,
    double? positionHeading,
    double? positionAccuracy,
    int? positionTimestamp,
    String? driverId,
    String? routeId,
    String? tripType,
    String? status,
    int? retryCount,
    int? createdAt,
    int? uploaded,
  }) {
    return GpsQueueRecord(
      id: id ?? this.id,
      busId: busId ?? this.busId,
      positionLat: positionLat ?? this.positionLat,
      positionLng: positionLng ?? this.positionLng,
      positionSpeed: positionSpeed ?? this.positionSpeed,
      positionHeading: positionHeading ?? this.positionHeading,
      positionAccuracy: positionAccuracy ?? this.positionAccuracy,
      positionTimestamp: positionTimestamp ?? this.positionTimestamp,
      driverId: driverId ?? this.driverId,
      routeId: routeId ?? this.routeId,
      tripType: tripType ?? this.tripType,
      status: status ?? this.status,
      retryCount: retryCount ?? this.retryCount,
      createdAt: createdAt ?? this.createdAt,
      uploaded: uploaded ?? this.uploaded,
    );
  }

  @override
  String toString() {
    return 'GpsQueueRecord(id: $id, busId: $busId, lat: $positionLat, lng: $positionLng, uploaded: $uploaded, retryCount: $retryCount)';
  }
}
