import 'dart:async';

import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../models/driver.dart';
import '../models/trip_type.dart';
import '../providers/auth_provider.dart';
import '../services/attendance_service.dart';
import '../services/background_gps_service.dart';
import '../services/course_history_service.dart';
import '../services/driver_service.dart';
import '../services/firebase_service.dart';
import '../services/gps_service.dart';
import '../services/student_service.dart';
import '../services/trip_state_service.dart';
import '../services/school_service.dart';
import '../models/trip_state.dart';
import '../utils/app_colors.dart';
import 'login_screen.dart';

/// Écran d'accueil pour les chauffeurs
/// Permet de sélectionner un type de course, lancer/arrêter la course,
/// et confirmer la présence des élèves en temps réel
class DriverHomeScreen extends StatefulWidget {
  const DriverHomeScreen({super.key});

  @override
  State<DriverHomeScreen> createState() => _DriverHomeScreenState();
}

class _DriverHomeScreenState extends State<DriverHomeScreen> {
  Driver? _driver;
  bool _isLoading = true;
  bool _isTripActive = false;
  Position? _currentPosition;
  String? _error;
  List<Student> _students = [];
  bool _isLoadingStudents = false;
  String? _currentCourseHistoryId;
  Map<String, dynamic>? _busMetadata;
  Map<String, double>? _schoolLocation;
  int? _currentTripStartTimestamp;

  // Nouveaux états pour le type de trajet et les scans
  TripType? _selectedTripType;
  Map<String, bool> _scannedStudents = {}; // studentId -> isScanned
  bool _isTripActionLoading = false;

  @override
  void initState() {
    super.initState();
    _loadDriverProfile();
    _checkForResumableTrip(); // Vérifier si un trajet était actif
  }

  @override
  void dispose() {
    // Plus de Timer GPS - géré par BackgroundGpsService
    super.dispose();
  }

  /// Charge le profil du chauffeur
  Future<void> _loadDriverProfile() async {
    final authProvider = context.read<AuthProvider>();
    final userId = authProvider.user?.uid;

    if (userId == null) {
      setState(() {
        _error = 'Utilisateur non connecté';
        _isLoading = false;
      });
      return;
    }

    try {
      final driver = await DriverService.getDriverProfile(userId);
      Map<String, dynamic>? busData;
      if (driver?.hasAssignedBus ?? false) {
        busData = await _fetchBusMetadata(driver!.busId!);
      }

      Map<String, dynamic>? schoolData;
      if (driver?.schoolId != null) {
        schoolData = await SchoolService.getSchoolById(driver!.schoolId!);
      }

      if (!mounted) return;
      setState(() {
        _driver = driver;
        _busMetadata = busData;
        if (schoolData != null && schoolData['location'] != null) {
          final location = schoolData['location'];
          if (location is Map<String, dynamic>) {
            final lat = location['lat'];
            final lng = location['lng'];
            if (lat is num && lng is num) {
              _schoolLocation = {
                'lat': lat.toDouble(),
                'lng': lng.toDouble(),
              };
            }
          }
        }
        _isLoading = false;
        if (driver == null) {
          _error = 'Profil chauffeur introuvable';
        } else if (!driver.hasAssignedBus) {
          _error = 'Aucun bus assigné';
        }
      });
    } catch (e) {
      setState(() {
        _error = 'Erreur: $e';
        _isLoading = false;
      });
    }
  }

