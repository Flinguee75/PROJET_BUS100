import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'dart:io' show Platform;

/// Service de gestion des notifications push (FCM) et locales
/// Gère :
/// - Initialisation FCM
/// - Permissions de notifications
/// - Enregistrement du token FCM
/// - Réception et affichage des notifications
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  /// Initialise le service de notifications
  /// À appeler au démarrage de l'application
  Future<void> initialize() async {
    if (_initialized) {
      print('📲 NotificationService déjà initialisé');
      return;
    }

    try {
      // 1. Demander les permissions de notifications
      final permission = await requestPermission();
      if (!permission) {
        print('⚠️ Permissions de notifications refusées');
        return;
      }

      // 2. Initialiser les notifications locales
      await _initializeLocalNotifications();

      // 3. Configurer les handlers FCM
      await _configureFCMHandlers();

      _initialized = true;
      print('✅ NotificationService initialisé avec succès');
    } catch (e) {
      print('❌ Erreur lors de l\'initialisation du NotificationService: $e');
    }
  }

  /// Demande les permissions de notifications
  Future<bool> requestPermission() async {
    try {
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        announcement: false,
        badge: true,
        carPlay: false,
        criticalAlert: false,
        provisional: false,
        sound: true,
      );

      final granted = settings.authorizationStatus == AuthorizationStatus.authorized ||
          settings.authorizationStatus == AuthorizationStatus.provisional;

      print('📲 Permission notifications: ${settings.authorizationStatus}');
      return granted;
    } catch (e) {
      print('❌ Erreur lors de la demande de permissions: $e');
      return false;
    }
  }

  /// Initialise les notifications locales
  Future<void> _initializeLocalNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');

    const iosSettings = DarwinInitializationSettings(
      requestSoundPermission: true,
      requestBadgePermission: true,
      requestAlertPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    print('✅ Notifications locales initialisées');
  }

  /// Callback quand l'utilisateur tape sur une notification
  void _onNotificationTapped(NotificationResponse response) {
    print('🔔 Notification tapped: ${response.payload}');
    // TODO: Navigation vers l'écran approprié basé sur response.payload
  }

  /// Configure les handlers FCM
  Future<void> _configureFCMHandlers() async {
    // Handler pour les messages en foreground
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // Handler pour les messages quand l'app est ouverte via notification
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageOpenedApp);

    // Vérifier si l'app a été lancée via une notification
    final initialMessage = await _firebaseMessaging.getInitialMessage();
    if (initialMessage != null) {
      _handleInitialMessage(initialMessage);
    }

    print('✅ Handlers FCM configurés');
  }

  /// Gère les messages reçus en foreground (app ouverte)
  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    print('📨 Message reçu en foreground: ${message.notification?.title}');

    // Afficher notification locale pour les messages foreground
    await showLocalNotification(
      title: message.notification?.title ?? 'Notification',
      body: message.notification?.body ?? '',
      payload: message.data.toString(),
    );
  }

  /// Gère les messages quand l'app est ouverte via notification
  void _handleMessageOpenedApp(RemoteMessage message) {
    print('🔔 App ouverte via notification: ${message.notification?.title}');
    // TODO: Navigation vers l'écran approprié
  }

  /// Gère le message initial si l'app a été lancée via notification
  void _handleInitialMessage(RemoteMessage message) {
    print('🚀 App lancée via notification: ${message.notification?.title}');
    // TODO: Navigation vers l'écran approprié
  }

  /// Affiche une notification locale
  Future<void> showLocalNotification({
    required String title,
    required String body,
    String? payload,
  }) async {
    const androidDetails = AndroidNotificationDetails(
      'bus_tracking_channel',
      'Suivi Bus',
      channelDescription: 'Notifications de suivi de bus en temps réel',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
      icon: '@mipmap/ic_launcher',
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _localNotifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      title,
      body,
      details,
      payload: payload,
    );

    print('✅ Notification locale affichée: $title');
  }

  /// Récupère le token FCM et l'enregistre dans Firestore
  Future<String?> registerFCMToken(String userId) async {
    try {
      // Récupérer le token FCM
      final token = await _firebaseMessaging.getToken();
      if (token == null) {
        print('⚠️ Impossible de récupérer le token FCM');
        return null;
      }

      print('📲 Token FCM récupéré: ${token.substring(0, 20)}...');

      // Enregistrer dans Firestore /fcm_tokens/{token}
      await FirebaseFirestore.instance.collection('fcm_tokens').doc(token).set({
        'userId': userId,
        'token': token,
        'platform': Platform.isIOS ? 'ios' : 'android',
        'createdAt': FieldValue.serverTimestamp(),
        'lastUsedAt': FieldValue.serverTimestamp(),
      });

      print('✅ Token FCM enregistré dans Firestore');

      // Écouter les changements de token
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        print('🔄 Token FCM rafraîchi');
        registerFCMToken(userId); // Re-enregistrer avec le nouveau token
      });

      return token;
    } catch (e) {
      print('❌ Erreur lors de l\'enregistrement du token FCM: $e');
      return null;
    }
  }

  /// Supprime le token FCM lors de la déconnexion
  Future<void> unregisterFCMToken() async {
    try {
      final token = await _firebaseMessaging.getToken();
      if (token != null) {
        await FirebaseFirestore.instance.collection('fcm_tokens').doc(token).delete();
        print('✅ Token FCM supprimé de Firestore');
      }

      // Supprimer le token côté Firebase
      await _firebaseMessaging.deleteToken();
      print('✅ Token FCM supprimé localement');
    } catch (e) {
      print('❌ Erreur lors de la suppression du token FCM: $e');
    }
  }

  /// Vérifie si les notifications sont activées
  Future<bool> areNotificationsEnabled() async {
    final settings = await _firebaseMessaging.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized;
  }
}

/// Handler pour les messages en background (doit être top-level)
/// À appeler dans main.dart avant runApp()
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  print('📨 Message reçu en background: ${message.notification?.title}');
  // Les notifications en background sont automatiquement affichées par FCM
}
