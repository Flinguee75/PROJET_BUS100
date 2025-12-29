import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/bus_provider.dart';
import '../utils/app_colors.dart';

/// Widget dropdown pour sélectionner un enfant à suivre
/// Affiche la liste des enfants du parent et permet de changer l'enfant actif
class ChildSelectorDropdown extends StatelessWidget {
  const ChildSelectorDropdown({super.key});

  @override
  Widget build(BuildContext context) {
    final busProvider = Provider.of<BusProvider>(context);
    final enfants = busProvider.enfants;
    final selectedEnfant = busProvider.selectedEnfant;

    // Ne pas afficher si un seul enfant ou aucun enfant
    if (enfants.isEmpty || enfants.length == 1) {
      return const SizedBox.shrink();
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: selectedEnfant?.id,
          isExpanded: true,
          icon: const Icon(Icons.arrow_drop_down, color: AppColors.primary),
          style: const TextStyle(
            fontSize: 16,
            color: AppColors.textPrimary,
            fontWeight: FontWeight.w500,
          ),
          items: enfants.map((enfant) {
            return DropdownMenuItem<String>(
              value: enfant.id,
              child: Row(
                children: [
                  // Icône enfant
                  Container(
                    width: 36,
                    height: 36,
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(
                      Icons.child_care,
                      color: AppColors.primary,
                      size: 20,
                    ),
                  ),
                  const SizedBox(width: 12),
                  // Nom de l'enfant
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          '${enfant.prenom} ${enfant.nom}',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: AppColors.textPrimary,
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                        if (enfant.classe != null && enfant.classe!.isNotEmpty)
                          Text(
                            enfant.classe!,
                            style: const TextStyle(
                              fontSize: 12,
                              color: AppColors.textSecondary,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }).toList(),
          onChanged: (String? newValue) {
            if (newValue != null) {
              final enfant = enfants.firstWhere((e) => e.id == newValue);
              busProvider.selectEnfant(enfant);
            }
          },
        ),
      ),
    );
  }
}
