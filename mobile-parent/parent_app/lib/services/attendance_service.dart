import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'firebase_service.dart';

/// Service pour gérer l'attendance (présence) des élèves
/// Écrit directement dans Firestore pour synchronisation temps réel avec le web admin
class AttendanceService {
  static final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Scanne un élève (marque comme présent)
  /// Écrit dans la collection 'attendance'
  static Future<void> scanStudent({
    required String studentId,
    required String busId,
    required String tripType, // ex: 'morning_outbound'
    required String driverId,
    required int tripStartTime,
    Map<String, double>? location,
  }) async {
    try {
      final now = DateTime.now();
      final date = _formatDate(now);
      
      // Chercher un enregistrement existant pour cet élève/bus/date/tripType
      final existingQuery = await _firestore
          .collection('attendance')
          .where('studentId', isEqualTo: studentId)
          .where('busId', isEqualTo: busId)
          .where('date', isEqualTo: date)
          .where('tripType', isEqualTo: tripType)
          .where('tripStartTime', isEqualTo: tripStartTime)
          .limit(1)
          .get();

      final attendanceData = {
        'studentId': studentId,
        'busId': busId,
        'date': date,
        'tripType': tripType,
        'tripStartTime': tripStartTime,
        'status': 'present',
        'scannedAt': FieldValue.serverTimestamp(),
        'driverId': driverId,
        'location': location,
        'updatedAt': FieldValue.serverTimestamp(),
      };

      if (existingQuery.docs.isNotEmpty) {
        // Mettre à jour l'enregistrement existant
        await existingQuery.docs.first.reference.update(attendanceData);
        debugPrint('✅ Élève $studentId mis à jour comme présent');
      } else {
        // Créer un nouvel enregistrement
        attendanceData['createdAt'] = FieldValue.serverTimestamp();
        await _firestore.collection('attendance').add(attendanceData);
        debugPrint('✅ Élève $studentId scanné comme présent');
      }
    } catch (e) {
      debugPrint('❌ Erreur lors du scan de l\'élève: $e');
      rethrow;
    }
  }

  /// Annule le scan d'un élève (marque comme absent)
  static Future<void> unscanStudent({
    required String studentId,
    required String busId,
    required String tripType,
    required String driverId,
    required int tripStartTime,
  }) async {
    try {
      final date = _formatDate(DateTime.now());
      
      // Chercher l'enregistrement existant
      final existingQuery = await _firestore
          .collection('attendance')
          .where('studentId', isEqualTo: studentId)
          .where('busId', isEqualTo: busId)
          .where('date', isEqualTo: date)
          .where('tripType', isEqualTo: tripType)
          .where('tripStartTime', isEqualTo: tripStartTime)
          .limit(1)
          .get();

      if (existingQuery.docs.isNotEmpty) {
        // Mettre à jour le statut à 'absent'
        await existingQuery.docs.first.reference.update({
          'status': 'absent',
          'scannedAt': null,
          'updatedAt': FieldValue.serverTimestamp(),
        });
        debugPrint('✅ Élève $studentId marqué comme absent');
      } else {
        // Créer un enregistrement avec statut absent
        await _firestore.collection('attendance').add({
          'studentId': studentId,
          'busId': busId,
          'date': date,
          'tripType': tripType,
          'tripStartTime': tripStartTime,
          'status': 'absent',
          'driverId': driverId,
          'createdAt': FieldValue.serverTimestamp(),
          'updatedAt': FieldValue.serverTimestamp(),
        });
        debugPrint('✅ Élève $studentId créé comme absent');
      }
    } catch (e) {
      debugPrint('❌ Erreur lors de l\'annulation du scan: $e');
      rethrow;
    }
  }

