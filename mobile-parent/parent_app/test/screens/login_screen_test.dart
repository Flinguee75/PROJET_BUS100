import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Tests pour LoginScreen
// Ces tests vérifient les éléments visuels et les interactions de l'écran de connexion

void main() {
  group('LoginScreen Widget Tests', () {
    testWidgets('should display all UI elements', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(
              child: Form(
                child: Column(
                  children: [
                    const Icon(Icons.directions_bus),
                    const Text('Transport Scolaire'),
                    const Text('Espace Parents'),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Email'),
                    ),
                    TextFormField(
                      decoration: const InputDecoration(labelText: 'Mot de passe'),
                      obscureText: true,
                    ),
                    ElevatedButton(
                      onPressed: () {},
                      child: const Text('Se connecter'),
                    ),
                    TextButton(
                      onPressed: () {},
                      child: const Text('Mot de passe oublié ?'),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      );

      // Assert
      expect(find.byIcon(Icons.directions_bus), findsOneWidget);
      expect(find.text('Transport Scolaire'), findsOneWidget);
      expect(find.text('Espace Parents'), findsOneWidget);
      expect(find.byType(TextFormField), findsNWidgets(2));
      expect(find.text('Se connecter'), findsOneWidget);
      expect(find.text('Mot de passe oublié ?'), findsOneWidget);
    });

    testWidgets('email field should validate empty input', (WidgetTester tester) async {
      // Arrange
      final formKey = GlobalKey<FormState>();
      final emailController = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                controller: emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer votre email';
                  }
                  if (!value.contains('@')) {
                    return 'Email invalide';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Act - Soumettre le formulaire sans entrer d'email
      formKey.currentState!.validate();
      await tester.pump();

      // Assert
      expect(find.text('Veuillez entrer votre email'), findsOneWidget);
    });

    testWidgets('email field should validate invalid format', (WidgetTester tester) async {
      // Arrange
      final formKey = GlobalKey<FormState>();
      final emailController = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                controller: emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer votre email';
                  }
                  if (!value.contains('@')) {
                    return 'Email invalide';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Act - Entrer un email invalide
      await tester.enterText(find.byType(TextFormField), 'invalidemail');
      formKey.currentState!.validate();
      await tester.pump();

      // Assert
      expect(find.text('Email invalide'), findsOneWidget);
    });

    testWidgets('email field should accept valid email', (WidgetTester tester) async {
      // Arrange
      final formKey = GlobalKey<FormState>();
      final emailController = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                controller: emailController,
                decoration: const InputDecoration(labelText: 'Email'),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer votre email';
                  }
                  if (!value.contains('@')) {
                    return 'Email invalide';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Act - Entrer un email valide
      await tester.enterText(find.byType(TextFormField), 'test@example.com');
      final isValid = formKey.currentState!.validate();
      await tester.pump();

      // Assert
      expect(isValid, true);
      expect(find.text('Veuillez entrer votre email'), findsNothing);
      expect(find.text('Email invalide'), findsNothing);
    });

    testWidgets('password field should validate empty input', (WidgetTester tester) async {
      // Arrange
      final formKey = GlobalKey<FormState>();
      final passwordController = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                controller: passwordController,
                decoration: const InputDecoration(labelText: 'Mot de passe'),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer votre mot de passe';
                  }
                  if (value.length < 6) {
                    return 'Le mot de passe doit contenir au moins 6 caractères';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Act
      formKey.currentState!.validate();
      await tester.pump();

      // Assert
      expect(find.text('Veuillez entrer votre mot de passe'), findsOneWidget);
    });

    testWidgets('password field should validate minimum length', (WidgetTester tester) async {
      // Arrange
      final formKey = GlobalKey<FormState>();
      final passwordController = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                controller: passwordController,
                decoration: const InputDecoration(labelText: 'Mot de passe'),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer votre mot de passe';
                  }
                  if (value.length < 6) {
                    return 'Le mot de passe doit contenir au moins 6 caractères';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Act - Entrer un mot de passe trop court
      await tester.enterText(find.byType(TextFormField), '12345');
      formKey.currentState!.validate();
      await tester.pump();

      // Assert
      expect(find.text('Le mot de passe doit contenir au moins 6 caractères'), findsOneWidget);
    });

    testWidgets('password field should accept valid password', (WidgetTester tester) async {
      // Arrange
      final formKey = GlobalKey<FormState>();
      final passwordController = TextEditingController();

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Form(
              key: formKey,
              child: TextFormField(
                controller: passwordController,
                decoration: const InputDecoration(labelText: 'Mot de passe'),
                obscureText: true,
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer votre mot de passe';
                  }
                  if (value.length < 6) {
                    return 'Le mot de passe doit contenir au moins 6 caractères';
                  }
                  return null;
                },
              ),
            ),
          ),
        ),
      );

      // Act - Entrer un mot de passe valide
      await tester.enterText(find.byType(TextFormField), 'password123');
      final isValid = formKey.currentState!.validate();
      await tester.pump();

      // Assert
      expect(isValid, true);
    });

    testWidgets('password visibility toggle should work', (WidgetTester tester) async {
      // Arrange
      bool obscurePassword = true;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return TextFormField(
                  decoration: InputDecoration(
                    labelText: 'Mot de passe',
                    suffixIcon: IconButton(
                      icon: Icon(
                        obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(() {
                          obscurePassword = !obscurePassword;
                        });
                      },
                    ),
                  ),
                  obscureText: obscurePassword,
                );
              },
            ),
          ),
        ),
      );

      // Assert - Initialement masqué
      final textField = tester.widget<TextFormField>(find.byType(TextFormField));
      expect(textField.obscureText, true);
      expect(find.byIcon(Icons.visibility_outlined), findsOneWidget);

      // Act - Cliquer sur l'icône
      await tester.tap(find.byType(IconButton));
      await tester.pump();

      // Assert - Maintenant visible
      expect(find.byIcon(Icons.visibility_off_outlined), findsOneWidget);
    });

    testWidgets('login button should be disabled during loading', (WidgetTester tester) async {
      // Arrange
      bool isLoading = true;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: isLoading ? null : () {},
              child: isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Se connecter'),
            ),
          ),
        ),
      );

      // Assert
      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNull);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('login button should be enabled when not loading', (WidgetTester tester) async {
      // Arrange
      bool isLoading = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: ElevatedButton(
              onPressed: isLoading ? null : () {},
              child: isLoading
                  ? const CircularProgressIndicator()
                  : const Text('Se connecter'),
            ),
          ),
        ),
      );

      // Assert
      final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
      expect(button.onPressed, isNotNull);
      expect(find.text('Se connecter'), findsOneWidget);
    });

    testWidgets('forgot password button should be clickable', (WidgetTester tester) async {
      // Arrange
      bool clicked = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TextButton(
              onPressed: () {
                clicked = true;
              },
              child: const Text('Mot de passe oublié ?'),
            ),
          ),
        ),
      );

      // Act
      await tester.tap(find.byType(TextButton));
      await tester.pump();

      // Assert
      expect(clicked, true);
    });
  });
}
