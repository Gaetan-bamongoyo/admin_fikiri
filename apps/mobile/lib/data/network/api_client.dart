import 'package:dio/dio.dart';
import 'api_endpoints.dart';
import 'dio_client.dart';

class ApiClient {
  Future<Response> get(
    String endpoint, {
    Map<String, dynamic>? queryParameters,
    String? token,
  }) async {
    final Map<String, dynamic> headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return await DioClient.dio.get(
      ApiEndpoints.baseUrl + endpoint,
      options: Options(headers: headers),
      queryParameters: queryParameters,
    );
  }

  Future<Response> post(
    String endpoint, {
    Map<String, dynamic>? data,
    String? token,
    String? baseUrl,
  }) async {
    final Map<String, dynamic> headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    return await DioClient.dio.post(
      (baseUrl ?? ApiEndpoints.baseUrl) + endpoint,
      data: data,
      options: Options(headers: headers),
    );
  }

  Future<Response> patch(
    String endpoint, {
    Map<String, dynamic>? data,
    String? token,
  }) async {
    final Map<String, dynamic> headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    return await DioClient.dio.patch(
      ApiEndpoints.baseUrl + endpoint,
      data: data,
      options: Options(headers: headers),
    );
  }

  Future<Response> delete(
    String endpoint, {
    String? token,
    String? baseUrl,
    Map<String, dynamic>? data,
  }) async {
    final Map<String, dynamic> headers = {'Content-Type': 'application/json'};
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    return await DioClient.dio.delete(
      (baseUrl ?? ApiEndpoints.baseUrl) + endpoint,
      data: data,
      options: Options(headers: headers),
    );
  }
}
