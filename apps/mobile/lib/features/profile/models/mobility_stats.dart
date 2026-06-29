class MobilityStats {
  final int totalTrips;
  final double totalDistanceKm;
  final int totalTimeSavedMinutes;
  final int incidentsReported;
  final double avgTripDistanceKm;

  const MobilityStats({
    required this.totalTrips,
    required this.totalDistanceKm,
    required this.totalTimeSavedMinutes,
    required this.incidentsReported,
    required this.avgTripDistanceKm,
  });
}
