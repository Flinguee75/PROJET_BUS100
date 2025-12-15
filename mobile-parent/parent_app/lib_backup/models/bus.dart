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
  });

  factory Bus.fromJson(Map<String, dynamic> json) {
    return Bus(
      id: json['id'] as String,
      immatriculation: json['immatriculation'] as String,
      chauffeur: json['chauffeur'] as String,
      chauffeurId: json['chauffeurId'] as String,
      capacite: json['capacite'] as int,
      itineraire: json['itineraire'] as String,
      status: _parseBusStatus(json['status'] as String),
      statusLabel: json['statusLabel'] as String,
      currentPosition: json['currentPosition'] != null
          ? GPSPosition.fromJson(json['currentPosition'])
          : null,
      lastGPSUpdate: json['lastGPSUpdate'] as String?,
      maintenanceStatus: json['maintenanceStatus'] as int,
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

