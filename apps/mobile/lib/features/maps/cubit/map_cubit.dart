import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:geolocator/geolocator.dart';
import 'package:latlong2/latlong.dart';
import '../../../data/services/location_service.dart';
import '../../../data/services/routing_exception.dart';
import '../../incident/models/incident_response.dart';
import '../../traffic/models/traffic_track_point.dart';
import '../repositories/map_repository.dart';
import '../utils/polyline_simplifier.dart';
import '../utils/route_progress_helper.dart';
import 'map_state.dart';

class MapCubit extends Cubit<MapState> {
  static const Distance _distance = Distance();
  static const double _arrivalThresholdMetres = 30;
  static const double _incidentProximityMetres = 50;
  static const double _offRouteThresholdMetres = 45;
  static const Duration _offRouteGraceDuration = Duration(seconds: 8);
  static const Duration _rerouteCooldown = Duration(seconds: 45);

  final MapRepository repository;
  StreamSubscription<Position>? _positionSubscription;
  DateTime? _lastNavigationEmitAt;
  LatLng? _lastNavigationEmitPos;
  DateTime? _offRouteStartedAt;
  DateTime? _lastRerouteAt;
  bool _isRerouting = false;
  List<IncidentResponse> _activeIncidents = const [];
  final Set<String> _promptedIncidentIds = {};
  String? _currentUserId;
  String? _userCity;
  final List<TrafficTrackPoint> _trackBuffer = [];
  DateTime? _trackStartedAt;
  DateTime? _lastTrackFlushAt;
  static const Duration _trackFlushInterval = Duration(minutes: 2);
  static const int _trackFlushMinPoints = 5;

  MapCubit(this.repository) : super(MapState.initial());

  void syncIncidents(List<IncidentResponse> incidents) {
    _activeIncidents = incidents;
  }

  void setCurrentUserId(String? userId) {
    _currentUserId = userId;
  }

  void clearIncidentToConfirm() {
    if (state.incidentToConfirm != null) {
      emit(state.copyWith(clearIncidentToConfirm: true));
    }
  }

  void _resetPromptedIncidents() {
    _promptedIncidentIds.clear();
  }

  @override
  Future<void> close() {
    unawaited(_flushTrackBuffer(endNavigation: true));
    _stopPositionWatch();
    return super.close();
  }

