import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';

import '../network/api_endpoints.dart';
import 'geocoding_bounds.dart';

typedef AddressSuggestion = Map<String, dynamic>;

class GeocodingService {
  GeocodingService({Dio? dio})
    : _dio =
          dio ??
          Dio(
            BaseOptions(
              connectTimeout: const Duration(seconds: 15),
              receiveTimeout: const Duration(seconds: 15),
              headers: const {'User-Agent': 'FikiriTraffic/1.0'},
            ),
          );

  final Dio _dio;

  static const String _graphHopperGeocodeUrl =
      'https://graphhopper.com/api/1/geocode';
  static const String _photonUrl = 'https://photon.komoot.io/api/';
  static const String _graphHopperApiKey =
      '94fa77aa-4d52-44bc-94e6-2e9a67600697';

  static String formatDisplayName(AddressSuggestion hit) {
    final name = hit['name']?.toString().trim() ?? '';
    final city = hit['city']?.toString().trim() ?? '';
    if (name.isEmpty && city.isEmpty) return 'Adresse';
    if (city.isEmpty || name.toLowerCase().contains(city.toLowerCase())) {
      return name.isNotEmpty ? name : city;
    }
    return '$name, $city';
  }

  /// Ville ou commune déduite de la position GPS (Nominatim reverse).
  Future<String?> getCityFromCoordinates(LatLng position) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.maps,
        queryParameters: {
          'lat': position.latitude,
          'lon': position.longitude,
          'format': 'json',
          'zoom': 10,
          'accept-language': 'fr',
        },
      );

      if (response.statusCode != 200 || response.data is! Map) return null;

      final address = response.data['address'];
      if (address is! Map) return null;

      for (final key in ['city', 'town', 'municipality', 'village', 'suburb']) {
        final value = address[key];
        if (value is String && value.trim().isNotEmpty) {
          return value.trim();
        }
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  /// Adresse lisible à partir des coordonnées GPS (Nominatim reverse).
  Future<String?> getAddressFromCoordinates(LatLng position) async {
    try {
      final response = await _dio.get(
        ApiEndpoints.maps,
        queryParameters: {
          'lat': position.latitude,
          'lon': position.longitude,
          'format': 'json',
          'zoom': 18,
          'accept-language': 'fr',
        },
      );

      if (response.statusCode != 200 || response.data is! Map) return null;

      final displayName = response.data['display_name'];
      if (displayName is String && displayName.trim().isNotEmpty) {
        return displayName.trim();
      }

      return null;
    } catch (_) {
      return null;
    }
  }

  /// Suggestions d'adresses en RDC (Photon + repli GraphHopper).
  Future<List<AddressSuggestion>> searchSuggestions(
    String query,
    LatLng devicePosition, {
    String? city,
    GeocodingMetro? preferredMetro,
  }) async {
    final trimmed = query.trim();
    if (trimmed.length < 2) return [];

    final area = GeocodingBounds.resolveSearchArea(
      devicePosition,
      preferred: preferredMetro,
      query: trimmed,
    );
    final anchor = GeocodingBounds.geocodingAnchor(
      devicePosition,
      preferred: preferredMetro,
      query: trimmed,
    );
    final bbox = GeocodingBounds.searchBbox(
      devicePosition,
      preferred: preferredMetro,
      query: trimmed,
    );

    final photonHits = await _searchPhoton(trimmed, anchor, bbox: bbox);
    final filtered = _prioritizeHits(photonHits, anchor, area, city);
    if (filtered.isNotEmpty) return filtered.take(8).toList();

    final graphHopperHits = await _searchGraphHopper(
      trimmed,
      anchor,
      bbox: bbox,
    );
    final ghFiltered = _prioritizeHits(graphHopperHits, anchor, area, city);
    if (ghFiltered.isNotEmpty) return ghFiltered.take(8).toList();

    return filtered.take(8).toList();
  }

  Future<LatLng?> getCoordinatesFromAddress(
    String address,
    LatLng devicePosition, {
    String? city,
    GeocodingMetro? preferredMetro,
  }) async {
    final suggestions = await searchSuggestions(
      address,
      devicePosition,
      city: city,
      preferredMetro: preferredMetro,
    );

    if (suggestions.isEmpty) return null;

    return _pointFromHit(suggestions.first);
  }

  Future<List<AddressSuggestion>> _searchPhoton(
    String query,
    LatLng anchor, {
    required String bbox,
  }) async {
    try {
      final response = await _dio.get(
        _photonUrl,
        queryParameters: {
          'q': query,
          'lang': 'fr',
          'limit': 15,
          'lat': anchor.latitude,
          'lon': anchor.longitude,
          'bbox': bbox,
        },
      );

      if (response.statusCode != 200) return [];

      final features = response.data['features'];
      if (features is! List) return [];

      final hits = <AddressSuggestion>[];
      for (final feature in features) {
        if (feature is! Map) continue;

        final geometry = feature['geometry'];
        final properties = feature['properties'];
        if (geometry is! Map || properties is! Map) continue;

        final coordinates = geometry['coordinates'];
        if (coordinates is! List || coordinates.length < 2) continue;

        final lat = (coordinates[1] as num).toDouble();
        final lng = (coordinates[0] as num).toDouble();
        final props = Map<String, dynamic>.from(properties);

        hits.add({
          'name': _formatPhotonName(props),
          'city': _photonCity(props),
          'country': props['country']?.toString() ?? '',
          'countrycode': props['countrycode']?.toString() ?? '',
          'point': {'lat': lat, 'lng': lng},
        });
      }

      return hits;
    } catch (_) {
      return [];
    }
  }

  Future<List<AddressSuggestion>> _searchGraphHopper(
    String query,
    LatLng anchor, {
    required String bbox,
  }) async {
    try {
      final response = await _dio.get(
        _graphHopperGeocodeUrl,
        queryParameters: {
          'q': query,
          'locale': 'fr',
          'limit': 12,
          'point': '${anchor.latitude},${anchor.longitude}',
          'bbox': bbox,
          'countrycode': 'cd',
          'key': _graphHopperApiKey,
        },
      );

      if (response.statusCode != 200) return [];

      final rawHits = response.data['hits'];
      if (rawHits is! List) return [];

      return rawHits
          .whereType<Map>()
          .map((hit) {
            final point = hit['point'];
            return {
              'name':
                  hit['name']?.toString() ?? hit['street']?.toString() ?? '',
              'city': hit['city']?.toString() ?? '',
              'country': hit['country']?.toString() ?? '',
              'countrycode': hit['countrycode']?.toString() ?? '',
              'point': point is Map
                  ? {
                      'lat': (point['lat'] as num).toDouble(),
                      'lng': (point['lng'] as num).toDouble(),
                    }
                  : null,
            };
          })
          .where((hit) => hit['point'] != null)
          .cast<AddressSuggestion>()
          .toList();
    } catch (_) {
      return [];
    }
  }

  List<AddressSuggestion> _prioritizeHits(
    List<AddressSuggestion> hits,
    LatLng anchor,
    MetroArea area,
    String? city,
  ) {
    final inArea = hits.where((hit) {
      final point = _pointFromHit(hit);
      if (point == null) return false;

      if (!GeocodingBounds.isAllowedCountry(
        hit['country']?.toString(),
        hit['countrycode']?.toString(),
      )) {
        return false;
      }

      return GeocodingBounds.isInMetro(point, area);
    }).toList();

    inArea.sort((a, b) {
      final distA = GeocodingBounds.distanceKm(anchor, _pointFromHit(a)!);
      final distB = GeocodingBounds.distanceKm(anchor, _pointFromHit(b)!);
      return distA.compareTo(distB);
    });

    if (city != null && city.trim().isNotEmpty && area.contains(anchor)) {
      final sameCity = inArea
          .where(
            (hit) => GeocodingBounds.matchesCity(hit['city']?.toString(), city),
          )
          .toList();
      if (sameCity.isNotEmpty) return sameCity;
    }

    return inArea;
  }

  LatLng? _pointFromHit(AddressSuggestion hit) {
    final point = hit['point'];
    if (point is! Map) return null;

    final lat = point['lat'];
    final lng = point['lng'];
    if (lat is! num || lng is! num) return null;

    return LatLng(lat.toDouble(), lng.toDouble());
  }

  String _formatPhotonName(Map<String, dynamic> properties) {
    final name = properties['name']?.toString().trim();
    if (name != null && name.isNotEmpty) return name;

    final street = properties['street']?.toString().trim();
    final number = properties['housenumber']?.toString().trim();
    if (street != null && street.isNotEmpty) {
      return number != null && number.isNotEmpty ? '$street $number' : street;
    }

    final city = _photonCity(properties);
    if (city.isNotEmpty) return city;

    return 'Adresse';
  }

  String _photonCity(Map<String, dynamic> properties) {
    for (final key in ['city', 'locality', 'district', 'county', 'state']) {
      final value = properties[key]?.toString().trim();
      if (value != null && value.isNotEmpty) return value;
    }
    return '';
  }
}
