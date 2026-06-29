import 'package:dio/dio.dart';

import '../../../data/local/secure_storage.dart';
import '../../../data/models/search_metro_preference.dart';
import '../../../data/network/api_client.dart';
import '../../../data/network/api_endpoints.dart';
import '../../auth/models/user_preferences_model.dart';

class UserPreferencesRepository {
  Future<UserPreferences> fetchPreferences() async {
    final token = await SecureStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('Connectez-vous pour synchroniser vos préférences.');
    }

    try {
      final response = await ApiClient().get(
        ApiEndpoints.usersMe,
        token: token,
      );

      final data = response.data;
      if (data is! Map) {
        throw Exception('Réponse invalide du serveur.');
      }

      final preferences = data['preferences'];
      if (preferences is Map) {
        return UserPreferences.fromJson(Map<String, dynamic>.from(preferences));
      }

      return UserPreferences.defaults();
    } on DioException catch (error) {
      throw Exception(_mapError(error));
    }
  }

  Future<UserPreferences> updatePreferences({
    SearchMetroPreference? searchMetro,
    bool? anonymizePositionData,
    bool? notificationsEnabled,
    bool? anticipatoryAlertsEnabled,
    bool? trafficRegionAlertsEnabled,
    bool? routeIncidentAlertsEnabled,
    int? departureReminderMinutes,
    double? homeLatitude,
    double? homeLongitude,
    double? workLatitude,
    double? workLongitude,
    bool? homeTrafficAlertsEnabled,
    bool? workTrafficAlertsEnabled,
    bool clearHomeLocation = false,
    bool clearWorkLocation = false,
  }) async {
    final token = await SecureStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('Connectez-vous pour enregistrer vos préférences.');
    }

    final payload = <String, dynamic>{
      if (searchMetro != null) 'searchMetro': searchMetro.storageValue,
      if (anonymizePositionData != null)
        'anonymizePositionData': anonymizePositionData,
      if (notificationsEnabled != null)
        'notificationsEnabled': notificationsEnabled,
      if (anticipatoryAlertsEnabled != null)
        'anticipatoryAlertsEnabled': anticipatoryAlertsEnabled,
      if (trafficRegionAlertsEnabled != null)
        'trafficRegionAlertsEnabled': trafficRegionAlertsEnabled,
      if (routeIncidentAlertsEnabled != null)
        'routeIncidentAlertsEnabled': routeIncidentAlertsEnabled,
      if (departureReminderMinutes != null)
        'departureReminderMinutes': departureReminderMinutes,
      if (homeTrafficAlertsEnabled != null)
        'homeTrafficAlertsEnabled': homeTrafficAlertsEnabled,
      if (workTrafficAlertsEnabled != null)
        'workTrafficAlertsEnabled': workTrafficAlertsEnabled,
      if (clearHomeLocation) ...{
        'homeLatitude': null,
        'homeLongitude': null,
      } else ...{
        if (homeLatitude != null) 'homeLatitude': homeLatitude,
        if (homeLongitude != null) 'homeLongitude': homeLongitude,
      },
      if (clearWorkLocation) ...{
        'workLatitude': null,
        'workLongitude': null,
      } else ...{
        if (workLatitude != null) 'workLatitude': workLatitude,
        if (workLongitude != null) 'workLongitude': workLongitude,
      },
    };

    try {
      final response = await ApiClient().patch(
        ApiEndpoints.usersMePreferences,
        data: payload,
        token: token,
      );

      final data = response.data;
      if (data is! Map) {
        throw Exception('Réponse invalide du serveur.');
      }

      final preferences = data['preferences'];
      if (preferences is Map) {
        return UserPreferences.fromJson(Map<String, dynamic>.from(preferences));
      }

      return UserPreferences.defaults();
    } on DioException catch (error) {
      throw Exception(_mapError(error));
    }
  }

  String _mapError(DioException error) {
    final data = error.response?.data;
    if (data is Map) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) return message;
    }

    return switch (error.response?.statusCode) {
      401 => 'Session expirée. Reconnectez-vous.',
      _ => 'Impossible de mettre à jour les préférences.',
    };
  }
}