  /// 1. Récupère la position GPS actuelle de l'utilisateur au démarrage
  Future<void> recupererPositionActuelle() async {
    if (!await _ensureLocationPermission()) {
      emit(state.copyWith(isLoadingLocation: false));
      return;
    }

    try {
      final lastKnown = await Geolocator.getLastKnownPosition();
      if (lastKnown != null &&
          lastKnown.latitude.isFinite &&
          lastKnown.longitude.isFinite) {
        emit(
          state.copyWith(
            positionActuelle: LatLng(lastKnown.latitude, lastKnown.longitude),
            isLoadingLocation: false,
          ),
        );
        await _refreshUserCity(LatLng(lastKnown.latitude, lastKnown.longitude));
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      emit(
        state.copyWith(
          positionActuelle: LatLng(position.latitude, position.longitude),
          isLoadingLocation: false,
        ),
      );

      await _refreshUserCity(LatLng(position.latitude, position.longitude));
      await demarrerSuiviPosition();
    } catch (e) {
      debugPrint("Erreur de récupération de la position : $e");
      emit(
        state.copyWith(
          isLoadingLocation: false,
          errorMessage: "Erreur lors de la récupération de la position GPS.",
        ),
      );
      await demarrerSuiviPosition();
    }
  }

  Future<void> _refreshUserCity(LatLng position) async {
    _userCity = await repository.getCityFromPosition(position);
  }

  /// 2. Recherche d'adresses en temps réel (Appelé à chaque changement dans le TextField)
  Future<void> rechercherSuggestions(String query) async {
    if (query.trim().length < 2) {
      emit(state.copyWith(suggestions: []));
      return;
    }

    try {
      final hits = await repository.getSearchSuggestions(
        query,
        state.positionActuelle,
        city: _userCity,
      );
      emit(state.copyWith(suggestions: hits));
    } catch (e) {
      emit(
        state.copyWith(
          errorMessage: "Impossible de récupérer les suggestions d'adresse.",
        ),
      );
    }
  }

  /// 3. Sélectionne une adresse dans le Pop Modal
  void selectionnerDestination(LatLng coordinates, String addressName) {
    _arreterSuiviItineraire(silent: true);
    _resetPromptedIncidents();

    emit(
      state.copyWith(
        pointArriveeDynamique: coordinates,
        adresseSelectionnee: addressName,
        routePoints: const [],
        clearRouteMetadata: true,
        suggestions: const [],
      ),
    );
  }

  /// 4. Recherche textuelle directe
  Future<void> gererRechercheDirecte(String address) async {
    if (address.isEmpty) return;

    emit(state.copyWith(suggestions: const [], isLoadingRoute: true));

    try {
      final LatLng? destination = await repository.getCoordinatesFromAddress(
        address,
        state.positionActuelle,
        city: _userCity,
      );

      if (destination != null) {
        emit(
          state.copyWith(
            pointArriveeDynamique: destination,
            adresseSelectionnee: address,
            routePoints: const [],
            clearRouteMetadata: true,
            isLoadingRoute: false,
          ),
        );
      } else {
        emit(
          state.copyWith(
            isLoadingRoute: false,
            errorMessage:
                "Destination introuvable. Veuillez préciser l'adresse.",
          ),
        );
      }
    } catch (e) {
      emit(
        state.copyWith(
          isLoadingRoute: false,
          errorMessage: "Erreur lors de la recherche de la destination.",
        ),
      );
    }
  }

  /// 5. Calcule le tracé et démarre le suivi GPS sur l'itinéraire
  Future<void> validerEtTracerItineraire() async {
    if (state.pointArriveeDynamique == null) {
      emit(
        state.copyWith(
          errorMessage: "Veuillez d'abord sélectionner une destination.",
        ),
      );
      return;
    }

    emit(state.copyWith(isSearching: false, isLoadingRoute: true));

    try {
      final route = await repository.getRoute(
        state.positionActuelle,
        state.pointArriveeDynamique!,
      );

      final simplifiedRoute = simplifyPolyline(route.polylinePoints);
      _resetPromptedIncidents();
      _resetOffRouteTracking();

      emit(
        state.copyWith(
          routePoints: simplifiedRoute,
          routeRemainingPoints: simplifiedRoute,
          routeTraveledPoints: const [],
          routeProgressIndex: 0,
          distanceMetres: route.distanceMetres,
          distanceRemainingMetres: route.distanceMetres,
          tempsSecondes: route.tempsSecondes,
          tempsRemainingSecondes: route.tempsSecondes,
          instructions: route.instructions,
          alerteIncidentInevitable: route.alerteIncidentInevitable,
          penalitesIncidentsAppliquees: route.penalitesIncidentsAppliquees,
          routeWarningMessage: route.alerteIncidentInevitable
              ? "Votre itinéraire traverse une zone d'incident. Aucun contournement disponible."
              : null,
          isLoadingRoute: false,
        ),
      );
    } on RoutingException catch (e) {
      emit(
        state.copyWith(
          isLoadingRoute: false,
          errorMessage: _routingErrorMessage(e),
        ),
      );
    } catch (e) {
      emit(
        state.copyWith(
          isLoadingRoute: false,
          errorMessage: "Erreur lors du calcul de l'itinéraire.",
        ),
      );
    }
  }

  /// Suivi GPS continu sur la carte (sans itinéraire actif).
  Future<void> demarrerSuiviPosition({double distanceFilterMeters = 10}) async {
    if (_positionSubscription != null || isClosed) return;
    if (!await _ensureLocationPermission()) return;

    _positionSubscription =
        LocationService.watchPosition(
          distanceFilterMeters: distanceFilterMeters,
        ).listen(
          _onPositionUpdate,
          onError: (Object error) {
            debugPrint("Erreur suivi GPS : $error");
          },
        );
  }

  /// Démarre le flux GPS pour suivre la progression sur l'itinéraire actif.
  Future<void> demarrerSuiviItineraire() async {
    if (state.routePoints.isEmpty) return;
    if (!await _ensureLocationPermission()) return;

    _stopPositionWatch();
    _resetPromptedIncidents();

    emit(
      state.copyWith(
        isNavigating: true,
        routeRemainingPoints: state.routePoints,
        routeTraveledPoints: [state.positionActuelle],
        distanceRemainingMetres:
            state.distanceRemainingMetres ?? state.distanceMetres,
        tempsRemainingSecondes:
            state.tempsRemainingSecondes ?? state.tempsSecondes,
      ),
    );

    _startTrackCapture();
    _resetOffRouteTracking();
    await demarrerSuiviPosition(distanceFilterMeters: 5);
  }

  void _resetOffRouteTracking() {
    _offRouteStartedAt = null;
    _lastRerouteAt = null;
    _isRerouting = false;
  }

  void _startTrackCapture() {
    _trackBuffer.clear();
    _trackStartedAt = DateTime.now();
    _lastTrackFlushAt = null;
  }

  void _onPositionUpdate(Position position) {
    if (isClosed) return;

    final lat = position.latitude;
    final lng = position.longitude;
    if (!lat.isFinite || !lng.isFinite) return;

    final userPos = LatLng(lat, lng);

    if (state.isNavigating && state.routePoints.isNotEmpty) {
      _onNavigationPositionUpdate(position, userPos);
    } else {
      _onIdlePositionUpdate(userPos);
    }
  }

  void _onIdlePositionUpdate(LatLng userPos) {
    _checkIncidentProximity(userPos);

    if (!_shouldEmitPositionUpdate(userPos)) return;

    emit(state.copyWith(positionActuelle: userPos));
    _recordPositionEmit(userPos);
  }

  void _onNavigationPositionUpdate(Position position, LatLng userPos) {
    _checkIncidentProximity(userPos);

    final destination = state.pointArriveeDynamique;

    if (destination != null &&
        _distance(userPos, destination) <= _arrivalThresholdMetres) {
      emit(
        state.copyWith(
          positionActuelle: userPos,
          routeTraveledPoints: state.routePoints,
          routeRemainingPoints: const [],
          routeProgressIndex: state.routePoints.length - 1,
          distanceRemainingMetres: 0,
          tempsRemainingSecondes: 0,
          isNavigating: false,
          routeSuccessMessage: "Vous êtes arrivé à destination.",
        ),
      );
      unawaited(_flushTrackBuffer(endNavigation: true));
      _stopPositionWatch();
      unawaited(demarrerSuiviPosition());
      return;
    }

    _checkOffRoute(userPos);
    _emitNavigationProgress(userPos);

    if (!_shouldEmitPositionUpdate(userPos)) return;

    _appendTrackPoint(position);
    _recordPositionEmit(userPos);
    unawaited(_maybeFlushTrackBuffer());
  }

  void _emitNavigationProgress(LatLng userPos) {
    final progress = RouteProgressHelper.computeNavigationProgress(
      userPos,
      state.routePoints,
      state.routeProgressIndex,
    );

    final totalDistance =
        state.distanceMetres ?? progress.distanceRemainingMetres;
    final totalTime = state.tempsSecondes ?? 0.0;
    final tempsRemaining = totalDistance > 0
        ? totalTime * (progress.distanceRemainingMetres / totalDistance)
        : totalTime;

    emit(
      state.copyWith(
        positionActuelle: userPos,
        routeProgressIndex: progress.progressIndex,
        routeTraveledPoints: progress.traveled,
        routeRemainingPoints: progress.remaining,
        distanceRemainingMetres: progress.distanceRemainingMetres,
        tempsRemainingSecondes: tempsRemaining.clamp(0.0, totalTime),
      ),
    );
  }

  void _checkOffRoute(LatLng userPos) {
    if (!state.isNavigating ||
        state.routePoints.isEmpty ||
        state.pointArriveeDynamique == null ||
        _isRerouting ||
        state.isLoadingRoute) {
      return;
    }

    final distanceToRoute = RouteProgressHelper.minDistanceToRoute(
      userPos,
      state.routePoints,
    );

    if (distanceToRoute <= _offRouteThresholdMetres) {
      _offRouteStartedAt = null;
      return;
    }

    final now = DateTime.now();
    _offRouteStartedAt ??= now;

    if (now.difference(_offRouteStartedAt!) >= _offRouteGraceDuration) {
      unawaited(_rerouteFromPosition(userPos));
    }
  }

  Future<void> _rerouteFromPosition(LatLng userPos) async {
    if (_isRerouting || isClosed) return;

    final destination = state.pointArriveeDynamique;
    if (destination == null) return;

    final now = DateTime.now();
    if (_lastRerouteAt != null &&
        now.difference(_lastRerouteAt!) < _rerouteCooldown) {
      return;
    }

    _isRerouting = true;
    _lastRerouteAt = now;
    _offRouteStartedAt = null;

    try {
      final route = await repository.getRoute(userPos, destination);
      if (isClosed || !state.isNavigating) return;

      final simplifiedRoute = simplifyPolyline(route.polylinePoints);
      final progress = RouteProgressHelper.computeNavigationProgress(
        userPos,
        simplifiedRoute,
        0,
      );
      final tempsRemaining = route.distanceMetres > 0
          ? route.tempsSecondes *
                (progress.distanceRemainingMetres / route.distanceMetres)
          : route.tempsSecondes;

      emit(
        state.copyWith(
          routePoints: simplifiedRoute,
          routeProgressIndex: progress.progressIndex,
          routeTraveledPoints: progress.traveled,
          routeRemainingPoints: progress.remaining,
          positionActuelle: userPos,
          distanceMetres: route.distanceMetres,
          distanceRemainingMetres: progress.distanceRemainingMetres,
          tempsSecondes: route.tempsSecondes,
          tempsRemainingSecondes: tempsRemaining.clamp(
            0.0,
            route.tempsSecondes,
          ),
          instructions: route.instructions,
          alerteIncidentInevitable: route.alerteIncidentInevitable,
          penalitesIncidentsAppliquees: route.penalitesIncidentsAppliquees,
          routeSuccessMessage: 'Itinéraire recalculé.',
          isNavigating: true,
        ),
      );
    } on RoutingException catch (e) {
      debugPrint('Recalcul itinéraire échoué : ${e.detail ?? e.statusCode}');
    } catch (e) {
      debugPrint('Recalcul itinéraire échoué : $e');
    } finally {
      _isRerouting = false;
    }
  }

  void _appendTrackPoint(Position position) {
    final speed = position.speed;
    _trackBuffer.add(
      TrafficTrackPoint(
        latitude: position.latitude,
        longitude: position.longitude,
        speedMs: speed.isFinite && speed >= 0 ? speed : null,
        recordedAt: position.timestamp,
      ),
    );
  }

  Future<void> _maybeFlushTrackBuffer() async {
    if (_trackBuffer.length < _trackFlushMinPoints) return;

    final now = DateTime.now();
    if (_lastTrackFlushAt != null &&
        now.difference(_lastTrackFlushAt!) < _trackFlushInterval) {
      return;
    }

    await _flushTrackBuffer(endNavigation: false);
  }

  Future<void> _flushTrackBuffer({required bool endNavigation}) async {
    if (_trackBuffer.length < 2) {
      if (endNavigation) {
        _trackBuffer.clear();
        _trackStartedAt = null;
      }
      return;
    }

    final points = List<TrafficTrackPoint>.from(_trackBuffer);
    final startedAt = _trackStartedAt;
    final endedAt = endNavigation ? DateTime.now() : null;

    if (endNavigation) {
      _trackBuffer.clear();
      _trackStartedAt = null;
      _lastTrackFlushAt = null;
    } else {
      _trackBuffer.clear();
      if (points.isNotEmpty) {
        _trackBuffer.add(points.last);
      }
      _lastTrackFlushAt = DateTime.now();
    }

    await repository.uploadTrafficTrack(
      points: points,
      startedAt: startedAt,
      endedAt: endedAt,
    );
  }

  void _recordPositionEmit(LatLng userPos) {
    _lastNavigationEmitAt = DateTime.now();
    _lastNavigationEmitPos = userPos;
  }

  void _checkIncidentProximity(LatLng userPos) {
    if (isClosed || _currentUserId == null) return;

    for (final incident in _activeIncidents) {
      if (_promptedIncidentIds.contains(incident.id)) continue;
      if (incident.resolvedAt != null) continue;
      if (incident.status.toLowerCase() == 'resolved') continue;
      if (incident.reporterId.isNotEmpty &&
          incident.reporterId == _currentUserId) {
        continue;
      }

      final incidentPos = incident.toLatLng;
      if (_distance(userPos, incidentPos) > _incidentProximityMetres) continue;

      _promptedIncidentIds.add(incident.id);
      emit(
        state.copyWith(incidentToConfirm: incident, clearRouteWarning: true),
      );
      return;
    }
  }

  bool _shouldEmitPositionUpdate(LatLng userPos) {
    final now = DateTime.now();
    if (_lastNavigationEmitAt != null &&
        now.difference(_lastNavigationEmitAt!) < const Duration(seconds: 2)) {
      return false;
    }

    if (_lastNavigationEmitPos != null &&
        _distance(userPos, _lastNavigationEmitPos!) < 12) {
      return false;
    }

    return true;
  }

  void _resetNavigationThrottle() {
    _lastNavigationEmitAt = null;
    _lastNavigationEmitPos = null;
  }

  void _stopPositionWatch() {
    _positionSubscription?.cancel();
    _positionSubscription = null;
    _resetNavigationThrottle();
  }

  void _arreterSuiviItineraire({bool silent = false}) {
    if (!silent && state.isNavigating) {
      emit(state.copyWith(isNavigating: false));
    }

    _resetOffRouteTracking();
    unawaited(_flushTrackBuffer(endNavigation: true));
    _stopPositionWatch();
    unawaited(demarrerSuiviPosition());
  }

  void basculerRecherche(bool isSearching) {
    emit(state.copyWith(isSearching: isSearching));
  }

  void effacerSuggestions() {
    if (state.suggestions.isEmpty) return;
    emit(state.copyWith(suggestions: const []));
  }

  void effacerRecherche() {
    _arreterSuiviItineraire(silent: true);
    _resetPromptedIncidents();

    emit(
      state.copyWith(
        isSearching: false,
        suggestions: const [],
        routePoints: const [],
        clearRouteMetadata: true,
        clearArrivee: true,
      ),
    );
  }

  void clearError() {
    emit(state.copyWith(errorMessage: null));
  }

  void clearRouteWarning() {
    emit(state.copyWith(clearRouteWarning: true));
  }

  void clearRouteSuccess() {
    emit(state.copyWith(routeSuccessMessage: null));
  }

  Future<bool> _ensureLocationPermission() async {
    final serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      emit(
        state.copyWith(
          errorMessage: "Le GPS est désactivé sur votre appareil.",
        ),
      );
      return false;
    }

    var permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        emit(
          state.copyWith(
            errorMessage: "L'autorisation d'accès GPS est refusée.",
          ),
        );
        return false;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      emit(
        state.copyWith(
          errorMessage: "L'autorisation GPS est définitivement refusée.",
        ),
      );
      return false;
    }

    return true;
  }

  String _routingErrorMessage(RoutingException exception) {
    if (exception.detail == 'empty_polyline') {
      return "Aucun tracé disponible pour cet itinéraire.";
    }

    return switch (exception.statusCode) {
      404 => "Aucun itinéraire trouvé entre ces deux points.",
      502 => "Le service de routage a rencontré une erreur.",
      503 =>
        "Le service de routage est indisponible. Vérifiez votre connexion.",
      504 => "Le calcul de l'itinéraire a expiré. Réessayez.",
      429 => "Trop de recalculs. Patientez un instant.",
      0 => "Impossible de joindre le serveur de routage.",
      _ => "Erreur lors du calcul de l'itinéraire.",
    };
  }
}
