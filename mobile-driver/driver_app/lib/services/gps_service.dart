import 'dart:async';
import 'dart:convert';
import 'package:geolocator/geolocator.dart';
import 'package:http/http.dart' as http;

class GPSService {
  static const String baseUrl =
      'https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api';

  Timer? _locationTimer;
  bool _isTracking = false;

  /// Vérifier et demander les permissions de localisation
  Future<bool> checkPermissions() async {
    bool serviceEnabled;
    LocationPermission permission;

    // Vérifier si le service de localisation est activé
    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      return false;
    }

    // Vérifier les permissions
    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      return false;
    }

    return true;
  }

  /// Obtenir la position actuelle
  Future<Position?> getCurrentPosition() async {
    try {
      final hasPermission = await checkPermissions();
      if (!hasPermission) {
        throw Exception('Permission de localisation refusée');
      }

      return await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );
    } catch (e) {
      print('Erreur getCurrentPosition: $e');
      return null;
    }
  }

  /// Démarrer le suivi GPS automatique
  Future<void> startTracking({
    required String busId,
    required String driverId,
    int intervalSeconds = 5,
  }) async {
    if (_isTracking) {
      print('Le suivi GPS est déjà actif');
      return;
    }

    final hasPermission = await checkPermissions();
    if (!hasPermission) {
      throw Exception('Permission de localisation requise');
    }

    _isTracking = true;

    // Envoyer la position immédiatement
    await _sendPosition(busId, driverId);

    // Puis envoyer toutes les X secondes
    _locationTimer = Timer.periodic(
      Duration(seconds: intervalSeconds),
      (timer) async {
        await _sendPosition(busId, driverId);
      },
    );

    print('Suivi GPS démarré (intervalle: ${intervalSeconds}s)');
  }

  /// Arrêter le suivi GPS
  void stopTracking() {
    _locationTimer?.cancel();
    _locationTimer = null;
    _isTracking = false;
    print('Suivi GPS arrêté');
  }

  /// Envoyer la position au backend
  Future<void> _sendPosition(String busId, String driverId) async {
    try {
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      final body = {
        'busId': busId,
        'position': {
          'lat': position.latitude,
          'lng': position.longitude,
          'speed': position.speed,
          'heading': position.heading,
          'accuracy': position.accuracy,
          'timestamp': position.timestamp.millisecondsSinceEpoch,
        },
        'driverId': driverId,
      };

      final response = await http.post(
        Uri.parse('$baseUrl/gps'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        print('Position envoyée: ${position.latitude}, ${position.longitude}');
      } else {
        print('Erreur envoi position: ${response.statusCode}');
      }
    } catch (e) {
      print('Erreur _sendPosition: $e');
    }
  }

  /// Vérifier si le suivi est actif
  bool get isTracking => _isTracking;

  /// Nettoyer les ressources
  void dispose() {
    stopTracking();
  }
}
