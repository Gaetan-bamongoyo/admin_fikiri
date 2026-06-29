import 'package:latlong2/latlong.dart';

class RouteProgressHelper {
  RouteProgressHelper._();

  static const Distance _distance = Distance();

  /// Index du point de polyline le plus proche, en avançant uniquement sur le trajet.
  static int computeProgressIndex(
    LatLng user,
    List<LatLng> route,
    int lastIndex,
  ) {
    if (route.isEmpty) return 0;

    final clampedLast = lastIndex.clamp(0, route.length - 1);
    var bestIndex = clampedLast;
    var bestDist = _distance(user, route[clampedLast]);

    final searchStart = clampedLast > 3 ? clampedLast - 3 : 0;
    for (var i = searchStart; i < route.length; i++) {
      final dist = _distance(user, route[i]);
      if (dist <= bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }

    return bestIndex;
  }

  static List<LatLng> buildTraveledPoints(
    List<LatLng> route,
    int progressIndex,
    LatLng user,
  ) {
    if (route.isEmpty) return [user];

    final end = (progressIndex + 1).clamp(0, route.length);
    return [...route.sublist(0, end), user];
  }

  static List<LatLng> buildRemainingPoints(
    List<LatLng> route,
    int progressIndex,
  ) {
    if (route.isEmpty) return const [];
    if (progressIndex >= route.length - 1) return const [];

    return route.sublist(progressIndex);
  }

  static double distanceAlongPolyline(List<LatLng> points) {
    if (points.length < 2) return 0;

    var total = 0.0;
    for (var i = 0; i < points.length - 1; i++) {
      total += _distance(points[i], points[i + 1]);
    }
    return total;
  }

  /// Distance minimale (m) entre un point et la polyline de l'itinéraire.
  static double minDistanceToRoute(LatLng point, List<LatLng> route) {
    if (route.isEmpty) return double.infinity;
    if (route.length == 1) return _distance(point, route.first);

    var minDist = double.infinity;
    for (var i = 0; i < route.length - 1; i++) {
      final segmentDist = _distancePointToSegment(
        point,
        route[i],
        route[i + 1],
      );
      if (segmentDist < minDist) minDist = segmentDist;
    }
    return minDist;
  }

  static double _distancePointToSegment(LatLng point, LatLng a, LatLng b) {
    const sampleSteps = 10;
    var minDist = double.infinity;

    for (var step = 0; step <= sampleSteps; step++) {
      final fraction = step / sampleSteps;
      final sample = LatLng(
        a.latitude + (b.latitude - a.latitude) * fraction,
        a.longitude + (b.longitude - a.longitude) * fraction,
      );
      final dist = _distance(point, sample);
      if (dist < minDist) minDist = dist;
    }

    return minDist;
  }

  /// Progression le long de l'itinéraire avec distance restante précise.
  static ({
    int progressIndex,
    double distanceRemainingMetres,
    List<LatLng> traveled,
    List<LatLng> remaining,
  })
  computeNavigationProgress(LatLng user, List<LatLng> route, int hintIndex) {
    if (route.isEmpty) {
      return (
        progressIndex: 0,
        distanceRemainingMetres: 0.0,
        traveled: [user],
        remaining: const <LatLng>[],
      );
    }

    if (route.length == 1) {
      return (
        progressIndex: 0,
        distanceRemainingMetres: _distance(user, route.first),
        traveled: [user],
        remaining: route,
      );
    }

    final startSegment = hintIndex > 0 ? hintIndex - 1 : 0;
    var closestSegment = startSegment;
    var closestDist = double.infinity;
    var closestFraction = 0.0;

    for (var i = startSegment; i < route.length - 1; i++) {
      final (dist, fraction) = _distanceAndFractionOnSegment(
        user,
        route[i],
        route[i + 1],
      );
      if (dist < closestDist) {
        closestDist = dist;
        closestSegment = i;
        closestFraction = fraction;
      }
    }

    var distanceCovered = 0.0;
    for (var i = 0; i < closestSegment; i++) {
      distanceCovered += _distance(route[i], route[i + 1]);
    }
    final segmentLength = _distance(
      route[closestSegment],
      route[closestSegment + 1],
    );
    distanceCovered += segmentLength * closestFraction.clamp(0.0, 1.0);

    final totalLength = distanceAlongPolyline(route);
    final distanceRemaining = (totalLength - distanceCovered).clamp(
      0.0,
      totalLength,
    );

    var progressIndex = closestSegment;
    if (closestFraction > 0.85 && progressIndex < route.length - 1) {
      progressIndex += 1;
    }

    return (
      progressIndex: progressIndex,
      distanceRemainingMetres: distanceRemaining,
      traveled: buildTraveledPoints(route, progressIndex, user),
      remaining: buildRemainingPoints(route, progressIndex),
    );
  }

  static (double distance, double fraction) _distanceAndFractionOnSegment(
    LatLng point,
    LatLng a,
    LatLng b,
  ) {
    const sampleSteps = 20;
    var minDist = double.infinity;
    var bestFraction = 0.0;

    for (var step = 0; step <= sampleSteps; step++) {
      final fraction = step / sampleSteps;
      final sample = LatLng(
        a.latitude + (b.latitude - a.latitude) * fraction,
        a.longitude + (b.longitude - a.longitude) * fraction,
      );
      final dist = _distance(point, sample);
      if (dist < minDist) {
        minDist = dist;
        bestFraction = fraction;
      }
    }

    return (minDist, bestFraction);
  }

  static bool isPointNearRoute(
    LatLng point,
    List<LatLng> route,
    double thresholdMetres,
  ) {
    return minDistanceToRoute(point, route) <= thresholdMetres;
  }
}
