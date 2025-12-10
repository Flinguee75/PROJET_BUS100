import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_profile.dart';
import '../providers/auth_provider.dart';
import '../providers/notification_provider.dart';
import '../utils/app_colors.dart';
import 'login_screen.dart';
import 'edit_profile_screen.dart';

/// Écran de profil utilisateur
class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  UserProfile? _userProfile;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadUserProfile();
  }

  Future<void> _loadUserProfile() async {
    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();
    final user = authProvider.user;

    if (user != null) {
      setState(() {
        _userProfile = UserProfile(
          uid: user.uid,
          email: user.email ?? '',
          displayName: user.displayName,
          phoneNumber: user.phoneNumber,
          photoURL: user.photoURL,
        );
        _isLoading = false;
      });
    } else {
      setState(() => _isLoading = false);
    }
  }

  Future<void> _handleLogout() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Déconnexion'),
        content: const Text('Voulez-vous vraiment vous déconnecter ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Déconnexion',
              style: TextStyle(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );

    if (confirmed == true && mounted) {
      // Supprimer le token FCM avant déconnexion
      final notificationProvider = context.read<NotificationProvider>();
      await notificationProvider.unregisterToken();
      notificationProvider.reset();

      final authProvider = context.read<AuthProvider>();
      await authProvider.signOut();

      if (!mounted) return;

      Navigator.of(context).pushAndRemoveUntil(
        MaterialPageRoute(builder: (_) => const LoginScreen()),
        (route) => false,
      );
    }
  }

  Future<void> _handleChangePassword() async {
    await showDialog(
      context: context,
      builder: (context) => const _ChangePasswordDialog(),
    );
  }

  Future<void> _handleEditProfile() async {
    if (_userProfile == null) return;

    final updatedProfile = await Navigator.of(context).push<UserProfile>(
      MaterialPageRoute(
        builder: (_) => EditProfileScreen(profile: _userProfile!),
      ),
    );

    if (updatedProfile != null) {
      setState(() {
        _userProfile = updatedProfile;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Profil'),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _userProfile == null
              ? const Center(
                  child: Text('Impossible de charger le profil'),
                )
              : ListView(
                  children: [
                    const SizedBox(height: 24),

                    // Avatar
                    Center(
                      child: CircleAvatar(
                        radius: 50,
                        backgroundColor: AppColors.primary,
                        backgroundImage: _userProfile!.photoURL != null
                            ? NetworkImage(_userProfile!.photoURL!)
                            : null,
                        child: _userProfile!.photoURL == null
                            ? Text(
                                _userProfile!.initials,
                                style: const TextStyle(
                                  fontSize: 36,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                              )
                            : null,
                      ),
                    ),
                    const SizedBox(height: 16),

                    // Display Name
                    Center(
                      child: Text(
                        _userProfile!.displayName ?? 'Utilisateur',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Email
                    Center(
                      child: Text(
                        _userProfile!.email,
                        style: const TextStyle(
                          fontSize: 14,
                          color: AppColors.textSecondary,
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Edit Profile Button
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: ElevatedButton.icon(
                        onPressed: _handleEditProfile,
                        icon: const Icon(Icons.edit),
                        label: const Text('Modifier le profil'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Informations personnelles
                    const _SectionHeader(title: 'Informations personnelles'),
                    if (_userProfile!.phoneNumber != null)
                      ListTile(
                        leading: const Icon(Icons.phone, color: AppColors.primary),
                        title: const Text('Téléphone'),
                        subtitle: Text(_userProfile!.phoneNumber!),
                      ),
                    if (_userProfile!.address != null)
                      ListTile(
                        leading: const Icon(Icons.home, color: AppColors.primary),
                        title: const Text('Adresse'),
                        subtitle: Text(_userProfile!.address!),
                      ),
                    if (_userProfile!.emergencyContact != null)
                      ListTile(
                        leading: const Icon(Icons.emergency, color: AppColors.danger),
                        title: const Text('Contact d\'urgence'),
                        subtitle: Text(_userProfile!.emergencyContact!),
                      ),
                    const Divider(height: 32),

                    // Paramètres
                    const _SectionHeader(title: 'Paramètres'),
                    Consumer<NotificationProvider>(
                      builder: (context, notificationProvider, _) {
                        return SwitchListTile(
                          secondary: const Icon(Icons.notifications, color: AppColors.primary),
                          title: const Text('Notifications'),
                          subtitle: Text(
                            notificationProvider.notificationsEnabled
                                ? 'Notifications activées'
                                : 'Notifications désactivées',
                          ),
                          value: notificationProvider.notificationsEnabled,
                          onChanged: (value) async {
                            await notificationProvider.setNotificationsEnabled(
                              value,
                              _userProfile?.uid,
                            );
                            // Mettre à jour aussi le profil local
                            if (_userProfile != null) {
                              setState(() {
                                _userProfile = _userProfile!.copyWith(
                                  notificationsEnabled: value,
                                );
                              });
                            }
                          },
                        );
                      },
                    ),
                    const Divider(height: 32),

                    // Sécurité
                    const _SectionHeader(title: 'Sécurité'),
                    ListTile(
                      leading: const Icon(Icons.lock, color: AppColors.primary),
                      title: const Text('Changer le mot de passe'),
                      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                      onTap: _handleChangePassword,
                    ),
                    const Divider(height: 32),

                    // Déconnexion
                    Padding(
                      padding: const EdgeInsets.all(16),
                      child: ElevatedButton.icon(
                        onPressed: _handleLogout,
                        icon: const Icon(Icons.logout),
                        label: const Text('Déconnexion'),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.danger,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),
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

/// Dialog pour changer le mot de passe
class _ChangePasswordDialog extends StatefulWidget {
  const _ChangePasswordDialog();

  @override
  State<_ChangePasswordDialog> createState() => _ChangePasswordDialogState();
}

class _ChangePasswordDialogState extends State<_ChangePasswordDialog> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleChangePassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // TODO: Implement password change logic with Firebase
    await Future.delayed(const Duration(seconds: 1));

    if (!mounted) return;

    setState(() => _isLoading = false);

    Navigator.of(context).pop();

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Mot de passe modifié avec succès'),
        backgroundColor: AppColors.success,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('Changer le mot de passe'),
      content: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Current Password
              TextFormField(
                controller: _currentPasswordController,
                obscureText: _obscureCurrentPassword,
                decoration: InputDecoration(
                  labelText: 'Mot de passe actuel',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureCurrentPassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureCurrentPassword = !_obscureCurrentPassword;
                      });
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer votre mot de passe actuel';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // New Password
              TextFormField(
                controller: _newPasswordController,
                obscureText: _obscureNewPassword,
                decoration: InputDecoration(
                  labelText: 'Nouveau mot de passe',
                  prefixIcon: const Icon(Icons.lock),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureNewPassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureNewPassword = !_obscureNewPassword;
                      });
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez entrer un nouveau mot de passe';
                  }
                  if (value.length < 6) {
                    return 'Le mot de passe doit contenir au moins 6 caractères';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),

              // Confirm Password
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: _obscureConfirmPassword,
                decoration: InputDecoration(
                  labelText: 'Confirmer le mot de passe',
                  prefixIcon: const Icon(Icons.lock),
                  suffixIcon: IconButton(
                    icon: Icon(
                      _obscureConfirmPassword
                          ? Icons.visibility_outlined
                          : Icons.visibility_off_outlined,
                    ),
                    onPressed: () {
                      setState(() {
                        _obscureConfirmPassword = !_obscureConfirmPassword;
                      });
                    },
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Veuillez confirmer le mot de passe';
                  }
                  if (value != _newPasswordController.text) {
                    return 'Les mots de passe ne correspondent pas';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.of(context).pop(),
          child: const Text('Annuler'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _handleChangePassword,
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.primary,
            foregroundColor: Colors.white,
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('Modifier'),
        ),
      ],
    );
  }
}
