import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../models/driver.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  final AuthService _authService = AuthService();

  Driver? _driver;
  bool _isLoading = false;
  String? _error;

  Driver? get driver => _driver;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _driver != null;

  AuthProvider() {
    _init();
  }

  /// Initialisation - écouter les changements d'auth
  void _init() {
    _authService.authStateChanges.listen((User? user) {
      if (user == null) {
        _driver = null;
        notifyListeners();
      } else {
        _loadCurrentDriver();
      }
    });
  }

  /// Charger le profil du chauffeur actuel
  Future<void> _loadCurrentDriver() async {
    try {
      _driver = await _authService.getCurrentDriver();
      notifyListeners();
    } catch (e) {
      print('Erreur chargement chauffeur: $e');
    }
  }

  /// Connexion
  Future<bool> signIn(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      _driver = await _authService.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Déconnexion
  Future<void> signOut() async {
    await _authService.signOut();
    _driver = null;
    _error = null;
    notifyListeners();
  }

  /// Effacer l'erreur
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
