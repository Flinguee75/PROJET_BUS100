import 'package:firebase_auth/firebase_auth.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/driver.dart';

class AuthService {
  final FirebaseAuth _auth = FirebaseAuth.instance;
  final FirebaseFirestore _firestore = FirebaseFirestore.instance;

  // Stream d'authentification
  Stream<User?> get authStateChanges => _auth.authStateChanges();

  // Utilisateur actuel
  User? get currentUser => _auth.currentUser;

  /// Connexion avec email et mot de passe
  Future<Driver?> signInWithEmailAndPassword({
    required String email,
    required String password,
  }) async {
    try {
      final credential = await _auth.signInWithEmailAndPassword(
        email: email,
        password: password,
      );

      if (credential.user == null) {
        throw Exception('Échec de la connexion');
      }

      // Récupérer les données du chauffeur depuis Firestore
      final driverDoc = await _firestore
          .collection('users')
          .doc(credential.user!.uid)
          .get();

      if (!driverDoc.exists) {
        throw Exception('Profil chauffeur non trouvé');
      }

      final driverData = driverDoc.data()!;

      // Vérifier que c'est bien un chauffeur
      if (driverData['role'] != 'driver') {
        await _auth.signOut();
        throw Exception('Ce compte n\'est pas un compte chauffeur');
      }

      return Driver.fromJson({
        'id': credential.user!.uid,
        ...driverData,
      });
    } on FirebaseAuthException catch (e) {
      throw _handleAuthException(e);
    }
  }

  /// Déconnexion
  Future<void> signOut() async {
    await _auth.signOut();
  }

  /// Récupérer le profil chauffeur actuel
  Future<Driver?> getCurrentDriver() async {
    final user = currentUser;
    if (user == null) return null;

    try {
      final driverDoc = await _firestore.collection('users').doc(user.uid).get();

      if (!driverDoc.exists) return null;

      final driverData = driverDoc.data()!;
      if (driverData['role'] != 'driver') return null;

      return Driver.fromJson({
        'id': user.uid,
        ...driverData,
      });
    } catch (e) {
      print('Erreur lors de la récupération du profil: $e');
      return null;
    }
  }

  /// Gérer les exceptions Firebase Auth
  String _handleAuthException(FirebaseAuthException e) {
    switch (e.code) {
      case 'user-not-found':
        return 'Aucun utilisateur trouvé avec cet email';
      case 'wrong-password':
        return 'Mot de passe incorrect';
      case 'invalid-email':
        return 'Format d\'email invalide';
      case 'user-disabled':
        return 'Ce compte a été désactivé';
      case 'too-many-requests':
        return 'Trop de tentatives. Veuillez réessayer plus tard';
      case 'network-request-failed':
        return 'Erreur réseau. Vérifiez votre connexion internet';
      default:
        return 'Erreur d\'authentification: ${e.message}';
    }
  }
}
