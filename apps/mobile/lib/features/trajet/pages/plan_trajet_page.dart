import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widget/app_button.dart';
import '../../../core/widget/app_gap.dart';
import '../../../core/widget/app_input.dart';
import '../../../data/local/app_settings_service.dart';
import '../../../data/services/geocoding_bounds.dart';
import '../../../data/services/geocoding_service.dart';
import '../../../data/services/location_service.dart';
import '../../maps/cubit/map_cubit.dart';
import '../../maps/cubit/map_state.dart';
import '../../maps/widgets/address_search_suggestions.dart';
import '../models/trajet_model.dart';
import '../repositories/trajet_repository.dart';
import '../../settings/services/trajet_preferences_sync.dart';

enum _LocationSource { search, currentPosition }

/// Enregistrement et gestion des destinations favorites.
class PlanTrajetPage extends StatefulWidget {
  const PlanTrajetPage({super.key});

  static Future<void> open(BuildContext context) {
    MapCubit? mapCubit;
    try {
      mapCubit = context.read<MapCubit>();
    } catch (_) {}

    return Navigator.push(
      context,
      MaterialPageRoute(
        builder: (routeContext) {
          if (mapCubit != null) {
            return BlocProvider.value(
              value: mapCubit,
              child: const PlanTrajetPage(),
            );
          }
          return const PlanTrajetPage();
        },
      ),
    );
  }

  @override
  State<PlanTrajetPage> createState() => _PlanTrajetPageState();
}

class _PlanTrajetPageState extends State<PlanTrajetPage> {
  static const _presetLabels = ['Maison', 'Travail', 'Église', 'Marché'];

  final TrajetRepository _trajetRepository = TrajetRepository();
  final TrajetPreferencesSync _preferencesSync = TrajetPreferencesSync();
  final GeocodingService _geocodingService = GeocodingService();
  final TextEditingController _searchController = TextEditingController();

  List<TrajetModel> _trajets = [];

  bool _isLoadingTrajets = true;
  bool _isSaving = false;
  bool _isResolvingPosition = false;
  String? _loadError;
  String _selectedLabel = _presetLabels.first;
  _LocationSource _locationSource = _LocationSource.search;
  double? _selectedLat;
  double? _selectedLng;
  String? _selectedAddress;
  LatLng _nearPosition = MapState.defaultPosition;

