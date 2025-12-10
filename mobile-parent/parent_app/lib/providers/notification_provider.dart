import 'package:flutter/foundation.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import '../services/notification_service.dart';

/// Provider pour la gestion de l'état des notifications
class NotificationProvider with ChangeNotifier {
  final NotificationService _notificationService = NotificationService();

  List<AppNotification> _notifications = [];
  int _unreadCount = 0;
  bool _isLoading = false;
  String? _error;
  bool _notificationsEnabled = true;
  bool _isInitialized = false;

  // Getters
  List<AppNotification> get notifications => _notifications;
  int get unreadCount => _unreadCount;
  bool get isLoading => _isLoading;
  String? get error => _error;
  bool get notificationsEnabled => _notificationsEnabled;
  bool get isInitialized => _isInitialized;
  bool get hasUnread => _unreadCount > 0;

  /// Initialise le provider avec les callbacks pour les notifications
  Future<void> initialize({
    Function(RemoteMessage)? onForegroundMessage,
    Function(RemoteMessage)? onMessageOpenedApp,
  }) async {
    if (_isInitialized) return;

    try {
      _setLoading(true);

      // Configurer les callbacks
      _notificationService.onForegroundMessage = (message) {
        _handleForegroundMessage(message);
        onForegroundMessage?.call(message);
      };

      _notificationService.onMessageOpenedApp = (message) {
        onMessageOpenedApp?.call(message);
      };

      _isInitialized = true;
      _error = null;
    } catch (e) {
      _error = 'Erreur initialisation notifications: $e';
      debugPrint('❌ $_error');
    } finally {
      _setLoading(false);
    }
  }

  /// Gère les notifications reçues au premier plan
  void _handleForegroundMessage(RemoteMessage message) {
    // Incrémenter le compteur de non lues
    _unreadCount++;
    notifyListeners();

    // On pourrait aussi ajouter la notification à la liste locale
    // mais il est préférable de recharger depuis le serveur pour avoir l'ID
  }

  /// Enregistre le token FCM pour un utilisateur connecté
  Future<bool> registerToken(String userId) async {
    if (!_notificationsEnabled) {
      debugPrint('⚠️ Notifications désactivées, token non enregistré');
      return false;
    }

    try {
      final success = await _notificationService.registerToken(userId);
      if (success) {
        // Charger les notifications existantes
        await loadNotifications(userId);
        await loadUnreadCount(userId);
      }
      return success;
    } catch (e) {
      debugPrint('❌ Erreur enregistrement token: $e');
      return false;
    }
  }

  /// Supprime le token FCM (déconnexion)
  Future<void> unregisterToken() async {
    try {
      await _notificationService.unregisterToken();
      _notifications = [];
      _unreadCount = 0;
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Erreur suppression token: $e');
    }
  }

  /// Charge les notifications pour un utilisateur
  Future<void> loadNotifications(String userId, {int limit = 50}) async {
    try {
      _setLoading(true);
      _notifications = await _notificationService.getNotifications(userId, limit: limit);
      _error = null;
    } catch (e) {
      _error = 'Erreur chargement notifications: $e';
      debugPrint('❌ $_error');
    } finally {
      _setLoading(false);
    }
  }

  /// Charge le nombre de notifications non lues
  Future<void> loadUnreadCount(String userId) async {
    try {
      _unreadCount = await _notificationService.getUnreadCount(userId);
      notifyListeners();
    } catch (e) {
      debugPrint('❌ Erreur chargement compteur: $e');
    }
  }

  /// Marque une notification comme lue
  Future<bool> markAsRead(String notificationId, String userId) async {
    try {
      final success = await _notificationService.markAsRead(notificationId, userId);
      if (success) {
        // Mettre à jour localement
        final index = _notifications.indexWhere((n) => n.id == notificationId);
        if (index != -1) {
          // Créer une nouvelle notification avec read = true
          final notification = _notifications[index];
          _notifications[index] = AppNotification(
            id: notification.id,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            sentAt: notification.sentAt,
            read: true,
            data: notification.data,
          );
        }
        // Décrémenter le compteur
        if (_unreadCount > 0) {
          _unreadCount--;
        }
        notifyListeners();
      }
      return success;
    } catch (e) {
      debugPrint('❌ Erreur marquage notification: $e');
      return false;
    }
  }

  /// Marque toutes les notifications comme lues
  Future<void> markAllAsRead(String userId) async {
    try {
      for (final notification in _notifications.where((n) => !n.read)) {
        await markAsRead(notification.id, userId);
      }
    } catch (e) {
      debugPrint('❌ Erreur marquage toutes notifications: $e');
    }
  }

  /// Active ou désactive les notifications
  Future<void> setNotificationsEnabled(bool enabled, String? userId) async {
    _notificationsEnabled = enabled;
    notifyListeners();

    if (userId != null) {
      if (enabled) {
        await registerToken(userId);
      } else {
        await unregisterToken();
      }
    }
  }

  /// S'abonne à un topic (ex: bus_123 pour suivre un bus spécifique)
  Future<void> subscribeToTopic(String topic) async {
    if (!_notificationsEnabled) return;
    await _notificationService.subscribeToTopic(topic);
  }

  /// Se désabonne d'un topic
  Future<void> unsubscribeFromTopic(String topic) async {
    await _notificationService.unsubscribeFromTopic(topic);
  }

  /// S'abonne aux topics pour les bus des enfants
  Future<void> subscribeToChildrenBuses(List<String> busIds) async {
    for (final busId in busIds) {
      await subscribeToTopic('bus_$busId');
    }
  }

  /// Se désabonne des topics pour les bus
  Future<void> unsubscribeFromAllBuses(List<String> busIds) async {
    for (final busId in busIds) {
      await unsubscribeFromTopic('bus_$busId');
    }
  }

  /// Rafraîchit les notifications
  Future<void> refresh(String userId) async {
    await Future.wait([
      loadNotifications(userId),
      loadUnreadCount(userId),
    ]);
  }

  /// Réinitialise le provider (déconnexion)
  void reset() {
    _notifications = [];
    _unreadCount = 0;
    _isLoading = false;
    _error = null;
    _isInitialized = false;
    notifyListeners();
  }

  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }
}
