import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/students_provider.dart';
import 'screens/login_screen.dart';
import 'screens/students_list_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialiser Firebase
  await Firebase.initializeApp();

  runApp(const DriverApp());
}

class DriverApp extends StatelessWidget {
  const DriverApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => StudentsProvider()),
      ],
      child: MaterialApp(
        title: 'Bus Scolaire - Chauffeur',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.blue,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          appBarTheme: AppBarTheme(
            backgroundColor: Colors.blue[700],
            foregroundColor: Colors.white,
            elevation: 2,
          ),
        ),
        home: Consumer<AuthProvider>(
          builder: (context, authProvider, _) {
            // Si authentifié, afficher la liste des élèves
            if (authProvider.isAuthenticated) {
              return const StudentsListScreen();
            }

            // Sinon, afficher l'écran de connexion
            return const LoginScreen();
          },
        ),
      ),
    );
  }
}
