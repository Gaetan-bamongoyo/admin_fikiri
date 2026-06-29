import 'package:latlong2/latlong.dart';

/// Réduit le nombre de points d'une polyline pour alléger le rendu carte.
List<LatLng> simplifyPolyline(List<LatLng> points, {int maxPoints = 250}) {
  if (points.length <= maxPoints) return points;

  final step = points.length / maxPoints;
  final simplified = <LatLng>[];

  for (var i = 0; i < maxPoints; i++) {
    final index = (i * step).floor().clamp(0, points.length - 1);
    simplified.add(points[index]);
  }

  if (simplified.last != points.last) {
    simplified.add(points.last);
  }

  return simplified;
}
