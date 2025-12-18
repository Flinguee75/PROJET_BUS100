import 'dart:async';
import 'dart:ui';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:geolocator/geolocator.dart';
import 'package:battery_plus/battery_plus.dart';
import 'package:firebase_core/firebase_core.dart';
import '../models/trip_type.dart';
import '../services/gps_queue_manager.dart';
import '../services/gps_service.dart';
import 'dart:math' show sin, cos, sqrt, atan2;
import '../firebase_options.dart';

/// Service GPS en arrière-plan utilisant un isolate séparé
/// Survit au backgrounding de l'app grâce au Foreground Service Android
class BackgroundGpsService {
  static final BackgroundGpsService instance = BackgroundGpsService._init();

  final FlutterBackgroundService _service = FlutterBackgroundService();
  final FlutterLocalNotificationsPlugin _notificationsPlugin =
      FlutterLocalNotificationsPlugin();

  // Paramètres de tracking
  static const String _busIdKey = 'busId';
  static const String _driverIdKey = 'driverId';
  static const String _routeIdKey = 'routeId';
  static const String _tripTypeKey = 'tripType';

  BackgroundGpsService._init();

  /// Initialise le service background
  Future<void> initialize() async {
    debugPrint('🚀 Initialisation BackgroundGpsService');

    await _initializeNotifications();

    await _service.configure(
      iosConfiguration: IosConfiguration(
        // iOS non supporté pour cette version
        autoStart: false,
        onForeground: onStart,
        onBackground: onIosBackground,
      ),
      androidConfiguration: AndroidConfiguration(
        onStart: onStart,
        autoStart: false, // Ne démarre pas automatiquement
        isForegroundMode: true, // Mode foreground avec notification
        autoStartOnBoot: false, // Ne redémarre pas au boot
        notificationChannelId: 'bus_tracking_channel',
        initialNotificationTitle: 'Suivi Bus',
        initialNotificationContent: 'Initialisation du tracking GPS...',
        foregroundServiceNotificationId: 888,
        foregroundServiceTypes: [AndroidForegroundType.location],
      ),
    );

    debugPrint('✅ BackgroundGpsService initialisé');
  }

  Future<void> _initializeNotifications() async {
    if (defaultTargetPlatform != TargetPlatform.android) {
      return;
    }

    const initializationSettings = InitializationSettings(
      android: AndroidInitializationSettings('@mipmap/ic_launcher'),
    );

    await _notificationsPlugin.initialize(initializationSettings);

    const AndroidNotificationChannel channel = AndroidNotificationChannel(
      'bus_tracking_channel',
      'Suivi Bus',
      description: 'Notifications pour le suivi GPS en arrière-plan',
      importance: Importance.low,
    );

    await _notificationsPlugin
        .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin>()
        ?.createNotificationChannel(channel);
  }

  /// Démarre le tracking GPS
  Future<bool> startTracking({
    required String busId,
    required String driverId,
    required TripType tripType,
    String? routeId,
  }) async {
    try {
      // Vérifier les permissions GPS
      final hasPermission = await GPSService.checkLocationPermission();
      if (!hasPermission) {
        debugPrint('❌ Permissions GPS manquantes');
        return false;
      }

      debugPrint('▶️ Démarrage tracking GPS pour bus $busId');

      // Passer les paramètres au service
      final isRunning = await _service.isRunning();

      if (isRunning) {
        // Service déjà en cours, mettre à jour les paramètres
        _service.invoke('update', {
          _busIdKey: busId,
          _driverIdKey: driverId,
          _routeIdKey: routeId,
          _tripTypeKey: tripType.firestoreValue,
        });
      } else {
        // Démarrer le service
        await _service.startService();

        // Attendre un peu que le service démarre
        await Future.delayed(const Duration(milliseconds: 500));

        // Envoyer les paramètres
        _service.invoke('start', {
          _busIdKey: busId,
          _driverIdKey: driverId,
          _routeIdKey: routeId,
          _tripTypeKey: tripType.firestoreValue,
        });
      }

      debugPrint('✅ Tracking GPS démarré');
      return true;
    } catch (e) {
      debugPrint('❌ Erreur démarrage tracking: $e');
      return false;
    }
  }

