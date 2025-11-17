import 'package:flutter_test/flutter_test.dart';
import 'package:fake_cloud_firestore/fake_cloud_firestore.dart';
import 'package:parent_app/models/enfant.dart';

void main() {
  group('EnfantService Tests', () {
    late FakeFirebaseFirestore fakeFirestore;

    setUp(() {
      fakeFirestore = FakeFirebaseFirestore();
    });

    test('getEnfantsByParentId should return empty list if no children exist', () async {
      // Arrange
      final parentId = 'parent_001';

      // Act
      final snapshot = await fakeFirestore
          .collection('students')
          .where('parentId', isEqualTo: parentId)
          .get();

      // Assert
      expect(snapshot.docs, isEmpty);
    });

    test('getEnfantsByParentId should return children for specific parent', () async {
      // Arrange
      final parentId = 'parent_001';

      await fakeFirestore.collection('students').doc('enfant_001').set({
        'nom': 'Dupont',
        'prenom': 'Sophie',
        'classe': 'CM2',
        'ecole': 'École Primaire Centre',
        'busId': 'bus_001',
        'parentId': parentId,
      });

      await fakeFirestore.collection('students').doc('enfant_002').set({
        'nom': 'Dupont',
        'prenom': 'Lucas',
        'classe': 'CE1',
        'ecole': 'École Primaire Centre',
        'busId': 'bus_001',
        'parentId': parentId,
      });

      // Ajouter un enfant d'un autre parent
      await fakeFirestore.collection('students').doc('enfant_003').set({
        'nom': 'Martin',
        'prenom': 'Emma',
        'classe': 'CP',
        'ecole': 'École Élémentaire Nord',
        'busId': 'bus_002',
        'parentId': 'parent_002',
      });

      // Act
      final snapshot = await fakeFirestore
          .collection('students')
          .where('parentId', isEqualTo: parentId)
          .get();

      final enfants = snapshot.docs.map((doc) {
        return Enfant.fromJson({
          'id': doc.id,
          ...doc.data(),
        });
      }).toList();

      // Assert
      expect(enfants.length, 2);
      expect(enfants[0].parentId, parentId);
      expect(enfants[1].parentId, parentId);
      expect(enfants[0].prenom, 'Sophie');
      expect(enfants[1].prenom, 'Lucas');
    });

    test('getEnfantById should return null if enfant does not exist', () async {
      // Arrange
      final enfantId = 'nonexistent';

      // Act
      final doc = await fakeFirestore.collection('students').doc(enfantId).get();

      // Assert
      expect(doc.exists, false);
    });

    test('getEnfantById should return Enfant object if enfant exists', () async {
      // Arrange
      final enfantId = 'enfant_001';
      final enfantData = {
        'nom': 'Dupont',
        'prenom': 'Sophie',
        'classe': 'CM2',
        'ecole': 'École Primaire Centre',
        'busId': 'bus_001',
        'parentId': 'parent_001',
        'photoUrl': 'https://example.com/photo.jpg',
      };

      await fakeFirestore.collection('students').doc(enfantId).set(enfantData);

      // Act
      final doc = await fakeFirestore.collection('students').doc(enfantId).get();

      // Assert
      expect(doc.exists, true);
      final enfant = Enfant.fromJson({
        'id': doc.id,
        ...doc.data()!,
      });
      expect(enfant.id, enfantId);
      expect(enfant.nom, 'Dupont');
      expect(enfant.prenom, 'Sophie');
      expect(enfant.photoUrl, 'https://example.com/photo.jpg');
    });

    test('getEnfantsByParentId should handle multiple children with different buses', () async {
      // Arrange
      final parentId = 'parent_001';

      await fakeFirestore.collection('students').doc('enfant_001').set({
        'nom': 'Martin',
        'prenom': 'Léa',
        'classe': 'CM1',
        'ecole': 'École A',
        'busId': 'bus_001',
        'parentId': parentId,
      });

      await fakeFirestore.collection('students').doc('enfant_002').set({
        'nom': 'Martin',
        'prenom': 'Tom',
        'classe': 'CE2',
        'ecole': 'École B',
        'busId': 'bus_002',
        'parentId': parentId,
      });

      // Act
      final snapshot = await fakeFirestore
          .collection('students')
          .where('parentId', isEqualTo: parentId)
          .get();

      final enfants = snapshot.docs.map((doc) {
        return Enfant.fromJson({
          'id': doc.id,
          ...doc.data(),
        });
      }).toList();

      // Assert
      expect(enfants.length, 2);
      expect(enfants[0].busId, 'bus_001');
      expect(enfants[1].busId, 'bus_002');
      expect(enfants[0].ecole, 'École A');
      expect(enfants[1].ecole, 'École B');
    });

    test('Enfant data should be correctly structured for Firebase', () async {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_test',
        nom: 'Bernard',
        prenom: 'Emma',
        classe: 'CP',
        ecole: 'École Test',
        busId: 'bus_test',
        parentId: 'parent_test',
      );

      // Act
      await fakeFirestore.collection('students').doc(enfant.id).set(enfant.toJson());
      final doc = await fakeFirestore.collection('students').doc(enfant.id).get();

      // Assert
      expect(doc.exists, true);
      final retrievedEnfant = Enfant.fromJson({
        'id': doc.id,
        ...doc.data()!,
      });
      expect(retrievedEnfant.nom, enfant.nom);
      expect(retrievedEnfant.prenom, enfant.prenom);
      expect(retrievedEnfant.classe, enfant.classe);
    });

    test('should handle special characters in enfant names', () async {
      // Arrange
      final enfantData = {
        'nom': 'O\'Connor',
        'prenom': 'Chloé',
        'classe': 'CM2',
        'ecole': 'École Saint-Exupéry',
        'busId': 'bus_001',
        'parentId': 'parent_001',
      };

      await fakeFirestore.collection('students').doc('enfant_special').set(enfantData);

      // Act
      final doc = await fakeFirestore.collection('students').doc('enfant_special').get();
      final enfant = Enfant.fromJson({
        'id': doc.id,
        ...doc.data()!,
      });

      // Assert
      expect(enfant.nom, 'O\'Connor');
      expect(enfant.prenom, 'Chloé');
      expect(enfant.nomComplet, 'Chloé O\'Connor');
    });
  });
}
