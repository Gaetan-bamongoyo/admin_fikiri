import 'package:dio/dio.dart';

import '../../../data/network/api_client.dart';
import '../../../data/network/api_endpoints.dart';
import '../models/login_request.dart';
import '../models/login_response.dart';
import '../models/register_request.dart';

class AuthRepository {
  Future<LoginResponse> login({
    required String email,
    required String password,
  }) async {
    try {
      final response = await ApiClient().post(
        ApiEndpoints.login,
        data: LoginRequest(email: email, password: password).toJson(),
      );

      return LoginResponse.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      throw Exception(_mapError(error, 'vous connecter'));
    }
  }

  Future<LoginResponse> register({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    try {
      final response = await ApiClient().post(
        ApiEndpoints.register,
        data: RegisterRequest(
          email: email,
          password: password,
          firstName: firstName,
          lastName: lastName,
          phone: phone,
        ).toJson(),
      );

      return LoginResponse.fromJson(
        Map<String, dynamic>.from(response.data as Map),
      );
    } on DioException catch (error) {
      throw Exception(_mapError(error, 'créer le compte'));
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
      409 => 'Un compte existe déjà avec cet email.',
      401 => 'Email ou mot de passe incorrect.',
      400 => 'Informations invalides. Vérifiez vos données.',
      _ => 'Impossible de $action.',
    };
  }
}
