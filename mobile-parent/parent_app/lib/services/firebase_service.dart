import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';

/// Service Firebase pour initialiser et accéder aux services Firebase
class FirebaseService {
  static FirebaseAuth get auth => FirebaseAuth.instance;
  static FirebaseFirestore get firestore => FirebaseFirestore.instance;

  /// Initialiser Firebase
  static Future<void> initialize() async {
    await Firebase.initializeApp();
    
    // Utiliser les émulateurs en développement (optionnel)
    const useEmulators = bool.fromEnvironment('USE_EMULATORS', defaultValue: false);
    
    if (useEmulators) {
      await _connectToEmulators();
    }
  }

  /// Connecter aux émulateurs Firebase (développement local)
  static Future<void> _connectToEmulators() async {
    try {
      await FirebaseAuth.instance.useAuthEmulator('localhost', 9099);
      FirebaseFirestore.instance.useFirestoreEmulator('localhost', 8080);
      print('✅ Connecté aux émulateurs Firebase');
    } catch (e) {
      print('⚠️ Erreur connexion émulateurs: $e');
    }
  }

  /// Connexion avec email et mot de passe
  static Future<User?> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      final userCredential = await auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );
      return userCredential.user;
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  /// Déconnexion
  static Future<void> signOut() async {
    await auth.signOut();
  }

  /// Gérer les erreurs d'authentification
  static String _handleAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'Aucun utilisateur trouvé avec cet email';
      case 'wrong-password':
        return 'Mot de passe incorrect';
      case 'invalid-email':
        return 'Email invalide';
      case 'user-disabled':
        return 'Ce compte a été désactivé';
      case 'too-many-requests':
        return 'Trop de tentatives. Réessayez plus tard';
      default:
        return 'Erreur: ${e.message}';
    }
  }
}