  /// Arrête le tracking GPS
  Future<void> stopTracking() async {
    try {
      debugPrint('⏹️ Arrêt tracking GPS');

      _service.invoke('stop');

      // Arrêter le service après un court délai
      await Future.delayed(const Duration(seconds: 1));
      _service.invoke('stopService');

      debugPrint('✅ Tracking GPS arrêté');
    } catch (e) {
      debugPrint('❌ Erreur arrêt tracking: $e');
    }
  }

  /// Vérifie si le service est en cours d'exécution
  Future<bool> isRunning() async {
    return await _service.isRunning();
  }
}

/// Point d'entrée du service background (isolate)
@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  // Obligatoire pour Flutter background service
  DartPluginRegistrant.ensureInitialized();
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  debugPrint('🔄 Service background démarré (isolate)');

  // État du tracking
  String? currentBusId;
  String? currentDriverId;
  String? currentRouteId;
  String? currentTripType;

  Timer? gpsTimer;
  Position? lastSentPosition;
  DateTime? lastSentTime;

  final battery = Battery();
  final queueManager = GpsQueueManager.instance;

  // Initialiser le queue manager
  await queueManager.initialize();

  // Si Android, configurer la notification
  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((event) {
      service.setAsForegroundService();
    });

    service.on('setAsBackground').listen((event) {
      service.setAsBackgroundService();
    });
  }

  // Écouter la commande "start" (démarrage tracking)
  service.on('start').listen((event) async {
    debugPrint('📍 Commande START reçue');

    if (event != null) {
      currentBusId = event[BackgroundGpsService._busIdKey];
      currentDriverId = event[BackgroundGpsService._driverIdKey];
      currentRouteId = event[BackgroundGpsService._routeIdKey];
      currentTripType = event[BackgroundGpsService._tripTypeKey];

      debugPrint('🚌 Tracking: Bus=$currentBusId, Driver=$currentDriverId');

      // Annuler le timer existant si présent
      gpsTimer?.cancel();

      // Démarrer le polling GPS
      gpsTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
        if (currentBusId == null) {
          timer.cancel();
          return;
        }

        try {
          // Obtenir la position actuelle
          final position = await _getCurrentPosition();
          if (position == null) {
            debugPrint('⚠️ Position GPS null, skip');
            return;
          }

          // Filtrage par distance (5m)
          final shouldSend = _shouldSendPosition(
            position,
            lastSentPosition,
            lastSentTime,
          );

          if (!shouldSend) {
            debugPrint('⏭️ Position non envoyée (filtre distance/temps)');
            return;
          }

          // Mettre à jour la notification avec la vitesse
          if (service is AndroidServiceInstance) {
            final speedKmh = (position.speed * 3.6).toStringAsFixed(1);
            service.setForegroundNotificationInfo(
              title: 'Suivi Bus Actif',
              content: 'Bus $currentBusId • Vitesse: $speedKmh km/h',
            );
          }

          // Mise en queue (offline-first)
          await queueManager.enqueue(
            busId: currentBusId!,
            position: position,
            driverId: currentDriverId,
            routeId: currentRouteId,
            tripType: currentTripType,
            status: 'en_route',
          );

          lastSentPosition = position;
          lastSentTime = DateTime.now();

          debugPrint('✅ GPS enqueued: ${position.latitude}, ${position.longitude}');
        } catch (e) {
          debugPrint('❌ Erreur GPS polling: $e');
        }
      });
    }
  });

  // Écouter la commande "update" (mise à jour paramètres sans restart)
  service.on('update').listen((event) {
    if (event != null) {
      currentBusId = event[BackgroundGpsService._busIdKey];
      currentDriverId = event[BackgroundGpsService._driverIdKey];
      currentRouteId = event[BackgroundGpsService._routeIdKey];
      currentTripType = event[BackgroundGpsService._tripTypeKey];
      debugPrint('🔄 Paramètres tracking mis à jour');
    }
  });

  // Écouter la commande "stop" (arrêt tracking)
  service.on('stop').listen((event) {
    debugPrint('⏹️ Commande STOP reçue');
    gpsTimer?.cancel();
    gpsTimer = null;
    currentBusId = null;
    lastSentPosition = null;
    lastSentTime = null;
  });

  // Écouter la commande "stopService" (arrêt complet du service)
  service.on('stopService').listen((event) async {
    debugPrint('🛑 Commande STOP SERVICE reçue');
    await service.stopSelf();
  });

  // Timer périodique pour ajuster la fréquence selon batterie (optionnel)
  Timer.periodic(const Duration(minutes: 1), (timer) async {
    if (gpsTimer == null || currentBusId == null) return;

    final batteryLevel = await battery.batteryLevel;
    final batteryState = await battery.batteryState;

    // Ajuster la fréquence si batterie faible
    if (batteryLevel < 20 && batteryState != BatteryState.charging) {
      debugPrint('🔋 Batterie faible ($batteryLevel%), maintien fréquence 3s');
      // Pour l'instant, on garde 3s même en batterie faible
      // Pourrait être ajusté à 5s ou 10s si nécessaire
    }
  });
}

