import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:geolocator/geolocator.dart';
import '../database/gps_queue_database.dart';
import '../models/gps_queue_record.dart';
import 'gps_service.dart';

/// Gestionnaire de la file d'attente GPS offline
/// Responsable de:
/// - Mise en queue des positions GPS
/// - Détection connectivité réseau
/// - Upload automatique vers Firestore
/// - Retry avec backoff exponentiel
class GpsQueueManager {
  static final GpsQueueManager instance = GpsQueueManager._init();

  final _db = GpsQueueDatabase.instance;
  final _connectivity = Connectivity();

  Timer? _processTimer;
  Timer? _pruneTimer;
  StreamSubscription<ConnectivityResult>? _connectivitySubscription;

  bool _isProcessing = false;
  bool _isOnline = true;

  GpsQueueManager._init();

  /// Initialise le gestionnaire
  Future<void> initialize() async {
    debugPrint('🚀 Initialisation GpsQueueManager');

    // Écouter les changements de connectivité
    _connectivitySubscription = _connectivity.onConnectivityChanged.listen(
      _onConnectivityChanged,
    );

    // Vérifier la connectivité initiale
    final result = await _connectivity.checkConnectivity();
    _isOnline = result != ConnectivityResult.none;
    debugPrint('📡 Connectivité initiale: ${_isOnline ? "En ligne" : "Hors ligne"}');

    // Timer pour traitement périodique de la queue (toutes les 30 secondes)
    _processTimer = Timer.periodic(
      const Duration(seconds: 30),
      (_) => processQueue(),
    );

    // Timer pour nettoyage quotidien (toutes les 24h)
    _pruneTimer = Timer.periodic(
      const Duration(hours: 24),
      (_) => pruneOldRecords(),
    );

    // Traiter immédiatement au démarrage
    await processQueue();

    debugPrint('✅ GpsQueueManager initialisé');
  }

  /// Gère les changements de connectivité
  void _onConnectivityChanged(ConnectivityResult result) {
    final wasOffline = !_isOnline;
    _isOnline = result != ConnectivityResult.none;

    debugPrint('📡 Connectivité changée: ${_isOnline ? "En ligne" : "Hors ligne"}');

    // Si on vient de se reconnecter, traiter la queue
    if (wasOffline && _isOnline) {
      debugPrint('🔄 Reconnexion détectée - traitement de la queue');
      processQueue();
    }
  }

  /// Ajoute une position GPS à la file d'attente
  Future<void> enqueue({
    required String busId,
    required Position position,
    String? driverId,
    String? routeId,
    String? tripType,
    String? status,
  }) async {
    try {
      final record = GpsQueueRecord.fromPosition(
        busId: busId,
        position: position,
        driverId: driverId,
        routeId: routeId,
        tripType: tripType,
        status: status,
      );

      await _db.insert(record);

      // Si en ligne, tenter upload immédiat
      if (_isOnline) {
        processQueue();
      }
    } catch (e) {
      debugPrint('❌ Erreur enqueue GPS: $e');
    }
  }

  /// Traite la file d'attente (upload vers Firestore)
  Future<void> processQueue() async {
    if (_isProcessing) {
      debugPrint('⏭️ Traitement déjà en cours, skip');
      return;
    }

    if (!_isOnline) {
      debugPrint('📴 Hors ligne, skip traitement queue');
      return;
    }

    _isProcessing = true;

    try {
      // Récupérer les 50 premiers enregistrements non-uploadés
      final records = await _db.getUnuploadedRecords(limit: 50);

      if (records.isEmpty) {
        return;
      }

      debugPrint('📤 Traitement de ${records.length} enregistrements GPS...');

      int successCount = 0;
      int failCount = 0;

      for (final record in records) {
        final success = await _uploadRecord(record);

        if (success) {
          await _db.markAsUploaded(record.id!);
          successCount++;
        } else {
          await _db.incrementRetryCount(record.id!);
          failCount++;
        }
      }

      debugPrint('✅ Upload terminé: $successCount succès, $failCount échecs');

      // Si des échecs, traiter les retries
      if (failCount > 0) {
        await _retryFailed();
      }

    } catch (e) {
      debugPrint('❌ Erreur traitement queue: $e');
    } finally {
      _isProcessing = false;
    }
  }

