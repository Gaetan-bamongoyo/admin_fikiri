import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../routes/app_routes.dart';
import '../widgets/settings_menu_tile.dart';

/// Hub principal des paramètres (inspiré Waze).
class SettingsPage extends StatelessWidget {
  const SettingsPage({super.key});

  static const _appVersion = '1.0.0';

  void _showComingSoon(BuildContext context, String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature — bientôt disponible'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Paramètres',
          style: AppTypography.heading3.copyWith(fontWeight: FontWeight.bold),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.close, color: AppColors.textPrimary),
            onPressed: () => Navigator.pop(context),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: ListView(
              children: [
                SettingsMenuTile(
                  icon: Icons.tune_rounded,
                  iconColor: const Color(0xFF38BDF8),
                  label: 'Général',
                  onTap: () {
                    Navigator.pushNamed(context, AppRoutes.generalSettingsPage);
                  },
                ),
                const Divider(height: 1, color: AppColors.border),
                const SettingsSectionHeader(title: 'Notifications'),
                SettingsMenuTile(
                  icon: Icons.notifications_rounded,
                  iconColor: const Color(0xFF8B5CF6),
                  label: 'Notifications',
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      AppRoutes.notificationsSettingsPage,
                    );
                  },
                ),
                const Divider(height: 1, color: AppColors.border),
                SettingsMenuTile(
                  icon: Icons.schedule_rounded,
                  iconColor: const Color(0xFF60A5FA),
                  label: 'Trajets planifiés',
                  onTap: () {
                    Navigator.pushNamed(
                      context,
                      AppRoutes.plannedTrajetsSettingsPage,
                    );
                  },
                ),
                const Divider(height: 1, color: AppColors.border),
                const SettingsSectionHeader(title: 'Application'),
                SettingsMenuTile(
                  icon: Icons.info_outline_rounded,
                  iconColor: const Color(0xFF38BDF8),
                  label: 'À propos',
                  onTap: () => _showComingSoon(context, 'À propos'),
                ),
                const Divider(height: 1, color: AppColors.border),
                SettingsMenuTile(
                  icon: Icons.help_outline_rounded,
                  iconColor: const Color(0xFF64748B),
                  label: 'Aide et commentaires',
                  onTap: () => _showComingSoon(context, 'Aide et commentaires'),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.xxl),
            child: Text(
              'Version $_appVersion',
              style: AppTypography.caption.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
