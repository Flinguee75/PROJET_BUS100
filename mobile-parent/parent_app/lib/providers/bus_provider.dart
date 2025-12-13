import 'package:flutter/foundation.dart';
import '../models/bus.dart';
import '../models/enfant.dart';
import '../services/bus_service.dart';
import '../services/enfant_service.dart';

/// Provider pour gérer les données des bus
class BusProvider with ChangeNotifier {
  final BusService _busService = BusService();
  final EnfantService _enfantService = EnfantService();

  List<Enfant> _enfants = [];
  final Map<String, Bus> _buses = {};
  bool _isLoading = false;
  String? _error;

  List<Enfant> get enfants => _enfants;
  Map<String, Bus> get buses => _buses;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Charger les enfants du parent
  Future<void> loadEnfants(String parentId) async {
    try {
      _isLoading = true;
      notifyListeners();

      _enfants = await _enfantService.getEnfantsByParentId(parentId);
      
      // Charger les bus associés
      for (final enfant in _enfants) {
        final bus = await _busService.getBusById(enfant.busId);
        if (bus != null) {
          _buses[enfant.busId] = bus;
        }
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Erreur lors du chargement des données: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Obtenir le bus d'un enfant
  Bus? getBusForEnfant(Enfant enfant) {
    return _buses[enfant.busId];
  }

  /// Écouter les mises à jour GPS d'un bus
  Stream<Bus?> watchBusPosition(String busId) {
    return _busService.watchBusPosition(busId);
  }

  /// Effacer l'erreur
  void clearError() {
    _error = null;
    notifyListeners();
  }
}

