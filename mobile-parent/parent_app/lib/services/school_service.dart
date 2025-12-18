import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/foundation.dart';
import 'firebase_service.dart';

/// Service utilitaire pour récupérer les informations d'une école
class SchoolService {
  static final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Retourne les données de l'école (incluant la localisation) ou null si introuvable
  static Future<Map<String, dynamic>?> getSchoolById(String schoolId) async {
    try {
      final doc = await _firestore.collection('schools').doc(schoolId).get();
      if (!doc.exists) return null;
      final data = doc.data();
      if (data == null) return null;
      return {
        'id': doc.id,
        ...data,
      };
    } catch (e) {
      debugPrint('❌ Erreur chargement école $schoolId: $e');
      return null;
    }
  }
}
