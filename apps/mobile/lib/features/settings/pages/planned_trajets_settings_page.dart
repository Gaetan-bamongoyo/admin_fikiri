import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/local/app_settings_service.dart';
import '../../trajet/pages/plan_trajet_page.dart';
import '../../auth/models/user_preferences_model.dart';
import '../../trajet/models/trajet_model.dart';
import '../../trajet/repositories/trajet_repository.dart';
import '../repositories/user_preferences_repository.dart';
import '../services/trajet_preferences_sync.dart';

/// Surveillance des trajets Maison / Travail pour alertes avant départ.
class PlannedTrajetsSettingsPage extends StatefulWidget {
  const PlannedTrajetsSettingsPage({super.key});

  @override
  State<PlannedTrajetsSettingsPage> createState() =>
      _PlannedTrajetsSettingsPageState();
}

class _PlannedTrajetsSettingsPageState
    extends State<PlannedTrajetsSettingsPage> {
  final TrajetRepository _trajetRepository = TrajetRepository();
  final UserPreferencesRepository _preferencesRepository =
      UserPreferencesRepository();
  final TrajetPreferencesSync _sync = TrajetPreferencesSync();

  List<TrajetModel> _trajets = [];
  UserPreferences _preferences = UserPreferences.defaults();

  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final trajets = await _trajetRepository.fetchTrajets();
      UserPreferences preferences = UserPreferences.defaults();

      try {
        preferences = await _preferencesRepository.fetchPreferences();
        await AppSettingsService.applyFromUserPreferences(preferences);
      } catch (_) {}

      if (!mounted) return;
      setState(() {
        _trajets = trajets;
        _preferences = preferences;
        _isLoading = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  TrajetModel? _trajetForLabel(String label) {
    for (final trajet in _trajets) {
      if (trajet.label == label) return trajet;
    }
    return null;
  }

  Future<void> _toggleHomeAlerts(bool enabled) async {
    final trajet = _trajetForLabel('Maison');
    if (enabled && trajet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Enregistrez d\'abord une destination « Maison ».'),
        ),
      );
      return;
    }

    setState(() {
      _isSaving = true;
      _preferences = UserPreferences(
        homeLatitude: _preferences.homeLatitude,
        homeLongitude: _preferences.homeLongitude,
        workLatitude: _preferences.workLatitude,
        workLongitude: _preferences.workLongitude,
        notificationsEnabled: _preferences.notificationsEnabled,
        anticipatoryAlertsEnabled: _preferences.anticipatoryAlertsEnabled,
        anonymizePositionData: _preferences.anonymizePositionData,
        searchMetro: _preferences.searchMetro,
        trafficRegionAlertsEnabled: _preferences.trafficRegionAlertsEnabled,
        routeIncidentAlertsEnabled: _preferences.routeIncidentAlertsEnabled,
        departureReminderMinutes: _preferences.departureReminderMinutes,
        homeTrafficAlertsEnabled: enabled,
        workTrafficAlertsEnabled: _preferences.workTrafficAlertsEnabled,
      );
    });

    try {
      final updated = trajet == null
          ? await _sync.clearHomeSlot()
          : await _sync.setHomeAlerts(trajet: trajet, enabled: enabled);
      await AppSettingsService.applyFromUserPreferences(updated);
      if (!mounted) return;
      setState(() => _preferences = updated);
    } catch (error) {
      if (!mounted) return;
      setState(
        () => _errorMessage = error.toString().replaceFirst('Exception: ', ''),
      );
      await _load();
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _toggleWorkAlerts(bool enabled) async {
    final trajet = _trajetForLabel('Travail');
    if (enabled && trajet == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Enregistrez d\'abord une destination « Travail ».'),
        ),
      );
      return;
    }

    setState(() {
      _isSaving = true;
      _preferences = UserPreferences(
        homeLatitude: _preferences.homeLatitude,
        homeLongitude: _preferences.homeLongitude,
        workLatitude: _preferences.workLatitude,
        workLongitude: _preferences.workLongitude,
        notificationsEnabled: _preferences.notificationsEnabled,
        anticipatoryAlertsEnabled: _preferences.anticipatoryAlertsEnabled,
        anonymizePositionData: _preferences.anonymizePositionData,
        searchMetro: _preferences.searchMetro,
        trafficRegionAlertsEnabled: _preferences.trafficRegionAlertsEnabled,
        routeIncidentAlertsEnabled: _preferences.routeIncidentAlertsEnabled,
        departureReminderMinutes: _preferences.departureReminderMinutes,
        homeTrafficAlertsEnabled: _preferences.homeTrafficAlertsEnabled,
        workTrafficAlertsEnabled: enabled,
      );
    });

    try {
      final updated = trajet == null
          ? await _sync.clearWorkSlot()
          : await _sync.setWorkAlerts(trajet: trajet, enabled: enabled);
      await AppSettingsService.applyFromUserPreferences(updated);
      if (!mounted) return;
      setState(() => _preferences = updated);
    } catch (error) {
      if (!mounted) return;
      setState(
        () => _errorMessage = error.toString().replaceFirst('Exception: ', ''),
      );
      await _load();
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _resyncTrajet(TrajetModel trajet) async {
    setState(() => _isSaving = true);

    try {
      final updated = await _sync.syncTrajetCoords(trajet);
      if (updated != null) {
        await AppSettingsService.applyFromUserPreferences(updated);
        if (!mounted) return;
        setState(() => _preferences = updated);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('« ${trajet.label} » synchronisé pour les alertes.'),
            backgroundColor: AppColors.success,
          ),
        );
      }
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.danger,
        ),
      );
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final homeTrajet = _trajetForLabel('Maison');
    final workTrajet = _trajetForLabel('Travail');

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
          'Trajets planifiés',
          style: AppTypography.heading3.copyWith(fontWeight: FontWeight.bold),
        ),
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView(
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
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.xl,
                    AppSpacing.lg,
                    AppSpacing.xl,
                    AppSpacing.sm,
                  ),
                  child: Text(
                    'Recevez la situation du trafic avant votre départ '
                    'vers la Maison ou le Travail.',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
                _PlannedTrajetCard(
                  title: 'Maison',
                  trajet: homeTrajet,
                  alertsEnabled: _preferences.homeTrafficAlertsEnabled,
                  coordsSet: _preferences.hasHomeLocation,
                  isSaving: _isSaving,
                  onToggleAlerts: _toggleHomeAlerts,
                  onResync: homeTrajet == null
                      ? null
                      : () => _resyncTrajet(homeTrajet),
                ),
                const Divider(height: 1, color: AppColors.border),
                _PlannedTrajetCard(
                  title: 'Travail',
                  trajet: workTrajet,
                  alertsEnabled: _preferences.workTrafficAlertsEnabled,
                  coordsSet: _preferences.hasWorkLocation,
                  isSaving: _isSaving,
                  onToggleAlerts: _toggleWorkAlerts,
                  onResync: workTrajet == null
                      ? null
                      : () => _resyncTrajet(workTrajet),
                ),
                const Divider(height: 1, color: AppColors.border),
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xl,
                    vertical: AppSpacing.sm,
                  ),
                  leading: const Icon(
                    Icons.route_outlined,
                    color: AppColors.primary,
                  ),
                  title: const Text('Gérer mes destinations'),
                  subtitle: Text(
                    'Ajouter ou modifier Maison, Travail…',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  trailing: const Icon(Icons.chevron_right),
                  onTap: () async {
                    await PlanTrajetPage.open(context);
                    if (mounted) await _load();
                  },
                ),
              ],
            ),
    );
  }
}

