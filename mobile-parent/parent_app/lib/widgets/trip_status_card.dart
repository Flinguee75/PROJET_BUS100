import 'package:flutter/material.dart';
import '../models/bus.dart';
import '../models/enfant.dart';
import '../services/eta_service.dart';
import '../utils/app_colors.dart';
import '../utils/trip_status_helper.dart';
import '../utils/trip_type_helper.dart';

/// Card affichant le statut du trajet avec 2 états distincts :
/// - État ACTIF : ETA, distance, vitesse, type de trajet
/// - État INACTIF : Message "Bus pas en course" + infos bus/chauffeur
class TripStatusCard extends StatelessWidget {
  final Bus? bus;
  final Enfant enfant;

  const TripStatusCard({
    super.key,
    required this.bus,
    required this.enfant,
  });

  @override
  Widget build(BuildContext context) {
    if (bus == null) {
      return _buildNoDataCard();
    }

    // Vérifier si l'enfant est inscrit au trip actuel
    if (bus!.currentTrip != null && !enfant.isActiveForTrip(bus!.currentTrip!.tripType)) {
      return _buildNotEnrolledCard(bus!.currentTrip!.tripType);
    }

    // Déterminer le statut du trajet
    final tripStatus = TripStatusHelper.determineTripStatus(bus);

    if (tripStatus == TripStatus.inactive) {
      return _buildInactiveCard();
    } else {
      return _buildActiveCard();
    }
  }

  /// Card quand aucune donnée de bus
  Widget _buildNoDataCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Aucune information disponible',
            style: TextStyle(
              color: AppColors.textSecondary,
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  /// Card quand l'enfant n'est pas inscrit au trip actuel
  Widget _buildNotEnrolledCard(String tripType) {
    String tripLabel = 'ce trajet';
    switch (tripType) {
      case TripTimeOfDay.morningOutbound:
        tripLabel = 'le ramassage du matin';
        break;
      case TripTimeOfDay.middayOutbound:
        tripLabel = 'le dépôt du midi';
        break;
      case TripTimeOfDay.middayReturn:
        tripLabel = 'le retour du midi';
        break;
      case TripTimeOfDay.eveningReturn:
        tripLabel = 'le retour du soir';
        break;
    }

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Badge "Non inscrit"
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.warning.withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.info_outline,
                      size: 14,
                      color: AppColors.warning,
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Non inscrit à ce trajet',
                      style: TextStyle(
                        color: AppColors.warning,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Message explicatif
          Text(
            '${enfant.prenom} n\'est pas inscrit pour $tripLabel.',
            style: const TextStyle(
              color: AppColors.textPrimary,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Vous ne recevrez pas de notifications pour ce trajet.',
            style: const TextStyle(
              color: AppColors.textSecondary,
              fontSize: 13,
            ),
          ),
        ],
      ),
    );
  }

  /// Card pour bus INACTIF (pas en course)
  Widget _buildInactiveCard() {
    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Badge "Bus pas en course"
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 12,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: AppColors.textSecondary.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(
                    color: AppColors.textSecondary.withValues(alpha: 0.3),
                    width: 1,
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.radio_button_checked,
                      size: 14,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 6),
                    const Text(
                      'Bus pas en course',
                      style: TextStyle(
                        color: AppColors.textSecondary,
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Infos bus
          _buildInfoRow(
            Icons.directions_bus,
            'Bus',
            bus!.immatriculation,
          ),
          const SizedBox(height: 8),
          _buildInfoRow(
            Icons.person,
            'Chauffeur',
            bus!.chauffeur,
          ),
        ],
      ),
    );
  }

  /// Card pour bus ACTIF (en course)
  Widget _buildActiveCard() {
    // Déterminer le type de trajet (ramassage/dépôt)
    final tripType = TripTypeHelper.detectTripType();

    // Calculer distance et ETA si position disponible
    double? distance;
    double? eta;

    // Récupérer la bonne location selon le trip actuel
    EnfantLocation? enfantLocation;
    if (bus!.currentTrip != null) {
      enfantLocation = enfant.getLocationForTrip(bus!.currentTrip!.tripType);
    }
    // Fallback sur l'ancienne propriété arret
    if (enfantLocation == null && enfant.arret != null) {
      enfantLocation = EnfantLocation(
        address: '',
        lat: enfant.arret!.lat,
        lng: enfant.arret!.lng,
      );
    }

    if (bus!.currentPosition != null && enfantLocation != null) {
      distance = ETAService.calculateDistance(
        bus!.currentPosition!.lat,
        bus!.currentPosition!.lng,
        enfantLocation.lat,
        enfantLocation.lng,
      );

      eta = ETAService.calculateETA(distance, bus!.currentPosition!.speed);
    }

    return Container(
      margin: const EdgeInsets.all(16),
      padding: const EdgeInsets.all(16),
      decoration: _cardDecoration(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Badge type de trajet
          TripTypeHelper.buildBadge(tripType),
          const SizedBox(height: 16),

          // ETA (grand, proéminent)
          if (eta != null) ...[
            Row(
              crossAxisAlignment: CrossAxisAlignment.baseline,
              textBaseline: TextBaseline.alphabetic,
              children: [
                Icon(
                  Icons.schedule,
                  size: 20,
                  color: AppColors.primary,
                ),
                const SizedBox(width: 8),
                Text(
                  ETAService.formatETA(eta),
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    TripTypeHelper.getActionMessage(tripType, enfant.prenom),
                    style: const TextStyle(
                      fontSize: 14,
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],

          // Distance
          if (distance != null) ...[
            Row(
              children: [
                Icon(
                  Icons.straighten,
                  size: 18,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 8),
                Text(
                  _formatDistance(distance),
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
          ],

          // Vitesse
          if (bus!.currentPosition != null) ...[
            Row(
              children: [
                Icon(
                  Icons.speed,
                  size: 18,
                  color: AppColors.textSecondary,
                ),
                const SizedBox(width: 8),
                Text(
                  '${bus!.currentPosition!.speed.toStringAsFixed(0)} km/h',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    color: AppColors.textPrimary,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  /// Décoration de la card
  BoxDecoration _cardDecoration() {
    return BoxDecoration(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withValues(alpha: 0.1),
          blurRadius: 10,
          offset: const Offset(0, -2),
        ),
      ],
    );
  }

  /// Widget pour une ligne d'information
  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }

  /// Formate la distance en m ou km
  String _formatDistance(double distanceKm) {
    if (distanceKm < 1) {
      return '${(distanceKm * 1000).toStringAsFixed(0)} m';
    } else {
      return '${distanceKm.toStringAsFixed(1)} km';
    }
  }
}
