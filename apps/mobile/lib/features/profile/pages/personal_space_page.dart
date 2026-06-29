import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../data/local/shared_preferences_service.dart';
import '../data/profile_mock_data.dart';
import '../widgets/loyalty_points_card.dart';
import '../widgets/mobility_stats_grid.dart';
import '../widgets/profile_header.dart';
import '../widgets/trip_history_list.dart';

class PersonalSpacePage extends StatefulWidget {
  const PersonalSpacePage({super.key});

  @override
  State<PersonalSpacePage> createState() => _PersonalSpacePageState();
}

class _PersonalSpacePageState extends State<PersonalSpacePage> {
  String _fullName = 'Utilisateur Fikiri';
  String _email = 'contact@fikiri-traffic.cd';
  int _loyaltyPoints = ProfileMockData.loyaltyPoints;

  @override
  void initState() {
    super.initState();
    _loadUser();
  }

  Future<void> _loadUser() async {
    final user = await SharedPreferencesService.getUser();
    if (!mounted || user == null) return;

    setState(() {
      final firstName = user['firstName'] as String? ?? '';
      final lastName = user['lastName'] as String? ?? '';
      _fullName = '$firstName $lastName'.trim();
      if (_fullName.isEmpty) _fullName = 'Utilisateur Fikiri';
      _email = user['email'] as String? ?? _email;
      _loyaltyPoints =
          user['loyaltyPoints'] as int? ?? ProfileMockData.loyaltyPoints;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: CustomScrollView(
        slivers: [
          SliverToBoxAdapter(
            child: ProfileHeader(
              fullName: _fullName,
              email: _email,
              loyaltyPoints: _loyaltyPoints,
            ),
          ),
          SliverPadding(
            padding: const EdgeInsets.fromLTRB(20, 20, 20, 32),
            sliver: SliverList(
              delegate: SliverChildListDelegate([
                LoyaltyPointsCard(
                  points: _loyaltyPoints,
                  pointsToNextTier: ProfileMockData.pointsToNextTier,
                  tier: ProfileMockData.loyaltyTier,
                ),
                const SizedBox(height: 24),
                const MobilityStatsGrid(stats: ProfileMockData.stats),
                const SizedBox(height: 28),
                TripHistoryList(trips: ProfileMockData.tripHistory),
              ]),
            ),
          ),
        ],
      ),
    );
  }
}
