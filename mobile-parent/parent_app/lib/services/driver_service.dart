import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/driver.dart';
import 'firebase_service.dart';

/// Service pour gérer les opérations liées aux chauffeurs
class DriverService {
  static final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Récupère le profil d'un utilisateur depuis Firestore
  /// Retourne null si l'utilisateur n'existe pas ou n'est pas un chauffeur
  static Future<Driver?> getDriverProfile(String userId) async {
    try {
      final doc = await _firestore.collection('users').doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      final data = doc.data();
      if (data == null) {
        return null;
      }

      // Vérifier que c'est bien un chauffeur
      if (data['role'] != 'driver') {
        return null;
      }

      return Driver.fromFirestore(data, userId);
    } catch (e) {
      debugPrint('❌ Erreur lors de la récupération du profil chauffeur: $e');
      return null;
    }
  }

  /// Récupère le profil utilisateur (peut être parent, driver, admin, etc.)
  /// Retourne le rôle et les données de base
  static Future<Map<String, dynamic>?> getUserProfile(String userId) async {
    try {
      final doc = await _firestore.collection('users').doc(userId).get();

      if (!doc.exists) {
        return null;
      }

      final data = doc.data();
      if (data == null) {
        return null;
      }

      return {
        'id': userId,
        'role': data['role'] as String? ?? 'unknown',
        'email': data['email'] as String? ?? '',
        'displayName': data['displayName'] as String? ?? '',
        'phoneNumber': data['phoneNumber'] as String? ?? '',
        'schoolId': data['schoolId'] as String?,
        'busId': data['busId'] as String?,
        'isActive': data['isActive'] as bool? ?? true,
      };
    } catch (e) {
      debugPrint('❌ Erreur lors de la récupération du profil utilisateur: $e');
      return null;
    }
  }

  /// Vérifie si un chauffeur a un bus assigné
  static Future<bool> hasAssignedBus(String driverId) async {
    try {
      final driver = await getDriverProfile(driverId);
      return driver?.hasAssignedBus ?? false;
    } catch (e) {
      debugPrint('❌ Erreur lors de la vérification du bus assigné: $e');
      return false;
    }
  }
}