  Future<Map<String, dynamic>?> _fetchBusMetadata(String busId) async {
    try {
      final doc = await FirebaseService.firestore.collection('buses').doc(busId).get();
      if (!doc.exists) return null;
      final data = doc.data();
      if (data == null) return null;
      return {
        'id': doc.id,
        'busNumber': data['busNumber'],
        'plateNumber': data['plateNumber'],
        'assignedCommune': data['assignedCommune'],
        'assignedQuartiers': data['assignedQuartiers'],
        'routeId': data['routeId'],
        'routeName': data['routeName'],
        'capacity': data['capacity'],
      };
    } catch (e) {
      debugPrint('❌ Erreur chargement infos bus: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> _ensureBusMetadata() async {
    final busId = _driver?.busId;
    if (busId == null) return null;
    if (_busMetadata != null) return _busMetadata;
    final data = await _fetchBusMetadata(busId);
    if (!mounted) {
      _busMetadata = data;
      return data;
    }
    setState(() {
      _busMetadata = data;
    });
    return data;
  }

  /// Charge la liste des élèves assignés au bus, filtrés par type de trajet
  Future<void> _loadStudents() async {
    if (_driver?.busId == null || _selectedTripType == null) return;

    setState(() {
      _isLoadingStudents = true;
    });

    try {
      // Charger les élèves filtrés par type de trajet
      final students = await StudentService.getStudentsByBusIdAndTripType(
        _driver!.busId!,
        _selectedTripType!.firestoreValue,
      );

      // Charger les statuts d'attendance existants
      final attendanceStatus = await AttendanceService.getAttendanceStatusForBus(
        busId: _driver!.busId!,
        tripType: _selectedTripType!.firestoreValue,
        tripStartTime: _currentTripStartTimestamp,
      );

      setState(() {
        _students = students;
        _scannedStudents = attendanceStatus;
        _isLoadingStudents = false;
      });
    } catch (e) {
      debugPrint('❌ Erreur chargement élèves: $e');
      setState(() {
        _isLoadingStudents = false;
      });
    }
  }

  /// Vérifie si un trajet était actif et propose de le reprendre
  Future<void> _checkForResumableTrip() async {
    // Attendre que le profil du chauffeur soit chargé
    await Future.delayed(const Duration(milliseconds: 500));

    // Charger l'état persisté
    final savedState = await TripStateService.loadTripState();

    if (savedState == null) return; // Pas de trajet à restaurer

    // Afficher dialog de confirmation
    if (!mounted) return;

    final shouldResume = await showDialog<bool>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('Trajet en cours détecté'),
        content: Text(
          'Un trajet "${savedState.tripType.label}" était actif.\n\n'
          'Voulez-vous le reprendre ?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Non, annuler'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
            ),
            child: const Text('Oui, reprendre'),
          ),
        ],
      ),
    );

    if (shouldResume == true) {
      await _resumeTrip(savedState);
    } else {
      // L'utilisateur refuse, nettoyer l'état
      await TripStateService.clearTripState();
      await BackgroundGpsService.instance.stopTracking();
    }
  }

  /// Restaure un trajet à partir de l'état sauvegardé
  Future<void> _resumeTrip(TripState savedState) async {
    try {
      debugPrint('🔄 Restauration du trajet: ${savedState.toString()}');

      // Restaurer l'état
      setState(() {
        _isTripActive = true;
        _selectedTripType = savedState.tripType;
        _currentCourseHistoryId = savedState.courseHistoryId;
        _scannedStudents = savedState.scannedStudents;
        _currentPosition = savedState.currentPosition;
        _busMetadata = savedState.busMetadata;
        _currentTripStartTimestamp = savedState.tripStartTimestamp;
      });

      // Recharger la liste des élèves
      await _loadStudents();

      // Redémarrer le service GPS en arrière-plan
      final success = await BackgroundGpsService.instance.startTracking(
        busId: savedState.busId,
        driverId: savedState.driverId,
        tripType: savedState.tripType,
        routeId: savedState.busMetadata?['routeId'] as String?,
      );

      if (!success) {
        _showError('Impossible de redémarrer le tracking GPS');
        await TripStateService.clearTripState();
        setState(() {
          _isTripActive = false;
        });
        return;
      }

      debugPrint('✅ Trajet restauré avec succès: ${savedState.tripType.label}');

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Trajet "${savedState.tripType.label}" repris avec succès'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (e) {
      debugPrint('❌ Erreur lors de la restauration du trajet: $e');
      _showError('Erreur lors de la restauration du trajet');
      await TripStateService.clearTripState();
    }
  }

  /// Lance une course
  Future<void> _startTrip() async {
    debugPrint('🚀 Tentative de lancement de la course');

    if (_isTripActionLoading) return;

    // Vérifier qu'un type de trajet est sélectionné
    if (_selectedTripType == null) {
      _showError('Veuillez sélectionner un type de course');
      return;
    }

    _setTripActionLoading(true);

    try {
      if (_driver == null || !_driver!.hasAssignedBus) {
        debugPrint('❌ Lancement impossible: chauffeur sans bus assigné');
        _showError('Aucun bus assigné');
        return;
      }

      // Vérifier les permissions de localisation
      final permissionStatus = await GPSService.checkLocationPermissionStatus();
      if (permissionStatus != LocationPermissionStatus.granted) {
        debugPrint('❌ Permissions de localisation non accordées: $permissionStatus');
        await _showLocationPermissionDialog(permissionStatus);
        return;
      }

      final tripStartTimestamp = DateTime.now().millisecondsSinceEpoch;

      setState(() {
        _isTripActive = true;
        _error = null;
        _scannedStudents = {}; // Réinitialiser les scans
        _currentTripStartTimestamp = tripStartTimestamp;
      });
      debugPrint('✅ Course démarrée pour le bus ${_driver?.busId} - Type: ${_selectedTripType?.firestoreValue}');

      final tripValue = _selectedTripType!.firestoreValue;
      await _updateLiveStatus('en_route', extraData: {
        'tripType': tripValue,
        'tripLabel': _selectedTripType!.label,
        'tripStartTime': FieldValue.serverTimestamp(),
      });
      final busInfo = await _ensureBusMetadata();
      final historyId = await CourseHistoryService.startCourse(
        busId: _driver!.busId!,
        driverId: _driver!.id,
        routeId: busInfo?['routeId'] as String?,
        tripType: tripValue,
        tripLabel: _selectedTripType!.label,
        busInfo: busInfo,
        driverInfo: {
          'id': _driver!.id,
          'name': _driver!.displayName,
          'phoneNumber': _driver!.phoneNumber,
          'email': _driver!.email,
        },
        schoolId: _driver!.schoolId,
      );
      _currentCourseHistoryId = historyId;

      // Charger la liste des élèves filtrés
      await AttendanceService.resetAttendanceForTrip(
        busId: _driver!.busId!,
        tripType: tripValue,
      );
      await _loadStudents();

      // Démarrer le service GPS en arrière-plan
      final success = await BackgroundGpsService.instance.startTracking(
        busId: _driver!.busId!,
        driverId: _driver!.id,
        tripType: _selectedTripType!,
        routeId: _busMetadata?['routeId'] as String?,
      );

      if (!success) {
        debugPrint('❌ Échec démarrage service GPS background');
        _showError('Impossible de démarrer le tracking GPS');
      } else {
        debugPrint('✅ Service GPS background démarré');

        // Sauvegarder l'état du trajet pour récupération après crash
        await TripStateService.saveTripState(
          busId: _driver!.busId!,
          driverId: _driver!.id,
          tripType: _selectedTripType!,
          courseHistoryId: _currentCourseHistoryId!,
          scannedStudents: _scannedStudents,
          tripStartTimestamp: tripStartTimestamp,
          currentPosition: _currentPosition,
          busMetadata: _busMetadata,
        );
      }
    } finally {
      _setTripActionLoading(false);
    }
  }

  /// Arrête la course
  Future<void> _stopTrip({bool completed = true}) async {
    if (_isTripActionLoading) return;

    _setTripActionLoading(true);

    try {
      // 1. Calcul des statistiques de la course
      final totalStudents = _students.length;
      final scannedIds = _scannedStudents.entries
          .where((entry) => entry.value)
          .map((entry) => entry.key)
          .toList();
      final missedIds = _students
          .where((student) => !(_scannedStudents[student.id] ?? false))
          .map((student) => student.id)
          .toList();

      final tripStartTimestamp = _currentTripStartTimestamp;

      setState(() {
        _isTripActive = false;
        _scannedStudents = {};
        _students = [];
        _currentTripStartTimestamp = null;
      });

      // 2. Arrêter le service GPS en arrière-plan
      await BackgroundGpsService.instance.stopTracking();
      debugPrint('✅ Service GPS background arrêté');

      // 3. Nettoyer l'état persisté du trajet
      await TripStateService.clearTripState();

      // 4. Mettre le bus en statut STOPPED et nettoyer les métadonnées
      if (_driver?.busId != null) {
        await FirebaseService.firestore
            .collection('gps_live')
            .doc(_driver!.busId!)
            .update({
          'status': 'stopped',
          'tripType': null,
          'tripLabel': null,
          'tripStartTime': null,
          'lastUpdate': FieldValue.serverTimestamp(),
        });
        debugPrint('✅ Bus mis en statut STOPPED');
      }

      // 5. Finaliser l'historique de course
      if (_currentCourseHistoryId != null) {
        await CourseHistoryService.endCourse(
          historyId: _currentCourseHistoryId!,
          status: completed ? 'completed' : 'stopped',
          totalStudents: totalStudents > 0 ? totalStudents : null,
          scannedCount: scannedIds.length,
          scannedStudentIds: scannedIds,
          missedStudentIds: missedIds,
        );
        _currentCourseHistoryId = null;
      }

      // 6. Réinitialiser l'attendance
      if (tripStartTimestamp != null && _driver?.busId != null && _selectedTripType != null) {
        await AttendanceService.resetAttendanceForTrip(
          busId: _driver!.busId!,
          tripType: _selectedTripType!.firestoreValue,
          tripStartTime: tripStartTimestamp,
        );
      }
    } finally {
      _setTripActionLoading(false);
    }
  }

  /// Toggle le scan d'un élève (présent/absent)
  Future<void> _toggleStudentScan(Student student) async {
    if (_driver == null || _selectedTripType == null) return;

    final tripStartTimestamp = _currentTripStartTimestamp;
    final isCurrentlyScanned = _scannedStudents[student.id] ?? false;

    if (tripStartTimestamp == null) {
      _showError('Course invalide, redémarrez la course.');
      return;
    }

    try {
      if (isCurrentlyScanned) {
        // Annuler le scan
        await AttendanceService.unscanStudent(
          studentId: student.id,
          busId: _driver!.busId!,
          tripType: _selectedTripType!.firestoreValue,
          driverId: _driver!.id,
          tripStartTime: tripStartTimestamp,
        );
      } else {
        // Scanner l'élève
        await AttendanceService.scanStudent(
          studentId: student.id,
          busId: _driver!.busId!,
          tripType: _selectedTripType!.firestoreValue,
          driverId: _driver!.id,
          tripStartTime: tripStartTimestamp,
          location: _currentPosition != null
              ? {
                  'lat': _currentPosition!.latitude,
                  'lng': _currentPosition!.longitude,
                }
              : null,
        );
      }

      // Mettre à jour l'état local
      setState(() {
        _scannedStudents[student.id] = !isCurrentlyScanned;
      });

      // Mettre à jour l'état persisté (si trajet actif)
      if (_isTripActive && _currentCourseHistoryId != null) {
        await TripStateService.saveTripState(
          busId: _driver!.busId!,
          driverId: _driver!.id,
          tripType: _selectedTripType!,
          courseHistoryId: _currentCourseHistoryId!,
          scannedStudents: _scannedStudents,
          tripStartTimestamp: tripStartTimestamp,
          currentPosition: _currentPosition,
          busMetadata: _busMetadata,
        );
      }

      // Feedback visuel
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              isCurrentlyScanned
                  ? '${student.firstName} marqué comme absent'
                  : '${student.firstName} confirmé présent',
            ),
            duration: const Duration(seconds: 1),
            backgroundColor: isCurrentlyScanned ? Colors.orange : Colors.green,
          ),
        );
      }
    } catch (e) {
      debugPrint('❌ Erreur lors du scan: $e');
      _showError('Erreur lors de la confirmation');
    }
  }

  Future<void> _updateLiveStatus(String status,
      {Map<String, dynamic>? extraData, bool moveToParking = false}) async {
    final busId = _driver?.busId;
    if (busId == null) return;
    await GPSService.setBusStatus(
      busId: busId,
      status: status,
      driverId: _driver?.id,
      driverName: _driver?.displayName,
      driverPhone: _driver?.phoneNumber,
      routeId: _busMetadata?['routeId'] as String?,
      extraData: extraData,
      parkingLocation: moveToParking ? _schoolLocation : null,
    );
  }

  Future<void> _handleLogout() async {
    final authProvider = context.read<AuthProvider>();
    if (_isTripActive) {
      await _stopTrip(completed: false);
    }
    await authProvider.signOut();
    if (!mounted) return;
    Navigator.of(context).pushAndRemoveUntil(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
      (route) => false,
    );
  }

  // Méthode _startGPSTracking supprimée - remplacée par BackgroundGpsService

  void _setTripActionLoading(bool value) {
    if (!mounted) {
      _isTripActionLoading = value;
      return;
    }
    setState(() {
      _isTripActionLoading = value;
    });
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: AppColors.danger,
      ),
    );
  }

  Future<void> _showLocationPermissionDialog(LocationPermissionStatus status) async {
    if (!mounted) return;

    String message;
    String title = 'Permission localisation requise';
    String? settingsLabel;
    bool openLocationSettings = false;

    switch (status) {
      case LocationPermissionStatus.denied:
        message =
            'Cette application ne peut pas fonctionner sans GPS. Veuillez autoriser l\'accès à votre position dans les paramètres.';
        settingsLabel = 'Ouvrir les paramètres';
        break;
      case LocationPermissionStatus.deniedForever:
        message =
            'Vous avez refusé définitivement l\'accès à la localisation. Activez la permission dans les paramètres de l\'application pour démarrer une course.';
        settingsLabel = 'Ouvrir les paramètres';
        break;
      case LocationPermissionStatus.serviceDisabled:
        message =
            'Le service de localisation du téléphone est désactivé. Activez le GPS pour pouvoir lancer la course.';
        settingsLabel = 'Activer le GPS';
        openLocationSettings = true;
        break;
      case LocationPermissionStatus.granted:
        return;
    }

    final result = await showDialog<String>(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text(title),
        content: Text(message),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Fermer'),
          ),
          if (settingsLabel != null)
            ElevatedButton(
              onPressed: () => Navigator.pop(context, 'settings'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
              ),
              child: Text(settingsLabel),
            ),
        ],
      ),
    );

    if (result == 'settings') {
      if (openLocationSettings) {
        await Geolocator.openLocationSettings();
      } else {
        await Geolocator.openAppSettings();
      }
    }
  }

  /// Compte le nombre d'élèves scannés
  int get _scannedCount =>
      _scannedStudents.values.where((scanned) => scanned).length;

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return Scaffold(
        backgroundColor: AppColors.background,
        body: const Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    if (_error != null && _driver == null) {
      return Scaffold(
        backgroundColor: AppColors.background,
        appBar: AppBar(
          title: const Text('Erreur'),
        ),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(
                Icons.error_outline,
                size: 64,
                color: AppColors.danger,
              ),
              const SizedBox(height: 16),
              Text(
                _error!,
                style: const TextStyle(
                  fontSize: 16,
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              ElevatedButton(
                onPressed: _handleLogout,
                child: const Text('Se déconnecter'),
              ),
            ],
          ),
        ),
      );
    }

    final canInteractWithTripAction =
        !_isTripActionLoading && (_isTripActive || _selectedTripType != null);

    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        title: const Text('Espace Chauffeur'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Carte de bienvenue
              Card(
                color: AppColors.primary,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    children: [
                      const Icon(
                        Icons.person,
                        size: 64,
                        color: Colors.white,
                      ),
                      const SizedBox(height: 12),
                      Text(
                        _driver?.displayName ?? 'Chauffeur',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        _driver?.email ?? '',
                        style: const TextStyle(
                          fontSize: 14,
                          color: Colors.white70,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Informations du bus
              if (_driver?.hasAssignedBus ?? false) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Bus Assigné',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'ID: ${_driver!.busId}',
                          style: const TextStyle(
                            fontSize: 16,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        if (_driver!.schoolId != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'École: ${_driver!.schoolId}',
                            style: const TextStyle(
                              fontSize: 14,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Sélecteur de type de course (affiché seulement si course inactive)
              if (!_isTripActive) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Row(
                          children: [
                            Icon(Icons.route, color: AppColors.primary),
                            SizedBox(width: 8),
                            Text(
                              'Type de course',
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        ...TripType.values.map((tripType) => _buildTripTypeOption(tripType)),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Position actuelle
              if (_currentPosition != null) ...[
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Position Actuelle',
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Lat: ${_currentPosition!.latitude.toStringAsFixed(6)}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          'Lng: ${_currentPosition!.longitude.toStringAsFixed(6)}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                        Text(
                          'Vitesse: ${(_currentPosition!.speed * 3.6).toStringAsFixed(1)} km/h',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),
              ],

              // Bouton Lancer/Arrêter la course
              ElevatedButton(
                onPressed: canInteractWithTripAction
                    ? () async {
                        if (_isTripActive) {
                          await _stopTrip();
                        } else {
                          await _startTrip();
                        }
                      }
                    : null,
                style: ElevatedButton.styleFrom(
                  backgroundColor:
                      _isTripActive ? AppColors.danger : AppColors.primary,
                  foregroundColor: Colors.white,
                  disabledBackgroundColor: Colors.grey.shade300,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isTripActionLoading
                    ? const SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(
                            _isTripActive ? Icons.stop : Icons.play_arrow,
                            size: 24,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _isTripActive
                                ? 'Arrêter la course'
                                : _selectedTripType != null
                                    ? 'Lancer: ${_selectedTripType!.shortLabel}'
                                    : 'Sélectionnez un type de course',
                            style: const TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
              ),

              if (_isTripActive) ...[
                const SizedBox(height: 16),
                Card(
                  color: Colors.green,
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      children: [
                        const Icon(Icons.check_circle, color: Colors.white),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Course en cours - GPS actif',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (_selectedTripType != null)
                                Text(
                                  _selectedTripType!.label,
                                  style: const TextStyle(
                                    color: Colors.white70,
                                    fontSize: 12,
                                  ),
                                ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],

              // Liste des élèves (affichée uniquement quand la course est active)
              if (_isTripActive) ...[
                const SizedBox(height: 24),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.people, color: AppColors.primary),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _selectedTripType?.actionDescription ?? 'Élèves',
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            // Compteur de progression
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: _scannedCount == _students.length && _students.isNotEmpty
                                    ? Colors.green.withValues(alpha: 0.2)
                                    : AppColors.primary.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(
                                '$_scannedCount/${_students.length}',
                                style: TextStyle(
                                  fontWeight: FontWeight.bold,
                                  color: _scannedCount == _students.length && _students.isNotEmpty
                                      ? Colors.green
                                      : AppColors.primary,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Appuyez sur un élève pour confirmer sa présence',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey.shade600,
                          ),
                        ),
                        const SizedBox(height: 12),
                        if (_isLoadingStudents)
                          const Center(
                            child: Padding(
                              padding: EdgeInsets.all(20),
                              child: CircularProgressIndicator(),
                            ),
                          )
                        else if (_students.isEmpty)
                          Center(
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                children: [
                                  Icon(
                                    Icons.info_outline,
                                    size: 48,
                                    color: Colors.grey.shade400,
                                  ),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Aucun élève pour ce trajet',
                                    style: TextStyle(
                                      color: Colors.grey.shade600,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          )
                        else
                          ...(_students.map((student) => _buildStudentTile(student))),
                      ],
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  /// Construit une option de type de trajet
  Widget _buildTripTypeOption(TripType tripType) {
    final isSelected = _selectedTripType == tripType;

    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedTripType = tripType;
          });
        },
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isSelected
                ? tripType.color.withValues(alpha: 0.2)
                : Colors.grey.shade100,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected ? tripType.color : Colors.transparent,
              width: 2,
            ),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: isSelected
                      ? tripType.color.withValues(alpha: 0.3)
                      : Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(
                  tripType.icon,
                  color: isSelected ? tripType.color : Colors.grey.shade600,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      tripType.shortLabel,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: isSelected ? tripType.color : Colors.black87,
                      ),
                    ),
                    Text(
                      tripType.actionDescription,
                      style: TextStyle(
                        fontSize: 12,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),
              if (isSelected)
                Icon(
                  Icons.check_circle,
                  color: tripType.color,
                ),
            ],
          ),
        ),
      ),
    );
  }

  /// Construit une tuile d'élève avec possibilité de toggle scan
  Widget _buildStudentTile(Student student) {
    final isScanned = _scannedStudents[student.id] ?? false;

    return InkWell(
      onTap: () => _toggleStudentScan(student),
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
        decoration: BoxDecoration(
          color: isScanned
              ? Colors.green.withValues(alpha: 0.1)
              : Colors.grey.shade50,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isScanned ? Colors.green.withValues(alpha: 0.3) : Colors.grey.shade200,
          ),
        ),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              backgroundColor:
                  isScanned ? Colors.green.withValues(alpha: 0.2) : AppColors.primary.withValues(alpha: 0.2),
              child: Text(
                student.firstName.isNotEmpty
                    ? student.firstName[0].toUpperCase()
                    : '?',
                style: TextStyle(
                  color: isScanned ? Colors.green : AppColors.primary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Infos élève
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    student.fullName,
                    style: TextStyle(
                      fontWeight: FontWeight.w600,
                      color: isScanned ? Colors.green.shade800 : Colors.black87,
                    ),
                  ),
                  Text(
                    '${student.grade}${student.quartier != null ? " • ${student.quartier}" : ""}',
                    style: TextStyle(
                      fontSize: 12,
                      color: Colors.grey.shade600,
                    ),
                  ),
                ],
              ),
            ),
            // Icône de statut
            AnimatedContainer(
              duration: const Duration(milliseconds: 200),
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: isScanned ? Colors.green : Colors.grey.shade300,
                shape: BoxShape.circle,
              ),
              child: Icon(
                isScanned ? Icons.check : Icons.person_outline,
                color: Colors.white,
                size: 20,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
