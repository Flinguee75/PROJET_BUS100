import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/bus.dart';
import '../models/enfant.dart';
import '../providers/auth_provider.dart';
import '../providers/bus_provider.dart';
import '../services/eta_service.dart';
import '../services/notification_service.dart';
import '../utils/app_colors.dart';
import '../utils/trip_status_helper.dart';
import '../widgets/child_selector_dropdown.dart';
import '../widgets/trip_status_card.dart';
import 'login_screen.dart';
import 'profile_screen.dart';

/// Écran principal - Carte avec suivi bus en temps réel
/// Interface simplifiée focalisée sur l'essentiel :
/// - Sélection d'enfant (si plusieurs)
/// - Carte centrée sur stop de l'enfant
/// - Bus visible uniquement si en course
/// - Card avec ETA/statut en bas
class MainMapScreen extends StatefulWidget {
  const MainMapScreen({super.key});

  @override
  State<MainMapScreen> createState() => _MainMapScreenState();
}

class _MainMapScreenState extends State<MainMapScreen> {
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};
  bool _isLoading = true;
  bool _hasPositionedCamera = false;

  // Notification de proximité
  bool _hasNotifiedProximity = false;
  TripStatus? _previousTripStatus;
  int _proximityThresholdMinutes = 10; // Par défaut 10 min

  @override
  void initState() {
    super.initState();
    _loadData();
    _loadProximityThreshold();
  }

  /// Charge le seuil de proximité depuis les préférences
  Future<void> _loadProximityThreshold() async {
    final prefs = await SharedPreferences.getInstance();
    final busProvider = context.read<BusProvider>();

    // Attendre que les enfants soient chargés
    await Future.delayed(const Duration(milliseconds: 500));

    if (busProvider.selectedEnfant != null) {
      final savedThreshold = prefs.getInt(
        '${busProvider.selectedEnfant!.id}_proximity_minutes',
      );

      if (savedThreshold != null) {
        setState(() {
          _proximityThresholdMinutes = savedThreshold;
        });
      }
    }
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();
    final busProvider = context.read<BusProvider>();

    if (authProvider.user != null) {
      await busProvider.loadEnfants(authProvider.user!.uid);
    }

    setState(() => _isLoading = false);
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
  }

  /// Vérifie si l'enfant est inscrit au trip actuel du bus
  bool _isEnfantActiveForCurrentTrip(Bus? bus, Enfant? enfant) {
    if (bus == null || enfant == null || bus.currentTrip == null) {
      return false;
    }

    // Vérifier si l'enfant est inscrit au trip actuel
    return enfant.isActiveForTrip(bus.currentTrip!.tripType);
  }

  /// Retourne la location appropriée pour l'enfant selon le trip actuel
  GPSPosition? _getEnfantLocationForCurrentTrip(Bus? bus, Enfant? enfant) {
    if (bus == null || enfant == null) {
      // Fallback sur l'ancienne propriété arret si pas de trip
      return enfant?.arret;
    }

    if (bus.currentTrip != null) {
      final location = enfant.getLocationForTrip(bus.currentTrip!.tripType);
      if (location != null) {
        return GPSPosition(
          lat: location.lat,
          lng: location.lng,
          speed: 0,
          timestamp: 0,
        );
      }
    }

    // Fallback sur l'ancienne propriété arret
    return enfant.arret;
  }

  /// Met à jour les marqueurs de la carte
  /// - Marqueur stop enfant : affiché si inscrit au trip actuel
  /// - Marqueur bus : affiché uniquement si en_route ET enfant inscrit au trip
  void _updateMarkers(Bus? bus, Enfant? enfant) {
    setState(() {
      _markers.clear();

      // Vérifier si l'enfant est inscrit au trip actuel
      final isActiveForTrip = _isEnfantActiveForCurrentTrip(bus, enfant);
      final enfantLocation = _getEnfantLocationForCurrentTrip(bus, enfant);

      // 1. Marqueur pour l'arrêt de l'enfant
      if (enfantLocation != null) {
        // Si pas de trip actif OU enfant inscrit au trip
        if (bus?.currentTrip == null || isActiveForTrip) {
          _markers.add(
            Marker(
              markerId: const MarkerId('stop'),
              position: LatLng(
                enfantLocation.lat,
                enfantLocation.lng,
              ),
              infoWindow: InfoWindow(
                title: 'Arrêt de ${enfant!.prenom}',
                snippet: enfant.ecole,
              ),
              icon: BitmapDescriptor.defaultMarkerWithHue(
                BitmapDescriptor.hueOrange, // Orange pour meilleure visibilité
              ),
            ),
          );
        }
      }

      // 2. Marqueur pour le bus (seulement si en course ET enfant inscrit)
      final tripStatus = TripStatusHelper.determineTripStatus(bus);
      if (tripStatus == TripStatus.active &&
          bus!.currentPosition != null &&
          isActiveForTrip) {
        _markers.add(
          Marker(
            markerId: MarkerId(bus.id),
            position: LatLng(
              bus.currentPosition!.lat,
              bus.currentPosition!.lng,
            ),
            infoWindow: InfoWindow(
              title: 'Bus ${bus.immatriculation}',
              snippet: '${bus.currentPosition!.speed.toStringAsFixed(0)} km/h',
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(
              BitmapDescriptor.hueAzure, // Bleu pour bon contraste avec orange
            ),
          ),
        );
      }
    });
  }

  /// Centre la caméra sur la position appropriée
  void _centerCamera(Bus? bus, Enfant? enfant) {
    final enfantLocation = _getEnfantLocationForCurrentTrip(bus, enfant);
    if (_mapController == null || enfantLocation == null) return;

    // Ne centrer qu'une seule fois au démarrage
    if (_hasPositionedCamera) return;

    final tripStatus = TripStatusHelper.determineTripStatus(bus);
    final isActiveForTrip = _isEnfantActiveForCurrentTrip(bus, enfant);

    if (tripStatus == TripStatus.active &&
        bus!.currentPosition != null &&
        isActiveForTrip) {
      // Si bus actif ET enfant inscrit au trip, utiliser des bounds
      final busPos = LatLng(
        bus.currentPosition!.lat,
        bus.currentPosition!.lng,
      );
      final stopPos = LatLng(enfantLocation.lat, enfantLocation.lng);

      // Créer les bounds incluant les deux positions
      final bounds = LatLngBounds(
        southwest: LatLng(
          busPos.latitude < stopPos.latitude
              ? busPos.latitude
              : stopPos.latitude,
          busPos.longitude < stopPos.longitude
              ? busPos.longitude
              : stopPos.longitude,
        ),
        northeast: LatLng(
          busPos.latitude > stopPos.latitude
              ? busPos.latitude
              : stopPos.latitude,
          busPos.longitude > stopPos.longitude
              ? busPos.longitude
              : stopPos.longitude,
        ),
      );

      // Animer avec padding pour marges confortables
      _mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(bounds, 80),
      );
    } else {
      // Sinon, centrer sur le stop de l'enfant
      final target = LatLng(enfantLocation.lat, enfantLocation.lng);
      _mapController!.animateCamera(
        CameraUpdate.newCameraPosition(
          CameraPosition(target: target, zoom: 14),
        ),
      );
    }

    _hasPositionedCamera = true;
  }

  /// Vérifie la proximité du bus et envoie une notification si nécessaire
  Future<void> _checkProximityAndNotify(Bus? bus, Enfant enfant) async {
    // Vérifier si l'enfant est inscrit au trip actuel
    if (!_isEnfantActiveForCurrentTrip(bus, enfant)) {
      return; // Ne pas notifier si l'enfant n'est pas inscrit à ce trip
    }

    final enfantLocation = _getEnfantLocationForCurrentTrip(bus, enfant);
    if (bus == null || bus.currentPosition == null || enfantLocation == null) {
      return;
    }

    // Déterminer le statut actuel du trajet
    final currentStatus = TripStatusHelper.determineTripStatus(bus);

    // Réinitialiser le flag si le trajet vient de démarrer (transition inactive → active)
    if (_previousTripStatus == TripStatus.inactive &&
        currentStatus == TripStatus.active) {
      _hasNotifiedProximity = false;
      print('Nouveau trajet détecté, flag proximité réinitialisé');
    }

    _previousTripStatus = currentStatus;

    // Ne vérifier que si le bus est actif
    if (currentStatus != TripStatus.active) {
      return;
    }

    // Ne pas notifier si déjà fait pour ce trajet
    if (_hasNotifiedProximity) {
      return;
    }

    // Calculer la distance et l'ETA vers la bonne location
    final distance = ETAService.calculateDistance(
      bus.currentPosition!.lat,
      bus.currentPosition!.lng,
      enfantLocation.lat,
      enfantLocation.lng,
    );

    final eta = ETAService.calculateETA(distance, bus.currentPosition!.speed);

    // Si ETA <= seuil, envoyer notification avec message spécifique au trip
    if (eta != null && eta <= _proximityThresholdMinutes) {
      // Déterminer le message selon le type de trajet actuel
      String title = 'Bus à proximité';
      String body = 'Le bus arrive dans ${eta.toInt()} min';

      if (bus.currentTrip != null) {
        switch (bus.currentTrip!.tripType) {
          case TripTimeOfDay.morningOutbound:
            title = 'Bus à proximité (matin)';
            body = 'Le bus arrive dans ${eta.toInt()} min pour récupérer ${enfant.prenom} (trajet du matin)';
            break;
          case TripTimeOfDay.middayOutbound:
            title = 'Bus à proximité (pause midi)';
            body = 'Le bus arrive dans ${eta.toInt()} min pour ramener ${enfant.prenom} à la maison (pause midi)';
            break;
          case TripTimeOfDay.middayReturn:
            title = 'Bus à proximité (retour midi)';
            body = 'Le bus arrive dans ${eta.toInt()} min pour récupérer ${enfant.prenom} (retour de la pause)';
            break;
          case TripTimeOfDay.eveningReturn:
            title = 'Bus à proximité (fin de journée)';
            body = 'Le bus arrive dans ${eta.toInt()} min pour ramener ${enfant.prenom} à la maison (fin de journée)';
            break;
          default:
            body = 'Le bus arrive dans ${eta.toInt()} min pour ${enfant.prenom}';
        }
      }

      await NotificationService().showLocalNotification(
        title: title,
        body: body,
        payload: 'proximity_alert',
      );

      setState(() {
        _hasNotifiedProximity = true;
      });

      print('Notification de proximité envoyée (ETA: ${eta.toInt()} min, Trip: ${bus.currentTrip?.tripType})');
    }
  }

  Future<void> _handleLogout() async {
    final authProvider = context.read<AuthProvider>();
    await authProvider.signOut();

    if (!mounted) return;

    Navigator.of(context).pushReplacement(
      MaterialPageRoute(builder: (_) => const LoginScreen()),
    );
  }

  Widget _buildDrawer(BusProvider busProvider) {
    final authProvider = context.watch<AuthProvider>();
    final selectedEnfant = busProvider.selectedEnfant;

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: AppColors.primary,
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: Colors.white,
                  child: Icon(
                    Icons.person,
                    size: 40,
                    color: AppColors.primary,
                  ),
                ),
                const SizedBox(height: 10),
                Text(
                  authProvider.user?.email ?? 'Parent',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (selectedEnfant != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Enfant: ${selectedEnfant.nomComplet}',
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 14,
                    ),
                  ),
                ],
              ],
            ),
          ),
          ListTile(
            leading: const Icon(Icons.person),
            title: const Text('Mon Profil'),
            onTap: () {
              Navigator.pop(context);
              Navigator.of(context).push(
                MaterialPageRoute(builder: (_) => const ProfileScreen()),
              );
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings),
            title: const Text('Paramètres'),
            onTap: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Paramètres - À venir')),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.logout, color: AppColors.danger),
            title: const Text(
              'Déconnexion',
              style: TextStyle(color: AppColors.danger),
            ),
            onTap: _handleLogout,
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    final busProvider = context.watch<BusProvider>();
    final selectedEnfant = busProvider.selectedEnfant;

    // Écran si aucun enfant
    if (selectedEnfant == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Transport Scolaire'),
        ),
        drawer: _buildDrawer(busProvider),
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.person_outline,
                size: 64,
                color: Colors.grey[400],
              ),
              const SizedBox(height: 16),
              Text(
                'Aucun enfant enregistré',
                style: TextStyle(
                  fontSize: 18,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Contactez l\'école pour enregistrer vos enfants',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }

    // Position initiale de la carte (stop de l'enfant par défaut)
    final initialPosition = selectedEnfant.arret != null
        ? LatLng(selectedEnfant.arret!.lat, selectedEnfant.arret!.lng)
        : const LatLng(5.3600, -4.0083); // Abidjan par défaut

    return Scaffold(
      appBar: AppBar(
        title: Text('Bus de ${selectedEnfant.prenom}'),
        backgroundColor: AppColors.primary,
      ),
      drawer: _buildDrawer(busProvider),
      body: Stack(
        children: [
          // Carte Google Maps avec StreamBuilder
          StreamBuilder<Bus?>(
            stream: busProvider.watchSelectedBus(),
            builder: (context, snapshot) {
              final bus = snapshot.data;

              // Mettre à jour les marqueurs à chaque update GPS
              _updateMarkers(bus, selectedEnfant);

              // Centrer la caméra au premier chargement
              WidgetsBinding.instance.addPostFrameCallback((_) {
                _centerCamera(bus, selectedEnfant);

                // Vérifier la proximité et notifier si nécessaire
                _checkProximityAndNotify(bus, selectedEnfant);
              });

              return GoogleMap(
                onMapCreated: _onMapCreated,
                initialCameraPosition: CameraPosition(
                  target: initialPosition,
                  zoom: 14,
                ),
                markers: _markers,
                myLocationEnabled: true,
                myLocationButtonEnabled: true,
                zoomControlsEnabled: true,
              );
            },
          ),

          // Sélecteur d'enfant en haut (si plusieurs enfants)
          const Positioned(
            left: 0,
            right: 0,
            top: 0,
            child: ChildSelectorDropdown(),
          ),

          // Card d'information en bas
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: StreamBuilder<Bus?>(
              stream: busProvider.watchSelectedBus(),
              builder: (context, snapshot) {
                final bus = snapshot.data;
                return TripStatusCard(
                  bus: bus,
                  enfant: selectedEnfant,
                );
              },
            ),
          ),
        ],
      ),
    );
  }
}
