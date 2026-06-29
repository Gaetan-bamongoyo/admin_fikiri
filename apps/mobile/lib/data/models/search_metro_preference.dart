import '../services/geocoding_bounds.dart';

/// Ville de recherche configurée dans les paramètres.
enum SearchMetroPreference {
  auto,
  kinshasa,
  goma;

  String get label => switch (this) {
    SearchMetroPreference.auto => 'Automatique (GPS)',
    SearchMetroPreference.kinshasa => 'Kinshasa',
    SearchMetroPreference.goma => 'Goma',
  };

  String get storageValue => name;

  GeocodingMetro? get geocodingMetro => switch (this) {
    SearchMetroPreference.auto => null,
    SearchMetroPreference.kinshasa => GeocodingMetro.kinshasa,
    SearchMetroPreference.goma => GeocodingMetro.goma,
  };

  static SearchMetroPreference fromStorage(String? value) {
    return SearchMetroPreference.values.firstWhere(
      (item) => item.name == value,
      orElse: () => SearchMetroPreference.auto,
    );
  }

  static SearchMetroPreference fromApi(String? value) {
    return fromStorage(value);
  }
}
