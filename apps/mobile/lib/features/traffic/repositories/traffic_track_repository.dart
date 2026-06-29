import 'package:flutter/foundation.dart';

import '../../../data/local/secure_storage.dart';
import '../../../data/network/api_client.dart';
import '../../../data/network/api_endpoints.dart';
import '../models/traffic_track_point.dart';

class TrafficTrackRepository {
  Future<void> uploadTrack({
    required List<TrafficTrackPoint> points,
    DateTime? startedAt,
    DateTime? endedAt,
  }) async {
    if (points.length < 2) return;

    final token = await SecureStorage.getAccessToken();
    if (token == null || token.isEmpty) return;

    try {
      await ApiClient().post(
        ApiEndpoints.trafficTracks,
        data: {
          'points': points.map((point) => point.toJson()).toList(),
          if (startedAt != null)
            'startedAt': startedAt.toUtc().toIso8601String(),
          if (endedAt != null) 'endedAt': endedAt.toUtc().toIso8601String(),
        },
        token: token,
      );
    } catch (error) {
      debugPrint('Échec envoi tracé GPS passif: $error');
    }
  }
}