class _PlannedTrajetCard extends StatelessWidget {
  final String title;
  final TrajetModel? trajet;
  final bool alertsEnabled;
  final bool coordsSet;
  final bool isSaving;
  final ValueChanged<bool> onToggleAlerts;
  final VoidCallback? onResync;

  const _PlannedTrajetCard({
    required this.title,
    required this.trajet,
    required this.alertsEnabled,
    required this.coordsSet,
    required this.isSaving,
    required this.onToggleAlerts,
    this.onResync,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.lg,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: AppTypography.body.copyWith(fontWeight: FontWeight.w700),
          ),
          const SizedBox(height: AppSpacing.sm),
          if (trajet == null)
            Text(
              'Aucune destination enregistrée.',
              style: AppTypography.caption.copyWith(
                color: AppColors.textSecondary,
              ),
            )
          else ...[
            Text(
              trajet!.address,
              style: AppTypography.caption.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              '${trajet!.latitude.toStringAsFixed(5)}, '
              '${trajet!.longitude.toStringAsFixed(5)}',
              style: AppTypography.caption.copyWith(
                color: AppColors.textSecondary,
                fontFamily: 'monospace',
              ),
            ),
            if (onResync != null) ...[
              const SizedBox(height: AppSpacing.sm),
              TextButton(
                onPressed: isSaving ? null : onResync,
                child: const Text('Mettre à jour la position'),
              ),
            ],
          ],
          SwitchListTile(
            contentPadding: EdgeInsets.zero,
            title: const Text('Alertes trafic avant départ'),
            subtitle: Text(
              coordsSet
                  ? 'Position enregistrée dans vos préférences.'
                  : 'Activez pour enregistrer la position dans vos préférences.',
              style: AppTypography.caption.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
            value: alertsEnabled,
            activeThumbColor: AppColors.primary,
            onChanged: isSaving ? null : onToggleAlerts,
          ),
        ],
      ),
    );
  }
}
