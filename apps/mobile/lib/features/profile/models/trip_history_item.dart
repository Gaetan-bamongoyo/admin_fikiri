class TripHistoryItem {
  final String id;
  final String origin;
  final String destination;
  final DateTime date;
  final double distanceKm;
  final int durationMinutes;
  final int pointsEarned;
  final String trafficLevel;

  const TripHistoryItem({
    required this.id,
    required this.origin,
    required this.destination,
    required this.date,
    required this.distanceKm,
    required this.durationMinutes,
    required this.pointsEarned,
    required this.trafficLevel,
  });
}
