import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widget/app_gap.dart';
import '../../../data/local/shared_preferences_service.dart';
import '/features/incident/cubit/incident_cubit.dart';
import '/features/incident/cubit/incident_state.dart';
import '../cubit/map_cubit.dart';
import '../cubit/map_state.dart';
import '../widgets/map_drawer.dart';
import '../widgets/route_alert_dialog.dart';
import '../widgets/search_screen.dart';
import '../../trajet/pages/plan_trajet_page.dart';
import '../../incident/widgets/report_incident_bottom_sheet.dart';
import '../../incident/widgets/confirm_incident_bottom_sheet.dart'
    show ConfirmIncidentDialog;

class MapPage extends StatefulWidget {
  const MapPage({super.key});

  @override
  State<MapPage> createState() => _MapPageState();
}

class _MapPageState extends State<MapPage> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final MapController _mapController = MapController();

  LatLng? _lastPosition;
  LatLng? _lastDestination;
  LatLng? _lastIncidentFetchCenter;
  bool _isMapReady = false;
  bool _isIncidentDialogOpen = false;

  @override
  void initState() {
    super.initState();
    context.read<MapCubit>().recupererPositionActuelle();
    _loadCurrentUserId();
  }

  void _refreshIncidentsNearUser(LatLng position) {
    if (!_isValidLatLng(position)) return;

    const distance = Distance();
    if (_lastIncidentFetchCenter != null &&
        distance(_lastIncidentFetchCenter!, position) < 500) {
      return;
    }

    final isFirstFetch = _lastIncidentFetchCenter == null;
    _lastIncidentFetchCenter = position;

    context.read<IncidentCubit>().getIncidents(
      showLoading: isFirstFetch,
      latitude: position.latitude,
      longitude: position.longitude,
    );
  }

  Future<void> _loadCurrentUserId() async {
    final user = await SharedPreferencesService.getUser();
    if (!mounted || user == null) return;
    context.read<MapCubit>().setCurrentUserId(user['id']?.toString());
  }

  void _syncIncidentsToMapCubit(IncidentState incidentState) {
    if (incidentState is IncidentListed) {
      context.read<MapCubit>().syncIncidents(incidentState.incidents);
    }
  }

  @override
  void dispose() {
    _mapController.dispose();
    super.dispose();
  }

  // ── Style des incidents ───────────────────────────────────────────────────

  Map<String, dynamic> _getIncidentStyle(String type) {
    switch (type.toLowerCase()) {
      case 'accident':
        return {
          'icon': Icons.warning_amber_rounded,
          'color': AppColors.accident,
        };
      case 'roadwork':
      case 'travaux':
        return {'icon': Icons.engineering, 'color': AppColors.roadWork};
      case 'checkpoint':
      case 'police':
        return {'icon': Icons.local_police, 'color': AppColors.policeControl};
      case 'congestion':
      case 'clear':
      case 'bouchon':
      default:
        return {'icon': Icons.traffic, 'color': AppColors.trafficBlocked};
    }
  }

  // ── Ouverture des widgets externes ────────────────────────────────────────

  Future<void> _ouvrirRecherche() async {
    final result = await SearchScreen.show(context);
    if (result != null && mounted) {
      context.read<MapCubit>().selectionnerDestination(
        result.coordinates,
        result.name,
      );
      await context.read<MapCubit>().validerEtTracerItineraire();
    }
  }

  void _ouvrirPlanifierTrajet() {
    PlanTrajetPage.open(context);
  }

  void _signalerIncident() {
    final position = context.read<MapCubit>().state.positionActuelle;
    ReportIncidentBottomSheet.show(
      context,
      position.latitude,
      position.longitude,
    );
  }

  void _safeMoveMap(LatLng target, double zoom) {
    if (!_isMapReady || !mounted) return;
    if (!_isValidLatLng(target)) return;

    try {
      _mapController.move(target, zoom);
    } catch (e) {
      debugPrint('MapController.move ignoré : $e');
    }
  }

  bool _isValidLatLng(LatLng point) {
    return point.latitude.isFinite &&
        point.longitude.isFinite &&
        point.latitude >= -90 &&
        point.latitude <= 90 &&
        point.longitude >= -180 &&
        point.longitude <= 180;
  }

  void _showConfirmIncidentDialog(dynamic incident) {
    if (_isIncidentDialogOpen || !mounted) return;

    _isIncidentDialogOpen = true;
    ConfirmIncidentDialog.show(
      context,
      incident,
      _getIncidentStyle(incident.type.toString()),
    ).whenComplete(() {
      if (mounted) _isIncidentDialogOpen = false;
    });
  }

  // ── Build ─────────────────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return MultiBlocListener(
      listeners: [
        BlocListener<IncidentCubit, IncidentState>(
          listener: (context, state) => _syncIncidentsToMapCubit(state),
        ),
        BlocListener<MapCubit, MapState>(
          listenWhen: (previous, current) =>
              previous.errorMessage != current.errorMessage ||
              previous.routeWarningMessage != current.routeWarningMessage ||
              previous.routeSuccessMessage != current.routeSuccessMessage ||
              previous.pointArriveeDynamique != current.pointArriveeDynamique ||
              previous.incidentToConfirm != current.incidentToConfirm ||
              previous.isLoadingLocation != current.isLoadingLocation ||
              previous.positionActuelle != current.positionActuelle,
          listener: (context, state) {
            if (state.errorMessage != null) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.errorMessage!),
                  backgroundColor: AppColors.danger,
                ),
              );
              context.read<MapCubit>().clearError();
            }

            if (state.incidentToConfirm != null) {
              final incident = state.incidentToConfirm!;
              context.read<MapCubit>().clearIncidentToConfirm();
              _showConfirmIncidentDialog(incident);
            }

            if (!state.isNavigating && state.routeWarningMessage != null) {
              final message = state.routeWarningMessage!;
              context.read<MapCubit>().clearRouteWarning();
              RouteAlertDialog.show(context, message: message);
            }

            if (state.routeSuccessMessage != null) {
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(state.routeSuccessMessage!),
                  backgroundColor: AppColors.success,
                ),
              );
              context.read<MapCubit>().clearRouteSuccess();
            }

            if (_lastPosition == null && !state.isLoadingLocation) {
              _lastPosition = state.positionActuelle;
              _safeMoveMap(state.positionActuelle, 15.0);
            }

            if (!state.isLoadingLocation) {
              _refreshIncidentsNearUser(state.positionActuelle);
            }

            if (state.pointArriveeDynamique != null &&
                state.pointArriveeDynamique != _lastDestination) {
              _lastDestination = state.pointArriveeDynamique;
              _safeMoveMap(state.pointArriveeDynamique!, 15.0);
            }

            if (state.pointArriveeDynamique == null) {
              _lastDestination = null;
            }
          },
        ),
      ],
      child: BlocBuilder<MapCubit, MapState>(
        buildWhen: (previous, current) =>
            previous.isLoadingLocation != current.isLoadingLocation ||
            previous.isLoadingRoute != current.isLoadingRoute ||
            previous.routePoints != current.routePoints ||
            previous.pointArriveeDynamique != current.pointArriveeDynamique ||
            previous.adresseSelectionnee != current.adresseSelectionnee ||
            previous.isNavigating != current.isNavigating ||
            previous.distanceMetres != current.distanceMetres ||
            previous.distanceRemainingMetres !=
                current.distanceRemainingMetres ||
            previous.tempsSecondes != current.tempsSecondes ||
            previous.tempsRemainingSecondes != current.tempsRemainingSecondes,
        builder: (context, mapState) {
          if (mapState.isLoadingLocation) {
            return Scaffold(
              key: _scaffoldKey,
              backgroundColor: AppColors.background,
              body: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const CircularProgressIndicator(color: AppColors.primary),
                    const SizedBox(height: 16),
                    Text(
                      'Localisation en cours…',
                      style: AppTypography.bodySmall.copyWith(
                        color: AppColors.textSecondary,
                      ),
                    ),
                  ],
                ),
              ),
            );
          }

          return Scaffold(
            key: _scaffoldKey,
            drawer: MapDrawer(
              onReportIncident: _signalerIncident,
              onPlanTrip: _ouvrirPlanifierTrajet,
            ),
            body: Stack(
              children: [
                // ── Carte ─────────────────────────────────────────────────
                FlutterMap(
                  key: const ValueKey('fikiri_map'),
                  mapController: _mapController,
                  options: MapOptions(
                    initialCenter: mapState.positionActuelle,
                    initialZoom: 15.0,
                    onMapReady: () {
                      if (mounted) {
                        setState(() => _isMapReady = true);
                      }
                    },
                  ),
                  children: [
                    TileLayer(
                      urlTemplate:
                          'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
                      userAgentPackageName: 'cd.fikiri.traffic',
                    ),
                    const _TraveledPolylineLayer(),
                    const _RemainingPolylineLayer(),
                    _MapMarkersLayer(
                      getIncidentStyle: _getIncidentStyle,
                      isValidLatLng: _isValidLatLng,
                    ),
                  ],
                ),

                // ── Bouton Drawer (menu) ───────────────────────────────────
                Positioned(
                  top: 30,
                  left: 15,
                  child: SafeArea(
                    child: FloatingActionButton(
                      heroTag: 'drawer_btn',
                      backgroundColor: Colors.white,
                      mini: true,
                      onPressed: () => _scaffoldKey.currentState?.openDrawer(),
                      child: const Icon(Icons.menu, color: Colors.black87),
                    ),
                  ),
                ),

                // ── Barre de recherche ─────────────────────────────────────
                Positioned(
                  top: 30,
                  left: 75,
                  right: 15,
                  child: SafeArea(
                    child: GestureDetector(
                      onTap: _ouvrirRecherche,
                      child: Container(
                        height: 48,
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(30),
                          boxShadow: const [
                            BoxShadow(
                              color: Colors.black12,
                              blurRadius: 8,
                              offset: Offset(0, 3),
                            ),
                          ],
                        ),
                        child: Row(
                          children: [
                            const Icon(Icons.search, color: Colors.blueAccent),
                            const HGap.sm(),
                            Expanded(
                              child: Text(
                                mapState.adresseSelectionnee ??
                                    "Où voulez-vous aller ?",
                                style: AppTypography.bodySmall.copyWith(
                                  color: mapState.adresseSelectionnee != null
                                      ? AppColors.textPrimary
                                      : AppColors.textSecondary,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                            if (mapState.pointArriveeDynamique != null)
                              IconButton(
                                icon: const Icon(
                                  Icons.cancel,
                                  color: Colors.grey,
                                  size: 20,
                                ),
                                padding: EdgeInsets.zero,
                                constraints: const BoxConstraints(),
                                onPressed: () =>
                                    context.read<MapCubit>().effacerRecherche(),
                              ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),

                // ── Barre bas : signalement + résumé itinéraire ───────────
                Positioned(
                  bottom: 20,
                  left: 20,
                  right: 20,
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      FloatingActionButton(
                        heroTag: 'report_incident_btn',
                        backgroundColor: AppColors.danger,
                        tooltip: "Signaler un incident",
                        onPressed: _signalerIncident,
                        child: const Icon(
                          Icons.report_problem,
                          color: Colors.white,
                        ),
                      ),
                      if (mapState.routePoints.isNotEmpty &&
                          mapState.distanceMetres != null &&
                          mapState.tempsSecondes != null) ...[
                        const SizedBox(width: 16),
                        Expanded(
                          child: Card(
                            elevation: 4,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(24),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 20,
                                vertical: 12,
                              ),
                              child: Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  const Icon(
                                    Icons.route,
                                    color: Colors.blueAccent,
                                    size: 20,
                                  ),
                                  const HGap.sm(),
                                  Flexible(
                                    child: Text(
                                      '${_formatDistance(_displayDistance(mapState))} · ${_formatDuration(_displayDuration(mapState))}',
                                      style: AppTypography.bodySmall.copyWith(
                                        fontWeight: FontWeight.w600,
                                        color: AppColors.textPrimary,
                                      ),
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (mapState.isNavigating) ...[
                                    const HGap.sm(),
                                    Container(
                                      width: 4,
                                      height: 4,
                                      decoration: const BoxDecoration(
                                        color: AppColors.success,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                    const HGap.sm(),
                                    Text(
                                      'En route',
                                      style: AppTypography.caption.copyWith(
                                        color: AppColors.success,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ] else if (mapState
                                      .routePoints
                                      .isNotEmpty) ...[
                                    const HGap.sm(),
                                    InkWell(
                                      onTap: () => context
                                          .read<MapCubit>()
                                          .demarrerSuiviItineraire(),
                                      borderRadius: BorderRadius.circular(8),
                                      child: Padding(
                                        padding: const EdgeInsets.symmetric(
                                          horizontal: 8,
                                          vertical: 4,
                                        ),
                                        child: Text(
                                          'Suivre',
                                          style: AppTypography.caption.copyWith(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.w700,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),

                // ── Indicateur de chargement de route ─────────────────────
                if (mapState.isLoadingRoute)
                  const Positioned(
                    bottom: 30,
                    right: 30,
                    child: Card(
                      elevation: 4,
                      shape: CircleBorder(),
                      child: Padding(
                        padding: EdgeInsets.all(12.0),
                        child: CircularProgressIndicator(
                          strokeWidth: 3,
                          valueColor: AlwaysStoppedAnimation<Color>(
                            Colors.blueAccent,
                          ),
                        ),
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  // ── Formatage itinéraire ──────────────────────────────────────────────────

  double _displayDistance(MapState mapState) {
    if (mapState.isNavigating && mapState.distanceRemainingMetres != null) {
      return mapState.distanceRemainingMetres!;
    }
    return mapState.distanceMetres ?? 0;
  }

  double _displayDuration(MapState mapState) {
    if (mapState.isNavigating && mapState.tempsRemainingSecondes != null) {
      return mapState.tempsRemainingSecondes!;
    }
    return mapState.tempsSecondes ?? 0;
  }

  String _formatDistance(double metres) {
    if (metres >= 1000) {
      return '${(metres / 1000).toStringAsFixed(1)} km';
    }
    return '${metres.round()} m';
  }

  String _formatDuration(double seconds) {
    final totalMinutes = (seconds / 60).round();
    if (totalMinutes < 60) {
      return '$totalMinutes min';
    }

    final hours = totalMinutes ~/ 60;
    final minutes = totalMinutes % 60;
    return minutes > 0 ? '$hours h $minutes min' : '$hours h';
  }

  // ── Couche de marqueurs ───────────────────────────────────────────────────
}

class _TraveledPolylineLayer extends StatelessWidget {
  const _TraveledPolylineLayer();

  @override
  Widget build(BuildContext context) {
    return BlocSelector<MapCubit, MapState, List<LatLng>>(
      selector: (state) =>
          state.isNavigating ? state.routeTraveledPoints : const [],
      builder: (context, traveled) {
        return PolylineLayer(
          polylines: traveled.length >= 2
              ? [
                  Polyline(
                    points: traveled,
                    color: AppColors.success,
                    strokeWidth: 6.0,
                  ),
                ]
              : <Polyline>[],
        );
      },
    );
  }
}

class _RemainingPolylineLayer extends StatelessWidget {
  const _RemainingPolylineLayer();

  @override
  Widget build(BuildContext context) {
    return BlocSelector<MapCubit, MapState, _RemainingRouteView>(
      selector: (state) => _RemainingRouteView(
        remaining: state.routeRemainingPoints,
        fullRoute: state.routePoints,
      ),
      builder: (context, view) {
        final points = view.remaining.length >= 2
            ? view.remaining
            : view.fullRoute;

        return PolylineLayer(
          polylines: points.length >= 2
              ? [
                  Polyline(
                    points: points,
                    color: Colors.blueAccent,
                    strokeWidth: 5.0,
                  ),
                ]
              : <Polyline>[],
        );
      },
    );
  }
}

class _RemainingRouteView {
  final List<LatLng> remaining;
  final List<LatLng> fullRoute;

  const _RemainingRouteView({required this.remaining, required this.fullRoute});

  @override
  bool operator ==(Object other) {
    return other is _RemainingRouteView &&
        identical(other.remaining, remaining) &&
        identical(other.fullRoute, fullRoute);
  }

  @override
  int get hashCode => Object.hash(remaining, fullRoute);
}

class _MapMarkersLayer extends StatelessWidget {
  final Map<String, dynamic> Function(String type) getIncidentStyle;
  final bool Function(LatLng point) isValidLatLng;

  const _MapMarkersLayer({
    required this.getIncidentStyle,
    required this.isValidLatLng,
  });

  @override
  Widget build(BuildContext context) {
    return BlocSelector<MapCubit, MapState, _UserMarkerView>(
      selector: (state) => _UserMarkerView(
        position: state.positionActuelle,
        isNavigating: state.isNavigating,
        destination: state.pointArriveeDynamique,
      ),
      builder: (context, userView) {
        return BlocBuilder<IncidentCubit, IncidentState>(
          builder: (context, incidentState) {
            final cubit = context.read<IncidentCubit>();
            final visibleIncidents = incidentState is IncidentListed
                ? incidentState.incidents
                : cubit.cachedIncidents;

            final markers = <Marker>[
              Marker(
                point: userView.position,
                width: userView.isNavigating ? 48 : 35,
                height: userView.isNavigating ? 48 : 35,
                child: userView.isNavigating
                    ? Container(
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: AppColors.primary,
                            width: 2,
                          ),
                        ),
                        child: const Icon(
                          Icons.navigation_rounded,
                          color: AppColors.primary,
                          size: 26,
                        ),
                      )
                    : const Icon(
                        Icons.my_location,
                        color: Colors.blue,
                        size: 35,
                      ),
              ),
              if (userView.destination != null)
                Marker(
                  point: userView.destination!,
                  child: const Icon(
                    Icons.location_on,
                    color: Colors.red,
                    size: 40,
                  ),
                ),
            ];

            if (visibleIncidents.isNotEmpty) {
              for (final incident in visibleIncidents) {
                if (!isValidLatLng(incident.toLatLng)) continue;

                final style = getIncidentStyle(incident.type.toString());
                final typeColor = style['color'] as Color;

                markers.add(
                  Marker(
                    point: incident.toLatLng,
                    width: 45,
                    height: 45,
                    child: Container(
                      decoration: BoxDecoration(
                        color: typeColor.withValues(alpha: 0.15),
                        shape: BoxShape.circle,
                        border: Border.all(color: typeColor, width: 1.5),
                      ),
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        style['icon'] as IconData,
                        color: typeColor,
                        size: 24,
                      ),
                    ),
                  ),
                );
              }
            }

            return MarkerLayer(markers: markers);
          },
        );
      },
    );
  }
}

class _UserMarkerView {
  final LatLng position;
  final bool isNavigating;
  final LatLng? destination;

  const _UserMarkerView({
    required this.position,
    required this.isNavigating,
    required this.destination,
  });

  @override
  bool operator ==(Object other) {
    return other is _UserMarkerView &&
        other.position == position &&
        other.isNavigating == isNavigating &&
        other.destination == destination;
  }

  @override
  int get hashCode => Object.hash(position, isNavigating, destination);
}
