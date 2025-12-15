/// Modèle de données pour le profil utilisateur
class UserProfile {
  final String uid;
  final String email;
  final String? displayName;
  final String? phoneNumber;
  final String? photoURL;
  final String? address;
  final String? emergencyContact;
  final bool notificationsEnabled;

  UserProfile({
    required this.uid,
    required this.email,
    this.displayName,
    this.phoneNumber,
    this.photoURL,
    this.address,
    this.emergencyContact,
    this.notificationsEnabled = true,
  });

  factory UserProfile.fromJson(Map<String, dynamic> json) {
    return UserProfile(
      uid: json['uid'] as String,
      email: json['email'] as String,
      displayName: json['displayName'] as String?,
      phoneNumber: json['phoneNumber'] as String?,
      photoURL: json['photoURL'] as String?,
      address: json['address'] as String?,
      emergencyContact: json['emergencyContact'] as String?,
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'uid': uid,
      'email': email,
      'displayName': displayName,
      'phoneNumber': phoneNumber,
      'photoURL': photoURL,
      'address': address,
      'emergencyContact': emergencyContact,
      'notificationsEnabled': notificationsEnabled,
    };
  }

  UserProfile copyWith({
    String? uid,
    String? email,
    String? displayName,
    String? phoneNumber,
    String? photoURL,
    String? address,
    String? emergencyContact,
    bool? notificationsEnabled,
  }) {
    return UserProfile(
      uid: uid ?? this.uid,
      email: email ?? this.email,
      displayName: displayName ?? this.displayName,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      photoURL: photoURL ?? this.photoURL,
      address: address ?? this.address,
      emergencyContact: emergencyContact ?? this.emergencyContact,
      notificationsEnabled: notificationsEnabled ?? this.notificationsEnabled,
    );
  }

  /// Validation d'email
  static bool isValidEmail(String email) {
    if (email.isEmpty) return false;
    final emailRegex = RegExp(
      r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
    );
    return emailRegex.hasMatch(email);
  }

  /// Validation de numéro de téléphone français
  static bool isValidPhoneNumber(String phone) {
    if (phone.isEmpty) return false;
    // Enlever les espaces pour la validation
    final cleanedPhone = phone.replaceAll(RegExp(r'\s+'), '');

    // Format français: +33612345678 ou 0612345678
    final phoneRegex = RegExp(
      r'^(\+33|0)[1-9][0-9]{8}$',
    );
    return phoneRegex.hasMatch(cleanedPhone);
  }

  /// Initiales du nom d'affichage
  String get initials {
    if (displayName == null || displayName!.isEmpty) {
      return 'U'; // U pour User
    }

    final parts = displayName!.trim().split(' ');
    if (parts.length == 1) {
      return parts[0][0].toUpperCase();
    }

    return '${parts[0][0]}${parts[parts.length - 1][0]}'.toUpperCase();
  }
}
