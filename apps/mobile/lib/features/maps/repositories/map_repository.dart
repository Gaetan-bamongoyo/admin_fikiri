import 'package:latlong2/latlong.dart';
import '../../../data/services/geocoding_service.dart';
import '../../../data/services/routing_service.dart';
import '../../traffic/models/traffic_track_point.dart';
import '../../traffic/repositories/traffic_track_repository.dart';
import '../models/route_response.dart';

class MapRepository {
  final RoutingService _routingService = RoutingService();
  final GeocodingService _geocodingService = GeocodingService();
  final TrafficTrackRepository _trafficTrackRepository =
      TrafficTrackRepository();

  /// Recherche des suggestions d'adresses proches de la position actuelle.
  Future<List<dynamic>> getSearchSuggestions(
    String query,
    LatLng near, {
    String? city,
  }) async {
    return _geocodingService.searchSuggestions(query, near, city: city);
  }

  /// Ville déduite de la position GPS.
  Future<String?> getCityFromPosition(LatLng position) async {
    return _geocodingService.getCityFromCoordinates(position);
  }

  /// Récupère les coordonnées géographiques à partir d'une adresse textuelle.
  Future<LatLng?> getCoordinatesFromAddress(
    String address,
    LatLng near, {
    String? city,
  }) async {
    return _geocodingService.getCoordinatesFromAddress(
      address,
      near,
      city: city,
    );
  }

  /// Calcule un itinéraire dynamique via l'API Python (contournement des incidents).
  Future<RouteResponse> getRoute(LatLng start, LatLng end) async {
    return await _routingService.getRoute(start, end);
  }

  /// Envoie un tracé GPS collecté pendant la navigation (détection trafic passive).
  Future<void> uploadTrafficTrack({
    required List<TrafficTrackPoint> points,
    DateTime? startedAt,
    DateTime? endedAt,
  }) async {
    await _trafficTrackRepository.uploadTrack(
      points: points,
      startedAt: startedAt,
      endedAt: endedAt,
    );
  }
}
