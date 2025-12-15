import 'package:flutter/material.dart';

/// Types de trajets scolaires
/// Correspond au backend TimeOfDay dans route.types.ts
enum TripType {
  /// Matin: maison → école (récupérer élèves)
  morningOutbound,
  
  /// Midi: école → maison (déposer élèves - demi-pensionnaires)
  middayOutbound,
  
  /// Après-midi: maison → école (récupérer élèves - demi-pensionnaires)
  middayReturn,
  
  /// Soir: école → maison (déposer élèves)
  eveningReturn,
}

/// Extension pour ajouter des propriétés utiles à TripType
extension TripTypeExtension on TripType {
  /// Valeur Firestore (correspond au backend)
  String get firestoreValue {
    switch (this) {
      case TripType.morningOutbound:
        return 'morning_outbound';
      case TripType.middayOutbound:
        return 'midday_outbound';
      case TripType.middayReturn:
        return 'midday_return';
      case TripType.eveningReturn:
        return 'evening_return';
    }
  }

  /// Label en français pour l'UI
  String get label {
    switch (this) {
      case TripType.morningOutbound:
        return 'Matin - Récupérer élèves';
      case TripType.middayOutbound:
        return 'Midi - Déposer élèves';
      case TripType.middayReturn:
        return 'Après-midi - Récupérer élèves';
      case TripType.eveningReturn:
        return 'Soir - Déposer élèves';
    }
  }

  /// Label court pour l'UI
  String get shortLabel {
    switch (this) {
      case TripType.morningOutbound:
        return 'Matin';
      case TripType.middayOutbound:
        return 'Midi (sortie)';
      case TripType.middayReturn:
        return 'Après-midi';
      case TripType.eveningReturn:
        return 'Soir';
    }
  }

  /// Description de l'action
  String get actionDescription {
    switch (this) {
      case TripType.morningOutbound:
        return 'Récupérer les élèves';
      case TripType.middayOutbound:
        return 'Déposer les élèves';
      case TripType.middayReturn:
        return 'Récupérer les élèves';
      case TripType.eveningReturn:
        return 'Déposer les élèves';
    }
  }

  /// Icône pour l'UI
  IconData get icon {
    switch (this) {
      case TripType.morningOutbound:
        return Icons.wb_sunny_outlined; // Lever de soleil
      case TripType.middayOutbound:
        return Icons.wb_sunny; // Soleil plein (midi)
      case TripType.middayReturn:
        return Icons.wb_sunny; // Soleil plein (après-midi)
      case TripType.eveningReturn:
        return Icons.nights_stay_outlined; // Coucher de soleil
    }
  }

  /// Couleur associée
  Color get color {
    switch (this) {
      case TripType.morningOutbound:
        return const Color(0xFFFF9800); // Orange (lever de soleil)
      case TripType.middayOutbound:
        return const Color(0xFFFFEB3B); // Jaune (midi)
      case TripType.middayReturn:
        return const Color(0xFFFFC107); // Ambre (après-midi)
      case TripType.eveningReturn:
        return const Color(0xFF3F51B5); // Indigo (soir)
    }
  }

  /// Crée un TripType à partir d'une valeur Firestore
  static TripType? fromFirestoreValue(String value) {
    switch (value) {
      case 'morning_outbound':
        return TripType.morningOutbound;
      case 'midday_outbound':
        return TripType.middayOutbound;
      case 'midday_return':
        return TripType.middayReturn;
      case 'evening_return':
        return TripType.eveningReturn;
      default:
        return null;
    }
  }
}

