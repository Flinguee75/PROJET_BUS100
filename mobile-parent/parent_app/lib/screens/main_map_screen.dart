import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../models/bus.dart';
import '../models/enfant.dart';
import '../providers/auth_provider.dart';
import '../providers/bus_provider.dart';
import '../services/eta_service.dart';
import '../utils/app_colors.dart';
import 'login_screen.dart';
import 'profile_screen.dart';

/// Écran principal - Carte avec menu Drawer (style Uber)
class MainMapScreen extends StatefulWidget {
  const MainMapScreen({super.key});

  @override
  State<MainMapScreen> createState() => _MainMapScreenState();
}

class _MainMapScreenState extends State<MainMapScreen> {
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};
  Enfant? _currentEnfant;
  Bus? _currentBus;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
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

      if (busProvider.enfants.isNotEmpty) {
        setState(() {
          _currentEnfant = busProvider.enfants.first;
          _currentBus = busProvider.getBusForEnfant(_currentEnfant!);
        });
      }
    }

    setState(() => _isLoading = false);
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
  }

  void _updateMarkers(Bus? bus, Enfant? enfant) {
    setState(() {
      _markers.clear();

      // Marqueur pour l'arrêt de l'enfant
      if (enfant?.arret != null) {
        _markers.add(
          Marker(
            markerId: const MarkerId('arret'),
            position: LatLng(
              enfant!.arret!.lat,
              enfant.arret!.lng,
            ),
            infoWindow: InfoWindow(
              title: 'Arrêt de ${enfant.prenom}',
              snippet: enfant.ecole,
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(
              BitmapDescriptor.hueRed,
            ),
          ),
        );
      }

      // Marqueur pour le bus (si position disponible)
      if (bus?.currentPosition != null) {
        _markers.add(
          Marker(
            markerId: MarkerId(bus!.id),
            position: LatLng(
              bus.currentPosition!.lat,
              bus.currentPosition!.lng,
            ),
            infoWindow: InfoWindow(
              title: 'Bus ${bus.immatriculation}',
              snippet: bus.statusLabel,
            ),
            icon: BitmapDescriptor.defaultMarkerWithHue(
              _getMarkerColor(bus.status),
            ),
          ),
        );
      }
    });
  }

  double _getMarkerColor(BusStatus status) {
    switch (status) {
      case BusStatus.enRoute:
        return BitmapDescriptor.hueGreen;
      case BusStatus.enRetard:
        return BitmapDescriptor.hueOrange;
      case BusStatus.aLArret:
        return BitmapDescriptor.hueBlue;
      case BusStatus.horsService:
        return BitmapDescriptor.hueViolet;
    }
  }

  Color _getStatusColor(BusStatus status) {
    switch (status) {
      case BusStatus.enRoute:
        return AppColors.busEnRoute;
      case BusStatus.enRetard:
        return AppColors.busEnRetard;
      case BusStatus.aLArret:
        return AppColors.busALArret;
      case BusStatus.horsService:
        return AppColors.busHorsService;
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

  Widget _buildDrawer() {
    final authProvider = context.watch<AuthProvider>();

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
                if (_currentEnfant != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    'Enfant: ${_currentEnfant!.nomComplet}',
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

    if (_currentEnfant == null) {
      return Scaffold(
        appBar: AppBar(
          title: const Text('Transport Scolaire'),
        ),
        drawer: _buildDrawer(),
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

    final busProvider = context.watch<BusProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Bus de ${_currentEnfant!.prenom}'),
        backgroundColor: AppColors.primary,
      ),
      drawer: _buildDrawer(),
      body: Stack(
        children: [
          // Carte Google Maps
          StreamBuilder<Bus?>(
            stream: busProvider.watchBusPosition(_currentEnfant!.busId),
            initialData: _currentBus,
            builder: (context, snapshot) {
              final bus = snapshot.data;

              // Mettre à jour les marqueurs
              _updateMarkers(bus, _currentEnfant);

              // Déterminer la position initiale de la carte
              LatLng initialPosition;
              if (_currentEnfant!.arret != null) {
                // Centrer sur l'arrêt de l'enfant
                initialPosition = LatLng(
                  _currentEnfant!.arret!.lat,
                  _currentEnfant!.arret!.lng,
                );
              } else if (bus?.currentPosition != null) {
                // Si pas d'arrêt, centrer sur le bus
                initialPosition = LatLng(
                  bus!.currentPosition!.lat,
                  bus.currentPosition!.lng,
                );
              } else {
                // Par défaut, centrer sur Abidjan (coordonnées à affiner)
                initialPosition = const LatLng(5.3600, -4.0083);
              }

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

          // Card d'information en bas
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: Container(
              margin: const EdgeInsets.all(16),
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.1),
                    blurRadius: 10,
                    offset: const Offset(0, -2),
                  ),
                ],
              ),
              child: StreamBuilder<Bus?>(
                stream: busProvider.watchBusPosition(_currentEnfant!.busId),
                initialData: _currentBus,
                builder: (context, snapshot) {
                  final bus = snapshot.data;

                  if (bus == null) {
                    return const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          'Aucune information disponible',
                          style: TextStyle(color: AppColors.textSecondary),
                        ),
                      ],
                    );
                  }

                  // Vérifier si le bus est en course
                  final isInService = bus.status != BusStatus.horsService &&
                      bus.currentPosition != null;

                  if (!isInService) {
                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 6,
                              ),
                              decoration: BoxDecoration(
                                color: AppColors.busHorsService,
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: const Text(
                                'Pas de course en cours',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildInfoRow(
                          Icons.directions_bus,
                          'Bus',
                          bus.immatriculation,
                        ),
                        const SizedBox(height: 8),
                        _buildInfoRow(
                          Icons.person,
                          'Chauffeur',
                          bus.chauffeur,
                        ),
                      ],
                    );
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Statut
                      Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 12,
                              vertical: 6,
                            ),
                            decoration: BoxDecoration(
                              color: _getStatusColor(bus.status),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: Text(
                              bus.statusLabel,
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                          const Spacer(),
                          if (bus.lastGPSUpdate != null)
                            Text(
                              'Mis à jour: ${bus.lastGPSUpdate}',
                              style: const TextStyle(
                                fontSize: 12,
                                color: AppColors.textSecondary,
                              ),
                            ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      // ETA et Distance (si arrêt disponible)
                      if (bus.currentPosition != null &&
                          _currentEnfant!.arret != null) ...[
                        _buildETASection(bus, _currentEnfant!),
                        const Divider(height: 24),
                      ],

                      // Informations du bus
                      _buildInfoRow(
                        Icons.directions_bus,
                        'Bus',
                        bus.immatriculation,
                      ),
                      const SizedBox(height: 8),
                      _buildInfoRow(
                        Icons.person,
                        'Chauffeur',
                        bus.chauffeur,
                      ),
                      const SizedBox(height: 8),
                      _buildInfoRow(
                        Icons.route,
                        'Itinéraire',
                        bus.itineraire,
                      ),
                      if (bus.currentPosition != null) ...[
                        const SizedBox(height: 8),
                        _buildInfoRow(
                          Icons.speed,
                          'Vitesse',
                          '${bus.currentPosition!.speed.toStringAsFixed(1)} km/h',
                        ),
                      ],
                    ],
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildETASection(Bus bus, Enfant enfant) {
    if (bus.currentPosition == null || enfant.arret == null) {
      return const SizedBox.shrink();
    }

    // Calculer la distance vers l'arrêt de l'enfant
    final distance = ETAService.calculateDistance(
      bus.currentPosition!.lat,
      bus.currentPosition!.lng,
      enfant.arret!.lat,
      enfant.arret!.lng,
    );

    // Calculer l'ETA
    final eta = ETAService.calculateETA(distance, bus.currentPosition!.speed);
    final formattedETA = ETAService.formatETA(eta);

    // Vérifier si proche
    final isNear = ETAService.isNearDestination(
      busPosition: bus.currentPosition!,
      destinationLat: enfant.arret!.lat,
      destinationLng: enfant.arret!.lng,
    );

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isNear
            ? AppColors.success.withOpacity(0.1)
            : AppColors.primary.withOpacity(0.05),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          // ETA
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.schedule,
                      size: 16,
                      color: isNear ? AppColors.success : AppColors.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'ETA',
                      style: TextStyle(
                        fontSize: 12,
                        color:
                            isNear ? AppColors.success : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  formattedETA,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isNear ? AppColors.success : AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
          // Distance
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      Icons.straighten,
                      size: 16,
                      color: isNear ? AppColors.success : AppColors.primary,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Distance',
                      style: TextStyle(
                        fontSize: 12,
                        color:
                            isNear ? AppColors.success : AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 4),
                Text(
                  distance < 1
                      ? '${(distance * 1000).toStringAsFixed(0)} m'
                      : '${distance.toStringAsFixed(1)} km',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: isNear ? AppColors.success : AppColors.primary,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, size: 20, color: AppColors.primary),
        const SizedBox(width: 8),
        Text(
          '$label: ',
          style: const TextStyle(
            fontSize: 14,
            color: AppColors.textSecondary,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              color: AppColors.textPrimary,
            ),
          ),
        ),
      ],
    );
  }
}
