import 'package:latlong2/latlong.dart';

class RouteResponse {
  final double distanceMetres;
  final double tempsSecondes;
  final List<LatLng> polylinePoints;
  final List<String> instructions;
  final bool alerteIncidentInevitable;
  final bool penalitesIncidentsAppliquees;

  const RouteResponse({
    required this.distanceMetres,
    required this.tempsSecondes,
    required this.polylinePoints,
    required this.instructions,
    required this.alerteIncidentInevitable,
    required this.penalitesIncidentsAppliquees,
  });

  factory RouteResponse.fromJson(Map<String, dynamic> json) {
    final rawCoords = json['trajet_coordonnees'] as List<dynamic>? ?? [];

    final polylinePoints = <LatLng>[];
    for (final point in rawCoords) {
      if (point is! List || point.length < 2) continue;
      final lng = (point[0] as num).toDouble();
      final lat = (point[1] as num).toDouble();
      if (!lat.isFinite || !lng.isFinite) continue;
      if (lat < -90 || lat > 90 || lng < -180 || lng > 180) continue;
      polylinePoints.add(LatLng(lat, lng));
    }

    return RouteResponse(
      distanceMetres: (json['distance_metres'] as num?)?.toDouble() ?? 0,
      tempsSecondes: (json['temps_secondes'] as num?)?.toDouble() ?? 0,
      polylinePoints: polylinePoints,
      instructions: (json['instructions'] as List<dynamic>? ?? [])
          .map((instruction) => instruction.toString())
          .toList(growable: false),
      alerteIncidentInevitable:
          json['alerte_incident_inevitable'] as bool? ?? false,
      penalitesIncidentsAppliquees:
          json['penalites_incidents_appliquees'] as bool? ?? false,
    );
  }
}
