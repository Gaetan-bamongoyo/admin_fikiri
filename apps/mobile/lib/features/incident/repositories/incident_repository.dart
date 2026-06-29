import 'package:dio/dio.dart';
import '../../../data/network/api_client.dart';
import '../../../data/local/secure_storage.dart';
import '../../../data/network/api_endpoints.dart';
import '/features/incident/models/incident_model.dart';
import '../models/incident_request.dart';
import '../models/incident_response.dart';

class IncidentRepository {
  Future<IncidentResponse> reportIncident({
    required String type,
    required double latitude,
    required double longitude,
    required String description,
    required String address,
  }) async {
    final response = await ApiClient().post(
      ApiEndpoints.incident,
      data: IncidentRequest(
        type: type,
        latitude: latitude,
        longitude: longitude,
        description: description,
        address: address,
      ).toJson(),
      token: await SecureStorage.getAccessToken(),
    );

    return IncidentResponse.fromJson(response.data);
  }

  // get incidents near the user's position
  Future<IncidentModel> getIncidents({
    double? latitude,
    double? longitude,
    double radiusKm = 15,
    int limit = 50,
  }) async {
    final queryParameters = <String, dynamic>{
      'limit': limit,
      if (latitude != null && longitude != null) ...{
        'latitude': latitude,
        'longitude': longitude,
        'radiusKm': radiusKm,
      },
    };

    final response = await ApiClient().get(
      ApiEndpoints.incident,
      queryParameters: queryParameters,
      token: await SecureStorage.getAccessToken(),
    );

    return IncidentModel.fromJson(response.data);
  }

  // confirm or dispute an incident
  Future<void> confirmIncident(
    String incidentId, {
    bool isConfirm = true,
  }) async {
    final token = await SecureStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw Exception('Connectez-vous pour confirmer un incident.');
    }

    try {
      await ApiClient().post(
        '${ApiEndpoints.incident}/$incidentId/confirm',
        data: {'isConfirm': isConfirm},
        token: token,
      );
    } on DioException catch (e) {
      throw Exception(_mapConfirmError(e));
    }
  }

  String _mapConfirmError(DioException error) {
    final statusCode = error.response?.statusCode;
    final data = error.response?.data;

    if (data is Map) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) return message;
      if (message is List && message.isNotEmpty) {
        return message.first.toString();
      }
    }

    return switch (statusCode) {
      401 => 'Session expirée. Reconnectez-vous.',
      409 => 'Vous avez déjà répondu à cet incident.',
      404 => 'Incident introuvable.',
      400 => 'Requête invalide. Réessayez.',
      _ => 'Impossible de confirmer l\'incident.',
    };
  }
}
