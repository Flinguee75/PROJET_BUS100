import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/splash_screen.dart';
import 'services/firebase_service.dart';
import 'services/background_gps_service.dart';
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

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialiser Firebase
  await FirebaseService.initialize();

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
