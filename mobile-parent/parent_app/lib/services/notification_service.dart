import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import 'firebase_service.dart';

/// Types de notifications supportées
enum NotificationType {
  busArriving,
  busDelayed,
  busBreakdown,
  studentAbsent,
  studentBoarded,
  studentExited,
  routeChanged,
  maintenanceDue,
  general,
}

/// Modèle de notification
class AppNotification {
  final String id;
  final NotificationType type;
  final String title;
  final String message;
  final DateTime sentAt;
  final bool read;
  final Map<String, dynamic>? data;

  AppNotification({
    required this.id,
    required this.type,
    required this.title,
    required this.message,
    required this.sentAt,
    this.read = false,
    this.data,
  });

  factory AppNotification.fromJson(Map<String, dynamic> json) {
    return AppNotification(
      id: json['id'] ?? '',
      type: _parseNotificationType(json['type']),
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      sentAt: json['sentAt'] != null
          ? DateTime.parse(json['sentAt'])
          : DateTime.now(),
      read: json['read'] ?? false,
      data: json['data'],
    );
  }

  static NotificationType _parseNotificationType(String? type) {
    switch (type) {
      case 'bus_arriving':
        return NotificationType.busArriving;
      case 'bus_delayed':
        return NotificationType.busDelayed;
      case 'bus_breakdown':
        return NotificationType.busBreakdown;
      case 'student_absent':
        return NotificationType.studentAbsent;
      case 'student_boarded':
        return NotificationType.studentBoarded;
      case 'student_exited':
        return NotificationType.studentExited;
      case 'route_changed':
        return NotificationType.routeChanged;
      case 'maintenance_due':
        return NotificationType.maintenanceDue;
      default:
        return NotificationType.general;
    }
  }
}

/// Handler pour les notifications en arrière-plan
/// DOIT être une fonction de niveau supérieur (top-level) pour fonctionner
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // Les notifications sont automatiquement affichées par le système
  // Ce handler permet de traiter les données supplémentaires si nécessaire
  debugPrint('📱 [Background] Notification reçue: ${message.notification?.title}');
}

