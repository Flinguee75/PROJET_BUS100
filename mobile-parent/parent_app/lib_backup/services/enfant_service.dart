import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/enfant.dart';
import 'firebase_service.dart';

/// Service pour gérer les données des enfants
class EnfantService {
  final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Récupérer les enfants d'un parent
  Future<List<Enfant>> getEnfantsByParentId(String parentId) async {
    try {
      final snapshot = await _firestore
          .collection('students')
          .where('parentId', isEqualTo: parentId)
          .get();

      return snapshot.docs.map((doc) {
        return Enfant.fromJson({
          'id': doc.id,
          ...doc.data(),
        });
      }).toList();
    } catch (e) {
      print('Erreur récupération enfants: $e');
      return [];
    }
  }

  /// Récupérer un enfant par son ID
  Future<Enfant?> getEnfantById(String enfantId) async {
    try {
      final doc = await _firestore.collection('students').doc(enfantId).get();

      if (!doc.exists) return null;

      return Enfant.fromJson({
        'id': doc.id,
        ...doc.data()!,
      });
    } catch (e) {
      print('Erreur récupération enfant: $e');
      return null;
    }
  }
}

