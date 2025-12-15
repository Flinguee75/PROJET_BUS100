import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:provider/provider.dart';
import '../models/bus.dart';
import '../models/enfant.dart';
import '../providers/bus_provider.dart';
import '../services/eta_service.dart';
import '../utils/app_colors.dart';

/// Écran de carte - Suivi en temps réel du bus
class MapScreen extends StatefulWidget {
  final Enfant enfant;
  final Bus? bus;

  const MapScreen({
    super.key,
    required this.enfant,
    this.bus,
  });

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};

  // Destination par défaut (école) - à remplacer par la vraie destination
  final double _destinationLat = 36.8065;
  final double _destinationLng = 10.1815;

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
  }

  void _updateMarkers(Bus? bus) {
    if (bus?.currentPosition == null) return;

    setState(() {
      _markers.clear();
      _markers.add(
        Marker(
          markerId: MarkerId(bus!.id),
          position: LatLng(
            bus.currentPosition!.lat,
            bus.currentPosition!.lng,
          ),
          infoWindow: InfoWindow(
            title: bus.immatriculation,
            snippet: bus.statusLabel,
          ),
          icon: BitmapDescriptor.defaultMarkerWithHue(
            _getMarkerColor(bus.status),
          ),
        ),
      );

      // Centrer la carte sur le bus
      _mapController?.animateCamera(
        CameraUpdate.newLatLng(
          LatLng(
            bus.currentPosition!.lat,
            bus.currentPosition!.lng,
          ),
        ),
      );
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

  @override
  Widget build(BuildContext context) {
    final busProvider = context.watch<BusProvider>();

    return Scaffold(
      appBar: AppBar(
        title: Text('Bus de ${widget.enfant.prenom}'),
      ),
      body: Stack(
        children: [
          // Carte Google Maps
          StreamBuilder<Bus?>(
            stream: busProvider.watchBusPosition(widget.enfant.busId),
            initialData: widget.bus,
            builder: (context, snapshot) {
              final bus = snapshot.data;

              if (bus?.currentPosition != null) {
                _updateMarkers(bus);
              }

              return GoogleMap(
                onMapCreated: _onMapCreated,
                initialCameraPosition: CameraPosition(
                  target: bus?.currentPosition != null
                      ? LatLng(
                          bus!.currentPosition!.lat,
                          bus.currentPosition!.lng,
                        )
                      : const LatLng(36.8065, 10.1815), // Tunis par défaut
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
                stream: busProvider.watchBusPosition(widget.enfant.busId),
                initialData: widget.bus,
                builder: (context, snapshot) {
                  final bus = snapshot.data;

                  if (bus == null) {
                    return const Text(
                      'Aucune information disponible',
                      style: TextStyle(color: AppColors.textSecondary),
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

                      // ETA et Distance
                      if (bus.currentPosition != null) ...[
                        _buildETASection(bus),
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

  Widget _buildETASection(Bus bus) {
    if (bus.currentPosition == null) {
      return const SizedBox.shrink();
    }

    // Calculer la distance
    final distance = ETAService.calculateDistance(
      bus.currentPosition!.lat,
      bus.currentPosition!.lng,
      _destinationLat,
      _destinationLng,
    );

    // Calculer l'ETA
    final eta = ETAService.calculateETA(distance, bus.currentPosition!.speed);
    final formattedETA = ETAService.formatETA(eta);

    // Vérifier si proche
    final isNear = ETAService.isNearDestination(
      busPosition: bus.currentPosition!,
      destinationLat: _destinationLat,
      destinationLng: _destinationLng,
    );

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: isNear ? AppColors.success.withOpacity(0.1) : AppColors.primary.withOpacity(0.05),
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
                        color: isNear ? AppColors.success : AppColors.textSecondary,
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
                        color: isNear ? AppColors.success : AppColors.textSecondary,
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
}

