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
    required String tripType,
    required String tripLabel,
    Map<String, dynamic>? busInfo,
    Map<String, dynamic>? driverInfo,
    String? routeId,
    String? schoolId,
  }) async {
    try {
      final docRef = await _firestore.collection(_collection).add({
        'busId': busId,
        'driverId': driverId,
        'routeId': routeId,
        'schoolId': schoolId,
        'tripType': tripType,
        'tripLabel': tripLabel,
        'busInfo': busInfo,
        'driverInfo': driverInfo,
        'status': 'in_progress',
        'startTime': FieldValue.serverTimestamp(),
        'endTime': null,
        'stats': null,
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
    int? totalStudents,
    int? scannedCount,
    List<String>? scannedStudentIds,
    List<String>? missedStudentIds,
  }) async {
    try {
      final updateData = <String, dynamic>{
        'status': status,
        'endTime': FieldValue.serverTimestamp(),
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (totalStudents != null || scannedCount != null) {
        final scanned = scannedCount ?? scannedStudentIds?.length ?? 0;
        int? unscanned;
        if (totalStudents != null) {
          final remaining = totalStudents - scanned;
          unscanned = remaining < 0 ? 0 : remaining;
        }
        updateData['stats'] = {
          'totalStudents': totalStudents,
          'scannedCount': scanned,
          'unscannedCount': unscanned,
        };
      }

      if (scannedStudentIds != null) {
        updateData['scannedStudentIds'] = scannedStudentIds;
      }
      if (missedStudentIds != null) {
        updateData['missedStudentIds'] = missedStudentIds;
      }

      await _firestore.collection(_collection).doc(historyId).update(updateData);
      debugPrint('✅ Course $historyId marquée comme $status');
    } catch (e) {
      debugPrint('❌ Erreur fermeture historique course: $e');
    }
  }
}
