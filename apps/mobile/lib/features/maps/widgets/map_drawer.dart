import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/local/session_manager.dart';
import '../../../data/local/shared_preferences_service.dart';
import '../../../routes/app_routes.dart';

/// Drawer de navigation principal — style épuré inspiré Waze, couleurs FIKIRI.
class MapDrawer extends StatefulWidget {
  final VoidCallback onReportIncident;
  final VoidCallback onPlanTrip;

  const MapDrawer({
    super.key,
    required this.onReportIncident,
    required this.onPlanTrip,
  });

  @override
  State<MapDrawer> createState() => _MapDrawerState();
}

class _MapDrawerState extends State<MapDrawer> {
  String _firstName = '';
  String _fullName = 'Utilisateur';

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await SharedPreferencesService.getUser();
    if (!mounted || user == null) return;

    final firstName = user['firstName'] as String? ?? '';
    final lastName = user['lastName'] as String? ?? '';
    final fullName = '$firstName $lastName'.trim();

    setState(() {
      _firstName = firstName;
      _fullName = fullName.isNotEmpty ? fullName : 'Utilisateur';
    });
  }

  void _closeDrawer() => Navigator.pop(context);

  void _openProfile() {
    _closeDrawer();
    Navigator.pushNamed(context, AppRoutes.personalSpacePage);
  }

  Future<void> _logout() async {
    await SessionManager.logout();
    await SharedPreferencesService.removeUser();
    if (!mounted) return;
    Navigator.pushReplacementNamed(context, AppRoutes.loginPage);
  }

  @override
  Widget build(BuildContext context) {
    final greeting = _firstName.isNotEmpty
        ? 'Bonjour, $_firstName !'
        : 'Bonjour !';

    return Drawer(
      width: MediaQuery.sizeOf(context).width * 0.88,
      backgroundColor: AppColors.surface,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.only(
          topRight: Radius.circular(AppRadius.modal),
          bottomRight: Radius.circular(AppRadius.modal),
        ),
      ),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ── Fermer ────────────────────────────────────────────────────
            Align(
              alignment: Alignment.centerRight,
              child: IconButton(
                onPressed: _closeDrawer,
                icon: const Icon(Icons.close, color: AppColors.textPrimary),
                tooltip: 'Fermer',
              ),
            ),

            // ── Profil ────────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: AppSpacing.xl),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 36,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                    child: CircleAvatar(
                      radius: 32,
                      backgroundColor: AppColors.primary,
                      child: Text(
                        _initials(_fullName),
                        style: AppTypography.heading3.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: AppSpacing.lg),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          greeting,
                          style: AppTypography.heading2.copyWith(
                            fontSize: 20,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        TextButton(
                          onPressed: _openProfile,
                          style: TextButton.styleFrom(
                            backgroundColor: AppColors.primary.withValues(
                              alpha: 0.1,
                            ),
                            foregroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(
                              horizontal: AppSpacing.lg,
                              vertical: AppSpacing.sm,
                            ),
                            minimumSize: Size.zero,
                            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(
                                AppRadius.button,
                              ),
                            ),
                          ),
                          child: const Text(
                            'Voir le profil',
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: AppSpacing.xl),
            const Divider(height: 1, color: AppColors.border),
            const SizedBox(height: AppSpacing.sm),

            // ── Menu ──────────────────────────────────────────────────────
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                children: [
                  _DrawerMenuItem(
                    icon: Icons.route_outlined,
                    label: 'Planifier un trajet',
                    onTap: () {
                      _closeDrawer();
                      widget.onPlanTrip();
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.map_outlined,
                    label: 'Carte du trafic',
                    onTap: _closeDrawer,
                  ),
                  _DrawerMenuItem(
                    icon: Icons.person_outline,
                    label: 'Mon espace personnel',
                    onTap: _openProfile,
                  ),
                  _DrawerMenuItem(
                    icon: Icons.report_problem_outlined,
                    label: 'Signaler un incident',
                    onTap: () {
                      _closeDrawer();
                      widget.onReportIncident();
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.settings_outlined,
                    label: 'Paramètres',
                    onTap: () {
                      _closeDrawer();
                      Navigator.pushNamed(context, AppRoutes.settingsPage);
                    },
                  ),
                  _DrawerMenuItem(
                    icon: Icons.help_outline,
                    label: 'Aide et commentaires',
                    onTap: () {
                      _closeDrawer();
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Aide — bientôt disponible'),
                        ),
                      );
                    },
                  ),
                  const SizedBox(height: AppSpacing.lg),
                  _DrawerMenuItem(
                    icon: Icons.power_settings_new,
                    label: 'Quitter',
                    onTap: _logout,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _initials(String name) {
    final parts = name.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return 'F';
    if (parts.length == 1) return parts.first[0].toUpperCase();
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }
}

class _DrawerMenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _DrawerMenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.xl,
            vertical: AppSpacing.lg,
          ),
          child: Row(
            children: [
              Icon(icon, size: 26, color: AppColors.textPrimary),
              const SizedBox(width: AppSpacing.xl),
              Expanded(
                child: Text(
                  label,
                  style: AppTypography.body.copyWith(
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