  @override
  void initState() {
    super.initState();
    _loadTrajets();
    _loadNearPosition();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadTrajets() async {
    setState(() {
      _isLoadingTrajets = true;
      _loadError = null;
    });

    try {
      final trajets = await _trajetRepository.fetchTrajets();
      if (!mounted) return;
      setState(() {
        _trajets = trajets;
        _isLoadingTrajets = false;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() {
        _isLoadingTrajets = false;
        _loadError = error.toString().replaceFirst('Exception: ', '');
      });
    }
  }

  void _clearSelection() {
    setState(() {
      _selectedLat = null;
      _selectedLng = null;
      _selectedAddress = null;
      _searchController.clear();
    });
  }

  void _selectSearchResult({
    required String displayName,
    required double lat,
    required double lng,
  }) {
    FocusScope.of(context).unfocus();
    setState(() {
      _selectedLat = lat;
      _selectedLng = lng;
      _selectedAddress = displayName;
      _searchController.text = displayName;
    });
  }

  Future<void> _loadNearPosition() async {
    LatLng near = MapState.defaultPosition;

    try {
      final cubit = context.read<MapCubit>();
      if (cubit.state.isLoadingLocation) {
        await cubit.recupererPositionActuelle();
      }
      if (!mounted) return;
      near = cubit.state.positionActuelle;
    } catch (_) {
      try {
        final gps = await LocationService.getCurrentLocation();
        near = LatLng(gps.latitude, gps.longitude);
      } catch (_) {
        final metro = await AppSettingsService.getGeocodingMetro();
        near = metro != null
            ? GeocodingBounds.metroFor(metro).center
            : GeocodingBounds.kinshasa.center;
      }
    }

    if (!mounted) return;
    setState(() => _nearPosition = near);
  }

  Future<LatLng?> _resolveCurrentPosition() async {
    MapCubit? mapCubit;
    try {
      mapCubit = context.read<MapCubit>();
    } catch (_) {}

    try {
      final gps = await LocationService.getCurrentLocation();
      return LatLng(gps.latitude, gps.longitude);
    } catch (_) {
      if (mapCubit == null) return null;

      if (!mapCubit.state.isLoadingLocation) {
        return mapCubit.state.positionActuelle;
      }
      await mapCubit.recupererPositionActuelle();
      if (!mounted) return null;
      return mapCubit.state.positionActuelle;
    }
  }

  Future<void> _useCurrentPosition() async {
    setState(() {
      _locationSource = _LocationSource.currentPosition;
      _isResolvingPosition = true;
      _selectedLat = null;
      _selectedLng = null;
      _selectedAddress = null;
      _searchController.clear();
    });

    final position = await _resolveCurrentPosition();

    if (!mounted) return;

    if (position == null) {
      setState(() => _isResolvingPosition = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Impossible d\'obtenir votre position. '
            'Vérifiez le GPS ou utilisez la recherche d\'adresse.',
          ),
          backgroundColor: AppColors.danger,
        ),
      );
      return;
    }

    if (!GeocodingBounds.isInSupportedMetro(position)) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Votre position GPS semble hors des zones couvertes. '
            'Sélectionnez une ville ou utilisez la recherche d\'adresse.',
          ),
          backgroundColor: AppColors.warning,
        ),
      );
    }

    setState(() {
      _selectedLat = position.latitude;
      _selectedLng = position.longitude;
      _nearPosition = position;
    });

    final address = await _geocodingService.getAddressFromCoordinates(position);

    if (!mounted) return;
    setState(() {
      _isResolvingPosition = false;
      _selectedAddress =
          address ??
          'Ma position (${position.latitude.toStringAsFixed(5)}, '
              '${position.longitude.toStringAsFixed(5)})';
    });
  }

  Future<void> _enregistrer() async {
    if (_selectedLat == null ||
        _selectedLng == null ||
        _selectedAddress == null ||
        _selectedAddress!.isEmpty) {
      return;
    }

    setState(() => _isSaving = true);

    try {
      final created = await _trajetRepository.createTrajet(
        label: _selectedLabel,
        address: _selectedAddress!,
        latitude: _selectedLat!,
        longitude: _selectedLng!,
        category: TrajetModel.categoryFromLabel(_selectedLabel),
      );

      if (!mounted) return;
      setState(() {
        _trajets = [..._trajets, created];
        _isSaving = false;
      });
      _clearSelection();

      try {
        await _preferencesSync.syncTrajetCoords(created);
      } catch (_) {}

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('« ${created.label} » enregistré.'),
          backgroundColor: AppColors.success,
        ),
      );
    } catch (error) {
      if (!mounted) return;
      setState(() => _isSaving = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  Future<void> _supprimerTrajet(TrajetModel trajet) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Supprimer cette destination ?'),
        content: Text('« ${trajet.label} » ne sera plus disponible.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text(
              'Supprimer',
              style: TextStyle(color: AppColors.danger),
            ),
          ),
        ],
      ),
    );

    if (confirmed != true || !mounted) return;

    try {
      await _trajetRepository.deleteTrajet(trajet.id);
      if (TrajetPreferencesSync.isHomeTrajet(trajet)) {
        try {
          await _preferencesSync.clearHomeSlot();
        } catch (_) {}
      } else if (TrajetPreferencesSync.isWorkTrajet(trajet)) {
        try {
          await _preferencesSync.clearWorkSlot();
        } catch (_) {}
      }
      if (!mounted) return;
      setState(() {
        _trajets = _trajets.where((item) => item.id != trajet.id).toList();
      });
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(error.toString().replaceFirst('Exception: ', '')),
          backgroundColor: AppColors.danger,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final canSave =
        _selectedLat != null &&
        _selectedLng != null &&
        _selectedAddress != null &&
        !_isResolvingPosition;
    final devicePosition = _nearPosition;

    return Scaffold(
      backgroundColor: AppColors.surface,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
        title: Text(
          'Planifier un trajet',
          style: AppTypography.heading3.copyWith(fontWeight: FontWeight.bold),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
          padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Nouvelle destination',
                style: AppTypography.bodySmall.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textSecondary,
                ),
              ),
              const VGap.sm(),
              Text(
                'Étiquette',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const VGap.xs(),
              SizedBox(
                height: 40,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: _presetLabels.length,
                  itemBuilder: (context, index) {
                    final label = _presetLabels[index];
                    final isSelected = _selectedLabel == label;
                    return Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: ChoiceChip(
                        label: Text(label),
                        selected: isSelected,
                        onSelected: (selected) {
                          if (selected) {
                            setState(() => _selectedLabel = label);
                          }
                        },
                      ),
                    );
                  },
                ),
              ),
              const VGap.md(),
              Text(
                'Adresse de la destination',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const VGap.xs(),
              Text(
                'La ville de recherche se configure dans Paramètres → Général.',
                style: AppTypography.caption.copyWith(
                  color: AppColors.textSecondary,
                ),
              ),
              const VGap.sm(),
              _buildLocationSourcePicker(),
              const VGap.md(),
              if (_locationSource == _LocationSource.search)
                AppInput(
                  controller: _searchController,
                  hint: 'Saisissez une adresse…',
                  prefixIcon: const Icon(
                    Icons.search,
                    color: AppColors.textSecondary,
                  ),
                  textInputAction: TextInputAction.search,
                  onChanged: (value) {
                    setState(() {
                      if (_selectedAddress != null &&
                          value != _selectedAddress) {
                        _selectedLat = null;
                        _selectedLng = null;
                        _selectedAddress = null;
                      }
                    });
                  },
                )
              else
                OutlinedButton.icon(
                  onPressed: _isResolvingPosition ? null : _useCurrentPosition,
                  icon: _isResolvingPosition
                      ? const SizedBox(
                          width: 18,
                          height: 18,
                          child: CircularProgressIndicator(strokeWidth: 2),
                        )
                      : const Icon(Icons.my_location),
                  label: Text(
                    _isResolvingPosition
                        ? 'Localisation en cours…'
                        : 'Utiliser ma position actuelle',
                  ),
                ),
              if (_selectedAddress != null) ...[
                const VGap.md(),
                _buildSelectedPreview(),
              ],
              if (_locationSource == _LocationSource.search &&
                  _selectedAddress == null) ...[
                const VGap.sm(),
                AddressSearchSuggestions(
                  controller: _searchController,
                  near: devicePosition,
                  onSelected: (selection) => _selectSearchResult(
                    displayName: selection.displayName,
                    lat: selection.latitude,
                    lng: selection.longitude,
                  ),
                ),
              ],
              const VGap.lg(),
              AppButton(
                text: 'Enregistrer « $_selectedLabel »',
                isLoading: _isSaving,
                onPressed: canSave ? _enregistrer : null,
              ),
              const VGap.xl(),
              Text(
                'Mes destinations enregistrées',
                style: AppTypography.bodySmall.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textSecondary,
                ),
              ),
              const VGap.sm(),
              _buildTrajetsList(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLocationSourcePicker() {
    return Row(
      children: [
        Expanded(
          child: _SourceTile(
            icon: Icons.search,
            label: 'Rechercher',
            selected: _locationSource == _LocationSource.search,
            onTap: () {
              setState(() {
                _locationSource = _LocationSource.search;
                _isResolvingPosition = false;
              });
              _clearSelection();
            },
          ),
        ),
        const HGap.sm(),
        Expanded(
          child: _SourceTile(
            icon: Icons.my_location,
            label: 'Ma position',
            selected: _locationSource == _LocationSource.currentPosition,
            onTap: _useCurrentPosition,
          ),
        ),
      ],
    );
  }

  Widget _buildSelectedPreview() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.primary.withValues(alpha: 0.2)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, color: AppColors.primary, size: 20),
          const HGap.sm(),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _selectedLabel,
                  style: AppTypography.bodySmall.copyWith(
                    fontWeight: FontWeight.w700,
                  ),
                ),
                const VGap.xs(),
                Text(
                  _selectedAddress ?? '',
                  style: AppTypography.caption.copyWith(
                    color: AppColors.textSecondary,
                  ),
                ),
                if (_selectedLat != null && _selectedLng != null) ...[
                  const VGap.xs(),
                  Text(
                    'Coordonnées : '
                    '${_selectedLat!.toStringAsFixed(5)}, '
                    '${_selectedLng!.toStringAsFixed(5)}',
                    style: AppTypography.caption.copyWith(
                      color: AppColors.textSecondary,
                      fontFamily: 'monospace',
                    ),
                  ),
                ],
              ],
            ),
          ),
          IconButton(
            icon: const Icon(Icons.close, size: 18),
            onPressed: _clearSelection,
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(),
          ),
        ],
      ),
    );
  }

  Widget _buildTrajetsList() {
    if (_isLoadingTrajets) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 24),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_loadError != null) {
      return Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _loadError!,
            textAlign: TextAlign.center,
            style: AppTypography.caption.copyWith(color: AppColors.danger),
          ),
          TextButton(onPressed: _loadTrajets, child: const Text('Réessayer')),
        ],
      );
    }

    if (_trajets.isEmpty) {
      return Text(
        'Aucune destination enregistrée pour le moment.',
        style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
      );
    }

    return Column(
      children: [
        for (var i = 0; i < _trajets.length; i++) ...[
          if (i > 0) const SizedBox(height: 8),
          _buildTrajetCard(_trajets[i]),
        ],
      ],
    );
  }

  Widget _buildTrajetCard(TrajetModel trajet) {
    return Card(
      margin: EdgeInsets.zero,
      elevation: 0,
      color: AppColors.background,
      child: ListTile(
        contentPadding: const EdgeInsets.symmetric(horizontal: 12),
        title: Text(
          trajet.label,
          style: const TextStyle(fontWeight: FontWeight.w700),
        ),
        subtitle: Text(
          trajet.address,
          maxLines: 2,
          overflow: TextOverflow.ellipsis,
        ),
        trailing: IconButton(
          icon: const Icon(Icons.delete_outline, color: Colors.grey),
          onPressed: () => _supprimerTrajet(trajet),
        ),
      ),
    );
  }
}

class _SourceTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool selected;
  final VoidCallback onTap;

  const _SourceTile({
    required this.icon,
    required this.label,
    required this.selected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected
          ? AppColors.primary.withValues(alpha: 0.12)
          : AppColors.background,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 8),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: selected ? AppColors.primary : AppColors.border,
            ),
          ),
          child: Column(
            children: [
              Icon(
                icon,
                color: selected ? AppColors.primary : AppColors.textSecondary,
              ),
              const VGap.xs(),
              Text(
                label,
                textAlign: TextAlign.center,
                style: AppTypography.caption.copyWith(
                  fontWeight: selected ? FontWeight.w700 : FontWeight.w500,
                  color: selected ? AppColors.primary : AppColors.textSecondary,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
