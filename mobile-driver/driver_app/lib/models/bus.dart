/// Modèle de données pour un bus
class Bus {
  final String id;
  final String plate;
  final int capacity;
  final String? driverId;
  final String? routeId;
  final BusStatus status;

  Bus({
    required this.id,
    required this.plate,
    required this.capacity,
    this.driverId,
    this.routeId,
    required this.status,
  });

  factory Bus.fromJson(Map<String, dynamic> json) {
    return Bus(
      id: json['id'] as String,
      plate: json['plate'] as String,
      capacity: json['capacity'] as int,
      driverId: json['driverId'] as String?,
      routeId: json['routeId'] as String?,
      status: BusStatus.fromString(json['status'] as String? ?? 'hors_service'),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'plate': plate,
      'capacity': capacity,
      'driverId': driverId,
      'routeId': routeId,
      'status': status.value,
    };
  }

  Bus copyWith({
    String? id,
    String? plate,
    int? capacity,
    String? driverId,
    String? routeId,
    BusStatus? status,
  }) {
    return Bus(
      id: id ?? this.id,
      plate: plate ?? this.plate,
      capacity: capacity ?? this.capacity,
      driverId: driverId ?? this.driverId,
      routeId: routeId ?? this.routeId,
      status: status ?? this.status,
    );
  }
}

/// Statut du bus
enum BusStatus {
  enRoute('en_route'),
  horsService('hors_service'),
  enPanne('en_panne'),
  enMaintenance('en_maintenance');

  final String value;
  const BusStatus(this.value);

  static BusStatus fromString(String value) {
    return BusStatus.values.firstWhere(
      (status) => status.value == value,
      orElse: () => BusStatus.horsService,
    );
  }
}
