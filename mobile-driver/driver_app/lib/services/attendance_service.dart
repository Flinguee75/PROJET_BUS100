import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:geolocator/geolocator.dart';
import '../models/student.dart';

class AttendanceService {
  // TODO: Remplacer par l'URL de votre Cloud Function en production
  static const String baseUrl =
      'https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api';
  // Pour l'émulateur local: 'http://10.0.2.2:5001/projet-bus-60a3f/europe-west4/api'

  /// Enregistrer la montée d'un élève
  Future<void> boardStudent({
    required String studentId,
    required String busId,
    required String driverId,
    Position? location,
    String? notes,
  }) async {
    try {
      final body = {
        'studentId': studentId,
        'busId': busId,
        'driverId': driverId,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };

      if (location != null) {
        body['location'] = {
          'lat': location.latitude,
          'lng': location.longitude,
        };
      }

      if (notes != null && notes.isNotEmpty) {
        body['notes'] = notes;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/attendance/board'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Erreur lors de l\'enregistrement');
      }
    } catch (e) {
      print('Erreur boardStudent: $e');
      rethrow;
    }
  }

  /// Enregistrer la descente d'un élève
  Future<void> exitStudent({
    required String studentId,
    required String busId,
    required String driverId,
    Position? location,
    String? notes,
  }) async {
    try {
      final body = {
        'studentId': studentId,
        'busId': busId,
        'driverId': driverId,
        'timestamp': DateTime.now().millisecondsSinceEpoch,
      };

      if (location != null) {
        body['location'] = {
          'lat': location.latitude,
          'lng': location.longitude,
        };
      }

      if (notes != null && notes.isNotEmpty) {
        body['notes'] = notes;
      }

      final response = await http.post(
        Uri.parse('$baseUrl/attendance/exit'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode(body),
      );

      if (response.statusCode != 200 && response.statusCode != 201) {
        final errorData = json.decode(response.body);
        throw Exception(errorData['error'] ?? 'Erreur lors de l\'enregistrement');
      }
    } catch (e) {
      print('Erreur exitStudent: $e');
      rethrow;
    }
  }

  /// Récupérer la liste des élèves actuellement dans le bus
  Future<List<Map<String, dynamic>>> getStudentsOnBus(String busId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/attendance/bus/$busId/students'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return List<Map<String, dynamic>>.from(data['data'] ?? []);
      } else {
        throw Exception('Erreur lors de la récupération des élèves');
      }
    } catch (e) {
      print('Erreur getStudentsOnBus: $e');
      return [];
    }
  }

  /// Récupérer le nombre d'élèves dans le bus
  Future<int> countStudentsOnBus(String busId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/attendance/bus/$busId/count'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        return data['data']['count'] as int;
      } else {
        return 0;
      }
    } catch (e) {
      print('Erreur countStudentsOnBus: $e');
      return 0;
    }
  }

  /// Récupérer le statut d'attendance d'un élève pour aujourd'hui
  Future<AttendanceStatus?> getStudentTodayStatus(String studentId) async {
    try {
      final response = await http.get(
        Uri.parse('$baseUrl/attendance/student/$studentId'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final record = data['data'];
        if (record != null) {
          return AttendanceStatus.fromString(record['status'] as String);
        }
      }
      return null;
    } catch (e) {
      print('Erreur getStudentTodayStatus: $e');
      return null;
    }
  }
}
