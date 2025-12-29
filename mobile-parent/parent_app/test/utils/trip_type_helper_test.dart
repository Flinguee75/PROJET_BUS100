import 'package:flutter_test/flutter_test.dart';
import 'package:parent_app/models/enfant.dart';
import 'package:parent_app/utils/trip_type_helper.dart';

/// Tests pour TripTypeHelper - détection du type de trajet selon l'heure
void main() {
  group('TripTypeHelper - getCurrentTimeOfDay', () {
    test('returns morning_outbound for hours 6-8 (6h, 7h, 8h)', () {
      final time6h = DateTime(2025, 1, 15, 6, 30);
      final time7h = DateTime(2025, 1, 15, 7, 0);
      final time8h = DateTime(2025, 1, 15, 8, 45);

      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time6h),
        TripTimeOfDay.morningOutbound,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time7h),
        TripTimeOfDay.morningOutbound,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time8h),
        TripTimeOfDay.morningOutbound,
      );
    });

    test('returns midday_outbound for hours 12-13 (12h, 13h)', () {
      final time12h = DateTime(2025, 1, 15, 12, 0);
      final time13h = DateTime(2025, 1, 15, 13, 30);

      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time12h),
        TripTimeOfDay.middayOutbound,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time13h),
        TripTimeOfDay.middayOutbound,
      );
    });

    test('returns midday_return for hour 14', () {
      final time14h = DateTime(2025, 1, 15, 14, 0);
      final time14h30 = DateTime(2025, 1, 15, 14, 30);

      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time14h),
        TripTimeOfDay.middayReturn,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time14h30),
        TripTimeOfDay.middayReturn,
      );
    });

    test('returns evening_return for hours 15-17 (15h, 16h, 17h)', () {
      final time15h = DateTime(2025, 1, 15, 15, 0);
      final time16h = DateTime(2025, 1, 15, 16, 30);
      final time17h = DateTime(2025, 1, 15, 17, 45);

      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time15h),
        TripTimeOfDay.eveningReturn,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time16h),
        TripTimeOfDay.eveningReturn,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time17h),
        TripTimeOfDay.eveningReturn,
      );
    });

    test('returns null for non-trip hours', () {
      // Nuit
      final time0h = DateTime(2025, 1, 15, 0, 0);
      final time3h = DateTime(2025, 1, 15, 3, 0);
      final time5h = DateTime(2025, 1, 15, 5, 59);

      // Après le matin, avant midi
      final time9h = DateTime(2025, 1, 15, 9, 0);
      final time10h = DateTime(2025, 1, 15, 10, 30);
      final time11h = DateTime(2025, 1, 15, 11, 45);

      // Soir tard
      final time18h = DateTime(2025, 1, 15, 18, 0);
      final time20h = DateTime(2025, 1, 15, 20, 0);
      final time23h = DateTime(2025, 1, 15, 23, 59);

      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time0h), isNull);
      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time3h), isNull);
      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time5h), isNull);
      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time9h), isNull);
      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time10h), isNull);
      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time11h), isNull);
      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time18h), isNull);
      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time20h), isNull);
      expect(TripTypeHelper.getCurrentTimeOfDay(currentTime: time23h), isNull);
    });

    test('boundary test: 8h59 is morning_outbound, 9h00 is null', () {
      final time8h59 = DateTime(2025, 1, 15, 8, 59);
      final time9h00 = DateTime(2025, 1, 15, 9, 0);

      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time8h59),
        TripTimeOfDay.morningOutbound,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time9h00),
        isNull,
      );
    });

    test('boundary test: 13h59 is midday_outbound, 14h00 is midday_return', () {
      final time13h59 = DateTime(2025, 1, 15, 13, 59);
      final time14h00 = DateTime(2025, 1, 15, 14, 0);

      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time13h59),
        TripTimeOfDay.middayOutbound,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time14h00),
        TripTimeOfDay.middayReturn,
      );
    });

    test('boundary test: 14h59 is midday_return, 15h00 is evening_return', () {
      final time14h59 = DateTime(2025, 1, 15, 14, 59);
      final time15h00 = DateTime(2025, 1, 15, 15, 0);

      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time14h59),
        TripTimeOfDay.middayReturn,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time15h00),
        TripTimeOfDay.eveningReturn,
      );
    });

    test('boundary test: 17h59 is evening_return, 18h00 is null', () {
      final time17h59 = DateTime(2025, 1, 15, 17, 59);
      final time18h00 = DateTime(2025, 1, 15, 18, 0);

      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time17h59),
        TripTimeOfDay.eveningReturn,
      );
      expect(
        TripTypeHelper.getCurrentTimeOfDay(currentTime: time18h00),
        isNull,
      );
    });
  });

  group('TripTypeHelper - detectTripType', () {
    test('returns ramassage for morning hours (6h-8h)', () {
      final time7h = DateTime(2025, 1, 15, 7, 30);
      expect(
        TripTypeHelper.detectTripType(currentTime: time7h),
        TripType.ramassage,
      );
    });

    test('returns depot for midday hours (12h-13h)', () {
      final time12h = DateTime(2025, 1, 15, 12, 30);
      expect(
        TripTypeHelper.detectTripType(currentTime: time12h),
        TripType.depot,
      );
    });

    test('returns ramassage for midday return hours (14h)', () {
      final time14h = DateTime(2025, 1, 15, 14, 30);
      expect(
        TripTypeHelper.detectTripType(currentTime: time14h),
        TripType.ramassage,
      );
    });

    test('returns depot for evening hours (15h-17h)', () {
      final time16h = DateTime(2025, 1, 15, 16, 30);
      expect(
        TripTypeHelper.detectTripType(currentTime: time16h),
        TripType.depot,
      );
    });

    test('returns ramassage by default for non-trip hours', () {
      final time10h = DateTime(2025, 1, 15, 10, 0);
      final time23h = DateTime(2025, 1, 15, 23, 0);

      expect(
        TripTypeHelper.detectTripType(currentTime: time10h),
        TripType.ramassage,
      );
      expect(
        TripTypeHelper.detectTripType(currentTime: time23h),
        TripType.ramassage,
      );
    });
  });

  group('TripTypeHelper - Helper Methods', () {
    test('getLabel returns correct labels', () {
      expect(TripTypeHelper.getLabel(TripType.ramassage), 'Ramassage');
      expect(TripTypeHelper.getLabel(TripType.depot), 'Dépôt');
    });

    test('getActionMessage returns correct messages', () {
      expect(
        TripTypeHelper.getActionMessage(TripType.ramassage, 'Emma'),
        'pour récupérer Emma',
      );
      expect(
        TripTypeHelper.getActionMessage(TripType.depot, 'Lucas'),
        'pour déposer Lucas',
      );
    });

    test('getEmoji returns correct emojis', () {
      expect(TripTypeHelper.getEmoji(TripType.ramassage), '🌅');
      expect(TripTypeHelper.getEmoji(TripType.depot), '🌇');
    });
  });

  group('TripTypeHelper - Complete Workflow', () {
    test('morning workflow: 7h30 -> morning_outbound -> ramassage', () {
      final morningTime = DateTime(2025, 1, 15, 7, 30);

      final timeOfDay = TripTypeHelper.getCurrentTimeOfDay(
        currentTime: morningTime,
      );
      final tripType = TripTypeHelper.detectTripType(
        currentTime: morningTime,
      );

      expect(timeOfDay, TripTimeOfDay.morningOutbound);
      expect(tripType, TripType.ramassage);
      expect(TripTypeHelper.getLabel(tripType), 'Ramassage');
      expect(
        TripTypeHelper.getActionMessage(tripType, 'Emma'),
        'pour récupérer Emma',
      );
    });

    test('evening workflow: 16h30 -> evening_return -> depot', () {
      final eveningTime = DateTime(2025, 1, 15, 16, 30);

      final timeOfDay = TripTypeHelper.getCurrentTimeOfDay(
        currentTime: eveningTime,
      );
      final tripType = TripTypeHelper.detectTripType(
        currentTime: eveningTime,
      );

      expect(timeOfDay, TripTimeOfDay.eveningReturn);
      expect(tripType, TripType.depot);
      expect(TripTypeHelper.getLabel(tripType), 'Dépôt');
      expect(
        TripTypeHelper.getActionMessage(tripType, 'Lucas'),
        'pour déposer Lucas',
      );
    });

    test('midday outbound workflow: 12h30 -> midday_outbound -> depot', () {
      final middayTime = DateTime(2025, 1, 15, 12, 30);

      final timeOfDay = TripTypeHelper.getCurrentTimeOfDay(
        currentTime: middayTime,
      );
      final tripType = TripTypeHelper.detectTripType(
        currentTime: middayTime,
      );

      expect(timeOfDay, TripTimeOfDay.middayOutbound);
      expect(tripType, TripType.depot);
    });

    test('midday return workflow: 14h15 -> midday_return -> ramassage', () {
      final middayReturnTime = DateTime(2025, 1, 15, 14, 15);

      final timeOfDay = TripTypeHelper.getCurrentTimeOfDay(
        currentTime: middayReturnTime,
      );
      final tripType = TripTypeHelper.detectTripType(
        currentTime: middayReturnTime,
      );

      expect(timeOfDay, TripTimeOfDay.middayReturn);
      expect(tripType, TripType.ramassage);
    });
  });
}
