import 'dart:async';

import 'package:flutter/material.dart';
import 'package:latlong2/latlong.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../data/local/app_settings_service.dart';
import '../../../data/services/geocoding_bounds.dart';
import '../../../data/services/geocoding_service.dart';

/// Liste de suggestions d'adresses avec recherche debouncée.
class AddressSearchSuggestions extends StatefulWidget {
  final TextEditingController controller;
  final LatLng near;
  final String? city;
  final GeocodingMetro? searchMetro;
  final ValueChanged<AddressSelection> onSelected;

  const AddressSearchSuggestions({
    super.key,
    required this.controller,
    required this.near,
    required this.onSelected,
    this.city,
    this.searchMetro,
  });

  @override
  State<AddressSearchSuggestions> createState() =>
      _AddressSearchSuggestionsState();
}

class AddressSelection {
  final String displayName;
  final double latitude;
  final double longitude;

  const AddressSelection({
    required this.displayName,
    required this.latitude,
    required this.longitude,
  });
}

class _AddressSearchSuggestionsState extends State<AddressSearchSuggestions> {
  final GeocodingService _geocodingService = GeocodingService();
  Timer? _debounce;
  List<AddressSuggestion> _suggestions = [];
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    widget.controller.addListener(_onTextChanged);
    if (widget.controller.text.trim().length >= 2) {
      _fetchSuggestions(widget.controller.text);
    }
  }

  @override
  void didUpdateWidget(AddressSearchSuggestions oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.near != widget.near ||
        oldWidget.searchMetro != widget.searchMetro) {
      if (widget.controller.text.trim().length >= 2) {
        _fetchSuggestions(widget.controller.text);
      }
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    widget.controller.removeListener(_onTextChanged);
    super.dispose();
  }

  void _onTextChanged() {
    _fetchSuggestions(widget.controller.text);
  }

  void _fetchSuggestions(String value) {
    _debounce?.cancel();

    final query = value.trim();
    if (query.length < 2) {
      setState(() {
        _suggestions = [];
        _isLoading = false;
        _errorMessage = null;
      });
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    _debounce = Timer(const Duration(milliseconds: 250), () async {
      try {
        final preferredMetro =
            widget.searchMetro ?? await AppSettingsService.getGeocodingMetro();
        final hits = await _geocodingService.searchSuggestions(
          query,
          widget.near,
          city: widget.city,
          preferredMetro: preferredMetro,
        );

        if (!mounted || widget.controller.text.trim() != query) return;

        setState(() {
          _suggestions = hits;
          _isLoading = false;
          _errorMessage = null;
        });
      } catch (_) {
        if (!mounted || widget.controller.text.trim() != query) return;

        setState(() {
          _suggestions = [];
          _isLoading = false;
          _errorMessage = 'Connexion impossible. Vérifiez votre réseau.';
        });
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final query = widget.controller.text.trim();
    final searchArea = GeocodingBounds.resolveSearchArea(
      widget.near,
      preferred: widget.searchMetro,
      query: query,
    );
    final anchor = GeocodingBounds.geocodingAnchor(
      widget.near,
      preferred: widget.searchMetro,
      query: query,
    );
    final usingFallback = !searchArea.contains(widget.near);

    if (query.isEmpty) {
      return Text(
        'Commencez à saisir une adresse pour voir les propositions.',
        style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
      );
    }

    if (query.length < 2) {
      return Text(
        'Saisissez au moins 2 caractères…',
        style: AppTypography.caption.copyWith(color: AppColors.textSecondary),
      );
    }

    if (_isLoading) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 12),
        child: Center(child: CircularProgressIndicator()),
      );
    }

    if (_errorMessage != null) {
      return Text(
        _errorMessage!,
        style: AppTypography.caption.copyWith(color: AppColors.danger),
      );
    }

    if (_suggestions.isEmpty) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Aucune adresse trouvée pour « $query » à ${searchArea.label}.',
            style: AppTypography.caption.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          if (usingFallback) ...[
            const SizedBox(height: 4),
            Text(
              'Recherche centrée sur ${searchArea.label} '
              '(${anchor.latitude.toStringAsFixed(4)}, '
              '${anchor.longitude.toStringAsFixed(4)}).',
              style: AppTypography.caption.copyWith(
                color: AppColors.textSecondary,
              ),
            ),
          ],
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Sélectionnez une adresse',
          style: AppTypography.bodySmall.copyWith(
            fontWeight: FontWeight.bold,
            color: AppColors.textSecondary,
          ),
        ),
        const SizedBox(height: 8),
        ListView.separated(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.zero,
          itemCount: _suggestions.length,
          separatorBuilder: (_, __) => const Divider(height: 1),
          itemBuilder: (context, index) {
            final hit = _suggestions[index];
            final displayName = GeocodingService.formatDisplayName(hit);
            final city = hit['city']?.toString() ?? '';
            final country = hit['country']?.toString() ?? '';
            final point = hit['point'];
            if (point is! Map) return const SizedBox.shrink();

            final lat = point['lat'];
            final lng = point['lng'];
            if (lat is! num || lng is! num) return const SizedBox.shrink();

            return ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(
                Icons.location_on_outlined,
                color: AppColors.primary,
              ),
              title: Text(
                displayName,
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              subtitle: Text(
                city.isNotEmpty && !displayName.contains(city)
                    ? '$city${country.isNotEmpty ? ', $country' : ''}'
                    : country,
              ),
              trailing: const Icon(Icons.chevron_right, color: Colors.grey),
              onTap: () {
                FocusScope.of(context).unfocus();
                widget.onSelected(
                  AddressSelection(
                    displayName: displayName,
                    latitude: lat.toDouble(),
                    longitude: lng.toDouble(),
                  ),
                );
              },
            );
          },
        ),
      ],
    );
  }
}
