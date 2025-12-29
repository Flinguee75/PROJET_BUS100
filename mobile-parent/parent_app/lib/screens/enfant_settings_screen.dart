import 'package:flutter/material.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/enfant.dart';
import '../utils/app_colors.dart';

/// Écran de paramétrage de l'enfant
class EnfantSettingsScreen extends StatefulWidget {
  final Enfant enfant;

  const EnfantSettingsScreen({
    super.key,
    required this.enfant,
  });

  @override
  State<EnfantSettingsScreen> createState() => _EnfantSettingsScreenState();
}

class _EnfantSettingsScreenState extends State<EnfantSettingsScreen> {
  // Préférences de notifications
  bool _notificationsEnabled = true;
  bool _busEnRouteNotif = true;
  bool _busProximiteNotif = true;
  int _proximityMinutes = 10; // Délai de notification de proximité (en minutes)
  bool _retardNotif = true;
  bool _absenceNotif = true;
  bool _trackBusEnabled = true;

  // Contact d'urgence
  final _emergencyContactController = TextEditingController(text: '+33 6 12 34 56 78');

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _loadPreferences();
  }

  @override
  void dispose() {
    _emergencyContactController.dispose();
    super.dispose();
  }

  /// Charger les préférences depuis SharedPreferences
  Future<void> _loadPreferences() async {
    final prefs = await SharedPreferences.getInstance();
    final enfantId = widget.enfant.id;

    setState(() {
      _notificationsEnabled = prefs.getBool('${enfantId}_notifications') ?? true;
      _busEnRouteNotif = prefs.getBool('${enfantId}_bus_en_route') ?? true;
      _busProximiteNotif = prefs.getBool('${enfantId}_bus_proximite') ?? true;
      _proximityMinutes = prefs.getInt('${enfantId}_proximity_minutes') ?? 10;
      _retardNotif = prefs.getBool('${enfantId}_retard') ?? true;
      _absenceNotif = prefs.getBool('${enfantId}_absence') ?? true;
      _trackBusEnabled = prefs.getBool('${enfantId}_track_bus') ?? true;

      final emergencyContact = prefs.getString('${enfantId}_emergency_contact');
      if (emergencyContact != null) {
        _emergencyContactController.text = emergencyContact;
      }
    });
  }

  /// Sauvegarder les préférences
  Future<void> _savePreferences() async {
    setState(() => _isLoading = true);

    final prefs = await SharedPreferences.getInstance();
    final enfantId = widget.enfant.id;

    await prefs.setBool('${enfantId}_notifications', _notificationsEnabled);
    await prefs.setBool('${enfantId}_bus_en_route', _busEnRouteNotif);
    await prefs.setBool('${enfantId}_bus_proximite', _busProximiteNotif);
    await prefs.setInt('${enfantId}_proximity_minutes', _proximityMinutes);
    await prefs.setBool('${enfantId}_retard', _retardNotif);
    await prefs.setBool('${enfantId}_absence', _absenceNotif);
    await prefs.setBool('${enfantId}_track_bus', _trackBusEnabled);
    await prefs.setString('${enfantId}_emergency_contact', _emergencyContactController.text);

    setState(() => _isLoading = false);

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Paramètres enregistrés'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Paramètres'),
        actions: [
          if (_isLoading)
            const Center(
              child: Padding(
                padding: EdgeInsets.symmetric(horizontal: 16),
                child: SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
              ),
            ),
        ],
      ),
      body: ListView(
        children: [
          // Section: Informations générales
          const _SectionHeader(title: 'Informations générales'),
          ListTile(
            leading: CircleAvatar(
              radius: 25,
              backgroundColor: AppColors.primary.withOpacity(0.1),
              child: widget.enfant.photoUrl != null
                  ? ClipOval(
                      child: Image.network(
                        widget.enfant.photoUrl!,
                        width: 50,
                        height: 50,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return const Icon(Icons.person, size: 30, color: AppColors.primary);
                        },
                      ),
                    )
                  : const Icon(Icons.person, size: 30, color: AppColors.primary),
            ),
            title: const Text('Nom complet'),
            subtitle: Text(widget.enfant.nomComplet),
          ),
          ListTile(
            leading: const Icon(Icons.class_outlined, color: AppColors.primary),
            title: const Text('Classe'),
            subtitle: Text(widget.enfant.classe),
          ),
          ListTile(
            leading: const Icon(Icons.school_outlined, color: AppColors.primary),
            title: const Text('École'),
            subtitle: Text(widget.enfant.ecole),
          ),
          const Divider(height: 32),

          // Section: Notifications
          const _SectionHeader(title: 'Notifications'),
          SwitchListTile(
            secondary: const Icon(Icons.notifications_outlined, color: AppColors.primary),
            title: const Text('Notifications'),
            subtitle: const Text('Recevoir les notifications du bus'),
            value: _notificationsEnabled,
            onChanged: (value) {
              setState(() => _notificationsEnabled = value);
            },
          ),
          if (_notificationsEnabled) ...[
            Padding(
              padding: const EdgeInsets.only(left: 16),
              child: Column(
                children: [
                  SwitchListTile(
                    title: const Text('Bus en route'),
                    subtitle: const Text('Notification quand le bus démarre'),
                    value: _busEnRouteNotif,
                    onChanged: (value) {
                      setState(() => _busEnRouteNotif = value);
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Bus à proximité'),
                    subtitle: const Text('Notification quand le bus approche'),
                    value: _busProximiteNotif,
                    onChanged: (value) {
                      setState(() => _busProximiteNotif = value);
                    },
                  ),
                  if (_busProximiteNotif)
                    Padding(
                      padding: const EdgeInsets.only(left: 16, right: 16),
                      child: ListTile(
                        title: const Text(
                          'Délai de notification',
                          style: TextStyle(fontSize: 14),
                        ),
                        subtitle: const Text(
                          'Temps avant l\'arrivée du bus',
                          style: TextStyle(fontSize: 12),
                        ),
                        trailing: DropdownButton<int>(
                          value: _proximityMinutes,
                          items: [5, 10, 15, 20].map((int minutes) {
                            return DropdownMenuItem<int>(
                              value: minutes,
                              child: Text('$minutes min'),
                            );
                          }).toList(),
                          onChanged: (int? newValue) {
                            if (newValue != null) {
                              setState(() => _proximityMinutes = newValue);
                            }
                          },
                        ),
                      ),
                    ),
                  SwitchListTile(
                    title: const Text('Retard'),
                    subtitle: const Text('Notification en cas de retard'),
                    value: _retardNotif,
                    onChanged: (value) {
                      setState(() => _retardNotif = value);
                    },
                  ),
                  SwitchListTile(
                    title: const Text('Notifications d\'absence'),
                    subtitle: const Text('Alertes si l\'enfant n\'est pas monté dans le bus'),
                    value: _absenceNotif,
                    onChanged: (value) {
                      setState(() => _absenceNotif = value);
                    },
                  ),
                ],
              ),
            ),
          ],
          const Divider(height: 32),

          // Section: Suivi du bus
          const _SectionHeader(title: 'Suivi du bus'),
          SwitchListTile(
            secondary: const Icon(Icons.my_location, color: AppColors.primary),
            title: const Text('Suivi en temps réel'),
            subtitle: const Text('Voir la position du bus en temps réel'),
            value: _trackBusEnabled,
            onChanged: (value) {
              setState(() => _trackBusEnabled = value);
            },
          ),
          const Divider(height: 32),

          // Section: Contact
          const _SectionHeader(title: 'Contact'),
          ListTile(
            leading: const Icon(Icons.phone, color: AppColors.primary),
            title: const Text('Contact d\'urgence'),
            subtitle: TextField(
              controller: _emergencyContactController,
              decoration: const InputDecoration(
                border: InputBorder.none,
                hintText: '+33 6 12 34 56 78',
              ),
              keyboardType: TextInputType.phone,
            ),
          ),
          const SizedBox(height: 32),

          // Bouton Enregistrer
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
            child: ElevatedButton(
              onPressed: _isLoading ? null : _savePreferences,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                      ),
                    )
                  : const Text(
                      'Enregistrer',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
            ),
          ),
          const SizedBox(height: 16),
        ],
      ),
    );
  }
}

/// Widget pour les en-têtes de section
class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.grey[200],
      child: Text(
        title,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
