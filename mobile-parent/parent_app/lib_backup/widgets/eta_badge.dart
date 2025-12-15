import 'package:flutter/material.dart';
import '../models/bus.dart';
import '../services/eta_service.dart';
import '../utils/app_colors.dart';

/// Widget badge affichant l'ETA du bus
class ETABadge extends StatelessWidget {
  final Bus? bus;
  final double? destinationLat;
  final double? destinationLng;
  final bool compact;

  const ETABadge({
    super.key,
    required this.bus,
    this.destinationLat,
    this.destinationLng,
    this.compact = true,
  });

  @override
  Widget build(BuildContext context) {
    if (bus == null || bus!.currentPosition == null) {
      return _buildBadge(
        eta: null,
        isNear: false,
        isImminent: false,
      );
    }

    // Destination par défaut si non fournie
    final destLat = destinationLat ?? 36.8065;
    final destLng = destinationLng ?? 10.1815;

    // Calculer la distance et l'ETA
    final distance = ETAService.calculateDistance(
      bus!.currentPosition!.lat,
      bus!.currentPosition!.lng,
      destLat,
      destLng,
    );

    final eta = ETAService.calculateETA(distance, bus!.currentPosition!.speed);

    // Vérifier si proche
    final isNear = ETAService.isNearDestination(
      busPosition: bus!.currentPosition!,
      destinationLat: destLat,
      destinationLng: destLng,
    );

    // Vérifier si imminent (< 1 min)
    final isImminent = eta != null && eta < 1;

    return _buildBadge(
      eta: eta,
      isNear: isNear,
      isImminent: isImminent,
    );
  }

  Widget _buildBadge({
    required double? eta,
    required bool isNear,
    required bool isImminent,
  }) {
    final formattedETA = ETAService.formatETA(eta);

    // Couleurs selon l'état
    Color bgColor;
    Color fgColor;

    if (isImminent) {
      bgColor = AppColors.warning;
      fgColor = Colors.white;
    } else if (isNear) {
      bgColor = AppColors.success;
      fgColor = Colors.white;
    } else if (eta == null) {
      bgColor = Colors.grey.shade200;
      fgColor = AppColors.textSecondary;
    } else {
      bgColor = AppColors.primary.withOpacity(0.1);
      fgColor = AppColors.primary;
    }

    if (compact) {
      // Version compacte pour EnfantCard
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.schedule,
              size: 12,
              color: fgColor,
            ),
            const SizedBox(width: 4),
            Text(
              formattedETA,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: fgColor,
              ),
            ),
          ],
        ),
      );
    } else {
      // Version étendue
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
        decoration: BoxDecoration(
          color: bgColor,
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: fgColor.withOpacity(0.3),
            width: 1,
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              Icons.schedule,
              size: 16,
              color: fgColor,
            ),
            const SizedBox(width: 8),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Arrivée estimée',
                  style: TextStyle(
                    fontSize: 10,
                    color: fgColor.withOpacity(0.8),
                  ),
                ),
                Text(
                  formattedETA,
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: fgColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      );
    }
  }
}
