import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widget/app_gap.dart';
import '../../../core/widget/app_input.dart';
import '../../trajet/models/trajet_model.dart';
import '../../trajet/repositories/trajet_repository.dart';
import '../cubit/map_cubit.dart';
import 'address_search_suggestions.dart';

/// Résultat retourné par [SearchScreen.show] lors d'une validation.
class SearchResult {
  final LatLng coordinates;
  final String name;
  final String label;

  const SearchResult({
    required this.coordinates,
    required this.name,
    required this.label,
  });
}

/// Recherche de destination pour calculer un itinéraire depuis la position GPS.
class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  static Future<SearchResult?> show(BuildContext context) {
    context.read<MapCubit>().basculerRecherche(true);

    return showGeneralDialog<SearchResult>(
      context: context,
      barrierDismissible: false,
      barrierColor: Colors.black,
      transitionDuration: const Duration(milliseconds: 250),
      pageBuilder: (animationContext, _, __) => BlocProvider.value(
        value: context.read<MapCubit>(),
        child: const SearchScreen(),
      ),
      transitionBuilder: (_, anim1, __, child) => SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 1),
          end: Offset.zero,
        ).animate(anim1),
        child: child,
      ),
    );
  }

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final TrajetRepository _trajetRepository = TrajetRepository();

  List<TrajetModel> _trajets = [];
  bool _isLoadingTrajets = true;

  @override
  void initState() {
    super.initState();
    _loadTrajets();
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadTrajets() async {
    try {
      final trajets = await _trajetRepository.fetchTrajets();
      if (!mounted) return;
      setState(() {
        _trajets = trajets;
        _isLoadingTrajets = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() => _isLoadingTrajets = false);
    }
  }

  void _annuler(BuildContext context) {
    context.read<MapCubit>().effacerRecherche();
    Navigator.pop(context, null);
  }

  void _choisirDestination({
    required double lat,
    required double lng,
    required String name,
    required String label,
  }) {
    Navigator.pop(
      context,
      SearchResult(coordinates: LatLng(lat, lng), name: name, label: label),
    );
  }

  @override
  Widget build(BuildContext context) {
    final near = context.read<MapCubit>().state.positionActuelle;

    return Scaffold(
      backgroundColor: AppColors.surface,
      resizeToAvoidBottomInset: true,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black),
          onPressed: () => _annuler(context),
        ),
        title: Text(
          'Où allez-vous ?',
          style: AppTypography.heading3.copyWith(fontWeight: FontWeight.bold),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              if (_trajets.isNotEmpty) ...[
                Text(
                  'Mes destinations',
                  style: AppTypography.bodySmall.copyWith(
                    fontWeight: FontWeight.bold,
                    color: AppColors.textSecondary,
                  ),
                ),
                const VGap.sm(),
                SizedBox(
                  height: 120,
                  child: _isLoadingTrajets
                      ? const Center(child: CircularProgressIndicator())
                      : ListView.separated(
                          itemCount: _trajets.length,
                          separatorBuilder: (_, __) => const Divider(height: 1),
                          itemBuilder: (context, index) {
                            final trajet = _trajets[index];
                            return ListTile(
                              contentPadding: EdgeInsets.zero,
                              title: Text(
                                trajet.label,
                                style: const TextStyle(
                                  fontWeight: FontWeight.w700,
                                ),
                              ),
                              subtitle: Text(
                                trajet.address,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              onTap: () => _choisirDestination(
                                lat: trajet.latitude,
                                lng: trajet.longitude,
                                name: trajet.address,
                                label: trajet.label,
                              ),
                            );
                          },
                        ),
                ),
                const VGap.md(),
              ],
              Text(
                'Rechercher une adresse',
                style: AppTypography.bodySmall.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textSecondary,
                ),
              ),
              const VGap.sm(),
              AppInput(
                controller: _searchController,
                hint: "Saisissez l'adresse de destination…",
                prefixIcon: const Icon(
                  Icons.search,
                  color: AppColors.textSecondary,
                ),
                textInputAction: TextInputAction.search,
                onChanged: (_) => setState(() {}),
              ),
              const VGap.sm(),
              Expanded(
                child: SingleChildScrollView(
                  keyboardDismissBehavior:
                      ScrollViewKeyboardDismissBehavior.onDrag,
                  child: AddressSearchSuggestions(
                    controller: _searchController,
                    near: near,
                    onSelected: (selection) => _choisirDestination(
                      lat: selection.latitude,
                      lng: selection.longitude,
                      name: selection.displayName,
                      label: selection.displayName,
                    ),
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
