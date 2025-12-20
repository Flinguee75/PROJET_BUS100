import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:geolocator/geolocator.dart';
import 'firebase_service.dart';

/// Statut détaillé des permissions de localisation
enum LocationPermissionStatus {
  granted,
  denied,
  deniedForever,
  serviceDisabled,
}

/// Service pour gérer l'écriture GPS dans Firestore
class GPSService {
  static final FirebaseFirestore _firestore = FirebaseService.firestore;

  /// Met à jour la position GPS d'un bus dans Firestore
  /// Écrit dans /gps_live/{busId}
  ///
  /// [busId] : ID du bus
  /// [position] : Position GPS actuelle
  /// [driverId] : ID du chauffeur (optionnel)
  /// [routeId] : ID de la route (optionnel)
  /// [statusOverride] : Statut imposé (ex: 'en_route' pendant la course)
  ///
  /// Retourne `true` en cas de succès, `false` en cas d'échec
  static Future<bool> updateBusPosition({
    required String busId,
    required Position position,
    String? driverId,
    String? routeId,
    String? statusOverride,
    String? tripType,
    String? tripLabel,
  }) async {
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;

      // Déterminer le statut du bus
      final finalStatus = statusOverride ?? _determineBusStatus(position.speed);

      // Créer l'objet GPS Live selon le format backend
      final gpsLiveData = {
        'busId': busId,
        'position': {
          'lat': position.latitude,
          'lng': position.longitude,
          'speed': position.speed, // m/s
          'heading': position.heading, // degrés (0-360)
          'accuracy': position.accuracy, // mètres
          'timestamp': timestamp,
        },
        'driverId': driverId ?? '',
        'routeId': routeId,
        'status': finalStatus,
        'passengersCount': 0, // TODO: Implémenter comptage passagers
        'tripType': tripType,
        'tripLabel': tripLabel,
        'lastUpdate': FieldValue.serverTimestamp(),
      };

      // Écrire dans /gps_live/{busId}
      await _firestore
          .collection('gps_live')
          .doc(busId)
          .set(gpsLiveData, SetOptions(merge: true));

      debugPrint('✅ Position GPS mise à jour pour le bus $busId (status: $finalStatus)');
      return true; // Succès
    } catch (e) {
      debugPrint('❌ Erreur lors de la mise à jour GPS: $e');
      return false; // Échec - sera mis en queue pour retry
    }
  }

  /// Met uniquement à jour le statut live d'un bus (sans écrire de position)
  static Future<void> setBusStatus({
    required String busId,
    required String status,
    String? driverId,
    String? driverName,
    String? driverPhone,
    String? routeId,
    Map<String, dynamic>? extraData,
    Map<String, double>? parkingLocation,
  }) async {
    try {
      final payload = {
        'busId': busId,
        'status': status,
        'driverId': driverId ?? '',
        'driverName': driverName,
        'driverPhone': driverPhone,
        'routeId': routeId,
        'lastUpdate': FieldValue.serverTimestamp(),
      };

      if (extraData != null) {
        payload.addAll(extraData);
      }

      if (parkingLocation != null &&
          parkingLocation.containsKey('lat') &&
          parkingLocation.containsKey('lng')) {
        payload['position'] = {
          'lat': parkingLocation['lat'],
          'lng': parkingLocation['lng'],
          'speed': 0.0,
          'heading': 0.0,
          'accuracy': 5.0,
          'timestamp': DateTime.now().millisecondsSinceEpoch,
        };
      }

      await _firestore.collection('gps_live').doc(busId).set(payload, SetOptions(merge: true));
      debugPrint('✅ Statut du bus $busId mis à $status');
    } catch (e) {
      debugPrint('❌ Erreur mise à jour statut bus: $e');
    }
  }

  /// Archive la position GPS dans l'historique
  /// Écrit dans /gps_history/{busId}/{date}/{positionId}
  static Future<void> archiveGPSPosition({
    required String busId,
    required Position position,
  }) async {
    try {
      final timestamp = DateTime.now().millisecondsSinceEpoch;
      final date = DateTime.now().toIso8601String().split('T')[0]; // YYYY-MM-DD
      final positionId = timestamp.toString();

      final historyData = {
        'busId': busId,
        'position': {
          'lat': position.latitude,
          'lng': position.longitude,
          'speed': position.speed,
          'heading': position.heading,
          'accuracy': position.accuracy,
          'timestamp': timestamp,
        },
        'createdAt': FieldValue.serverTimestamp(),
      };

      // Écrire dans /gps_history/{busId}/{date}/{positionId}
      await _firestore
          .collection('gps_history')
          .doc(busId)
          .collection(date)
          .doc(positionId)
          .set(historyData);

      debugPrint('✅ Position GPS archivée pour le bus $busId');
    } catch (e) {
      debugPrint('❌ Erreur lors de l\'archivage GPS: $e');
      // Ne pas rethrow pour ne pas bloquer la mise à jour live
    }
  }

  /// Détermine le statut du bus basé sur la vitesse
  /// Retourne les mêmes statuts que le backend attend (en_route, idle, stopped)
  static String _determineBusStatus(double speedMs) {
    final speedKmh = speedMs * 3.6;

    if (speedKmh > 5) {
      return 'en_route'; // Bus considéré comme en course
    } else if (speedKmh > 0.5) {
      return 'idle'; // Ralenti
    } else {
      return 'stopped'; // À l'arrêt
    }
  }

  /// Vérifie les permissions de localisation et retourne un statut détaillé
  static Future<LocationPermissionStatus> checkLocationPermissionStatus() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      debugPrint('⚠️ Le service de localisation est désactivé');
      return LocationPermissionStatus.serviceDisabled;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        debugPrint('⚠️ Les permissions de localisation sont refusées');
        return LocationPermissionStatus.denied;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      debugPrint('⚠️ Les permissions de localisation sont définitivement refusées');
      return LocationPermissionStatus.deniedForever;
    }

    return LocationPermissionStatus.granted;
  }

  /// Historique : garde une version booléenne pour compatibilité
  static Future<bool> checkLocationPermission() async {
    final status = await checkLocationPermissionStatus();
    return status == LocationPermissionStatus.granted;
  }

  /// Obtient la position actuelle
  static Future<Position?> getCurrentPosition() async {
    try {
      final hasPermission = await checkLocationPermission();
      if (!hasPermission) {
        return null;
      }

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      debugPrint('❌ Erreur lors de la récupération de la position: $e');
      return null;
    }
  }
}
