/// Trajet en cours
class CurrentTrip {
  final String tripType; // Type de trajet (morning_outbound, etc.)
  final String? routeId; // Route active pour ce trajet
  final int startTime; // Timestamp début du trajet (Unix ms)
  final List<String> scannedStudentIds; // IDs des élèves scannés

  CurrentTrip({
    required this.tripType,
    this.routeId,
    required this.startTime,
    this.scannedStudentIds = const [],
  });

  factory CurrentTrip.fromJson(Map<String, dynamic> json) {
    return CurrentTrip(
      tripType: json['tripType'] as String,
      routeId: json['routeId'] as String?,
      startTime: json['startTime'] as int,
      scannedStudentIds: json['scannedStudentIds'] != null
          ? (json['scannedStudentIds'] as List).map((e) => e as String).toList()
          : [],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'tripType': tripType,
      if (routeId != null) 'routeId': routeId,
      'startTime': startTime,
      'scannedStudentIds': scannedStudentIds,
    };
  }
}

/// Modèle de données pour un bus
class Bus {
  final String id;
  final String immatriculation;
  final String chauffeur;
  final String chauffeurId;
  final int capacite;
  final String itineraire;
  final BusStatus status;
  final String statusLabel;
  final GPSPosition? currentPosition;
  final String? lastGPSUpdate;
  final int maintenanceStatus;
  final String? liveStatus; // Statut en temps réel depuis GPS : 'en_route', 'stopped', 'idle', 'arrived'
  final CurrentTrip? currentTrip; // Trajet en cours

  Bus({
    required this.id,
    required this.immatriculation,
    required this.chauffeur,
    required this.chauffeurId,
    required this.capacite,
    required this.itineraire,
    required this.status,
    required this.statusLabel,
    this.currentPosition,
    this.lastGPSUpdate,
    required this.maintenanceStatus,
    this.liveStatus,
    this.currentTrip,
  });

  factory Bus.fromJson(Map<String, dynamic> json) {
    return Bus(
      id: json['id'] as String,
      immatriculation: json['immatriculation'] as String? ?? json['plateNumber'] as String? ?? '',
      chauffeur: json['chauffeur'] as String? ?? json['driverName'] as String? ?? 'N/A',
      chauffeurId: json['chauffeurId'] as String? ?? json['driverId'] as String? ?? '',
      capacite: json['capacite'] as int? ?? json['capacity'] as int? ?? 0,
      itineraire: json['itineraire'] as String? ?? json['route'] as String? ?? '',
      status: _parseBusStatus(json['status'] as String? ?? 'EN_ROUTE'),
      statusLabel: json['statusLabel'] as String? ?? 'En route',
      currentPosition: json['currentPosition'] != null
          ? GPSPosition.fromJson(json['currentPosition'])
          : null,
      lastGPSUpdate: json['lastGPSUpdate'] as String?,
      maintenanceStatus: json['maintenanceStatus'] as int? ?? 0,
      liveStatus: json['liveStatus'] as String?,
      currentTrip: json['currentTrip'] != null
          ? CurrentTrip.fromJson(json['currentTrip'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'immatriculation': immatriculation,
      'chauffeur': chauffeur,
      'chauffeurId': chauffeurId,
      'capacite': capacite,
      'itineraire': itineraire,
      'status': status.name,
      'statusLabel': statusLabel,
      'currentPosition': currentPosition?.toJson(),
      'lastGPSUpdate': lastGPSUpdate,
      'maintenanceStatus': maintenanceStatus,
      'liveStatus': liveStatus,
      if (currentTrip != null) 'currentTrip': currentTrip!.toJson(),
    };
  }

  static BusStatus _parseBusStatus(String status) {
    switch (status) {
      case 'EN_ROUTE':
        return BusStatus.enRoute;
      case 'EN_RETARD':
        return BusStatus.enRetard;
      case 'A_L_ARRET':
        return BusStatus.aLArret;
      case 'HORS_SERVICE':
        return BusStatus.horsService;
      default:
        return BusStatus.enRoute;
    }
  }
}

/// Statut du bus
enum BusStatus {
  enRoute,
  enRetard,
  aLArret,
  horsService,
}

/// Position GPS
class GPSPosition {
  final double lat;
  final double lng;
  final double speed;
  final int timestamp;

  GPSPosition({
    required this.lat,
    required this.lng,
    required this.speed,
    required this.timestamp,
  });

  factory GPSPosition.fromJson(Map<String, dynamic> json) {
    return GPSPosition(
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      speed: (json['speed'] as num).toDouble(),
      timestamp: json['timestamp'] as int,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'lat': lat,
      'lng': lng,
      'speed': speed,
      'timestamp': timestamp,
    };
  }
}

