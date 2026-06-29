import '../../../data/models/search_metro_preference.dart';

class UserPreferences {
  final double? homeLatitude;
  final double? homeLongitude;
  final double? workLatitude;
  final double? workLongitude;
  final bool notificationsEnabled;
  final bool anticipatoryAlertsEnabled;
  final bool anonymizePositionData;
  final SearchMetroPreference searchMetro;
  final bool trafficRegionAlertsEnabled;
  final bool routeIncidentAlertsEnabled;
  final int departureReminderMinutes;
  final bool homeTrafficAlertsEnabled;
  final bool workTrafficAlertsEnabled;

  UserPreferences({
    required this.homeLatitude,
    required this.homeLongitude,
    required this.workLatitude,
    required this.workLongitude,
    required this.notificationsEnabled,
    required this.anticipatoryAlertsEnabled,
    required this.anonymizePositionData,
    required this.searchMetro,
    required this.trafficRegionAlertsEnabled,
    required this.routeIncidentAlertsEnabled,
    required this.departureReminderMinutes,
    required this.homeTrafficAlertsEnabled,
    required this.workTrafficAlertsEnabled,
  });

  bool get hasHomeLocation => homeLatitude != null && homeLongitude != null;

  bool get hasWorkLocation => workLatitude != null && workLongitude != null;

  factory UserPreferences.defaults() {
    return UserPreferences(
      homeLatitude: null,
      homeLongitude: null,
      workLatitude: null,
      workLongitude: null,
      notificationsEnabled: true,
      anticipatoryAlertsEnabled: true,
      anonymizePositionData: false,
      searchMetro: SearchMetroPreference.auto,
      trafficRegionAlertsEnabled: true,
      routeIncidentAlertsEnabled: true,
      departureReminderMinutes: 0,
      homeTrafficAlertsEnabled: false,
      workTrafficAlertsEnabled: false,
    );
  }

  factory UserPreferences.fromJson(Map<String, dynamic> json) {
    return UserPreferences(
      homeLatitude: _parseCoordinate(json['homeLatitude']),
      homeLongitude: _parseCoordinate(json['homeLongitude']),
      workLatitude: _parseCoordinate(json['workLatitude']),
      workLongitude: _parseCoordinate(json['workLongitude']),
      notificationsEnabled: json['notificationsEnabled'] as bool? ?? true,
      anticipatoryAlertsEnabled:
          json['anticipatoryAlertsEnabled'] as bool? ?? true,
      anonymizePositionData: json['anonymizePositionData'] as bool? ?? false,
      searchMetro: SearchMetroPreference.fromApi(
        json['searchMetro']?.toString(),
      ),
      trafficRegionAlertsEnabled:
          json['trafficRegionAlertsEnabled'] as bool? ?? true,
      routeIncidentAlertsEnabled:
          json['routeIncidentAlertsEnabled'] as bool? ?? true,
      departureReminderMinutes: json['departureReminderMinutes'] as int? ?? 0,
      homeTrafficAlertsEnabled:
          json['homeTrafficAlertsEnabled'] as bool? ?? false,
      workTrafficAlertsEnabled:
          json['workTrafficAlertsEnabled'] as bool? ?? false,
    );
  }

  static double? _parseCoordinate(dynamic value) {
    if (value == null) return null;
    if (value is num) return value.toDouble();
    return double.tryParse(value.toString().replaceAll(',', '.'));
  }
}
