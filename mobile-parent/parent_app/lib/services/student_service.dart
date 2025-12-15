import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'firebase_service.dart';

/// Modèle simplifié pour un élève (utilisé par le chauffeur)
class Student {
  final String id;
  final String firstName;
  final String lastName;
  final String grade; // Classe
  final String? commune;
  final String? quartier;
  final Map<String, dynamic>? locations;
  final List<String> activeTrips; // Trajets actifs: ['morning_outbound', 'evening_return', etc.]

  Student({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.grade,
    this.commune,
    this.quartier,
    this.locations,
    this.activeTrips = const [],
  });

  factory Student.fromFirestore(Map<String, dynamic> json, String id) {
    // Parser activeTrips depuis Firestore (peut être une liste de strings)
    List<String> parseActiveTrips(dynamic value) {
      if (value == null) return [];
      if (value is List) {
        return value.map((e) => e.toString()).toList();
      }
      return [];
    }

    return Student(
      id: id,
      firstName: json['firstName'] as String? ?? json['prenom'] as String? ?? '',
      lastName: json['lastName'] as String? ?? json['nom'] as String? ?? '',
      grade: json['grade'] as String? ?? json['classe'] as String? ?? '',
      commune: json['commune'] as String?,
      quartier: json['quartier'] as String?,
      locations: json['locations'] as Map<String, dynamic>?,
      activeTrips: parseActiveTrips(json['activeTrips']),
    );
  }

  String get fullName => '$firstName $lastName';

  /// Vérifie si l'élève participe à un type de trajet donné
  bool hasTrip(String tripType) => activeTrips.contains(tripType);
}

/// Service pour gérer les élèves
class StudentService {
  static final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Récupère tous les élèves assignés à un bus
  static Future<List<Student>> getStudentsByBusId(String busId) async {
    try {
      final snapshot = await _firestore
          .collection('students')
          .where('busId', isEqualTo: busId)
          .get();

      return snapshot.docs.map((doc) {
        return Student.fromFirestore(doc.data(), doc.id);
      }).toList();
    } catch (e) {
      debugPrint('❌ Erreur lors de la récupération des élèves: $e');
      return [];
    }
  }

  /// Écoute en temps réel les élèves d'un bus
  static Stream<List<Student>> watchStudentsByBusId(String busId) {
    return _firestore
        .collection('students')
        .where('busId', isEqualTo: busId)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return Student.fromFirestore(doc.data(), doc.id);
      }).toList();
    });
  }

  /// Récupère les élèves d'un bus filtrés par type de trajet
  /// [tripType] doit être une valeur Firestore: 'morning_outbound', 'midday_outbound', etc.
  static Future<List<Student>> getStudentsByBusIdAndTripType(
    String busId,
    String tripType,
  ) async {
    try {
      // Firestore query avec arrayContains pour filtrer par activeTrips
      final snapshot = await _firestore
          .collection('students')
          .where('busId', isEqualTo: busId)
          .where('activeTrips', arrayContains: tripType)
          .get();

      return snapshot.docs.map((doc) {
        return Student.fromFirestore(doc.data(), doc.id);
      }).toList();
    } catch (e) {
      debugPrint('❌ Erreur lors de la récupération des élèves filtrés: $e');
      return [];
    }
  }

  /// Écoute en temps réel les élèves d'un bus filtrés par type de trajet
  static Stream<List<Student>> watchStudentsByBusIdAndTripType(
    String busId,
    String tripType,
  ) {
    return _firestore
        .collection('students')
        .where('busId', isEqualTo: busId)
        .where('activeTrips', arrayContains: tripType)
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return Student.fromFirestore(doc.data(), doc.id);
      }).toList();
    });
  }
}

