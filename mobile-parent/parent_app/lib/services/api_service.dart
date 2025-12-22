import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'package:firebase_auth/firebase_auth.dart';

/// Service API pour communiquer avec le backend Cloud Functions
/// Gère l'authentification, les headers et les erreurs
class ApiService {
  /// URL de base de l'API
  /// En production : https://votre-projet.cloudfunctions.net/api
  /// En développement : http://localhost:5001/projet-bus-60a3f/europe-west4/api
  static String get baseUrl {
    // Détecter si on est en mode émulateur
    const useEmulator = bool.fromEnvironment('USE_EMULATOR', defaultValue: true);

    if (useEmulator || kDebugMode) {
      // Emulateur local - différent selon la plateforme
      if (Platform.isAndroid) {
        // Android émulateur utilise 10.0.2.2 pour localhost
        return 'http://10.0.2.2:5001/projet-bus-60a3f/europe-west4/api';
      } else {
        // iOS/autre utilise localhost
        return 'http://127.0.0.1:5001/projet-bus-60a3f/europe-west4/api';
      }
    } else {
      // Production
      return 'https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api';
    }
  }

  /// Récupère le token d'authentification Firebase
  static Future<String?> _getAuthToken() async {
    try {
      final user = FirebaseAuth.instance.currentUser;
      if (user == null) {
        debugPrint('⚠️ Aucun utilisateur connecté');
        return null;
      }
      return await user.getIdToken();
    } catch (e) {
      debugPrint('❌ Erreur récupération token: $e');
      return null;
    }
  }

  /// Headers communs pour toutes les requêtes
  static Future<Map<String, String>> _getHeaders() async {
    final token = await _getAuthToken();

    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }

  /// Effectue une requête POST
  static Future<Map<String, dynamic>> post(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    try {
      final url = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();

      debugPrint('📤 POST $url');
      debugPrint('   Body: ${jsonEncode(body)}');

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(body),
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw TimeoutException('La requête a pris trop de temps');
        },
      );

      debugPrint('📥 Response ${response.statusCode}: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        // Succès
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data;
      } else {
        // Erreur HTTP
        final error = jsonDecode(response.body) as Map<String, dynamic>;
        final message = error['message'] ?? error['error'] ?? 'Erreur serveur';
        throw ApiException(message, response.statusCode);
      }
    } on SocketException {
      throw ApiException('Pas de connexion internet', 0);
    } on TimeoutException catch (e) {
      throw ApiException(e.message ?? 'Timeout', 0);
    } on FormatException {
      throw ApiException('Réponse serveur invalide', 0);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur inconnue: $e', 0);
    }
  }

  /// Effectue une requête GET
  static Future<Map<String, dynamic>> get(String endpoint) async {
    try {
      final url = Uri.parse('$baseUrl$endpoint');
      final headers = await _getHeaders();

      debugPrint('📤 GET $url');

      final response = await http.get(
        url,
        headers: headers,
      ).timeout(
        const Duration(seconds: 10),
        onTimeout: () {
          throw TimeoutException('La requête a pris trop de temps');
        },
      );

      debugPrint('📥 Response ${response.statusCode}: ${response.body}');

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = jsonDecode(response.body) as Map<String, dynamic>;
        return data;
      } else {
        final error = jsonDecode(response.body) as Map<String, dynamic>;
        final message = error['message'] ?? error['error'] ?? 'Erreur serveur';
        throw ApiException(message, response.statusCode);
      }
    } on SocketException {
      throw ApiException('Pas de connexion internet', 0);
    } on TimeoutException catch (e) {
      throw ApiException(e.message ?? 'Timeout', 0);
    } on FormatException {
      throw ApiException('Réponse serveur invalide', 0);
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException('Erreur inconnue: $e', 0);
    }
  }
}

/// Exception personnalisée pour les erreurs API
class ApiException implements Exception {
  final String message;
  final int statusCode;

  ApiException(this.message, this.statusCode);

  @override
  String toString() => 'ApiException($statusCode): $message';
}

/// Exception pour les timeouts
class TimeoutException implements Exception {
  final String? message;
  TimeoutException(this.message);
}
