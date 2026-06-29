import 'package:latlong2/latlong.dart';

import '../../incident/models/incident_response.dart';

class MapState {
  static const LatLng defaultPosition = LatLng(-4.3224, 15.3112);

  final LatLng positionActuelle;
  final LatLng? pointArriveeDynamique;
  final String? adresseSelectionnee;
  final List<LatLng> routePoints;
  final List<LatLng> routeTraveledPoints;
  final List<LatLng> routeRemainingPoints;
  final List<dynamic> suggestions;
  final bool isLoadingRoute;
  final bool isSearching;
  final bool isNavigating;
  final bool isLoadingLocation;
  final int routeProgressIndex;
  final String? errorMessage;
  final double? distanceMetres;
  final double? distanceRemainingMetres;
  final double? tempsSecondes;
  final double? tempsRemainingSecondes;
  final List<String> instructions;
  final bool alerteIncidentInevitable;
  final bool penalitesIncidentsAppliquees;
  final String? routeWarningMessage;
  final String? routeSuccessMessage;
  final IncidentResponse? incidentToConfirm;

  const MapState({
    required this.positionActuelle,
    this.pointArriveeDynamique,
    this.adresseSelectionnee,
    this.routePoints = const [],
    this.routeTraveledPoints = const [],
    this.routeRemainingPoints = const [],
    this.suggestions = const [],
    this.isLoadingRoute = false,
    this.isSearching = false,
    this.isNavigating = false,
    this.isLoadingLocation = true,
    this.routeProgressIndex = 0,
    this.errorMessage,
    this.distanceMetres,
    this.distanceRemainingMetres,
    this.tempsSecondes,
    this.tempsRemainingSecondes,
    this.instructions = const [],
    this.alerteIncidentInevitable = false,
    this.penalitesIncidentsAppliquees = false,
    this.routeWarningMessage,
    this.routeSuccessMessage,
    this.incidentToConfirm,
  });

  factory MapState.initial() {
    return const MapState(
      positionActuelle: defaultPosition,
      isLoadingLocation: true,
    );
  }

  MapState copyWith({
    LatLng? positionActuelle,
    LatLng? pointArriveeDynamique,
    String? adresseSelectionnee,
    List<LatLng>? routePoints,
    List<LatLng>? routeTraveledPoints,
    List<LatLng>? routeRemainingPoints,
    List<dynamic>? suggestions,
    bool? isLoadingRoute,
    bool? isSearching,
    bool? isNavigating,
    bool? isLoadingLocation,
    int? routeProgressIndex,
    String? errorMessage,
    double? distanceMetres,
    double? distanceRemainingMetres,
    double? tempsSecondes,
    double? tempsRemainingSecondes,
    List<String>? instructions,
    bool? alerteIncidentInevitable,
    bool? penalitesIncidentsAppliquees,
    String? routeWarningMessage,
    String? routeSuccessMessage,
    IncidentResponse? incidentToConfirm,
    bool clearArrivee = false,
    bool clearRouteMetadata = false,
    bool clearIncidentToConfirm = false,
    bool clearRouteWarning = false,
  }) {
    return MapState(
      positionActuelle: positionActuelle ?? this.positionActuelle,
      pointArriveeDynamique: clearArrivee
          ? null
          : (pointArriveeDynamique ?? this.pointArriveeDynamique),
      adresseSelectionnee: clearArrivee
          ? null
          : (adresseSelectionnee ?? this.adresseSelectionnee),
      routePoints: routePoints ?? this.routePoints,
      routeTraveledPoints: clearRouteMetadata
          ? const []
          : (routeTraveledPoints ?? this.routeTraveledPoints),
      routeRemainingPoints: clearRouteMetadata
          ? const []
          : (routeRemainingPoints ?? this.routeRemainingPoints),
      suggestions: suggestions ?? this.suggestions,
      isLoadingRoute: isLoadingRoute ?? this.isLoadingRoute,
      isSearching: isSearching ?? this.isSearching,
      isNavigating: clearRouteMetadata
          ? false
          : (isNavigating ?? this.isNavigating),
      isLoadingLocation: isLoadingLocation ?? this.isLoadingLocation,
      routeProgressIndex: clearRouteMetadata
          ? 0
          : (routeProgressIndex ?? this.routeProgressIndex),
      errorMessage: errorMessage,
      distanceMetres: clearRouteMetadata
          ? null
          : (distanceMetres ?? this.distanceMetres),
      distanceRemainingMetres: clearRouteMetadata
          ? null
          : (distanceRemainingMetres ?? this.distanceRemainingMetres),
      tempsSecondes: clearRouteMetadata
          ? null
          : (tempsSecondes ?? this.tempsSecondes),
      tempsRemainingSecondes: clearRouteMetadata
          ? null
          : (tempsRemainingSecondes ?? this.tempsRemainingSecondes),
      instructions: clearRouteMetadata
          ? const []
          : (instructions ?? this.instructions),
      alerteIncidentInevitable: clearRouteMetadata
          ? false
          : (alerteIncidentInevitable ?? this.alerteIncidentInevitable),
      penalitesIncidentsAppliquees: clearRouteMetadata
          ? false
          : (penalitesIncidentsAppliquees ?? this.penalitesIncidentsAppliquees),
      routeWarningMessage: clearRouteMetadata || clearRouteWarning
          ? null
          : (routeWarningMessage ?? this.routeWarningMessage),
      routeSuccessMessage: routeSuccessMessage,
      incidentToConfirm: clearRouteMetadata || clearIncidentToConfirm
          ? null
          : (incidentToConfirm ?? this.incidentToConfirm),
    );
  }
}
