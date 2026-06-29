import 'package:shared_preferences/shared_preferences.dart';

import '../../features/auth/models/user_preferences_model.dart';
import '../../data/models/search_metro_preference.dart';
import '../services/geocoding_bounds.dart';

/// Préférences locales de l'application.
class AppSettingsService {
  AppSettingsService._();

  static const String searchMetroKey = 'search_metro';
  static const String anonymizePositionKey = 'anonymize_position_data';
  static const String notificationsEnabledKey = 'notifications_enabled';
  static const String trafficRegionAlertsKey = 'traffic_region_alerts_enabled';
  static const String routeIncidentAlertsKey = 'route_incident_alerts_enabled';
  static const String anticipatoryAlertsKey = 'anticipatory_alerts_enabled';
  static const String departureReminderKey = 'departure_reminder_minutes';

  static Future<SearchMetroPreference> getSearchMetro() async {
    final prefs = await SharedPreferences.getInstance();
    return SearchMetroPreference.fromStorage(prefs.getString(searchMetroKey));
  }

  static Future<void> setSearchMetro(SearchMetroPreference value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(searchMetroKey, value.storageValue);
  }

  static Future<GeocodingMetro?> getGeocodingMetro() async {
    return (await getSearchMetro()).geocodingMetro;
  }

  static Future<bool> getNotificationsEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(notificationsEnabledKey) ?? true;
  }

  static Future<void> setNotificationsEnabled(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(notificationsEnabledKey, value);
  }

  static Future<bool> getAnonymizePosition() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(anonymizePositionKey) ?? false;
  }

  static Future<void> setAnonymizePosition(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(anonymizePositionKey, value);
  }

  static Future<void> applyFromUserPreferences(
    UserPreferences preferences,
  ) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(searchMetroKey, preferences.searchMetro.storageValue);
    await prefs.setBool(
      anonymizePositionKey,
      preferences.anonymizePositionData,
    );
    await prefs.setBool(
      notificationsEnabledKey,
      preferences.notificationsEnabled,
    );
    await prefs.setBool(
      trafficRegionAlertsKey,
      preferences.trafficRegionAlertsEnabled,
    );
    await prefs.setBool(
      routeIncidentAlertsKey,
      preferences.routeIncidentAlertsEnabled,
    );
    await prefs.setBool(
      anticipatoryAlertsKey,
      preferences.anticipatoryAlertsEnabled,
    );
    await prefs.setInt(
      departureReminderKey,
      preferences.departureReminderMinutes,
    );
  }

  /// Rétrocompatibilité pour l'écran Général.
  static Future<void> applyFromApiPreferences({
    required String? searchMetro,
    required bool anonymizePositionData,
  }) async {
    await setSearchMetro(SearchMetroPreference.fromApi(searchMetro));
    await setAnonymizePosition(anonymizePositionData);
  }
}
