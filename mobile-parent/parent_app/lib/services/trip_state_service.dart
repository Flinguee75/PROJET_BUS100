import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/trip_state.dart';
import '../models/trip_type.dart';

/// Service pour persister et restaurer l'état d'un trajet en cours
/// Gère la sauvegarde dans SharedPreferences et la validation du timeout
class TripStateService {
  static const String _keyTripState = 'trip_state';
  static const int _timeoutMinutes = 30; // Timeout de 30 minutes

  /// Sauvegarde l'état complet d'un trajet en cours
  static Future<void> saveTripState({
    required String busId,
    required String driverId,
    required TripType tripType,
    required String courseHistoryId,
    required Map<String, bool> scannedStudents,
    Position? currentPosition,
    Map<String, dynamic>? busMetadata,
  }) async {
    try {
      final prefs = await SharedPreferences.getInstance();

      final tripState = TripState(
        busId: busId,
        driverId: driverId,
        tripType: tripType,
        courseHistoryId: courseHistoryId,
        scannedStudents: scannedStudents,
        currentPosition: currentPosition,
        busMetadata: busMetadata,
        tripStartTimestamp: DateTime.now().millisecondsSinceEpoch,
      );

      final jsonString = jsonEncode(tripState.toJson());
      await prefs.setString(_keyTripState, jsonString);

      debugPrint('💾 État trajet sauvegardé: ${tripState.toString()}');
    } catch (e) {
      debugPrint('❌ Erreur sauvegarde état trajet: $e');
    }
  }

  /// Charge l'état persisté et vérifie le timeout
  /// Retourne null si pas d'état sauvegardé ou si timeout dépassé
  static Future<TripState?> loadTripState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final jsonString = prefs.getString(_keyTripState);

      if (jsonString == null) {
        debugPrint('ℹ️ Aucun état trajet sauvegardé');
        return null;
      }

      final json = jsonDecode(jsonString) as Map<String, dynamic>;
      final tripState = TripState.fromJson(json);

      // Vérifier si le timeout de 30 minutes est dépassé
      if (_isExpired(tripState.tripStartTimestamp)) {
        debugPrint('⏰ Timeout dépassé (>30 min), état ignoré');
        await clearTripState(); // Nettoyer l'état expiré
        return null;
      }

      final elapsedMinutes = _getElapsedMinutes(tripState.tripStartTimestamp);
      debugPrint('📂 État trajet chargé: ${tripState.toString()} (${elapsedMinutes}min)');

      return tripState;
    } catch (e) {
      debugPrint('❌ Erreur chargement état trajet: $e');
      await clearTripState(); // Nettoyer en cas d'erreur
      return null;
    }
  }

  /// Nettoie l'état persisté
  static Future<void> clearTripState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_keyTripState);
      debugPrint('🗑️ État trajet nettoyé');
    } catch (e) {
      debugPrint('❌ Erreur nettoyage état trajet: $e');
    }
  }

  /// Vérifie si le timestamp est expiré (>30 minutes)
  static bool _isExpired(int timestamp) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final elapsed = now - timestamp;
    final timeoutMs = _timeoutMinutes * 60 * 1000; // 30 min en millisecondes
    return elapsed > timeoutMs;
  }

  /// Calcule le nombre de minutes écoulées depuis le timestamp
  static int _getElapsedMinutes(int timestamp) {
    final now = DateTime.now().millisecondsSinceEpoch;
    final elapsed = now - timestamp;
    return (elapsed / (60 * 1000)).floor();
  }

  /// Vérifie si un état trajet existe (sans le charger)
  static Future<bool> hasSavedState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.containsKey(_keyTripState);
    } catch (e) {
      debugPrint('❌ Erreur vérification état: $e');
      return false;
    }
  }
}
