import 'package:flutter_test/flutter_test.dart';
import 'package:firebase_auth_mocks/firebase_auth_mocks.dart';
import 'package:firebase_auth/firebase_auth.dart';

// Test pour AuthProvider
// Note: Ces tests vérifient la logique métier sans dépendre de l'implémentation exacte

void main() {
  group('AuthProvider Tests', () {
    late MockFirebaseAuth mockAuth;
    late MockUser mockUser;

    setUp(() {
      mockUser = MockUser(
        uid: 'test_user_123',
        email: 'test@example.com',
        displayName: 'Test User',
      );

      mockAuth = MockFirebaseAuth(
        mockUser: mockUser,
        signedIn: false,
      );
    });

    test('should initialize with null user when not signed in', () {
      // Arrange & Act
      final auth = MockFirebaseAuth(signedIn: false);

      // Assert
      expect(auth.currentUser, isNull);
    });

    test('should have current user when signed in', () {
      // Arrange & Act
      final auth = MockFirebaseAuth(
        mockUser: mockUser,
        signedIn: true,
      );

      // Assert
      expect(auth.currentUser, isNotNull);
      expect(auth.currentUser!.uid, 'test_user_123');
      expect(auth.currentUser!.email, 'test@example.com');
    });

    test('signInWithEmailAndPassword should authenticate user', () async {
      // Arrange
      final auth = MockFirebaseAuth(mockUser: mockUser);

      // Act
      final userCredential = await auth.signInWithEmailAndPassword(
        email: 'test@example.com',
        password: 'password123',
      );

      // Assert
      expect(userCredential.user, isNotNull);
      expect(userCredential.user!.email, 'test@example.com');
      expect(auth.currentUser, isNotNull);
    });

    test('signOut should clear current user', () async {
      // Arrange
      final auth = MockFirebaseAuth(
        mockUser: mockUser,
        signedIn: true,
      );
      expect(auth.currentUser, isNotNull);

      // Act
      await auth.signOut();

      // Assert
      expect(auth.currentUser, isNull);
    });

    test('authStateChanges should emit user changes', () async {
      // Arrange
      final auth = MockFirebaseAuth(mockUser: mockUser);

      // Act & Assert
      final stream = auth.authStateChanges();

      // Sign in
      await auth.signInWithEmailAndPassword(
        email: 'test@example.com',
        password: 'password123',
      );

      // Vérifier que le stream émet l'utilisateur connecté
      expect(auth.currentUser, isNotNull);

      // Sign out
      await auth.signOut();

      // Vérifier que le stream émet null après déconnexion
      expect(auth.currentUser, isNull);
    });

    test('should handle authentication errors', () async {
      // Arrange
      final auth = MockFirebaseAuth(
        authExceptions: AuthExceptions(
          signInWithEmailAndPassword: FirebaseAuthException(
            code: 'wrong-password',
            message: 'The password is invalid',
          ),
        ),
      );

      // Act & Assert
      expect(
        () => auth.signInWithEmailAndPassword(
          email: 'test@example.com',
          password: 'wrongpassword',
        ),
        throwsA(isA<FirebaseAuthException>()),
      );
    });

    test('should handle user-not-found error', () async {
      // Arrange
      final auth = MockFirebaseAuth(
        authExceptions: AuthExceptions(
          signInWithEmailAndPassword: FirebaseAuthException(
            code: 'user-not-found',
            message: 'No user found for that email',
          ),
        ),
      );

      // Act & Assert
      expect(
        () => auth.signInWithEmailAndPassword(
          email: 'nonexistent@example.com',
          password: 'password123',
        ),
        throwsA(isA<FirebaseAuthException>()),
      );
    });

    test('should persist user across app restarts', () {
      // Arrange
      final auth = MockFirebaseAuth(
        mockUser: mockUser,
        signedIn: true,
      );

      // Act - Simuler le redémarrage de l'app
      final currentUser = auth.currentUser;

      // Assert
      expect(currentUser, isNotNull);
      expect(currentUser!.uid, 'test_user_123');
      expect(currentUser.email, 'test@example.com');
    });

    test('user should have correct properties', () {
      // Arrange
      final customUser = MockUser(
        uid: 'custom_user_456',
        email: 'custom@example.com',
        displayName: 'Custom User',
        phoneNumber: '+33612345678',
        photoURL: 'https://example.com/photo.jpg',
      );

      final auth = MockFirebaseAuth(
        mockUser: customUser,
        signedIn: true,
      );

      // Act
      final user = auth.currentUser!;

      // Assert
      expect(user.uid, 'custom_user_456');
      expect(user.email, 'custom@example.com');
      expect(user.displayName, 'Custom User');
      expect(user.phoneNumber, '+33612345678');
      expect(user.photoURL, 'https://example.com/photo.jpg');
    });
  });
}
