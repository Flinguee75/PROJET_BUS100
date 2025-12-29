import '../models/bus.dart';

/// Statut du trajet d'un bus
enum TripStatus {
  /// Bus est en course (en mouvement)
  active,

  /// Bus n'est pas en course (arrêté, inactif)
  inactive,
}

/// Helper pour déterminer le statut de trajet d'un bus
class TripStatusHelper {
  /// Détermine si le bus est en course (actif) ou non
  /// Basé sur le champ `liveStatus` du bus
  ///
  /// - `en_route` → active (bus en mouvement)
  /// - `stopped`, `idle`, `arrived` → inactive (bus arrêté/inactif)
  static TripStatus determineTripStatus(Bus? bus) {
    if (bus == null) {
      return TripStatus.inactive;
    }

    // Vérifier le statut live depuis GPS
    final liveStatus = bus.liveStatus;

    // Si le statut est 'en_route', le bus est en course active
    if (liveStatus == 'en_route') {
      return TripStatus.active;
    }

    // Sinon (stopped, idle, arrived, null), le bus est inactif
    return TripStatus.inactive;
  }

  /// Vérifie si le bus est actuellement en course
  static bool isActive(Bus? bus) {
    return determineTripStatus(bus) == TripStatus.active;
  }

  /// Vérifie si le bus est actuellement inactif
  static bool isInactive(Bus? bus) {
    return determineTripStatus(bus) == TripStatus.inactive;
  }

  /// Retourne un message descriptif du statut
  static String getStatusMessage(Bus? bus) {
    if (bus == null) {
      return 'Bus non disponible';
    }

    switch (determineTripStatus(bus)) {
      case TripStatus.active:
        return 'Bus en course';
      case TripStatus.inactive:
        return 'Bus pas en course';
    }
  }

  /// Retourne l'icône appropriée pour le statut
  static String getStatusIcon(Bus? bus) {
    if (bus == null) {
      return '🚫';
    }

    switch (determineTripStatus(bus)) {
      case TripStatus.active:
        return '🚌';
      case TripStatus.inactive:
        return '🔘';
    }
  }
}
