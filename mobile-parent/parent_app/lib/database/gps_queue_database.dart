import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:sqflite/sqflite.dart';
import 'package:path/path.dart';
import '../models/gps_queue_record.dart';

/// Base de données SQLite pour la file d'attente GPS offline
/// Stocke les positions GPS en attente d'upload vers Firestore
class GpsQueueDatabase {
  static final GpsQueueDatabase instance = GpsQueueDatabase._init();
  static Database? _database;

  GpsQueueDatabase._init();

  /// Accès à la database (singleton)
  Future<Database> get database async {
    if (_database != null) return _database!;
    _database = await _initDB('gps_queue.db');
    return _database!;
  }

  /// Initialise la base de données
  Future<Database> _initDB(String filePath) async {
    final dbPath = await getDatabasesPath();
    final path = join(dbPath, filePath);

    debugPrint('📂 Initialisation GPS Queue Database: $path');

    return await openDatabase(
      path,
      version: 1,
      onCreate: _createDB,
      onUpgrade: _upgradeDB,
    );
  }

  /// Crée le schéma de la base de données
  Future<void> _createDB(Database db, int version) async {
    debugPrint('🔨 Création table gps_queue');

    await db.execute('''
      CREATE TABLE gps_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        busId TEXT NOT NULL,
        position_lat REAL NOT NULL,
        position_lng REAL NOT NULL,
        position_speed REAL NOT NULL,
        position_heading REAL NOT NULL,
        position_accuracy REAL NOT NULL,
        position_timestamp INTEGER NOT NULL,
        driverId TEXT,
        routeId TEXT,
        tripType TEXT,
        status TEXT,
        retry_count INTEGER DEFAULT 0,
        created_at INTEGER NOT NULL,
        uploaded INTEGER DEFAULT 0
      )
    ''');

    // Index pour optimiser les requêtes
    await db.execute('''
      CREATE INDEX idx_uploaded ON gps_queue(uploaded)
    ''');

    await db.execute('''
      CREATE INDEX idx_busId_timestamp ON gps_queue(busId, position_timestamp)
    ''');

    debugPrint('✅ Table gps_queue créée avec succès');
  }

  /// Gère les migrations de schéma
  Future<void> _upgradeDB(Database db, int oldVersion, int newVersion) async {
    debugPrint('⬆️ Mise à jour DB de v$oldVersion vers v$newVersion');
    // Futures migrations ici
  }

  /// Insère un nouvel enregistrement dans la queue
  Future<int> insert(GpsQueueRecord record) async {
    final db = await database;
    final id = await db.insert('gps_queue', record.toMap());
    debugPrint('➕ GPS enregistré en queue: ID=$id, busId=${record.busId}');
    return id;
  }

  /// Insère plusieurs enregistrements (batch)
  Future<void> insertBatch(List<GpsQueueRecord> records) async {
    if (records.isEmpty) return;

    final db = await database;
    final batch = db.batch();

    for (final record in records) {
      batch.insert('gps_queue', record.toMap());
    }

    await batch.commit(noResult: true);
    debugPrint('➕ ${records.length} enregistrements GPS ajoutés en batch');
  }

  /// Récupère tous les enregistrements non-uploadés
  Future<List<GpsQueueRecord>> getUnuploadedRecords({int? limit}) async {
    final db = await database;
    final result = await db.query(
      'gps_queue',
      where: 'uploaded = ?',
      whereArgs: [0],
      orderBy: 'created_at ASC',
      limit: limit,
    );

    return result.map((map) => GpsQueueRecord.fromMap(map)).toList();
  }

  /// Récupère les enregistrements échoués (retry_count < max)
  Future<List<GpsQueueRecord>> getFailedRecords({
    int maxRetries = 10,
    int? limit,
  }) async {
    final db = await database;
    final result = await db.query(
      'gps_queue',
      where: 'uploaded = ? AND retry_count < ?',
      whereArgs: [0, maxRetries],
      orderBy: 'created_at ASC',
      limit: limit,
    );

    return result.map((map) => GpsQueueRecord.fromMap(map)).toList();
  }

  /// Récupère tous les enregistrements pour un bus spécifique
  Future<List<GpsQueueRecord>> getRecordsByBusId(String busId) async {
    final db = await database;
    final result = await db.query(
      'gps_queue',
      where: 'busId = ?',
      whereArgs: [busId],
      orderBy: 'position_timestamp DESC',
    );

    return result.map((map) => GpsQueueRecord.fromMap(map)).toList();
  }

