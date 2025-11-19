import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/students_provider.dart';
import '../models/student.dart';

class StudentsListScreen extends StatefulWidget {
  const StudentsListScreen({super.key});

  @override
  State<StudentsListScreen> createState() => _StudentsListScreenState();
}

class _StudentsListScreenState extends State<StudentsListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadData();
    });
  }

  Future<void> _loadData() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final studentsProvider =
        Provider.of<StudentsProvider>(context, listen: false);

    final driver = authProvider.driver;
    if (driver?.busId != null) {
      await studentsProvider.loadStudents(driver!.busId!);
    }
  }

  Future<void> _toggleGPSTracking() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final studentsProvider =
        Provider.of<StudentsProvider>(context, listen: false);

    final driver = authProvider.driver;
    if (driver?.busId == null) return;

    if (studentsProvider.isGPSTracking) {
      await studentsProvider.stopGPSTracking(driver!.busId!);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Suivi GPS arrêté'),
            backgroundColor: Colors.orange,
          ),
        );
      }
    } else {
      await studentsProvider.startGPSTracking(driver!.busId!, driver.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Suivi GPS démarré'),
            backgroundColor: Colors.green,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = Provider.of<AuthProvider>(context);
    final studentsProvider = Provider.of<StudentsProvider>(context);

    final driver = authProvider.driver;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Mes Élèves'),
            if (studentsProvider.bus != null)
              Text(
                'Bus ${studentsProvider.bus!.plate}',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.normal),
              ),
          ],
        ),
        actions: [
          // Indicateur GPS
          IconButton(
            icon: Icon(
              studentsProvider.isGPSTracking
                  ? Icons.gps_fixed
                  : Icons.gps_off,
              color: studentsProvider.isGPSTracking
                  ? Colors.green
                  : Colors.grey,
            ),
            onPressed: _toggleGPSTracking,
          ),

          // Menu
          PopupMenuButton<String>(
            onSelected: (value) {
              if (value == 'logout') {
                authProvider.signOut();
              } else if (value == 'refresh') {
                _loadData();
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'refresh',
                child: Row(
                  children: [
                    Icon(Icons.refresh),
                    SizedBox(width: 8),
                    Text('Actualiser'),
                  ],
                ),
              ),
              const PopupMenuItem(
                value: 'logout',
                child: Row(
                  children: [
                    Icon(Icons.logout),
                    SizedBox(width: 8),
                    Text('Déconnexion'),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          // Statistiques
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.blue[700],
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.1),
                  blurRadius: 4,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildStatCard(
                  icon: Icons.people,
                  label: 'Total élèves',
                  value: '${studentsProvider.students.length}',
                ),
                _buildStatCard(
                  icon: Icons.check_circle,
                  label: 'À bord',
                  value: '${studentsProvider.studentsOnBoardCount}',
                ),
              ],
            ),
          ),

          // Liste des élèves
          Expanded(
            child: studentsProvider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : studentsProvider.students.isEmpty
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.people_outline,
                              size: 64,
                              color: Colors.grey[400],
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Aucun élève assigné',
                              style: TextStyle(
                                fontSize: 16,
                                color: Colors.grey[600],
                              ),
                            ),
                          ],
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadData,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(8),
                          itemCount: studentsProvider.students.length,
                          itemBuilder: (context, index) {
                            final student = studentsProvider.students[index];
                            return _buildStudentCard(
                              student,
                              driver!,
                              studentsProvider,
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required String label,
    required String value,
  }) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(icon, color: Colors.white, size: 28),
          const SizedBox(height: 4),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.white.withOpacity(0.9),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStudentCard(
    Student student,
    driver,
    StudentsProvider provider,
  ) {
    final status = student.todayStatus ?? AttendanceStatus.notBoarded;
    final isBoarded = status == AttendanceStatus.boarded;
    final isCompleted = status == AttendanceStatus.completed;

    return Card(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Row(
          children: [
            // Avatar
            CircleAvatar(
              radius: 24,
              backgroundColor: _getStatusColor(status).withOpacity(0.2),
              child: Text(
                student.firstName[0].toUpperCase(),
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: _getStatusColor(status),
                ),
              ),
            ),
            const SizedBox(width: 12),

            // Nom
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    student.fullName,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        _getStatusIcon(status),
                        size: 16,
                        color: _getStatusColor(status),
                      ),
                      const SizedBox(width: 4),
                      Text(
                        _getStatusText(status),
                        style: TextStyle(
                          fontSize: 12,
                          color: _getStatusColor(status),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Boutons d'action
            if (!isCompleted) ...[
              if (isBoarded)
                // Bouton Descendre
                ElevatedButton.icon(
                  onPressed: () async {
                    final success = await provider.exitStudent(
                      student.id,
                      driver.busId,
                      driver.id,
                    );
                    if (mounted && success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${student.fullName} est descendu(e)'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.arrow_downward, size: 18),
                  label: const Text('Descendre'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.orange,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                )
              else
                // Bouton Monter
                ElevatedButton.icon(
                  onPressed: () async {
                    final success = await provider.boardStudent(
                      student.id,
                      driver.busId,
                      driver.id,
                    );
                    if (mounted && success) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('${student.fullName} est monté(e)'),
                          backgroundColor: Colors.green,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.arrow_upward, size: 18),
                  label: const Text('Monter'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.green,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  ),
                ),
            ] else
              // Badge Terminé
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(16),
                ),
                child: const Text(
                  'Terminé',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                    color: Colors.grey,
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.boarded:
        return Colors.blue;
      case AttendanceStatus.completed:
        return Colors.green;
      case AttendanceStatus.absent:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.boarded:
        return Icons.directions_bus;
      case AttendanceStatus.completed:
        return Icons.check_circle;
      case AttendanceStatus.absent:
        return Icons.cancel;
      default:
        return Icons.circle_outlined;
    }
  }

  String _getStatusText(AttendanceStatus status) {
    switch (status) {
      case AttendanceStatus.boarded:
        return 'À bord';
      case AttendanceStatus.completed:
        return 'Trajet terminé';
      case AttendanceStatus.absent:
        return 'Absent';
      default:
        return 'Pas encore monté';
    }
  }
}
