import 'bus.dart';

/// Modèle de données pour un enfant
class Enfant {
  final String id;
  final String nom;
  final String prenom;
  final String classe;
  final String ecole;
  final String busId;
  final String parentId;
  final String? photoUrl;
  final GPSPosition? arret; // Point d'arrêt assigné à l'enfant

  Enfant({
    required this.id,
    required this.nom,
    required this.prenom,
    required this.classe,
    required this.ecole,
    required this.busId,
    required this.parentId,
    this.photoUrl,
    this.arret,
  });

  factory Enfant.fromJson(Map<String, dynamic> json) {
    return Enfant(
      id: json['id'] as String,
      nom: json['nom'] as String,
      prenom: json['prenom'] as String,
      classe: json['classe'] as String,
      ecole: json['ecole'] as String,
      busId: json['busId'] as String,
      parentId: json['parentId'] as String,
      photoUrl: json['photoUrl'] as String?,
      arret: json['arret'] != null
          ? GPSPosition.fromJson(json['arret'] as Map<String, dynamic>)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'nom': nom,
      'prenom': prenom,
      'classe': classe,
      'ecole': ecole,
      'busId': busId,
      'parentId': parentId,
      'photoUrl': photoUrl,
      'arret': arret?.toJson(),
    };
  }

  String get nomComplet => '$prenom $nom';
}

