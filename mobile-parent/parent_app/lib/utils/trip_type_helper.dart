import 'package:flutter/material.dart';
import 'app_colors.dart';
import '../models/enfant.dart' show TripTimeOfDay;

/// Type de trajet du bus
enum TripType {
  /// Ramassage (maison → école)
  /// Trajets du matin (6h-9h) et retour du midi (12h-14h)
  ramassage,

  /// Dépôt (école → maison)
  /// Trajets du midi sortie (12h-14h) et du soir (15h-18h)
  depot,
}

/// Helper pour déterminer le type de trajet basé sur l'heure
class TripTypeHelper {
  /// Détermine le TripTimeOfDay backend basé sur l'heure actuelle
  ///
  /// Logique (selon backend):
  /// - 6h-9h : MORNING_OUTBOUND (ramassage matin)
  /// - 12h-14h : MIDDAY_OUTBOUND (dépôt midi)
  /// - 14h-15h : MIDDAY_RETURN (retour midi)
  /// - 15h-18h : EVENING_RETURN (dépôt soir)
  /// - Autres heures : null (pas de trajet)
  static String? getCurrentTimeOfDay({DateTime? currentTime}) {
    final now = currentTime ?? DateTime.now();
    final hour = now.hour;

    // Matin (6h-9h) : Ramassage
    if (hour >= 6 && hour < 9) {
      return TripTimeOfDay.morningOutbound;
    }
    // Midi sortie (12h-14h) : Dépôt
    else if (hour >= 12 && hour < 14) {
      return TripTimeOfDay.middayOutbound;
    }
    // Retour midi (14h-15h) : Ramassage
    else if (hour >= 14 && hour < 15) {
      return TripTimeOfDay.middayReturn;
    }
    // Soir (15h-18h) : Dépôt
    else if (hour >= 15 && hour < 18) {
      return TripTimeOfDay.eveningReturn;
    }
    // Autres heures : pas de trajet
    else {
      return null;
    }
  }

  /// Détermine le type de trajet basé sur l'heure actuelle
  ///
  /// Logique :
  /// - 6h-9h : Ramassage matin (maison → école)
  /// - 12h-14h : Dépôt midi (école → maison)
  /// - 14h-15h : Ramassage retour midi (maison → école)
  /// - 15h-18h : Dépôt soir (école → maison)
  /// - Autres heures : Ramassage par défaut
  static TripType detectTripType({DateTime? currentTime}) {
    final now = currentTime ?? DateTime.now();
    final hour = now.hour;

    // Matin (6h-9h) : Ramassage
    if (hour >= 6 && hour < 9) {
      return TripType.ramassage;
    }
    // Midi (12h-14h) : Dépôt
    else if (hour >= 12 && hour < 14) {
      return TripType.depot;
    }
    // Retour midi (14h-15h) : Ramassage
    else if (hour >= 14 && hour < 15) {
      return TripType.ramassage;
    }
    // Soir (15h-18h) : Dépôt
    else if (hour >= 15 && hour < 18) {
      return TripType.depot;
    }
    // Par défaut : Ramassage
    else {
      return TripType.ramassage;
    }
  }

  /// Retourne le label du type de trajet
  static String getLabel(TripType type) {
    switch (type) {
      case TripType.ramassage:
        return 'Ramassage';
      case TripType.depot:
        return 'Dépôt';
    }
  }

  /// Retourne le message d'action pour l'ETA
  /// Exemple : "pour récupérer" ou "pour déposer"
  static String getActionMessage(TripType type, String childName) {
    switch (type) {
      case TripType.ramassage:
        return 'pour récupérer $childName';
      case TripType.depot:
        return 'pour déposer $childName';
    }
  }

  /// Retourne l'icône du type de trajet
  static IconData getIcon(TripType type) {
    switch (type) {
      case TripType.ramassage:
        return Icons.wb_sunny_outlined; // Soleil levant (matin)
      case TripType.depot:
        return Icons.nights_stay_outlined; // Lune (soir)
    }
  }

  /// Retourne la couleur du type de trajet
  static Color getColor(TripType type) {
    switch (type) {
      case TripType.ramassage:
        return AppColors.primary; // Bleu pour ramassage
      case TripType.depot:
        return AppColors.warning; // Orange pour dépôt
    }
  }

  /// Retourne l'emoji du type de trajet
  static String getEmoji(TripType type) {
    switch (type) {
      case TripType.ramassage:
        return '🌅'; // Lever de soleil
      case TripType.depot:
        return '🌇'; // Coucher de soleil
    }
  }

  /// Crée un badge coloré pour le type de trajet
  static Widget buildBadge(TripType type) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: getColor(type).withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(
          color: getColor(type).withValues(alpha: 0.3),
          width: 1,
        ),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            getIcon(type),
            size: 16,
            color: getColor(type),
          ),
          const SizedBox(width: 6),
          Text(
            getLabel(type),
            style: TextStyle(
              color: getColor(type),
              fontSize: 12,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
