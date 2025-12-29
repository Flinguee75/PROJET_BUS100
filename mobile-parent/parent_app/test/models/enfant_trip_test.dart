import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/enfant.dart';

/// Tests pour les méthodes de filtrage par trip de l'Enfant
void main() {
  group('Enfant - Trip Filtering Methods', () {
    test('isActiveForTrip returns true when child is enrolled in trip', () {
      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        activeTrips: ['morning_outbound', 'evening_return'],
      );

      expect(enfant.isActiveForTrip('morning_outbound'), true);
      expect(enfant.isActiveForTrip('evening_return'), true);
    });

    test('isActiveForTrip returns false when child is not enrolled in trip', () {
      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        activeTrips: ['morning_outbound', 'evening_return'],
      );

      expect(enfant.isActiveForTrip('midday_outbound'), false);
      expect(enfant.isActiveForTrip('midday_return'), false);
    });

    test('isActiveForTrip returns false when activeTrips is empty', () {
      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        activeTrips: [],
      );

      expect(enfant.isActiveForTrip('morning_outbound'), false);
      expect(enfant.isActiveForTrip('evening_return'), false);
    });

    test('getLocationForTrip returns correct location for morning_outbound', () {
      final morningLocation = EnfantLocation(
        address: '123 Rue du Matin',
        lat: 5.35,
        lng: -4.00,
      );

      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        morningPickup: morningLocation,
      );

      final location = enfant.getLocationForTrip(TripTimeOfDay.morningOutbound);
      expect(location, isNotNull);
      expect(location!.address, '123 Rue du Matin');
      expect(location.lat, 5.35);
      expect(location.lng, -4.00);
    });

    test('getLocationForTrip returns correct location for midday_outbound', () {
      final middayLocation = EnfantLocation(
        address: '456 Avenue du Midi',
        lat: 5.36,
        lng: -4.01,
      );

      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        middayDropoff: middayLocation,
      );

      final location = enfant.getLocationForTrip(TripTimeOfDay.middayOutbound);
      expect(location, isNotNull);
      expect(location!.address, '456 Avenue du Midi');
    });

    test('getLocationForTrip returns correct location for midday_return', () {
      final middayReturnLocation = EnfantLocation(
        address: '789 Boulevard du Retour',
        lat: 5.37,
        lng: -4.02,
      );

      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        middayPickup: middayReturnLocation,
      );

      final location = enfant.getLocationForTrip(TripTimeOfDay.middayReturn);
      expect(location, isNotNull);
      expect(location!.address, '789 Boulevard du Retour');
    });

    test('getLocationForTrip returns correct location for evening_return', () {
      final eveningLocation = EnfantLocation(
        address: '321 Place du Soir',
        lat: 5.38,
        lng: -4.03,
      );

      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        eveningDropoff: eveningLocation,
      );

      final location = enfant.getLocationForTrip(TripTimeOfDay.eveningReturn);
      expect(location, isNotNull);
      expect(location!.address, '321 Place du Soir');
    });

    test('getLocationForTrip returns null for unknown trip type', () {
      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
      );

      final location = enfant.getLocationForTrip('invalid_trip_type');
      expect(location, isNull);
    });

    test('getLocationForTrip returns null when location is not defined', () {
      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        // Pas de locations définies
      );

      expect(enfant.getLocationForTrip(TripTimeOfDay.morningOutbound), isNull);
      expect(enfant.getLocationForTrip(TripTimeOfDay.middayOutbound), isNull);
      expect(enfant.getLocationForTrip(TripTimeOfDay.middayReturn), isNull);
      expect(enfant.getLocationForTrip(TripTimeOfDay.eveningReturn), isNull);
    });

    test('Enfant with all 4 locations returns correct location for each trip', () {
      final enfant = Enfant(
        id: 'enfant1',
        nom: 'Martin',
        prenom: 'Emma',
        classe: 'CM1',
        ecole: 'École Primaire',
        busId: 'bus123',
        parentId: 'parent1',
        activeTrips: [
          'morning_outbound',
          'midday_outbound',
          'midday_return',
          'evening_return',
        ],
        morningPickup: EnfantLocation(
          address: 'Morning Address',
          lat: 5.35,
          lng: -4.00,
        ),
        middayDropoff: EnfantLocation(
          address: 'Midday Dropoff Address',
          lat: 5.36,
          lng: -4.01,
        ),
        middayPickup: EnfantLocation(
          address: 'Midday Pickup Address',
          lat: 5.37,
          lng: -4.02,
        ),
        eveningDropoff: EnfantLocation(
          address: 'Evening Dropoff Address',
          lat: 5.38,
          lng: -4.03,
        ),
      );

      // Vérifier toutes les inscriptions
      expect(enfant.isActiveForTrip('morning_outbound'), true);
      expect(enfant.isActiveForTrip('midday_outbound'), true);
      expect(enfant.isActiveForTrip('midday_return'), true);
      expect(enfant.isActiveForTrip('evening_return'), true);

      // Vérifier toutes les locations
      expect(
        enfant.getLocationForTrip(TripTimeOfDay.morningOutbound)!.address,
        'Morning Address',
      );
      expect(
        enfant.getLocationForTrip(TripTimeOfDay.middayOutbound)!.address,
        'Midday Dropoff Address',
      );
      expect(
        enfant.getLocationForTrip(TripTimeOfDay.middayReturn)!.address,
        'Midday Pickup Address',
      );
      expect(
        enfant.getLocationForTrip(TripTimeOfDay.eveningReturn)!.address,
        'Evening Dropoff Address',
      );
    });

    test('EnfantLocation fromJson and toJson work correctly', () {
      final json = {
        'address': '123 Test Street',
        'lat': 5.35,
        'lng': -4.00,
        'notes': 'Near the bakery',
      };

      final location = EnfantLocation.fromJson(json);
      expect(location.address, '123 Test Street');
      expect(location.lat, 5.35);
      expect(location.lng, -4.00);
      expect(location.notes, 'Near the bakery');

      final jsonOutput = location.toJson();
      expect(jsonOutput['address'], '123 Test Street');
      expect(jsonOutput['lat'], 5.35);
      expect(jsonOutput['lng'], -4.00);
      expect(jsonOutput['notes'], 'Near the bakery');
    });

    test('Enfant fromJson correctly parses activeTrips and locations', () {
      final json = {
        'id': 'enfant1',
        'firstName': 'Emma',
        'lastName': 'Martin',
        'grade': 'CM1',
        'schoolId': 'school1',
        'busId': 'bus123',
        'parentId': 'parent1',
        'activeTrips': ['morning_outbound', 'evening_return'],
        'locations': {
          'morningPickup': {
            'address': '123 Morning St',
            'lat': 5.35,
            'lng': -4.00,
          },
          'eveningDropoff': {
            'address': '456 Evening Ave',
            'lat': 5.38,
            'lng': -4.03,
          },
        },
      };

      final enfant = Enfant.fromJson(json);

      expect(enfant.prenom, 'Emma');
      expect(enfant.nom, 'Martin');
      expect(enfant.activeTrips.length, 2);
      expect(enfant.activeTrips, contains('morning_outbound'));
      expect(enfant.activeTrips, contains('evening_return'));

      expect(enfant.morningPickup, isNotNull);
      expect(enfant.morningPickup!.address, '123 Morning St');
      expect(enfant.eveningDropoff, isNotNull);
      expect(enfant.eveningDropoff!.address, '456 Evening Ave');

      expect(enfant.middayDropoff, isNull);
      expect(enfant.middayPickup, isNull);
    });
  });
}
