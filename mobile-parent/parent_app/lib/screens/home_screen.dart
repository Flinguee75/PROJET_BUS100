import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/bus_provider.dart';
import '../utils/app_colors.dart';
import '../widgets/enfant_card.dart';
import 'map_screen.dart';
import 'login_screen.dart';
import 'enfant_settings_screen.dart';
import 'profile_screen.dart';

/// Écran d'accueil - Liste des enfants
class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    final authProvider = context.read<AuthProvider>();
    final busProvider = context.read<BusProvider>();

    if (authProvider.user != null) {
      await busProvider.loadEnfants(authProvider.user!.uid);
    }
  }

  Future<void> _handleLogout() async {
    final authProvider = context.read<AuthProvider>();
    await authProvider.signOut();

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mes Enfants'),
        actions: [
          IconButton(
            icon: const Icon(Icons.person),
            onPressed: () {
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
            },
            tooltip: 'Profil',
          ),
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: _handleLogout,
            tooltip: 'Déconnexion',
          ),
        ],
      ),
      body: Consumer<BusProvider>(
        builder: (context, busProvider, child) {
          if (busProvider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (busProvider.error != null) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: AppColors.danger,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    busProvider.error!,
                    style: const TextStyle(color: AppColors.danger),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadData,
                    child: const Text('Réessayer'),
                  ),
                ],
              ),
            );
          }

          if (busProvider.enfants.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.person_outline,
                    size: 64,
                    color: Colors.grey[400],
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Aucun enfant enregistré',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Contactez l\'école pour enregistrer vos enfants',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _loadData,
            child: ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: busProvider.enfants.length,
              itemBuilder: (context, index) {
                final enfant = busProvider.enfants[index];
                final bus = busProvider.getBusForEnfant(enfant);

                return EnfantCard(
                  enfant: enfant,
                  bus: bus,
                  onTap: () {
                    // Ouvrir la carte pour cet enfant
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => MapScreen(
                          enfant: enfant,
                          bus: bus,
                        ),
                      ),
                    );
                  },
                  onSettingsTap: () {
                    // Ouvrir les paramètres de l'enfant
                    Navigator.of(context).push(
                      MaterialPageRoute(
                        builder: (_) => EnfantSettingsScreen(
                          enfant: enfant,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}

