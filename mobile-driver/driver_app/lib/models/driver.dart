/// Modèle de données pour un chauffeur
class Driver {
  final String id;
  final String firstName;
  final String lastName;
  final String email;
  final String? phone;
  final String? licenseNumber;
  final String? busId;
  final bool isActive;

  Driver({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.email,
    this.phone,
    this.licenseNumber,
    this.busId,
    this.isActive = true,
  });

  factory Driver.fromJson(Map<String, dynamic> json) {
    return Driver(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String?,
      licenseNumber: json['licenseNumber'] as String?,
      busId: json['busId'] as String?,
      isActive: json['isActive'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'licenseNumber': licenseNumber,
      'busId': busId,
      'isActive': isActive,
    };
  }

  String get fullName => '$firstName $lastName';

  Driver copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? email,
    String? phone,
    String? licenseNumber,
    String? busId,
    bool? isActive,
  }) {
    return Driver(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      licenseNumber: licenseNumber ?? this.licenseNumber,
      busId: busId ?? this.busId,
      isActive: isActive ?? this.isActive,
    );
  }
}
