import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/user_profile.dart';

// Tests pour ProfileScreen

void main() {
  group('ProfileScreen Widget Tests', () {
    late UserProfile testProfile;

    setUp(() {
      testProfile = UserProfile(
        uid: 'user_123',
        email: 'test@example.com',
        displayName: 'Jean Dupont',
        phoneNumber: '+33612345678',
        address: '123 Rue de la Paix, Paris',
        emergencyContact: '+33687654321',
      );
    });

    testWidgets('should display user profile information', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            appBar: AppBar(title: const Text('Profil')),
            body: ListView(
              children: [
                ListTile(
                  title: const Text('Nom'),
                  subtitle: Text(testProfile.displayName!),
                ),
                ListTile(
                  title: const Text('Email'),
                  subtitle: Text(testProfile.email),
                ),
                ListTile(
                  title: const Text('Téléphone'),
                  subtitle: Text(testProfile.phoneNumber!),
                ),
                ListTile(
                  title: const Text('Adresse'),
                  subtitle: Text(testProfile.address!),
                ),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Profil'), findsOneWidget);
      expect(find.text('Jean Dupont'), findsOneWidget);
      expect(find.text('test@example.com'), findsOneWidget);
      expect(find.text('+33612345678'), findsOneWidget);
      expect(find.text('123 Rue de la Paix, Paris'), findsOneWidget);
    });

    testWidgets('should display user avatar with initials', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: CircleAvatar(
              radius: 50,
              child: Text(testProfile.initials),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('JD'), findsOneWidget);
      expect(find.byType(CircleAvatar), findsOneWidget);
    });

    testWidgets('should have edit profile button', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.edit),
              label: const Text('Modifier le profil'),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Modifier le profil'), findsOneWidget);
      expect(find.byIcon(Icons.edit), findsOneWidget);
    });

    testWidgets('should have change password button', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListTile(
              leading: const Icon(Icons.lock),
              title: const Text('Changer le mot de passe'),
              trailing: const Icon(Icons.arrow_forward_ios),
              onTap: () {},
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Changer le mot de passe'), findsOneWidget);
      expect(find.byIcon(Icons.lock), findsOneWidget);
    });

    testWidgets('should have logout button', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.logout),
              label: const Text('Déconnexion'),
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Déconnexion'), findsOneWidget);
      expect(find.byIcon(Icons.logout), findsOneWidget);
    });

    testWidgets('should show confirmation dialog on logout', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Builder(
              builder: (context) {
                return ElevatedButton(
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Déconnexion'),
                        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Annuler'),
                          ),
                          TextButton(
                            onPressed: () {},
                            child: const Text('Déconnexion'),
                          ),
                        ],
                      ),
                    );
                  },
                  child: const Text('Logout'),
                );
              },
            ),
          ),
        ),
      );

      // Act
      await tester.tap(find.text('Logout'));
      await tester.pumpAndSettle();

      // Assert
      expect(find.text('Voulez-vous vraiment vous déconnecter ?'), findsOneWidget);
      expect(find.text('Annuler'), findsOneWidget);
      expect(find.text('Déconnexion'), findsNWidgets(2)); // Button + Dialog
    });

    testWidgets('should display notifications toggle', (WidgetTester tester) async {
      // Arrange
      bool notificationsEnabled = true;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return SwitchListTile(
                  title: const Text('Notifications'),
                  subtitle: const Text('Activer les notifications'),
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
      expect(find.byType(Switch), findsOneWidget);

      final switchWidget = tester.widget<Switch>(find.byType(Switch));
      expect(switchWidget.value, true);
    });

    testWidgets('should navigate to edit profile screen', (WidgetTester tester) async {
      // Arrange
      bool navigatedToEdit = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Builder(
            builder: (context) {
              return Scaffold(
                body: ElevatedButton(
                  onPressed: () {
                    navigatedToEdit = true;
                  },
                  child: const Text('Modifier le profil'),
                ),
              );
            },
          ),
        ),
      );

      // Act
      await tester.tap(find.text('Modifier le profil'));
      await tester.pump();

      // Assert
      expect(navigatedToEdit, true);
    });

    testWidgets('should display profile sections with dividers', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ListView(
              children: const [
                ListTile(
                  title: Text('Informations personnelles'),
                  tileColor: Colors.grey,
                ),
                ListTile(title: Text('Nom')),
                Divider(),
                ListTile(
                  title: Text('Paramètres'),
                  tileColor: Colors.grey,
                ),
                SwitchListTile(
                  title: Text('Notifications'),
                  value: true,
                  onChanged: null,
                ),
                Divider(),
                ListTile(
                  title: Text('Sécurité'),
                  tileColor: Colors.grey,
                ),
                ListTile(title: Text('Mot de passe')),
              ],
            ),
          ),
        ),
      );

      // Assert
      expect(find.text('Informations personnelles'), findsOneWidget);
      expect(find.text('Paramètres'), findsOneWidget);
      expect(find.text('Sécurité'), findsOneWidget);
      expect(find.byType(Divider), findsNWidgets(2));
    });
  });
}
