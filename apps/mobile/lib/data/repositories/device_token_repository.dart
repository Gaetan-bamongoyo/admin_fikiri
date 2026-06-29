import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';

import '../local/secure_storage.dart';
import '../network/api_client.dart';
import '../network/api_endpoints.dart';

/// Enregistrement du token FCM sur api_python.
class DeviceTokenRepository {
  DeviceTokenRepository({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient();

  final ApiClient _apiClient;

  String get _platform =>
      defaultTargetPlatform == TargetPlatform.iOS ? 'ios' : 'android';

  Future<void> registerToken(String fcmToken) async {
    final token = await SecureStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('Connectez-vous pour activer les notifications push.');
    }

    try {
      await _apiClient.post(
        ApiEndpoints.notificationsDeviceToken,
        baseUrl: ApiEndpoints.pythonBaseUrl,
        token: token,
        data: {'fcm_token': fcmToken, 'platform': _platform},
      );
    } on DioException catch (error) {
      throw Exception(_mapError(error));
    }
  }

  Future<void> unregisterToken({String? fcmToken}) async {
    final token = await SecureStorage.getAccessToken();
    if (token == null || token.isEmpty) return;

    try {
      await _apiClient.delete(
        ApiEndpoints.notificationsDeviceToken,
        baseUrl: ApiEndpoints.pythonBaseUrl,
        token: token,
        data: fcmToken == null ? null : {'fcm_token': fcmToken},
      );
    } on DioException catch (error) {
      final status = error.response?.statusCode;
      if (status == 401 || status == 404) return;
      throw Exception(_mapError(error));
    }
  }

  String _mapError(DioException error) {
    final data = error.response?.data;
    if (data is Map) {
      final message = data['detail'] ?? data['message'];
      if (message is String && message.isNotEmpty) return message;
    }

    return switch (error.response?.statusCode) {
      401 => 'Session expirée. Reconnectez-vous.',
      503 => 'Service de notifications indisponible.',
      _ => 'Impossible d\'enregistrer le token de notification.',
    };
  }
}
