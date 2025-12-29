import 'bus.dart';

/// Type de trajet selon le backend (constantes)
class TripTimeOfDay {
  static const String morningOutbound = 'morning_outbound'; // Matin : maison → école
  static const String middayOutbound = 'midday_outbound'; // Midi : école → maison
  static const String middayReturn = 'midday_return'; // Midi : maison → école
  static const String eveningReturn = 'evening_return'; // Soir : école → maison
}

/// Location pour un enfant
class EnfantLocation {
  final String address;
  final double lat;
  final double lng;
  final String? notes;

  EnfantLocation({
    required this.address,
    required this.lat,
    required this.lng,
    this.notes,
  });

  factory EnfantLocation.fromJson(Map<String, dynamic> json) {
    return EnfantLocation(
      address: json['address'] as String,
      lat: (json['lat'] as num).toDouble(),
      lng: (json['lng'] as num).toDouble(),
      notes: json['notes'] as String?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'address': address,
      'lat': lat,
      'lng': lng,
      if (notes != null) 'notes': notes,
    };
  }
}

/// Modèle de données pour un enfant
class Enfant {
  final String id;
  final String nom;
  final String prenom;
  final String classe;
  final String ecole;
  final String busId;
  final String parentId;
  final String? photoUrl;

  // Anciennes propriétés (deprecated, pour rétrocompatibilité)
  final GPSPosition? arret; // Point d'arrêt assigné à l'enfant

  // Nouvelles propriétés avec système de trips
  final List<String> activeTrips; // Liste des trips pour lesquels l'enfant prend le bus
  final EnfantLocation? morningPickup;
  final EnfantLocation? middayDropoff;
  final EnfantLocation? middayPickup;
  final EnfantLocation? eveningDropoff;

  Enfant({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.classe,
    required this.ecole,
    required this.busId,
    required this.parentId,
    this.photoUrl,
    this.arret,
    this.activeTrips = const [],
    this.morningPickup,
    this.middayDropoff,
    this.middayPickup,
    this.eveningDropoff,
  });

  factory Enfant.fromJson(Map<String, dynamic> json) {
    // Parser les activeTrips
    List<String> activeTrips = [];
    if (json['activeTrips'] != null) {
      activeTrips = (json['activeTrips'] as List).map((e) => e as String).toList();
    }

    // Parser les locations
    final locations = json['locations'] as Map<String, dynamic>?;

    return Enfant(
      id: json['id'] as String,
      nom: json['lastName'] as String? ?? json['nom'] as String? ?? '',
      prenom: json['firstName'] as String? ?? json['prenom'] as String? ?? '',
      classe: json['grade'] as String? ?? json['classe'] as String? ?? '',
      ecole: json['schoolId'] as String? ?? json['ecole'] as String? ?? '',
      busId: json['busId'] as String,
      parentId: json['parentId'] as String,
      photoUrl: json['photoUrl'] as String?,
      arret: json['arret'] != null
          ? GPSPosition.fromJson(json['arret'] as Map<String, dynamic>)
          : null,
      activeTrips: activeTrips,
      morningPickup: locations?['morningPickup'] != null
          ? EnfantLocation.fromJson(locations!['morningPickup'] as Map<String, dynamic>)
          : null,
      middayDropoff: locations?['middayDropoff'] != null
          ? EnfantLocation.fromJson(locations!['middayDropoff'] as Map<String, dynamic>)
          : null,
      middayPickup: locations?['middayPickup'] != null
          ? EnfantLocation.fromJson(locations!['middayPickup'] as Map<String, dynamic>)
          : null,
      eveningDropoff: locations?['eveningDropoff'] != null
          ? EnfantLocation.fromJson(locations!['eveningDropoff'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nom': nom,
      'prenom': prenom,
      'classe': classe,
      'ecole': ecole,
      'busId': busId,
      'parentId': parentId,
      'photoUrl': photoUrl,
      'arret': arret?.toJson(),
      'activeTrips': activeTrips,
      'locations': {
        if (morningPickup != null) 'morningPickup': morningPickup!.toJson(),
        if (middayDropoff != null) 'middayDropoff': middayDropoff!.toJson(),
        if (middayPickup != null) 'middayPickup': middayPickup!.toJson(),
        if (eveningDropoff != null) 'eveningDropoff': eveningDropoff!.toJson(),
      },
    };
  }

  String get nomComplet => '$prenom $nom';

  /// Retourne la location appropriée pour un trip donné
  EnfantLocation? getLocationForTrip(String tripType) {
    switch (tripType) {
      case TripTimeOfDay.morningOutbound:
        return morningPickup;
      case TripTimeOfDay.middayOutbound:
        return middayDropoff;
      case TripTimeOfDay.middayReturn:
        return middayPickup;
      case TripTimeOfDay.eveningReturn:
        return eveningDropoff;
      default:
        return null;
    }
  }

  /// Vérifie si l'enfant est inscrit à un trip donné
  bool isActiveForTrip(String tripType) {
    return activeTrips.contains(tripType);
  }
}