/// Service de gestion des notifications push
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  // URL de base de l'API (à configurer selon l'environnement)
  static const String _baseUrl = 'https://europe-west4-projet-bus-60a3f.cloudfunctions.net/api';

  // Callbacks pour les notifications
  Function(RemoteMessage)? onForegroundMessage;
  Function(RemoteMessage)? onMessageOpenedApp;

  String? _currentToken;

  /// Initialise le service de notifications
  /// Doit être appelé au démarrage de l'application
  static Future<void> initialize() async {
    final instance = NotificationService();
    await instance._initialize();
  }

  Future<void> _initialize() async {
    // Enregistrer le handler pour les notifications en arrière-plan
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

    // Demander les permissions
    await requestPermission();

    // Configurer les handlers pour les notifications
    _setupMessageHandlers();

    // Récupérer et stocker le token initial
    _currentToken = await _messaging.getToken();
    debugPrint('📱 Token FCM: $_currentToken');

    // Écouter les changements de token
    _messaging.onTokenRefresh.listen((newToken) {
      debugPrint('📱 Nouveau token FCM: $newToken');
      _currentToken = newToken;
      // Re-enregistrer avec le nouveau token si l'utilisateur est connecté
      final user = FirebaseService.auth.currentUser;
      if (user != null) {
        registerToken(user.uid);
      }
    });

    // Vérifier si l'app a été ouverte via une notification
    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      debugPrint('📱 App ouverte via notification: ${initialMessage.notification?.title}');
      onMessageOpenedApp?.call(initialMessage);
    }
  }

  /// Configure les handlers pour les messages reçus
  void _setupMessageHandlers() {
    // Notifications reçues quand l'app est au premier plan
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      debugPrint('📱 [Foreground] Notification: ${message.notification?.title}');
      onForegroundMessage?.call(message);
    });

    // Quand l'utilisateur clique sur une notification (app en arrière-plan)
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      debugPrint('📱 [OpenedApp] Notification cliquée: ${message.notification?.title}');
      onMessageOpenedApp?.call(message);
    });
  }

  /// Demande les permissions pour les notifications
  Future<NotificationSettings> requestPermission() async {
    final settings = await _messaging.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint('📱 Permission notifications: ${settings.authorizationStatus}');

    // Sur iOS, configurer les options de présentation au premier plan
    if (Platform.isIOS) {
      await _messaging.setForegroundNotificationPresentationOptions(
        alert: true,
        badge: true,
        sound: true,
      );
    }

    return settings;
  }

  /// Vérifie si les notifications sont autorisées
  Future<bool> isPermissionGranted() async {
    final settings = await _messaging.getNotificationSettings();
    return settings.authorizationStatus == AuthorizationStatus.authorized ||
        settings.authorizationStatus == AuthorizationStatus.provisional;
  }

  /// Récupère le token FCM actuel
  Future<String?> getToken() async {
    _currentToken ??= await _messaging.getToken();
    return _currentToken;
  }

  /// Enregistre le token FCM auprès du backend
  Future<bool> registerToken(String userId) async {
    try {
      final token = await getToken();
      if (token == null) {
        debugPrint('❌ Impossible de récupérer le token FCM');
        return false;
      }

      final platform = Platform.isIOS ? 'ios' : 'android';

      final response = await http.post(
        Uri.parse('$_baseUrl/notifications/fcm/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'userId': userId,
          'token': token,
          'platform': platform,
        }),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Token FCM enregistré pour $userId');
        return true;
      } else {
        debugPrint('❌ Erreur enregistrement token: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Erreur enregistrement token FCM: $e');
      return false;
    }
  }

  /// Supprime le token FCM du backend (déconnexion)
  Future<bool> unregisterToken() async {
    try {
      final token = await getToken();
      if (token == null) {
        return true; // Pas de token à supprimer
      }

      final response = await http.delete(
        Uri.parse('$_baseUrl/notifications/fcm/remove'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'token': token}),
      );

      if (response.statusCode == 200) {
        debugPrint('✅ Token FCM supprimé');
        return true;
      } else {
        debugPrint('❌ Erreur suppression token: ${response.body}');
        return false;
      }
    } catch (e) {
      debugPrint('❌ Erreur suppression token FCM: $e');
      return false;
    }
  }

  /// Récupère les notifications pour un utilisateur
  Future<List<AppNotification>> getNotifications(String userId, {int limit = 50}) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/notifications/user/$userId?limit=$limit'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return (data['data'] as List)
              .map((json) => AppNotification.fromJson(json))
              .toList();
        }
      }
      return [];
    } catch (e) {
      debugPrint('❌ Erreur récupération notifications: $e');
      return [];
    }
  }

  /// Récupère le nombre de notifications non lues
  Future<int> getUnreadCount(String userId) async {
    try {
      final response = await http.get(
        Uri.parse('$_baseUrl/notifications/user/$userId/unread-count'),
        headers: {'Content-Type': 'application/json'},
      );

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        if (data['success'] == true && data['data'] != null) {
          return data['data']['count'] ?? 0;
        }
      }
      return 0;
    } catch (e) {
      debugPrint('❌ Erreur comptage notifications: $e');
      return 0;
    }
  }

  /// Marque une notification comme lue
  Future<bool> markAsRead(String notificationId, String userId) async {
    try {
      final response = await http.patch(
        Uri.parse('$_baseUrl/notifications/$notificationId/read'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'userId': userId}),
      );

      return response.statusCode == 200;
    } catch (e) {
      debugPrint('❌ Erreur marquage notification: $e');
      return false;
    }
  }

  /// S'abonne à un topic pour recevoir des notifications groupées
  Future<void> subscribeToTopic(String topic) async {
    try {
      await _messaging.subscribeToTopic(topic);
      debugPrint('✅ Abonné au topic: $topic');
    } catch (e) {
      debugPrint('❌ Erreur abonnement topic: $e');
    }
  }

  /// Se désabonne d'un topic
  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _messaging.unsubscribeFromTopic(topic);
      debugPrint('✅ Désabonné du topic: $topic');
    } catch (e) {
      debugPrint('❌ Erreur désabonnement topic: $e');
    }
  }
}