/// Point d'entrée iOS background (non utilisé car Android uniquement)
@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  debugPrint('⚠️ iOS background appelé (non supporté)');
  return true;
}

/// Obtient la position GPS actuelle
Future<Position?> _getCurrentPosition() async {
  try {
    return await Geolocator.getCurrentPosition(
      desiredAccuracy: LocationAccuracy.high,
      timeLimit: const Duration(seconds: 5),
    );
  } catch (e) {
    debugPrint('❌ Erreur getCurrentPosition: $e');
    return null;
  }
}

/// Détermine si la position doit être envoyée (filtre distance 5m)
bool _shouldSendPosition(
  Position newPosition,
  Position? lastPosition,
  DateTime? lastSentTime,
) {
  // Toujours envoyer la première position
  if (lastPosition == null || lastSentTime == null) {
    return true;
  }

  // Toujours envoyer si plus de 15 secondes écoulées
  final elapsed = DateTime.now().difference(lastSentTime);
  if (elapsed.inSeconds > 15) {
    debugPrint('⏰ >15s écoulées, envoi forcé');
    return true;
  }

  // Filtrer si précision trop faible (>50m) - Anti-drift renforcé
  if (newPosition.accuracy > 50) {
    // Silent reject (pas de log pour performance)
    return false;
  }

  // Calculer distance entre positions (Haversine)
  final distanceMeters = _calculateDistance(
    lastPosition.latitude,
    lastPosition.longitude,
    newPosition.latitude,
    newPosition.longitude,
  );

  // Envoyer si déplacement > 2m pour un mouvement plus fluide
  if (distanceMeters > 2) {
    debugPrint('📏 Déplacement ${distanceMeters.toStringAsFixed(1)}m, envoi');
    return true;
  }

  debugPrint('🚫 Déplacement ${distanceMeters.toStringAsFixed(1)}m < 2m, skip');
  return false;
}

/// Calcule la distance entre deux coordonnées GPS (formule de Haversine)
/// Retourne la distance en mètres
double _calculateDistance(double lat1, double lon1, double lat2, double lon2) {
  const double earthRadius = 6371000; // Rayon de la Terre en mètres

  final dLat = _degreesToRadians(lat2 - lat1);
  final dLon = _degreesToRadians(lon2 - lon1);

  final a = sin(dLat / 2) * sin(dLat / 2) +
      cos(_degreesToRadians(lat1)) *
          cos(_degreesToRadians(lat2)) *
          sin(dLon / 2) *
          sin(dLon / 2);

  final c = 2 * atan2(sqrt(a), sqrt(1 - a));

  return earthRadius * c; // Distance en mètres
}

/// Convertit des degrés en radians
double _degreesToRadians(double degrees) {
  return degrees * 3.14159265359 / 180.0;
}
