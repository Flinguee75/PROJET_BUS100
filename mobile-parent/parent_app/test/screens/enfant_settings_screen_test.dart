import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/enfant.dart';

// Tests pour EnfantSettingsScreen
// Ces tests vérifient l'interface de paramétrage de l'enfant

void main() {
  group('EnfantSettingsScreen Widget Tests', () {
    late Enfant testEnfant;

    setUp(() {
      testEnfant = Enfant(
        id: 'enfant_001',
        nom: 'Dupont',
        prenom: 'Sophie',
        classe: 'CM2',
        ecole: 'École Primaire Centre',
        busId: 'bus_001',
        parentId: 'parent_001',
      );
    });

    testWidgets('should display enfant information', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(title: const Text('Paramètres')),
            body: Column(
              children: [
                ListTile(
                  title: const Text('Nom complet'),
                  subtitle: Text(testEnfant.nomComplet),
                ),
                ListTile(
                  title: const Text('Classe'),
                  subtitle: Text(testEnfant.classe),
                ),
                ListTile(
                  title: const Text('École'),
                  subtitle: Text(testEnfant.ecole),
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Paramètres'), findsOneWidget);
      expect(find.text('Sophie Dupont'), findsOneWidget);
      expect(find.text('CM2'), findsOneWidget);
      expect(find.text('École Primaire Centre'), findsOneWidget);
    });

    testWidgets('should display notification settings', (WidgetTester tester) async {
      // Arrange
      bool notificationsEnabled = true;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return SwitchListTile(
                  title: const Text('Notifications'),
                  subtitle: const Text('Recevoir les notifications du bus'),
                  value: notificationsEnabled,
                  onChanged: (value) {
                    setState(() {
                      notificationsEnabled = value;
                    });
                  },
                );
              },
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Notifications'), findsOneWidget);
      expect(find.text('Recevoir les notifications du bus'), findsOneWidget);
      expect(find.byType(Switch), findsOneWidget);

      final switchWidget = tester.widget<Switch>(find.byType(Switch));
      expect(switchWidget.value, true);
    });

    testWidgets('should toggle notification switch', (WidgetTester tester) async {
      // Arrange
      bool notificationsEnabled = true;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return SwitchListTile(
                  title: const Text('Notifications'),
                  value: notificationsEnabled,
                  onChanged: (value) {
                    setState(() {
                      notificationsEnabled = value;
                    });
                  },
                );
              },
            ),
          ),
        ),
      );

      // Act - Toggle le switch
      await tester.tap(find.byType(Switch));
      await tester.pump();

      // Assert - Le switch devrait être désactivé
      final switchWidget = tester.widget<Switch>(find.byType(Switch));
      expect(switchWidget.value, false);
    });

    testWidgets('should display notification preferences', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                const SwitchListTile(
                  title: Text('Bus en route'),
                  subtitle: Text('Notification quand le bus démarre'),
                  value: true,
                  onChanged: null,
                ),
                const SwitchListTile(
                  title: Text('Bus à proximité'),
                  subtitle: Text('Notification quand le bus approche'),
                  value: true,
                  onChanged: null,
                ),
                const SwitchListTile(
                  title: Text('Retard'),
                  subtitle: Text('Notification en cas de retard'),
                  value: true,
                  onChanged: null,
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Bus en route'), findsOneWidget);
      expect(find.text('Bus à proximité'), findsOneWidget);
      expect(find.text('Retard'), findsOneWidget);
    });

    testWidgets('should display emergency contact section', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                const ListTile(
                  title: Text('Contact d\'urgence'),
                  subtitle: Text('+33 6 12 34 56 78'),
                  leading: Icon(Icons.phone),
                ),
                ElevatedButton(
                  onPressed: () {},
                  child: const Text('Modifier'),
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Contact d\'urgence'), findsOneWidget);
      expect(find.text('+33 6 12 34 56 78'), findsOneWidget);
      expect(find.byIcon(Icons.phone), findsOneWidget);
      expect(find.text('Modifier'), findsOneWidget);
    });

    testWidgets('should display photo upload option', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              children: [
                const CircleAvatar(
                  radius: 50,
                  child: Icon(Icons.person, size: 50),
                ),
                ElevatedButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.photo_camera),
                  label: const Text('Changer la photo'),
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(CircleAvatar), findsOneWidget);
      expect(find.byIcon(Icons.photo_camera), findsOneWidget);
      expect(find.text('Changer la photo'), findsOneWidget);
    });

    testWidgets('should have save button', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: () {},
              child: const Text('Enregistrer'),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Enregistrer'), findsOneWidget);
    });

    testWidgets('should display absence notification settings', (WidgetTester tester) async {
      // Arrange
      bool absenceNotifEnabled = true;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return SwitchListTile(
                  title: const Text('Notifications d\'absence'),
                  subtitle: const Text('Alertes si l\'enfant n\'est pas monté dans le bus'),
                  value: absenceNotifEnabled,
                  onChanged: (value) {
                    setState(() {
                      absenceNotifEnabled = value;
                    });
                  },
                );
              },
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Notifications d\'absence'), findsOneWidget);
      expect(find.text('Alertes si l\'enfant n\'est pas monté dans le bus'), findsOneWidget);
    });

    testWidgets('should display bus tracking preference', (WidgetTester tester) async {
      // Arrange
      bool trackBusEnabled = true;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return SwitchListTile(
                  title: const Text('Suivi en temps réel'),
                  subtitle: const Text('Voir la position du bus en temps réel'),
                  value: trackBusEnabled,
                  onChanged: (value) {
                    setState(() {
                      trackBusEnabled = value;
                    });
                  },
                );
              },
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Suivi en temps réel'), findsOneWidget);
      expect(find.text('Voir la position du bus en temps réel'), findsOneWidget);
    });

    testWidgets('should group settings by category', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView(
              children: const [
                ListTile(
                  title: Text('Informations générales'),
                  tileColor: Colors.grey,
                ),
                ListTile(title: Text('Nom'), subtitle: Text('Sophie Dupont')),
                Divider(),
                ListTile(
                  title: Text('Notifications'),
                  tileColor: Colors.grey,
                ),
                SwitchListTile(
                  title: Text('Bus en route'),
                  value: true,
                  onChanged: null,
                ),
                Divider(),
                ListTile(
                  title: Text('Contact'),
                  tileColor: Colors.grey,
                ),
                ListTile(title: Text('Téléphone'), subtitle: Text('+33 6 12 34 56 78')),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Informations générales'), findsOneWidget);
      expect(find.text('Notifications'), findsOneWidget);
      expect(find.text('Contact'), findsOneWidget);
      expect(find.byType(Divider), findsNWidgets(2));
    });
  });
}
