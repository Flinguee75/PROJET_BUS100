import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../utils/app_colors.dart';
import 'login_screen.dart';
import 'main_map_screen.dart';

/// Écran de démarrage (Splash Screen)
class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _navigateToNextScreen();
  }

  Future<void> _navigateToNextScreen() async {
    // Attendre 2 secondes
    await Future.delayed(const Duration(seconds: 2));

    if (!mounted) return;

    // Vérifier l'état d'authentification
    final authProvider = context.read<AuthProvider>();

    if (authProvider.isAuthenticated) {
      // Enregistrer le token FCM pour les notifications push
      final notificationProvider = context.read<NotificationProvider>();
      final user = authProvider.user;
      if (user != null) {
        await notificationProvider.registerToken(user.uid);
      }

      if (!mounted) return;

      // Utilisateur connecté → aller vers la carte principale
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const MainMapScreen()),
      );
    } else {
      // Utilisateur non connecté → aller vers Login
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.primary,
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            // Logo ou icône
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(30),
              ),
              child: const Icon(
                Icons.directions_bus,
                size: 80,
                color: AppColors.primary,
              ),
            ),
            const SizedBox(height: 30),

            // Titre
            const Text(
              'Transport Scolaire',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            const SizedBox(height: 10),

            // Sous-titre
            const Text(
              'Parents',
              style: TextStyle(
                fontSize: 18,
                color: Colors.white70,
              ),
            ),
            const SizedBox(height: 50),

            // Indicateur de chargement
            const CircularProgressIndicator(
              valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
            ),
          ],
        ),
      ),
    );
  }
}

