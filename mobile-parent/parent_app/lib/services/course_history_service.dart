import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'firebase_service.dart';

/// Service pour gérer l'historique des courses des chauffeurs.
class CourseHistoryService {
  static final FirebaseFirestore _firestore = FirebaseService.firestore;
  static const String _collection = 'course_history';

  /// Enregistre le lancement d'une course et retourne l'ID créé.
  static Future<String?> startCourse({
    required String busId,
    required String driverId,
    String? routeId,
    String? schoolId,
  }) async {
    try {
      final docRef = await _firestore.collection(_collection).add({
        'busId': busId,
        'driverId': driverId,
        'routeId': routeId,
        'schoolId': schoolId,
        'status': 'in_progress',
        'startTime': FieldValue.serverTimestamp(),
        'endTime': null,
        'createdAt': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });

      debugPrint('✅ Historique course créé (${docRef.id}) pour bus $busId');
      return docRef.id;
    } catch (e) {
      debugPrint('❌ Erreur création historique course: $e');
      return null;
    }
  }

  /// Marque une course comme terminée ou arrêtée.
  static Future<void> endCourse({
    required String historyId,
    String status = 'completed',
  }) async {
    try {
      await _firestore.collection(_collection).doc(historyId).update({
        'status': status,
        'endTime': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      });
      debugPrint('✅ Course $historyId marquée comme $status');
    } catch (e) {
      debugPrint('❌ Erreur fermeture historique course: $e');
    }
  }
}
