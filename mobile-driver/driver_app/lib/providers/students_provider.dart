import 'package:flutter/material.dart';
import '../models/student.dart';
import '../models/bus.dart';
import '../services/firestore_service.dart';
import '../services/attendance_service.dart';
import '../services/gps_service.dart';

class StudentsProvider with ChangeNotifier {
  final FirestoreService _firestoreService = FirestoreService();
  final AttendanceService _attendanceService = AttendanceService();
  final GPSService _gpsService = GPSService();

  List<Student> _students = [];
  Bus? _bus;
  bool _isLoading = false;
  String? _error;
  int _studentsOnBoardCount = 0;

  List<Student> get students => _students;
  Bus? get bus => _bus;
  bool get isLoading => _isLoading;
  String? get error => _error;
  int get studentsOnBoardCount => _studentsOnBoardCount;
  bool get isGPSTracking => _gpsService.isTracking;

  /// Charger les élèves d'un bus
  Future<void> loadStudents(String busId) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      // Charger les élèves
      _students = await _firestoreService.getStudentsByBus(busId);

      // Charger le statut d'attendance pour chaque élève
      for (int i = 0; i < _students.length; i++) {
        final status =
            await _attendanceService.getStudentTodayStatus(_students[i].id);
        _students[i] = _students[i].copyWith(todayStatus: status);
      }

      // Charger le bus
      _bus = await _firestoreService.getBus(busId);

      // Compter les élèves à bord
      await _updateStudentsOnBoardCount(busId);

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Erreur lors du chargement des élèves: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Enregistrer la montée d'un élève
  Future<bool> boardStudent(
    String studentId,
    String busId,
    String driverId,
  ) async {
    try {
      final position = await _gpsService.getCurrentPosition();

      await _attendanceService.boardStudent(
        studentId: studentId,
        busId: busId,
        driverId: driverId,
        location: position,
      );

      // Mettre à jour le statut local
      final index = _students.indexWhere((s) => s.id == studentId);
      if (index != -1) {
        _students[index] =
            _students[index].copyWith(todayStatus: AttendanceStatus.boarded);
      }

      await _updateStudentsOnBoardCount(busId);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Erreur montée: $e';
      notifyListeners();
      return false;
    }
  }

  /// Enregistrer la descente d'un élève
  Future<bool> exitStudent(
    String studentId,
    String busId,
    String driverId,
  ) async {
    try {
      final position = await _gpsService.getCurrentPosition();

      await _attendanceService.exitStudent(
        studentId: studentId,
        busId: busId,
        driverId: driverId,
        location: position,
      );

      // Mettre à jour le statut local
      final index = _students.indexWhere((s) => s.id == studentId);
      if (index != -1) {
        _students[index] =
            _students[index].copyWith(todayStatus: AttendanceStatus.completed);
      }

      await _updateStudentsOnBoardCount(busId);
      notifyListeners();
      return true;
    } catch (e) {
      _error = 'Erreur descente: $e';
      notifyListeners();
      return false;
    }
  }

  /// Mettre à jour le nombre d'élèves à bord
  Future<void> _updateStudentsOnBoardCount(String busId) async {
    try {
      _studentsOnBoardCount = await _attendanceService.countStudentsOnBus(busId);
    } catch (e) {
      print('Erreur comptage élèves: $e');
    }
  }

  /// Démarrer le suivi GPS
  Future<void> startGPSTracking(String busId, String driverId) async {
    try {
      await _gpsService.startTracking(
        busId: busId,
        driverId: driverId,
        intervalSeconds: 5,
      );

      // Mettre le bus en route
      if (_bus != null) {
        await _firestoreService.updateBusStatus(busId, BusStatus.enRoute);
        _bus = _bus!.copyWith(status: BusStatus.enRoute);
      }

      notifyListeners();
    } catch (e) {
      _error = 'Erreur démarrage GPS: $e';
      notifyListeners();
    }
  }

  /// Arrêter le suivi GPS
  Future<void> stopGPSTracking(String busId) async {
    await _gpsService.stopTracking(busId);

    // Mettre le bus hors service
    if (_bus != null) {
      await _firestoreService.updateBusStatus(busId, BusStatus.horsService);
      _bus = _bus!.copyWith(status: BusStatus.horsService);
    }

    notifyListeners();
  }

  /// Rafraîchir les données
  Future<void> refresh(String busId) async {
    await loadStudents(busId);
  }

  /// Effacer l'erreur
  void clearError() {
    _error = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _gpsService.dispose();
    super.dispose();
  }
}