  /// Compte le nombre total d'enregistrements en attente
  Future<int> countPending() async {
    final db = await database;
    final result = await db.rawQuery(
      'SELECT COUNT(*) as count FROM gps_queue WHERE uploaded = 0',
    );
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Compte le nombre total d'enregistrements (tous)
  Future<int> countAll() async {
    final db = await database;
    final result = await db.rawQuery('SELECT COUNT(*) as count FROM gps_queue');
    return Sqflite.firstIntValue(result) ?? 0;
  }

  /// Marque un enregistrement comme uploadé
  Future<int> markAsUploaded(int id) async {
    final db = await database;
    return await db.update(
      'gps_queue',
      {'uploaded': 1},
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Marque plusieurs enregistrements comme uploadés (batch)
  Future<void> markMultipleAsUploaded(List<int> ids) async {
    if (ids.isEmpty) return;

    final db = await database;
    final batch = db.batch();

    for (final id in ids) {
      batch.update(
        'gps_queue',
        {'uploaded': 1},
        where: 'id = ?',
        whereArgs: [id],
      );
    }

    await batch.commit(noResult: true);
    debugPrint('✅ ${ids.length} enregistrements marqués comme uploadés');
  }

  /// Incrémente le compteur de retry pour un enregistrement
  Future<int> incrementRetryCount(int id) async {
    final db = await database;
    return await db.rawUpdate(
      'UPDATE gps_queue SET retry_count = retry_count + 1 WHERE id = ?',
      [id],
    );
  }

  /// Supprime un enregistrement
  Future<int> delete(int id) async {
    final db = await database;
    return await db.delete(
      'gps_queue',
      where: 'id = ?',
      whereArgs: [id],
    );
  }

  /// Purge les enregistrements uploadés plus anciens que X jours
  Future<int> pruneUploaded({int daysOld = 1}) async {
    final db = await database;
    final cutoffTime = DateTime.now()
        .subtract(Duration(days: daysOld))
        .millisecondsSinceEpoch;

    final count = await db.delete(
      'gps_queue',
      where: 'uploaded = ? AND created_at < ?',
      whereArgs: [1, cutoffTime],
    );

    if (count > 0) {
      debugPrint('🗑️ Purgé $count enregistrements uploadés (>${daysOld}j)');
    }

    return count;
  }

  /// Purge les enregistrements échoués définitivement (retry_count >= max)
  Future<int> pruneFailed({int maxRetries = 10, int daysOld = 7}) async {
    final db = await database;
    final cutoffTime = DateTime.now()
        .subtract(Duration(days: daysOld))
        .millisecondsSinceEpoch;

    final count = await db.delete(
      'gps_queue',
      where: 'retry_count >= ? AND created_at < ?',
      whereArgs: [maxRetries, cutoffTime],
    );

    if (count > 0) {
      debugPrint('🗑️ Purgé $count enregistrements échoués (>${daysOld}j, retries>=$maxRetries)');
    }

    return count;
  }

  /// Purge TOUS les anciens enregistrements (uploaded + failed) de plus de X jours
  Future<int> pruneAll({int daysOld = 7}) async {
    final db = await database;
    final cutoffTime = DateTime.now()
        .subtract(Duration(days: daysOld))
        .millisecondsSinceEpoch;

    final count = await db.delete(
      'gps_queue',
      where: 'created_at < ?',
      whereArgs: [cutoffTime],
    );

    if (count > 0) {
      debugPrint('🗑️ Purgé $count enregistrements anciens (>${daysOld}j)');
    }

    return count;
  }

  /// Vide complètement la table (DANGER - utiliser seulement pour debug/tests)
  Future<int> deleteAll() async {
    final db = await database;
    final count = await db.delete('gps_queue');
    debugPrint('⚠️ TOUTE la queue GPS supprimée: $count enregistrements');
    return count;
  }

  /// Statistiques sur la queue
  Future<Map<String, int>> getStats() async {
    final db = await database;

    final pending = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM gps_queue WHERE uploaded = 0'),
    ) ?? 0;

    final uploaded = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM gps_queue WHERE uploaded = 1'),
    ) ?? 0;

    final failed = Sqflite.firstIntValue(
      await db.rawQuery('SELECT COUNT(*) FROM gps_queue WHERE retry_count >= 10'),
    ) ?? 0;

    return {
      'pending': pending,
      'uploaded': uploaded,
      'failed': failed,
      'total': pending + uploaded + failed,
    };
  }

  /// Ferme la base de données
  Future<void> close() async {
    final db = await database;
    await db.close();
    _database = null;
    debugPrint('🔒 GPS Queue Database fermée');
  }
}
