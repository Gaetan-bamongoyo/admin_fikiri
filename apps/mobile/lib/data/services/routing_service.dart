import 'package:dio/dio.dart';
import 'package:latlong2/latlong.dart';

import '../../features/maps/models/route_request.dart';
import '../../features/maps/models/route_response.dart';
import '../network/api_client.dart';
import '../network/api_endpoints.dart';
import 'routing_exception.dart';

class RoutingService {
  final ApiClient _apiClient;

  RoutingService({ApiClient? apiClient})
    : _apiClient = apiClient ?? ApiClient();

  Future<RouteResponse> getRoute(LatLng start, LatLng end) async {
    try {
      final response = await _apiClient.post(
        ApiEndpoints.routingCompute,
        baseUrl: ApiEndpoints.pythonBaseUrl,
        data: RouteRequest(start: start, end: end).toJson(),
      );

      if (response.statusCode == 200 && response.data != null) {
        final route = RouteResponse.fromJson(
          response.data as Map<String, dynamic>,
        );

        if (route.polylinePoints.isEmpty) {
          throw const RoutingException(0, 'empty_polyline');
        }

        return route;
      }

      throw RoutingException(
        response.statusCode ?? 0,
        _extractDetail(response.data),
      );
    } on RoutingException {
      rethrow;
    } on DioException catch (e) {
      throw RoutingException(
        e.response?.statusCode ?? 0,
        _extractDetail(e.response?.data),
      );
    }
  }

  String? _extractDetail(dynamic data) {
    if (data is Map<String, dynamic>) {
      final detail = data['detail'];
      if (detail is String) return detail;
      if (detail != null) return detail.toString();
    }
    if (data != null) return data.toString();
    return null;
  }
}