  /// Upload un enregistrement vers Firestore
  Future<bool> _uploadRecord(GpsQueueRecord record) async {
    try {
      final success = await GPSService.updateBusPosition(
        busId: record.busId,
        position: record.toPosition(),
        driverId: record.driverId,
        routeId: record.routeId,
        statusOverride: record.status,
        tripType: record.tripType,
        tripLabel: null,
      );

      if (!success) {
        return false;
      }

      // Archiver aussi dans l'historique
      try {
        await GPSService.archiveGPSPosition(
          busId: record.busId,
          position: record.toPosition(),
        );
      } catch (e) {
        debugPrint('⚠️ Erreur archivage GPS (non bloquant): $e');
        // Ne pas échouer l'upload complet si juste l'archivage échoue
      }

      return true;
    } catch (e) {
      debugPrint('❌ Échec upload record ${record.id}: $e');
      return false;
    }
  }

  /// Retry les enregistrements échoués avec backoff exponentiel
  Future<void> _retryFailed() async {
    try {
      final failedRecords = await _db.getFailedRecords(maxRetries: 10, limit: 10);

      if (failedRecords.isEmpty) return;

      debugPrint('🔄 Retry de ${failedRecords.length} enregistrements échoués');

      for (final record in failedRecords) {
        // Calculer le délai de backoff exponentiel
        final backoffDelay = _calculateBackoff(record.retryCount);
        final ageMs = DateTime.now().millisecondsSinceEpoch - record.createdAt;

        // Si pas encore temps de retry, skip
        if (ageMs < backoffDelay.inMilliseconds) {
          continue;
        }

        final success = await _uploadRecord(record);

        if (success) {
          await _db.markAsUploaded(record.id!);
          debugPrint('✅ Retry réussi pour record ${record.id}');
        } else {
          await _db.incrementRetryCount(record.id!);
          debugPrint('❌ Retry échoué pour record ${record.id} (tentative ${record.retryCount + 1})');
        }
      }
    } catch (e) {
      debugPrint('❌ Erreur retry failed: $e');
    }
  }

  /// Calcule le délai de backoff exponentiel
  Duration _calculateBackoff(int retryCount) {
    // Stratégie de backoff:
    // 1er retry: 5s
    // 2ème retry: 15s
    // 3ème retry: 30s
    // 4ème retry: 1 min
    // 5ème+ retry: 5 min

    switch (retryCount) {
      case 0:
        return const Duration(seconds: 5);
      case 1:
        return const Duration(seconds: 15);
      case 2:
        return const Duration(seconds: 30);
      case 3:
        return const Duration(minutes: 1);
      default:
        return const Duration(minutes: 5);
    }
  }

  /// Nettoie les anciens enregistrements
  Future<void> pruneOldRecords() async {
    try {
      debugPrint('🧹 Nettoyage des anciens enregistrements GPS...');

      // Supprimer les enregistrements uploadés de plus de 1 jour
      final uploadedCount = await _db.pruneUploaded(daysOld: 1);

      // Supprimer les enregistrements échoués de plus de 7 jours
      final failedCount = await _db.pruneFailed(maxRetries: 10, daysOld: 7);

      debugPrint('🧹 Nettoyage terminé: $uploadedCount uploadés, $failedCount échoués');
    } catch (e) {
      debugPrint('❌ Erreur nettoyage: $e');
    }
  }

  /// Obtient des statistiques sur la queue
  Future<Map<String, int>> getStats() async {
    return await _db.getStats();
  }

  /// Force le traitement immédiat de la queue
  Future<void> forceProcess() async {
    debugPrint('🔧 Traitement forcé de la queue');
    await processQueue();
  }

  /// Arrête le gestionnaire
  Future<void> dispose() async {
    debugPrint('🛑 Arrêt GpsQueueManager');

    _processTimer?.cancel();
    _pruneTimer?.cancel();
    await _connectivitySubscription?.cancel();

    _processTimer = null;
    _pruneTimer = null;
    _connectivitySubscription = null;
  }
}
