import 'package:flutter/material.dart';
import '../models/bus.dart';
import '../models/enfant.dart';
import '../utils/app_colors.dart';

/// Widget Card pour afficher un enfant
class EnfantCard extends StatelessWidget {
  final Enfant enfant;
  final Bus? bus;
  final VoidCallback? onTap;

  const EnfantCard({
    super.key,
    required this.enfant,
    this.bus,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      elevation: 2,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // En-tête avec avatar et nom
              Row(
                children: [
                  // Avatar
                  CircleAvatar(
                    radius: 30,
                    backgroundColor: AppColors.primary,
                    backgroundImage: enfant.photoUrl != null
                        ? NetworkImage(enfant.photoUrl!)
                        : null,
                    child: enfant.photoUrl == null
                        ? Text(
                            enfant.prenom[0].toUpperCase(),
                            style: const TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          )
                        : null,
                  ),
                  const SizedBox(width: 16),

                  // Nom et informations
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          enfant.nomComplet,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${enfant.classe} • ${enfant.ecole}',
                          style: const TextStyle(
                            fontSize: 14,
                            color: AppColors.textSecondary,
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Icône de navigation
                  const Icon(
                    Icons.arrow_forward_ios,
                    size: 20,
                    color: AppColors.textSecondary,
                  ),
                ],
              ),

              if (bus != null) ...[
                const Divider(height: 24),

                // Informations du bus
                Row(
                  children: [
                    // Statut
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 12,
                        vertical: 6,
                      ),
                      decoration: BoxDecoration(
                        color: _getStatusColor(bus!.status),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        bus!.statusLabel,
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    const SizedBox(width: 16),

                    // Immatriculation
                    const Icon(
                      Icons.directions_bus,
                      size: 20,
                      color: AppColors.primary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      bus!.immatriculation,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: AppColors.textPrimary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Chauffeur
                Row(
                  children: [
                    const Icon(
                      Icons.person,
                      size: 20,
                      color: AppColors.textSecondary,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Chauffeur: ${bus!.chauffeur}',
                      style: const TextStyle(
                        fontSize: 14,
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(BusStatus status) {
    switch (status) {
      case BusStatus.enRoute:
        return AppColors.busEnRoute;
      case BusStatus.enRetard:
        return AppColors.busEnRetard;
      case BusStatus.aLArret:
        return AppColors.busALArret;
      case BusStatus.horsService:
        return AppColors.busHorsService;
    }
  }
}

