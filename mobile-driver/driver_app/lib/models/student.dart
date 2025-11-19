/// Modèle de données pour un élève
class Student {
  final String id;
  final String firstName;
  final String lastName;
  final String busId;
  final String? photoUrl;
  final AttendanceStatus? todayStatus;

  Student({
    required this.id,
    required this.firstName,
    required this.lastName,
    required this.busId,
    this.photoUrl,
    this.todayStatus,
  });

  factory Student.fromJson(Map<String, dynamic> json) {
    return Student(
      id: json['id'] as String,
      firstName: json['firstName'] as String,
      lastName: json['lastName'] as String,
      busId: json['busId'] as String,
      photoUrl: json['photoUrl'] as String?,
      todayStatus: json['todayStatus'] != null
          ? AttendanceStatus.fromString(json['todayStatus'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'busId': busId,
      'photoUrl': photoUrl,
      'todayStatus': todayStatus?.value,
    };
  }

  String get fullName => '$firstName $lastName';

  Student copyWith({
    String? id,
    String? firstName,
    String? lastName,
    String? busId,
    String? photoUrl,
    AttendanceStatus? todayStatus,
  }) {
    return Student(
      id: id ?? this.id,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      busId: busId ?? this.busId,
      photoUrl: photoUrl ?? this.photoUrl,
      todayStatus: todayStatus ?? this.todayStatus,
    );
  }
}

/// Statut d'attendance d'un élève
enum AttendanceStatus {
  notBoarded('not_boarded'),
  boarded('boarded'),
  completed('completed'),
  absent('absent');

  final String value;
  const AttendanceStatus(this.value);

  static AttendanceStatus fromString(String value) {
    return AttendanceStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => AttendanceStatus.notBoarded,
    );
  }
}
