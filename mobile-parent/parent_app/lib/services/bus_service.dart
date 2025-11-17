import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/bus.dart';
import 'firebase_service.dart';

/// Service pour gérer les données des bus
class BusService {
  final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Écouter les positions GPS en temps réel d'un bus
  Stream<Bus?> watchBusPosition(String busId) {
    return _firestore
        .collection('gps_live')
        .doc(busId)
        .snapshots()
        .map((snapshot) {
      if (!snapshot.exists) return null;
      
      final data = snapshot.data()!;
      return Bus.fromJson({
        'id': snapshot.id,
        ...data,
      });
    });
  }

  /// Récupérer les informations d'un bus
  Future<Bus?> getBusById(String busId) async {
    try {
      final doc = await _firestore.collection('buses').doc(busId).get();
      
      if (!doc.exists) return null;
      
      return Bus.fromJson({
        'id': doc.id,
        ...doc.data()!,
      });
    } catch (e) {
      print('Erreur récupération bus: $e');
      return null;
    }
  }

  /// Récupérer tous les bus
  Future<List<Bus>> getAllBuses() async {
    try {
      final snapshot = await _firestore.collection('buses').get();
      
      return snapshot.docs.map((doc) {
        return Bus.fromJson({
          'id': doc.id,
          ...doc.data(),
        });
      }).toList();
    } catch (e) {
      print('Erreur récupération buses: $e');
      return [];
    }
  }
}

