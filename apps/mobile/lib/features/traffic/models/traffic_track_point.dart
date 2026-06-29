class TrafficTrackPoint {
  final double latitude;
  final double longitude;
  final double? speedMs;
  final DateTime recordedAt;

  const TrafficTrackPoint({
    required this.latitude,
    required this.longitude,
    required this.recordedAt,
    this.speedMs,
  });

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
    if (speedMs != null && speedMs!.isFinite && speedMs! >= 0)
      'speedMs': speedMs,
    'recordedAt': recordedAt.toUtc().toIso8601String(),
  };
}
