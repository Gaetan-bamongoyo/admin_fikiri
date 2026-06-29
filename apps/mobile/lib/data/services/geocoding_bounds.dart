import 'dart:math' as math;

import 'package:latlong2/latlong.dart';

/// Villes couvertes par la recherche d'adresses en RDC.
enum GeocodingMetro { kinshasa, goma }

class MetroArea {
  final GeocodingMetro id;
  final String label;
  final LatLng center;
  final String bbox;
  final double minLon;
  final double minLat;
  final double maxLon;
  final double maxLat;

  const MetroArea({
    required this.id,
    required this.label,
    required this.center,
    required this.bbox,
    required this.minLon,
    required this.minLat,
    required this.maxLon,
    required this.maxLat,
  });

  bool contains(LatLng point) {
    return point.longitude >= minLon &&
        point.longitude <= maxLon &&
        point.latitude >= minLat &&
        point.latitude <= maxLat;
  }
}

/// Utilitaires pour limiter la recherche d'adresses aux grandes villes RDC.
class GeocodingBounds {
  GeocodingBounds._();

  static const Distance _distance = Distance();

  static const MetroArea kinshasa = MetroArea(
    id: GeocodingMetro.kinshasa,
    label: 'Kinshasa',
    center: LatLng(-4.3217, 15.3125),
    bbox: '14.8,-4.8,15.8,-4.0',
    minLon: 14.8,
    minLat: -4.8,
    maxLon: 15.8,
    maxLat: -4.0,
  );

  static const MetroArea goma = MetroArea(
    id: GeocodingMetro.goma,
    label: 'Goma',
    center: LatLng(-1.6792, 29.2340),
    bbox: '29.0,-1.9,29.5,-1.45',
    minLon: 29.0,
    minLat: -1.9,
    maxLon: 29.5,
    maxLat: -1.45,
  );

  static const List<MetroArea> supportedMetros = [kinshasa, goma];

  static MetroArea metroFor(GeocodingMetro metro) {
    return switch (metro) {
      GeocodingMetro.kinshasa => kinshasa,
      GeocodingMetro.goma => goma,
    };
  }

  /// Zone de recherche : ville choisie, mot-clé dans la requête, GPS, ou Kinshasa.
  static MetroArea resolveSearchArea(
    LatLng? devicePosition, {
    GeocodingMetro? preferred,
    String? query,
  }) {
    if (preferred != null) return metroFor(preferred);

    final fromQuery = _metroFromQuery(query);
    if (fromQuery != null) return fromQuery;

    if (devicePosition != null) {
      for (final metro in supportedMetros) {
        if (metro.contains(devicePosition)) return metro;
      }
    }

    return kinshasa;
  }

  static MetroArea? _metroFromQuery(String? query) {
    if (query == null || query.trim().isEmpty) return null;

    final normalized = query.toLowerCase();

    if (normalized.contains('goma') ||
        normalized.contains('karisimbi') ||
        normalized.contains('katindo') ||
        normalized.contains('himbi')) {
      return goma;
    }

    if (normalized.contains('kinshasa') ||
        normalized.contains('gombe') ||
        normalized.contains('limete') ||
        normalized.contains('bandal') ||
        normalized.contains('masina') ||
        normalized.contains('kalamu')) {
      return kinshasa;
    }

    return null;
  }

  static LatLng geocodingAnchor(
    LatLng? devicePosition, {
    GeocodingMetro? preferred,
    String? query,
  }) {
    final area = resolveSearchArea(
      devicePosition,
      preferred: preferred,
      query: query,
    );

    if (devicePosition != null && area.contains(devicePosition)) {
      return devicePosition;
    }

    return area.center;
  }

  static String searchBbox(
    LatLng? devicePosition, {
    GeocodingMetro? preferred,
    String? query,
  }) {
    final area = resolveSearchArea(
      devicePosition,
      preferred: preferred,
      query: query,
    );

    if (devicePosition != null && area.contains(devicePosition)) {
      return bboxFromCenter(devicePosition, radiusKm: 40);
    }

    return area.bbox;
  }

  static bool isInKinshasaMetro(LatLng point) => kinshasa.contains(point);

  static bool isInGomaMetro(LatLng point) => goma.contains(point);

  static bool isInSupportedMetro(LatLng point) {
    return supportedMetros.any((metro) => metro.contains(point));
  }

  /// Bbox GraphHopper / Photon : minLon,minLat,maxLon,maxLat
  static String bboxFromCenter(LatLng center, {double radiusKm = 35}) {
    final latDelta = radiusKm / 111.0;
    final lonDelta =
        radiusKm / (111.0 * math.cos(center.latitude * math.pi / 180));

    final minLon = center.longitude - lonDelta;
    final minLat = center.latitude - latDelta;
    final maxLon = center.longitude + lonDelta;
    final maxLat = center.latitude + latDelta;

    return '$minLon,$minLat,$maxLon,$maxLat';
  }

  static bool isInMetro(LatLng point, MetroArea area) => area.contains(point);

  static bool isAllowedCountry(String? country, String? countryCode) {
    final normalizedCountry = (country ?? '').toLowerCase();
    final normalizedCode = (countryCode ?? '').toLowerCase();

    if (normalizedCountry.isEmpty && normalizedCode.isEmpty) return true;

    if (normalizedCode == 'cd' || normalizedCode == 'cod') return true;

    return normalizedCountry.contains('congo') ||
        normalizedCountry.contains('rdc') ||
        normalizedCountry.contains('kinshasa');
  }

  static bool matchesCity(String? hitCity, String? userCity) {
    if (userCity == null || userCity.trim().isEmpty) return true;
    if (hitCity == null || hitCity.trim().isEmpty) return true;

    final user = _normalizeCity(userCity);
    final hit = _normalizeCity(hitCity);

    return hit.contains(user) ||
        user.contains(hit) ||
        hit.startsWith(user) ||
        user.startsWith(hit);
  }

  static double distanceKm(LatLng from, LatLng to) {
    return _distance(from, to) / 1000;
  }

  static String _normalizeCity(String value) {
    return value.toLowerCase().replaceAll('é', 'e').replaceAll('è', 'e').trim();
  }
}
