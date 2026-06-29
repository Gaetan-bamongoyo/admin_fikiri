import 'package:dio/dio.dart';

import '../../../data/local/secure_storage.dart';
import '../../../data/network/api_client.dart';
import '../../../data/network/api_endpoints.dart';
import '../models/trajet_model.dart';

class TrajetRepository {
  Future<String?> _tokenOrNull() async {
    final token = await SecureStorage.getAccessToken();
    if (token == null || token.isEmpty) return null;
    return token;
  }

  Future<List<TrajetModel>> fetchTrajets() async {
    final token = await _tokenOrNull();
    if (token == null) return [];

    final response = await ApiClient().get(ApiEndpoints.trajets, token: token);

    final data = response.data;
    if (data is! List) return [];

    return data
        .whereType<Map>()
        .map((item) => TrajetModel.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<TrajetModel> createTrajet({
    required String label,
    required String address,
    required double latitude,
    required double longitude,
    String? category,
  }) async {
    final token = await _tokenOrNull();
    if (token == null) {
      throw Exception('Connectez-vous pour enregistrer une destination.');
    }

    try {
      final response = await ApiClient().post(
        ApiEndpoints.trajets,
        data: {
          'label': label,
          if (category != null) 'category': category,
          'address': address,
          'latitude': latitude,
          'longitude': longitude,
        },
        token: token,
      );

      return TrajetModel.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      throw Exception(_mapError(error, 'enregistrer la destination'));
    }
  }

  Future<TrajetModel> updateTrajet({
    required String id,
    String? label,
    String? address,
    double? latitude,
    double? longitude,
    String? category,
  }) async {
    final token = await _tokenOrNull();
    if (token == null) {
      throw Exception('Connectez-vous pour modifier une destination.');
    }

    final data = <String, dynamic>{
      if (label != null) 'label': label,
      if (address != null) 'address': address,
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      if (category != null) 'category': category,
    };

    try {
      final response = await ApiClient().patch(
        '${ApiEndpoints.trajets}/$id',
        data: data,
        token: token,
      );

      return TrajetModel.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      throw Exception(_mapError(error, 'modifier la destination'));
    }
  }

  Future<void> deleteTrajet(String id) async {
    final token = await _tokenOrNull();
    if (token == null) {
      throw Exception('Connectez-vous pour supprimer une destination.');
    }

    try {
      await ApiClient().delete('${ApiEndpoints.trajets}/$id', token: token);
    } on DioException catch (error) {
      throw Exception(_mapError(error, 'supprimer la destination'));
    }
  }

  String _mapError(DioException error, String action) {
    final data = error.response?.data;
    if (data is Map) {
      final message = data['message'];
      if (message is String && message.isNotEmpty) return message;
      if (message is List && message.isNotEmpty) {
        return message.first.toString();
      }
    }

    return switch (error.response?.statusCode) {
      401 => 'Session expirée. Reconnectez-vous.',
      409 => 'Cette destination existe déjà.',
      404 => 'Destination introuvable.',
      _ => 'Impossible de $action.',
    };
  }
}
