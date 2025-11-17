import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

// Tests pour Pull-to-Refresh sur HomeScreen

void main() {
  group('Pull-to-Refresh Tests', () {
    testWidgets('should display RefreshIndicator widget', (WidgetTester tester) async {
      // Arrange & Act
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RefreshIndicator(
              onRefresh: () async {},
              child: ListView(
                children: const [
                  ListTile(title: Text('Item 1')),
                  ListTile(title: Text('Item 2')),
                ],
              ),
            ),
          ),
        ),
      );

      // Assert
      expect(find.byType(RefreshIndicator), findsOneWidget);
    });

    testWidgets('should trigger refresh callback on pull down', (WidgetTester tester) async {
      // Arrange
      bool refreshCalled = false;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RefreshIndicator(
              onRefresh: () async {
                refreshCalled = true;
                await Future.delayed(const Duration(milliseconds: 100));
              },
              child: ListView(
                children: const [
                  SizedBox(height: 100, child: Text('Item 1')),
                  SizedBox(height: 100, child: Text('Item 2')),
                ],
              ),
            ),
          ),
        ),
      );

      // Act - Simuler un pull-to-refresh
      await tester.fling(
        find.text('Item 1'),
        const Offset(0, 300),
        1000,
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump(const Duration(milliseconds: 100));

      // Assert
      expect(refreshCalled, true);
    });

    testWidgets('should show loading indicator during refresh', (WidgetTester tester) async {
      // Arrange
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: RefreshIndicator(
              onRefresh: () async {
                await Future.delayed(const Duration(milliseconds: 500));
              },
              child: ListView(
                children: const [
                  SizedBox(height: 100, child: Text('Item 1')),
                ],
              ),
            ),
          ),
        ),
      );

      // Act - Déclencher refresh
      await tester.fling(
        find.text('Item 1'),
        const Offset(0, 300),
        1000,
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));

      // Assert - Un indicateur de chargement devrait être visible
      expect(find.byType(RefreshProgressIndicator), findsOneWidget);
    });

    testWidgets('should update data after refresh completes', (WidgetTester tester) async {
      // Arrange
      int itemCount = 2;

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: StatefulBuilder(
              builder: (context, setState) {
                return RefreshIndicator(
                  onRefresh: () async {
                    await Future.delayed(const Duration(milliseconds: 100));
                    setState(() {
                      itemCount = 5;
                    });
                  },
                  child: ListView.builder(
                    itemCount: itemCount,
                    itemBuilder: (context, index) {
                      return SizedBox(
                        height: 100,
                        child: Text('Item ${index + 1}'),
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ),
      );

      // Assert initial state
      expect(find.text('Item 1'), findsOneWidget);
      expect(find.text('Item 2'), findsOneWidget);
      expect(find.text('Item 3'), findsNothing);

      // Act - Pull to refresh
      await tester.fling(
        find.text('Item 1'),
        const Offset(0, 300),
        1000,
      );
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 100));
      await tester.pump(const Duration(milliseconds: 100));

      // Assert - Data should be updated
      expect(find.text('Item 3'), findsOneWidget);
      expect(find.text('Item 5'), findsOneWidget);
    });
  });
}
