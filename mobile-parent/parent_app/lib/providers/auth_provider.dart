import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:firebase_auth/firebase_auth.dart';
import '../services/firebase_service.dart';
import '../services/driver_service.dart';
import '../services/notification_service.dart';
import '../services/gps_queue_manager.dart';

/// Provider pour gérer l'authentification
class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;
  String? _error;
  Map<String, dynamic>? _userProfile; // Profil utilisateur depuis Firestore

  User? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get isAuthenticated => _user != null;
  Map<String, dynamic>? get userProfile => _userProfile;
  
  /// Rôle de l'utilisateur ('driver', 'parent', 'admin', etc.)
  String? get userRole => _userProfile?['role'] as String?;
  
  /// Vérifie si l'utilisateur est un chauffeur
  bool get isDriver => userRole == 'driver';
  
  /// Vérifie si l'utilisateur est un parent
  bool get isParent => userRole == 'parent';

  AuthProvider() {
    // Restaurer immédiatement la session Firebase si un utilisateur existe déjà
    _restoreAuthState();

    // Écouter les changements d'état d'authentification
    FirebaseService.auth.authStateChanges().listen((User? user) async {
      _user = user;
      if (user != null) {
        // Récupérer le profil utilisateur depuis Firestore
        await _loadUserProfile(user.uid);
      } else {
        _userProfile = null;
      }
      notifyListeners();
    });
  }

  /// Restaure l'utilisateur Firebase courant (session persistée)
  Future<void> _restoreAuthState() async {
    final currentUser = FirebaseService.auth.currentUser;
    if (currentUser != null) {
      _user = currentUser;
      await _loadUserProfile(currentUser.uid);
      notifyListeners();
    }
  }

  /// Charge le profil utilisateur depuis Firestore
  Future<void> _loadUserProfile(String userId) async {
    try {
      _userProfile = await DriverService.getUserProfile(userId);
    } catch (e) {
      debugPrint('⚠️ Erreur lors du chargement du profil: $e');
      _userProfile = null;
    }
  }

  /// Connexion
  Future<bool> signIn(String email, String password) async {
    try {
      _isLoading = true;
      _error = null;
      notifyListeners();

      _user = await FirebaseService.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      // Charger le profil utilisateur depuis Firestore
      if (_user != null) {
        await _loadUserProfile(_user!.uid);

        // Enregistrer le token FCM pour les notifications push
        await NotificationService().registerFCMToken(_user!.uid);
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      _userProfile = null;
      notifyListeners();
      return false;
    }
  }

  /// Déconnexion
  Future<void> signOut() async {
    // Supprimer le token FCM avant de se déconnecter
    await NotificationService().unregisterFCMToken();
    await GpsQueueManager.instance.clearAll();

    await FirebaseService.signOut();
    _user = null;
    _userProfile = null;
    notifyListeners();
  }

  /// Effacer l'erreur
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
