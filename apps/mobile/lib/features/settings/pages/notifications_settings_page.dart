import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/local/app_settings_service.dart';
import '../../../services/device_token_sync_service.dart';
import '../../auth/models/user_preferences_model.dart';
import '../repositories/user_preferences_repository.dart';

/// Préférences de notifications (push et rappels).
class NotificationsSettingsPage extends StatefulWidget {
  const NotificationsSettingsPage({super.key});

  @override
  State<NotificationsSettingsPage> createState() =>
      _NotificationsSettingsPageState();
}

class _NotificationsSettingsPageState extends State<NotificationsSettingsPage>
    with SingleTickerProviderStateMixin {
  final UserPreferencesRepository _repository = UserPreferencesRepository();

  late final TabController _tabController;

  bool _notificationsEnabled = true;
  bool _trafficRegionAlerts = true;
  bool _routeIncidentAlerts = true;
  bool _delayBeforeDeparture = true;
  int _departureReminderMinutes = 0;

  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  static const _reminderOptions = [0, 5, 10, 15];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadSettings();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final preferences = await _repository.fetchPreferences();
      await AppSettingsService.applyFromUserPreferences(preferences);

      if (!mounted) return;
      setState(() => _applyPreferences(preferences));
    } catch (_) {
      if (!mounted) return;
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _applyPreferences(UserPreferences preferences) {
    _notificationsEnabled = preferences.notificationsEnabled;
    _trafficRegionAlerts = preferences.trafficRegionAlertsEnabled;
    _routeIncidentAlerts = preferences.routeIncidentAlertsEnabled;
    _delayBeforeDeparture = preferences.anticipatoryAlertsEnabled;
    _departureReminderMinutes = preferences.departureReminderMinutes;
  }

  Future<void> _save(
    Future<UserPreferences> Function() request, {
    required void Function(UserPreferences prefs) applyLocal,
  }) async {
    if (_isSaving) return;

    setState(() {
      _isSaving = true;
      _errorMessage = null;
    });

    try {
      final updated = await request();
      await AppSettingsService.applyFromUserPreferences(updated);
      if (!mounted) return;
      setState(() => applyLocal(updated));
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  String _reminderLabel(int minutes) {
    return switch (minutes) {
      0 => 'Aucun',
      5 => '5 minutes avant',
      10 => '10 minutes avant',
      15 => '15 minutes avant',
      _ => '$minutes minutes avant',
    };
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
          'Notifications',
          style: AppTypography.heading3.copyWith(fontWeight: FontWeight.bold),
        ),
        bottom: TabBar(
          controller: _tabController,
          labelColor: AppColors.primary,
          unselectedLabelColor: AppColors.textSecondary,
          indicatorColor: AppColors.primary,
          tabs: const [
            Tab(text: 'Notifications push'),
            Tab(text: 'Rappels'),
          ],
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Column(
              children: [
                if (_errorMessage != null)
                  Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Text(
                      _errorMessage!,
                      style: AppTypography.caption.copyWith(
                        color: AppColors.danger,
                      ),
                    ),
                  ),
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [_buildPushTab(), _buildRemindersTab()],
                  ),
                ),
                if (_isSaving)
                  const Padding(
                    padding: EdgeInsets.all(AppSpacing.lg),
                    child: SizedBox(
                      width: 24,
                      height: 24,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                  ),
              ],
            ),
    );
  }

  Widget _buildPushTab() {
    final pushEnabled = _notificationsEnabled;

    return ListView(
      children: [
        _NotificationSwitchTile(
          title: 'Recevoir toutes les notifications push',
          value: _notificationsEnabled,
          enabled: !_isSaving,
          onChanged: (value) async {
            setState(() => _notificationsEnabled = value);
            await _save(
              () => _repository.updatePreferences(notificationsEnabled: value),
              applyLocal: _applyPreferences,
            );
            if (value) {
              await DeviceTokenSyncService.syncIfEnabled(
                notificationsEnabled: true,
              );
            } else {
              await DeviceTokenSyncService.unregister();
            }
          },
        ),
        const Divider(height: 1, color: AppColors.border),
        _NotificationSwitchTile(
          title: 'Trafic dans ma région',
          subtitle:
              'Alertes lorsque le trafic est plus dense que d\'habitude '
              'dans votre ville.',
          value: _trafficRegionAlerts,
          enabled: pushEnabled && !_isSaving,
          onChanged: (value) {
            setState(() => _trafficRegionAlerts = value);
            _save(
              () => _repository.updatePreferences(
                trafficRegionAlertsEnabled: value,
              ),
              applyLocal: _applyPreferences,
            );
          },
        ),
        const Divider(height: 1, color: AppColors.border),
        _NotificationSwitchTile(
          title: 'Incidents sur mon trajet',
          subtitle:
              'Recevez une alerte lorsqu\'un incident est signalé sur '
              'votre trajet préféré.',
          value: _routeIncidentAlerts,
          enabled: pushEnabled && !_isSaving,
          onChanged: (value) {
            setState(() => _routeIncidentAlerts = value);
            _save(
              () => _repository.updatePreferences(
                routeIncidentAlertsEnabled: value,
              ),
              applyLocal: _applyPreferences,
            );
          },
        ),
        const Divider(height: 1, color: AppColors.border),
        _NotificationSwitchTile(
          title: 'Retard avant départ',
          subtitle:
              'Soyez averti si vous devez partir plus tôt à cause '
              'des embouteillages.',
          value: _delayBeforeDeparture,
          enabled: pushEnabled && !_isSaving,
          onChanged: (value) {
            setState(() => _delayBeforeDeparture = value);
            _save(
              () => _repository.updatePreferences(
                anticipatoryAlertsEnabled: value,
              ),
              applyLocal: _applyPreferences,
            );
          },
        ),
      ],
    );
  }

  Widget _buildRemindersTab() {
    return ListView(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.xl,
      ),
      children: [
        Text(
          'Rappel de départ',
          style: AppTypography.body.copyWith(fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: AppSpacing.sm),
        Text(
          'Recevez un rappel pour savoir quand partir en fonction '
          'des conditions de circulation.',
          style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
        ),
        const SizedBox(height: AppSpacing.lg),
        ..._reminderOptions.map((minutes) {
          final isSelected = _departureReminderMinutes == minutes;
          return ListTile(
            contentPadding: EdgeInsets.zero,
            title: Text(_reminderLabel(minutes)),
            trailing: isSelected
                ? const Icon(Icons.check_circle, color: AppColors.primary)
                : null,
            onTap: _isSaving
                ? null
                : () {
                    setState(() => _departureReminderMinutes = minutes);
                    _save(
                      () => _repository.updatePreferences(
                        departureReminderMinutes: minutes,
                      ),
                      applyLocal: _applyPreferences,
                    );
                  },
          );
        }),
      ],
    );
  }
}

class _NotificationSwitchTile extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool value;
  final bool enabled;
  final ValueChanged<bool> onChanged;

  const _NotificationSwitchTile({
    required this.title,
    required this.value,
    required this.enabled,
    required this.onChanged,
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    return SwitchListTile(
      contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.xl,
        vertical: AppSpacing.xs,
      ),
      title: Text(
        title,
        style: AppTypography.body.copyWith(fontWeight: FontWeight.w500),
      ),
      subtitle: subtitle == null
          ? null
          : Text(
              subtitle!,
              style: AppTypography.caption.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
      value: value,
      activeThumbColor: AppColors.primary,
      onChanged: enabled ? onChanged : null,
    );
  }
}
