import 'package:cloud_firestore/cloud_firestore.dart';

/// Modèle de données pour le profil chauffeur
class Driver {
  final String id;
  final String email;
  final String displayName;
  final String phoneNumber;
  final String role; // 'driver'
  final String? schoolId; // ID de l'école affiliée
  final String? busId; // Bus assigné
  final String? licenseNumber; // Numéro de permis
  final DateTime? licenseExpiry; // Date d'expiration du permis
  final String? photoUrl;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  Driver({
    required this.id,
    required this.email,
    required this.displayName,
    required this.phoneNumber,
    required this.role,
    this.schoolId,
    this.busId,
    this.licenseNumber,
    this.licenseExpiry,
    this.photoUrl,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String,
      phoneNumber: json['phoneNumber'] as String,
      role: json['role'] as String,
      schoolId: json['schoolId'] as String?,
      busId: json['busId'] as String?,
      licenseNumber: json['licenseNumber'] as String?,
      licenseExpiry: json['licenseExpiry'] != null
          ? (json['licenseExpiry'] as Timestamp).toDate()
          : null,
      photoUrl: json['photoUrl'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: (json['createdAt'] as Timestamp).toDate(),
      updatedAt: (json['updatedAt'] as Timestamp).toDate(),
    );
  }

  factory Driver.fromFirestore(Map<String, dynamic> json, String id) {
    // Helper pour convertir Timestamp en DateTime
    DateTime? parseTimestamp(dynamic value) {
      if (value == null) return null;
      if (value is Timestamp) return value.toDate();
      if (value is DateTime) return value;
      return null;
    }

    DateTime parseRequiredTimestamp(dynamic value) {
      if (value is Timestamp) return value.toDate();
      if (value is DateTime) return value;
      return DateTime.now(); // Fallback
    }

    return Driver(
      id: id,
      email: json['email'] as String? ?? '',
      displayName: json['displayName'] as String? ?? '',
      phoneNumber: json['phoneNumber'] as String? ?? '',
      role: json['role'] as String? ?? 'driver',
      schoolId: json['schoolId'] as String?,
      busId: json['busId'] as String?,
      licenseNumber: json['licenseNumber'] as String?,
      licenseExpiry: parseTimestamp(json['licenseExpiry']),
      photoUrl: json['photoUrl'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: parseRequiredTimestamp(json['createdAt']),
      updatedAt: parseRequiredTimestamp(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'displayName': displayName,
      'phoneNumber': phoneNumber,
      'role': role,
      'schoolId': schoolId,
      'busId': busId,
      'licenseNumber': licenseNumber,
      'licenseExpiry': licenseExpiry,
      'photoUrl': photoUrl,
      'isActive': isActive,
      'createdAt': Timestamp.fromDate(createdAt),
      'updatedAt': Timestamp.fromDate(updatedAt),
    };
  }

  /// Vérifie si le chauffeur a un bus assigné
  bool get hasAssignedBus => busId != null && busId!.isNotEmpty;

  /// Vérifie si le permis est valide
  bool get isLicenseValid {
    if (licenseExpiry == null) return false;
    return licenseExpiry!.isAfter(DateTime.now());
  }
}

