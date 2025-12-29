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
  Enfant? _selectedEnfant; // Enfant actuellement sélectionné pour le suivi

  List<Enfant> get enfants => _enfants;
  Map<String, Bus> get buses => _buses;
  bool get isLoading => _isLoading;
  String? get error => _error;
  Enfant? get selectedEnfant => _selectedEnfant;

  /// Bus de l'enfant sélectionné (raccourci pratique)
  Bus? get selectedBus => _selectedEnfant != null ? _buses[_selectedEnfant!.busId] : null;

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

      // Sélectionner automatiquement le premier enfant s'il y en a
      if (_enfants.isNotEmpty && _selectedEnfant == null) {
        _selectedEnfant = _enfants.first;
      }

      _isLoading = false;
      notifyListeners();
    } catch (e) {
      _error = 'Erreur lors du chargement des données: $e';
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Sélectionner un enfant pour le suivi
  void selectEnfant(Enfant enfant) {
    if (_selectedEnfant?.id != enfant.id) {
      _selectedEnfant = enfant;
      notifyListeners();
    }
  }

  /// Stream pour suivre le bus de l'enfant sélectionné
  Stream<Bus?> watchSelectedBus() {
    if (_selectedEnfant == null) {
      return Stream.value(null);
    }
    return watchBusPosition(_selectedEnfant!.busId);
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

