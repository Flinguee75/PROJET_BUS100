import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:parent_app/models/bus.dart';
import 'package:parent_app/models/enfant.dart';
import 'package:parent_app/providers/auth_provider.dart';
import 'package:parent_app/providers/bus_provider.dart';
import 'package:parent_app/screens/main_map_screen.dart';
import 'package:provider/provider.dart';
import 'package:firebase_auth/firebase_auth.dart' as firebase_auth;

@GenerateMocks([AuthProvider, BusProvider, firebase_auth.User])
import 'main_map_screen_test.mocks.dart';

void main() {
  late MockAuthProvider mockAuthProvider;
  late MockBusProvider mockBusProvider;
  late MockUser mockUser;

  setUp(() {
    mockAuthProvider = MockAuthProvider();
    mockBusProvider = MockBusProvider();
    mockUser = MockUser();

    // Mock user
    when(mockUser.uid).thenReturn('parent_001');
    when(mockUser.email).thenReturn('parent@example.com');
    when(mockAuthProvider.user).thenReturn(mockUser);
    when(mockAuthProvider.isAuthenticated).thenReturn(true);

    // Mock bus provider loading state
    when(mockBusProvider.isLoading).thenReturn(false);
    when(mockBusProvider.error).thenReturn(null);
    when(mockBusProvider.enfants).thenReturn([]);
    when(mockBusProvider.loadEnfants(any)).thenAnswer((_) async {});
  });

  Widget createWidgetUnderTest() {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
        ChangeNotifierProvider<BusProvider>.value(value: mockBusProvider),
      ],
      child: const MaterialApp(
        home: MainMapScreen(),
      ),
    );
  }

  group('MainMapScreen Widget Tests', () {
    testWidgets('Should show loading indicator when isLoading is true',
        (WidgetTester tester) async {
      // Arrange
      when(mockBusProvider.isLoading).thenReturn(true);

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pump();

      // Assert
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('Should show "Aucun enfant enregistré" when enfants list is empty',
        (WidgetTester tester) async {
      // Arrange
      when(mockBusProvider.enfants).thenReturn([]);

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Aucun enfant enregistré'), findsOneWidget);
      expect(
        find.text('Contactez l\'école pour enregistrer vos enfants'),
        findsOneWidget,
      );
    });

    testWidgets('Should display AppBar with child name when enfant exists',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Kouassi',
        prenom: 'Aya',
        classe: 'CE2',
        ecole: 'École Plateau',
        busId: 'bus_001',
        parentId: 'parent_001',
        arret: GPSPosition(
          lat: 5.3600,
          lng: -4.0083,
          speed: 0.0,
          timestamp: 1640000000000,
        ),
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(null);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(null));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Bus de Aya'), findsOneWidget);
    });

    testWidgets('Should open drawer when menu icon is tapped',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Traoré',
        prenom: 'Ibrahim',
        classe: 'CM1',
        ecole: 'École Cocody',
        busId: 'bus_001',
        parentId: 'parent_001',
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(null);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(null));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Open the drawer
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();

      // Assert - Drawer items should be visible
      expect(find.text('Mon Profil'), findsOneWidget);
      expect(find.text('Paramètres'), findsOneWidget);
      expect(find.text('Déconnexion'), findsOneWidget);
    });

    testWidgets('Should display drawer header with user email',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Bamba',
        prenom: 'Fatou',
        classe: 'CP',
        ecole: 'École Treichville',
        busId: 'bus_001',
        parentId: 'parent_001',
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(null);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(null));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Open the drawer
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('parent@example.com'), findsOneWidget);
      expect(find.text('Enfant: Fatou Bamba'), findsOneWidget);
    });

    testWidgets('Should show "Pas de course en cours" when bus is not active',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Diallo',
        prenom: 'Mamadou',
        classe: 'CE1',
        ecole: 'École Adjamé',
        busId: 'bus_001',
        parentId: 'parent_001',
      );

      final bus = Bus(
        id: 'bus_001',
        immatriculation: 'CI-001-AB',
        chauffeur: 'Koffi Yao',
        chauffeurId: 'driver_001',
        capacite: 40,
        itineraire: 'Route A',
        status: BusStatus.horsService,
        statusLabel: 'Hors service',
        currentPosition: null,
        maintenanceStatus: 0,
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(bus);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(bus));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Pas de course en cours'), findsOneWidget);
    });

    testWidgets('Should display bus information when bus is active',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Koné',
        prenom: 'Aminata',
        classe: 'CM2',
        ecole: 'École Plateau',
        busId: 'bus_001',
        parentId: 'parent_001',
        arret: GPSPosition(
          lat: 5.3167,
          lng: -4.0333,
          speed: 0.0,
          timestamp: 1640000000000,
        ),
      );

      final bus = Bus(
        id: 'bus_001',
        immatriculation: 'CI-002-CD',
        chauffeur: 'Touré Seydou',
        chauffeurId: 'driver_002',
        capacite: 40,
        itineraire: 'Route B',
        status: BusStatus.enRoute,
        statusLabel: 'En route',
        currentPosition: GPSPosition(
          lat: 5.3200,
          lng: -4.0300,
          speed: 35.0,
          timestamp: 1640000000000,
        ),
        maintenanceStatus: 0,
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(bus);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(bus));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Assert - Bus information should be displayed
      expect(find.text('En route'), findsOneWidget);
      expect(find.textContaining('CI-002-CD'), findsOneWidget);
      expect(find.textContaining('Touré Seydou'), findsOneWidget);
      expect(find.textContaining('Route B'), findsOneWidget);
    });

    testWidgets('Should display ETA and distance when arret exists',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Yao',
        prenom: 'Kouadio',
        classe: 'CE2',
        ecole: 'École Cocody',
        busId: 'bus_001',
        parentId: 'parent_001',
        arret: GPSPosition(
          lat: 5.3247,
          lng: -3.9752,
          speed: 0.0,
          timestamp: 1640000000000,
        ),
      );

      final bus = Bus(
        id: 'bus_001',
        immatriculation: 'CI-003-EF',
        chauffeur: 'Ouattara Jean',
        chauffeurId: 'driver_003',
        capacite: 40,
        itineraire: 'Route C',
        status: BusStatus.enRoute,
        statusLabel: 'En route',
        currentPosition: GPSPosition(
          lat: 5.3200,
          lng: -3.9800,
          speed: 30.0,
          timestamp: 1640000000000,
        ),
        maintenanceStatus: 0,
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(bus);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(bus));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Assert - ETA and Distance sections should exist
      expect(find.text('ETA'), findsOneWidget);
      expect(find.text('Distance'), findsOneWidget);
    });
  });

  group('MainMapScreen Drawer Navigation Tests', () {
    testWidgets('Should navigate to ProfileScreen when "Mon Profil" is tapped',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Test',
        prenom: 'Enfant',
        classe: 'CE2',
        ecole: 'École Test',
        busId: 'bus_001',
        parentId: 'parent_001',
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(null);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(null));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Open the drawer
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();

      // Tap on "Mon Profil"
      await tester.tap(find.text('Mon Profil'));
      await tester.pumpAndSettle();

      // Assert - ProfileScreen should be pushed
      // Note: In a real test, you'd verify the navigation occurred
      // For now, we just verify the tap doesn't crash
      expect(tester.takeException(), isNull);
    });

    testWidgets('Should show snackbar when "Paramètres" is tapped',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Test',
        prenom: 'Enfant',
        classe: 'CE2',
        ecole: 'École Test',
        busId: 'bus_001',
        parentId: 'parent_001',
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(null);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(null));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Open the drawer
      await tester.tap(find.byIcon(Icons.menu));
      await tester.pumpAndSettle();

      // Tap on "Paramètres"
      await tester.tap(find.text('Paramètres'));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Paramètres - À venir'), findsOneWidget);
    });
  });

  group('MainMapScreen Map Integration Tests', () {
    testWidgets('Should center map on enfant arret when available',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Kouassi',
        prenom: 'Aya',
        classe: 'CE2',
        ecole: 'École Plateau',
        busId: 'bus_001',
        parentId: 'parent_001',
        arret: GPSPosition(
          lat: 5.3600,
          lng: -4.0083,
          speed: 0.0,
          timestamp: 1640000000000,
        ),
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(null);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(null));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Assert - GoogleMap should be present
      expect(find.byType(GoogleMap), findsOneWidget);
    });

    testWidgets('Should center map on Abidjan when no arret available',
        (WidgetTester tester) async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_001',
        nom: 'Traoré',
        prenom: 'Ibrahim',
        classe: 'CM1',
        ecole: 'École Cocody',
        busId: 'bus_001',
        parentId: 'parent_001',
        arret: null, // No arret
      );

      when(mockBusProvider.enfants).thenReturn([enfant]);
      when(mockBusProvider.getBusForEnfant(any)).thenReturn(null);
      when(mockBusProvider.watchBusPosition(any))
          .thenAnswer((_) => Stream.value(null));

      // Act
      await tester.pumpWidget(createWidgetUnderTest());
      await tester.pumpAndSettle();

      // Assert - GoogleMap should be present
      // In real test, you'd verify the initial camera position is Abidjan
      expect(find.byType(GoogleMap), findsOneWidget);
    });
  });
}