  /// Récupère le statut d'attendance d'un élève pour aujourd'hui
  static Future<bool> isStudentScanned({
    required String studentId,
    required String busId,
    required String tripType,
  }) async {
    try {
      final date = _formatDate(DateTime.now());
      
      final query = await _firestore
          .collection('attendance')
          .where('studentId', isEqualTo: studentId)
          .where('busId', isEqualTo: busId)
          .where('date', isEqualTo: date)
          .where('tripType', isEqualTo: tripType)
          .limit(1)
          .get();

      if (query.docs.isEmpty) return false;
      
      final status = query.docs.first.data()['status'] as String?;
      return status == 'present';
    } catch (e) {
      debugPrint('❌ Erreur lors de la vérification du statut: $e');
      return false;
    }
  }

  /// Récupère tous les statuts d'attendance pour un bus et un type de trajet aujourd'hui
  /// Retourne un Map studentId vers isScanned
  static Future<Map<String, bool>> getAttendanceStatusForBus({
    required String busId,
    required String tripType,
    int? tripStartTime,
  }) async {
    try {
      final date = _formatDate(DateTime.now());
      Query<Map<String, dynamic>> query = _firestore
          .collection('attendance')
          .where('busId', isEqualTo: busId)
          .where('date', isEqualTo: date)
          .where('tripType', isEqualTo: tripType);

      if (tripStartTime != null) {
        query = query.where('tripStartTime', isEqualTo: tripStartTime);
      }

      final snapshot = await query.get();

      final Map<String, bool> result = {};
      for (final doc in snapshot.docs) {
        final data = doc.data();
        final studentId = data['studentId'] as String?;
        final status = data['status'] as String?;
        if (studentId != null) {
          result[studentId] = status == 'present';
        }
      }
      return result;
    } catch (e) {
      debugPrint('❌ Erreur lors de la récupération des statuts: $e');
      return {};
    }
  }

  /// Écoute en temps réel les changements d'attendance pour un bus
  static Stream<Map<String, bool>> watchAttendanceForBus({
    required String busId,
    required String tripType,
    int? tripStartTime,
  }) {
    final date = _formatDate(DateTime.now());
    
    Query<Map<String, dynamic>> query = _firestore
        .collection('attendance')
        .where('busId', isEqualTo: busId)
        .where('date', isEqualTo: date)
        .where('tripType', isEqualTo: tripType);

    if (tripStartTime != null) {
      query = query.where('tripStartTime', isEqualTo: tripStartTime);
    }

    return query.snapshots()
        .map((snapshot) {
      final Map<String, bool> result = {};
      for (final doc in snapshot.docs) {
        final data = doc.data();
        final studentId = data['studentId'] as String?;
        final status = data['status'] as String?;
        if (studentId != null) {
          result[studentId] = status == 'present';
        }
      }
      return result;
    });
  }

  /// Réinitialise les statuts d'attendance du jour pour un bus et un type de trajet.
  /// Si un tripStartTime est fourni, seule la course correspondante est supprimée.
  static Future<void> resetAttendanceForTrip({
    required String busId,
    required String tripType,
    int? tripStartTime,
  }) async {
    try {
      final date = _formatDate(DateTime.now());

      Query<Map<String, dynamic>> query = _firestore
          .collection('attendance')
          .where('busId', isEqualTo: busId)
          .where('tripType', isEqualTo: tripType)
          .where('date', isEqualTo: date);

      if (tripStartTime != null) {
        query = query.where('tripStartTime', isEqualTo: tripStartTime);
      }

      final snapshot = await query.get();

      if (snapshot.docs.isEmpty) {
        return;
      }

      final batch = _firestore.batch();
      for (final doc in snapshot.docs) {
        batch.delete(doc.reference);
      }
      await batch.commit();
      debugPrint(
        '🧹 Attendance réinitialisée pour bus $busId ($tripType) le $date'
        '${tripStartTime != null ? ' [tripStartTime: $tripStartTime]' : ''}',
      );
    } catch (e) {
      debugPrint('❌ Erreur reset attendance: $e');
    }
  }

  /// Formate une date en YYYY-MM-DD
  static String _formatDate(DateTime date) {
    return '${date.year}-${date.month.toString().padLeft(2, '0')}-${date.day.toString().padLeft(2, '0')}';
  }
}
