import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/enfant.dart';

void main() {
  group('Enfant Model Tests', () {
    test('Enfant.fromJson should correctly parse JSON data with photoUrl', () {
      // Arrange
      final json = {
        'id': 'enfant_001',
        'nom': 'Dupont',
        'prenom': 'Sophie',
        'classe': 'CM2',
        'ecole': 'École Primaire Centre',
        'busId': 'bus_001',
        'parentId': 'parent_001',
        'photoUrl': 'https://example.com/photo.jpg',
      };

      // Act
      final enfant = Enfant.fromJson(json);

      // Assert
      expect(enfant.id, 'enfant_001');
      expect(enfant.nom, 'Dupont');
      expect(enfant.prenom, 'Sophie');
      expect(enfant.classe, 'CM2');
      expect(enfant.ecole, 'École Primaire Centre');
      expect(enfant.busId, 'bus_001');
      expect(enfant.parentId, 'parent_001');
      expect(enfant.photoUrl, 'https://example.com/photo.jpg');
    });

    test('Enfant.fromJson should handle null photoUrl', () {
      // Arrange
      final json = {
        'id': 'enfant_002',
        'nom': 'Martin',
        'prenom': 'Lucas',
        'classe': 'CE1',
        'ecole': 'École Élémentaire Nord',
        'busId': 'bus_002',
        'parentId': 'parent_002',
      };

      // Act
      final enfant = Enfant.fromJson(json);

      // Assert
      expect(enfant.id, 'enfant_002');
      expect(enfant.nom, 'Martin');
      expect(enfant.prenom, 'Lucas');
      expect(enfant.classe, 'CE1');
      expect(enfant.ecole, 'École Élémentaire Nord');
      expect(enfant.busId, 'bus_002');
      expect(enfant.parentId, 'parent_002');
      expect(enfant.photoUrl, isNull);
    });

    test('Enfant.toJson should correctly serialize to JSON', () {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_003',
        nom: 'Bernard',
        prenom: 'Emma',
        classe: 'CP',
        ecole: 'École Jean Jaurès',
        busId: 'bus_003',
        parentId: 'parent_003',
        photoUrl: 'https://example.com/emma.jpg',
      );

      // Act
      final json = enfant.toJson();

      // Assert
      expect(json['id'], 'enfant_003');
      expect(json['nom'], 'Bernard');
      expect(json['prenom'], 'Emma');
      expect(json['classe'], 'CP');
      expect(json['ecole'], 'École Jean Jaurès');
      expect(json['busId'], 'bus_003');
      expect(json['parentId'], 'parent_003');
      expect(json['photoUrl'], 'https://example.com/emma.jpg');
    });

    test('Enfant.toJson should handle null photoUrl', () {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_004',
        nom: 'Petit',
        prenom: 'Nathan',
        classe: 'CE2',
        ecole: 'École Victor Hugo',
        busId: 'bus_004',
        parentId: 'parent_004',
      );

      // Act
      final json = enfant.toJson();

      // Assert
      expect(json['photoUrl'], isNull);
    });

    test('nomComplet should return correct full name', () {
      // Test case 1
      final enfant1 = Enfant(
        id: 'enfant_005',
        nom: 'Durand',
        prenom: 'Léa',
        classe: 'CM1',
        ecole: 'École Jules Ferry',
        busId: 'bus_005',
        parentId: 'parent_005',
      );

      expect(enfant1.nomComplet, 'Léa Durand');

      // Test case 2
      final enfant2 = Enfant(
        id: 'enfant_006',
        nom: 'Lefebvre',
        prenom: 'Thomas',
        classe: 'CE2',
        ecole: 'École Pasteur',
        busId: 'bus_006',
        parentId: 'parent_006',
      );

      expect(enfant2.nomComplet, 'Thomas Lefebvre');
    });

    test('Enfant model should handle special characters in names', () {
      // Arrange
      final json = {
        'id': 'enfant_007',
        'nom': 'O\'Connor',
        'prenom': 'Chloé',
        'classe': 'CM2',
        'ecole': 'École Saint-Exupéry',
        'busId': 'bus_007',
        'parentId': 'parent_007',
      };

      // Act
      final enfant = Enfant.fromJson(json);

      // Assert
      expect(enfant.nom, 'O\'Connor');
      expect(enfant.prenom, 'Chloé');
      expect(enfant.ecole, 'École Saint-Exupéry');
      expect(enfant.nomComplet, 'Chloé O\'Connor');
    });

    test('Enfant model should handle long class names', () {
      // Arrange
      final enfant = Enfant(
        id: 'enfant_008',
        nom: 'Rousseau',
        prenom: 'Mathilde',
        classe: 'CM2 - Classe de Madame Dubois',
        ecole: 'École Élémentaire République',
        busId: 'bus_008',
        parentId: 'parent_008',
      );

      // Act
      final json = enfant.toJson();

      // Assert
      expect(json['classe'], 'CM2 - Classe de Madame Dubois');
    });
  });
}
