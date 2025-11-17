import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/user_profile.dart';

void main() {
  group('UserProfile Model Tests', () {
    test('UserProfile.fromJson should correctly parse JSON data', () {
      // Arrange
      final json = {
        'uid': 'user_123',
        'email': 'parent@example.com',
        'displayName': 'Jean Dupont',
        'phoneNumber': '+33612345678',
        'photoURL': 'https://example.com/photo.jpg',
        'address': '123 Rue de la Paix, 75001 Paris',
        'emergencyContact': '+33687654321',
        'notificationsEnabled': true,
      };

      // Act
      final profile = UserProfile.fromJson(json);

      // Assert
      expect(profile.uid, 'user_123');
      expect(profile.email, 'parent@example.com');
      expect(profile.displayName, 'Jean Dupont');
      expect(profile.phoneNumber, '+33612345678');
      expect(profile.photoURL, 'https://example.com/photo.jpg');
      expect(profile.address, '123 Rue de la Paix, 75001 Paris');
      expect(profile.emergencyContact, '+33687654321');
      expect(profile.notificationsEnabled, true);
    });

    test('UserProfile.fromJson should handle null optional fields', () {
      // Arrange
      final json = {
        'uid': 'user_456',
        'email': 'parent2@example.com',
      };

      // Act
      final profile = UserProfile.fromJson(json);

      // Assert
      expect(profile.uid, 'user_456');
      expect(profile.email, 'parent2@example.com');
      expect(profile.displayName, isNull);
      expect(profile.phoneNumber, isNull);
      expect(profile.photoURL, isNull);
      expect(profile.address, isNull);
      expect(profile.emergencyContact, isNull);
      expect(profile.notificationsEnabled, true); // default value
    });

    test('UserProfile.toJson should correctly serialize to JSON', () {
      // Arrange
      final profile = UserProfile(
        uid: 'user_789',
        email: 'test@example.com',
        displayName: 'Marie Martin',
        phoneNumber: '+33698765432',
        photoURL: 'https://example.com/marie.jpg',
        address: '456 Avenue Victor Hugo, 69000 Lyon',
        emergencyContact: '+33676543210',
        notificationsEnabled: false,
      );

      // Act
      final json = profile.toJson();

      // Assert
      expect(json['uid'], 'user_789');
      expect(json['email'], 'test@example.com');
      expect(json['displayName'], 'Marie Martin');
      expect(json['phoneNumber'], '+33698765432');
      expect(json['photoURL'], 'https://example.com/marie.jpg');
      expect(json['address'], '456 Avenue Victor Hugo, 69000 Lyon');
      expect(json['emergencyContact'], '+33676543210');
      expect(json['notificationsEnabled'], false);
    });

    test('UserProfile.toJson should handle null fields', () {
      // Arrange
      final profile = UserProfile(
        uid: 'user_999',
        email: 'minimal@example.com',
      );

      // Act
      final json = profile.toJson();

      // Assert
      expect(json['uid'], 'user_999');
      expect(json['email'], 'minimal@example.com');
      expect(json['displayName'], isNull);
      expect(json['phoneNumber'], isNull);
      expect(json['photoURL'], isNull);
      expect(json['address'], isNull);
      expect(json['emergencyContact'], isNull);
      expect(json['notificationsEnabled'], true);
    });

    test('UserProfile.copyWith should create new instance with updated fields', () {
      // Arrange
      final original = UserProfile(
        uid: 'user_001',
        email: 'original@example.com',
        displayName: 'Original Name',
        phoneNumber: '+33611111111',
      );

      // Act
      final updated = original.copyWith(
        displayName: 'Updated Name',
        phoneNumber: '+33622222222',
      );

      // Assert
      expect(updated.uid, 'user_001'); // unchanged
      expect(updated.email, 'original@example.com'); // unchanged
      expect(updated.displayName, 'Updated Name'); // changed
      expect(updated.phoneNumber, '+33622222222'); // changed
    });

    test('UserProfile should validate email format', () {
      // Test with valid emails
      expect(UserProfile.isValidEmail('test@example.com'), true);
      expect(UserProfile.isValidEmail('user.name@domain.co.uk'), true);
      expect(UserProfile.isValidEmail('user+tag@example.com'), true);

      // Test with invalid emails
      expect(UserProfile.isValidEmail('invalid'), false);
      expect(UserProfile.isValidEmail('missing@domain'), false);
      expect(UserProfile.isValidEmail('@example.com'), false);
      expect(UserProfile.isValidEmail('user@'), false);
      expect(UserProfile.isValidEmail(''), false);
    });

    test('UserProfile should validate phone number format', () {
      // Test with valid French phone numbers
      expect(UserProfile.isValidPhoneNumber('+33612345678'), true);
      expect(UserProfile.isValidPhoneNumber('0612345678'), true);
      expect(UserProfile.isValidPhoneNumber('+33 6 12 34 56 78'), true);

      // Test with invalid phone numbers
      expect(UserProfile.isValidPhoneNumber('123'), false);
      expect(UserProfile.isValidPhoneNumber('abc'), false);
      expect(UserProfile.isValidPhoneNumber(''), false);
      expect(UserProfile.isValidPhoneNumber('+33 abc'), false);
    });

    test('UserProfile should have initials from displayName', () {
      // Arrange
      final profile1 = UserProfile(
        uid: 'user_1',
        email: 'test@example.com',
        displayName: 'Jean Dupont',
      );

      final profile2 = UserProfile(
        uid: 'user_2',
        email: 'test@example.com',
        displayName: 'Marie',
      );

      final profile3 = UserProfile(
        uid: 'user_3',
        email: 'test@example.com',
      );

      // Act & Assert
      expect(profile1.initials, 'JD');
      expect(profile2.initials, 'M');
      expect(profile3.initials, 'U'); // U for User (default)
    });
  });
}
