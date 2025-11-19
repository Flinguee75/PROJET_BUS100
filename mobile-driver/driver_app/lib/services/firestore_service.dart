import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/student.dart';
import '../models/bus.dart';

class FirestoreService {
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  /// Récupérer tous les élèves assignés à un bus
  Future<List<Student>> getStudentsByBus(String busId) async {
    try {
      final snapshot = await _firestore
          .collection('students')
          .where('busId', isEqualTo: busId)
          .orderBy('lastName')
          .orderBy('firstName')
          .get();

      return snapshot.docs.map((doc) {
        return Student.fromJson({
          'id': doc.id,
          ...doc.data(),
        });
      }).toList();
    } catch (e) {
      print('Erreur getStudentsByBus: $e');
      return [];
    }
  }

  /// Stream des élèves d'un bus (temps réel)
  Stream<List<Student>> watchStudentsByBus(String busId) {
    return _firestore
        .collection('students')
        .where('busId', isEqualTo: busId)
        .orderBy('lastName')
        .orderBy('firstName')
        .snapshots()
        .map((snapshot) {
      return snapshot.docs.map((doc) {
        return Student.fromJson({
          'id': doc.id,
          ...doc.data(),
        });
      }).toList();
    });
  }

  /// Récupérer les informations d'un bus
  Future<Bus?> getBus(String busId) async {
    try {
      final doc = await _firestore.collection('buses').doc(busId).get();

      if (!doc.exists) return null;

      return Bus.fromJson({
        'id': doc.id,
        ...doc.data()!,
      });
    } catch (e) {
      print('Erreur getBus: $e');
      return null;
    }
  }

  /// Stream du bus (temps réel)
  Stream<Bus?> watchBus(String busId) {
    return _firestore.collection('buses').doc(busId).snapshots().map((doc) {
      if (!doc.exists) return null;
      return Bus.fromJson({
        'id': doc.id,
        ...doc.data()!,
      });
    });
  }

  /// Mettre à jour le statut du bus
  Future<void> updateBusStatus(String busId, BusStatus status) async {
    try {
      await _firestore.collection('buses').doc(busId).update({
        'status': status.value,
        'updatedAt': FieldValue.serverTimestamp(),
      });
    } catch (e) {
      print('Erreur updateBusStatus: $e');
      rethrow;
    }
  }
}
