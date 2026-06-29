import 'package:flutter/material.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/local/app_settings_service.dart';
import '../../../data/models/search_metro_preference.dart';
import '../repositories/user_preferences_repository.dart';

/// Paramètres généraux : ville de recherche et confidentialité.
class GeneralSettingsPage extends StatefulWidget {
  const GeneralSettingsPage({super.key});

  @override
  State<GeneralSettingsPage> createState() => _GeneralSettingsPageState();
}

class _GeneralSettingsPageState extends State<GeneralSettingsPage> {
  final UserPreferencesRepository _repository = UserPreferencesRepository();

  SearchMetroPreference _searchMetro = SearchMetroPreference.auto;
  bool _anonymizePosition = false;
  bool _isLoading = true;
  bool _isSaving = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    final localMetro = await AppSettingsService.getSearchMetro();
    final localAnonymize = await AppSettingsService.getAnonymizePosition();

    if (!mounted) return;
    setState(() {
      _searchMetro = localMetro;
      _anonymizePosition = localAnonymize;
    });

    try {
      final preferences = await _repository.fetchPreferences();
      await AppSettingsService.applyFromUserPreferences(preferences);

      if (!mounted) return;
      setState(() {
        _searchMetro = preferences.searchMetro;
        _anonymizePosition = preferences.anonymizePositionData;
        _isLoading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoading = false);
    }
  }

  Future<void> _updateSearchMetro(SearchMetroPreference value) async {
    if (_isSaving || _searchMetro == value) return;

    setState(() {
      _searchMetro = value;
      _isSaving = true;
      _errorMessage = null;
    });

    await AppSettingsService.setSearchMetro(value);

    try {
      final updated = await _repository.updatePreferences(searchMetro: value);
      await AppSettingsService.applyFromUserPreferences(updated);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  Future<void> _updateAnonymizePosition(bool value) async {
    if (_isSaving) return;

    setState(() {
      _anonymizePosition = value;
      _isSaving = true;
      _errorMessage = null;
    });

    await AppSettingsService.setAnonymizePosition(value);

    try {
      final updated = await _repository.updatePreferences(
        anonymizePositionData: value,
      );
      await AppSettingsService.applyFromUserPreferences(updated);
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _errorMessage = error.toString().replaceFirst('Exception: ', '');
      });
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
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
          'Général',
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
                const _SettingsGroupHeader(title: 'Localisation'),
                Padding(
                  padding: const EdgeInsets.fromLTRB(
                    AppSpacing.xl,
                    AppSpacing.sm,
                    AppSpacing.xl,
                    AppSpacing.lg,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Ville de recherche par défaut',
                        style: AppTypography.body.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.sm),
                      Text(
                        'Utilisée pour la recherche d\'adresses sur la carte '
                        'et lors de l\'enregistrement des trajets.',
                        style: AppTypography.caption.copyWith(
                          color: AppColors.textSecondary,
                        ),
                      ),
                      const SizedBox(height: AppSpacing.md),
                      ...SearchMetroPreference.values.map((metro) {
                        final isSelected = _searchMetro == metro;
                        return ListTile(
                          contentPadding: EdgeInsets.zero,
                          title: Text(metro.label),
                          trailing: isSelected
                              ? const Icon(
                                  Icons.check_circle,
                                  color: AppColors.primary,
                                )
                              : null,
                          onTap: _isSaving
                              ? null
                              : () => _updateSearchMetro(metro),
                        );
                      }),
                    ],
                  ),
                ),
                const Divider(height: 1, color: AppColors.border),
                const _SettingsGroupHeader(title: 'Confidentialité'),
                SwitchListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xl,
                    vertical: AppSpacing.xs,
                  ),
                  title: Text(
                    'Anonymiser les données de position',
                    style: AppTypography.body.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  subtitle: Text(
                    'Vos tracés GPS ne seront pas associés à votre compte.',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                  value: _anonymizePosition,
                  activeThumbColor: AppColors.primary,
                  onChanged: _isSaving ? null : _updateAnonymizePosition,
                ),
                const Divider(height: 1, color: AppColors.border),
                const _SettingsGroupHeader(title: 'Unités'),
                ListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.xl,
                    vertical: AppSpacing.sm,
                  ),
                  title: Text(
                    'Distance',
                    style: AppTypography.body.copyWith(
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  trailing: Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.lg,
                      vertical: AppSpacing.sm,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.background,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(
                      'km',
                      style: AppTypography.bodySmall.copyWith(
                        fontWeight: FontWeight.w700,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ),
                if (_isSaving)
                  const Padding(
                    padding: EdgeInsets.all(AppSpacing.lg),
                    child: Center(
                      child: SizedBox(
                        width: 24,
                        height: 24,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                    ),
                  ),
              ],
            ),
    );
  }
}

class _SettingsGroupHeader extends StatelessWidget {
  final String title;

  const _SettingsGroupHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,
      color: AppColors.background,
      padding: const EdgeInsets.fromLTRB(
        AppSpacing.xl,
        AppSpacing.lg,
        AppSpacing.xl,
        AppSpacing.sm,
      ),
      child: Text(
        title,
        style: AppTypography.caption.copyWith(
          fontWeight: FontWeight.w600,
          color: AppColors.textSecondary,
        ),
      ),
    );
  }
}
