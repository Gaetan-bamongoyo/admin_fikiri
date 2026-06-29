import '../models/mobility_stats.dart';
import '../models/trip_history_item.dart';

class ProfileMockData {
  ProfileMockData._();

  static const int loyaltyPoints = 1240;
  static const int pointsToNextTier = 1500;
  static const String loyaltyTier = 'Explorateur';

  static const MobilityStats stats = MobilityStats(
    totalTrips: 47,
    totalDistanceKm: 312.5,
    totalTimeSavedMinutes: 186,
    incidentsReported: 8,
    avgTripDistanceKm: 6.6,
  );

  static final List<TripHistoryItem> tripHistory = [
    TripHistoryItem(
      id: '1',
      origin: 'Ma position',
      destination: 'Mon Bureau / ISP',
      date: DateTime(2026, 6, 18, 8, 15),
      distanceKm: 4.2,
      durationMinutes: 18,
      pointsEarned: 25,
      trafficLevel: 'modéré',
    ),
    TripHistoryItem(
      id: '2',
      origin: 'Ma position',
      destination: 'Résistance, Gombe',
      date: DateTime(2026, 6, 17, 17, 40),
      distanceKm: 7.8,
      durationMinutes: 32,
      pointsEarned: 35,
      trafficLevel: 'dense',
    ),
    TripHistoryItem(
      id: '3',
      origin: 'Ma position',
      destination: 'Paroisse Sainte Anne',
      date: DateTime(2026, 6, 16, 9, 0),
      distanceKm: 3.1,
      durationMinutes: 14,
      pointsEarned: 20,
      trafficLevel: 'fluide',
    ),
    TripHistoryItem(
      id: '4',
      origin: 'Ma position',
      destination: 'Marché Central',
      date: DateTime(2026, 6, 15, 12, 30),
      distanceKm: 5.5,
      durationMinutes: 22,
      pointsEarned: 30,
      trafficLevel: 'modéré',
    ),
    TripHistoryItem(
      id: '5',
      origin: 'Ma position',
      destination: 'Aéroport N\'djili',
      date: DateTime(2026, 6, 12, 6, 45),
      distanceKm: 18.3,
      durationMinutes: 55,
      pointsEarned: 50,
      trafficLevel: 'dense',
    ),
  ];
}
