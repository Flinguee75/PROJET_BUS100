import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'screens/splash_screen.dart';
import 'services/firebase_service.dart';
import 'services/background_gps_service.dart';
import 'services/notification_service.dart';
import 'providers/auth_provider.dart';
import 'providers/bus_provider.dart';
import 'utils/app_colors.dart';

// Pour Firebase Auth
// adb reverse tcp:9099 tcp:9099
//
// Pour Firestore (si tu l'utilises)
// adb reverse tcp:8080 tcp:8080
//
// Pour Cloud Functions (si tu l'utilises)
// adb reverse tcp:5001 tcp:5001

// Handler pour les messages FCM en background (doit être top-level)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await FirebaseService.initialize();
  print('📨 Message FCM en background: ${message.notification?.title}');
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialiser Firebase
  await FirebaseService.initialize();

  // Configurer le handler FCM background
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // Initialiser le service de notifications
  await NotificationService().initialize();

  // Initialiser le service GPS en arrière-plan
  await BackgroundGpsService.instance.initialize();

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BusProvider()),
      ],
      child: MaterialApp(
        title: 'Transport Scolaire - Parents',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          primarySwatch: Colors.blue,
          primaryColor: AppColors.primary,
          scaffoldBackgroundColor: AppColors.background,
          appBarTheme: const AppBarTheme(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
            elevation: 0,
          ),
          colorScheme: ColorScheme.fromSeed(
            seedColor: AppColors.primary,
            primary: AppColors.primary,
          ),
          useMaterial3: true,
        ),
        home: const SplashScreen(),
      ),
    );
  }
}
