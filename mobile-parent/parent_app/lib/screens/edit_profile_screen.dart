import 'package:flutter/material.dart';
import '../models/user_profile.dart';
import '../utils/app_colors.dart';

/// Écran d'édition du profil
class EditProfileScreen extends StatefulWidget {
  final UserProfile profile;

  const EditProfileScreen({
    super.key,
    required this.profile,
  });

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _displayNameController;
  late TextEditingController _phoneNumberController;
  late TextEditingController _addressController;
  late TextEditingController _emergencyContactController;

  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _displayNameController = TextEditingController(text: widget.profile.displayName);
    _phoneNumberController = TextEditingController(text: widget.profile.phoneNumber);
    _addressController = TextEditingController(text: widget.profile.address);
    _emergencyContactController = TextEditingController(text: widget.profile.emergencyContact);
  }

  @override
  void dispose() {
    _displayNameController.dispose();
    _phoneNumberController.dispose();
    _addressController.dispose();
    _emergencyContactController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    // Simuler l'enregistrement
    await Future.delayed(const Duration(seconds: 1));

    final updatedProfile = widget.profile.copyWith(
      displayName: _displayNameController.text.trim(),
      phoneNumber: _phoneNumberController.text.trim(),
      address: _addressController.text.trim(),
      emergencyContact: _emergencyContactController.text.trim(),
    );

    if (!mounted) return;

    setState(() => _isLoading = false);

    Navigator.of(context).pop(updatedProfile);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Modifier le profil'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Display Name
            TextFormField(
              controller: _displayNameController,
              decoration: const InputDecoration(
                labelText: 'Nom complet',
                prefixIcon: Icon(Icons.person),
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.trim().isEmpty) {
                  return 'Veuillez entrer votre nom';
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Email (read-only)
            TextFormField(
              initialValue: widget.profile.email,
              decoration: const InputDecoration(
                labelText: 'Email',
                prefixIcon: Icon(Icons.email),
                border: OutlineInputBorder(),
                enabled: false,
              ),
            ),
            const SizedBox(height: 16),

            // Phone Number
            TextFormField(
              controller: _phoneNumberController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Téléphone',
                prefixIcon: Icon(Icons.phone),
                border: OutlineInputBorder(),
                hintText: '+33 6 12 34 56 78',
              ),
              validator: (value) {
                if (value != null && value.isNotEmpty) {
                  if (!UserProfile.isValidPhoneNumber(value)) {
                    return 'Numéro de téléphone invalide';
                  }
                }
                return null;
              },
            ),
            const SizedBox(height: 16),

            // Address
            TextFormField(
              controller: _addressController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: 'Adresse',
                prefixIcon: Icon(Icons.home),
                border: OutlineInputBorder(),
                hintText: '123 Rue de la Paix, 75001 Paris',
              ),
            ),
            const SizedBox(height: 16),

            // Emergency Contact
            TextFormField(
              controller: _emergencyContactController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Contact d\'urgence',
                prefixIcon: Icon(Icons.emergency),
                border: OutlineInputBorder(),
                hintText: '+33 6 87 65 43 21',
              ),
              validator: (value) {
                if (value != null && value.isNotEmpty) {
                  if (!UserProfile.isValidPhoneNumber(value)) {
                    return 'Numéro de téléphone invalide';
                  }
                }
                return null;
              },
            ),
            const SizedBox(height: 32),

            // Save Button
            ElevatedButton(
              onPressed: _isLoading ? null : _handleSave,
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
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
          ],
        ),
      ),
    );
  }
}
