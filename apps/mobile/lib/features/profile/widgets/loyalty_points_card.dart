import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_typography.dart';

class LoyaltyPointsCard extends StatelessWidget {
  final int points;
  final int pointsToNextTier;
  final String tier;

  const LoyaltyPointsCard({
    super.key,
    required this.points,
    required this.pointsToNextTier,
    required this.tier,
  });

  @override
  Widget build(BuildContext context) {
    final progress = (points / pointsToNextTier).clamp(0.0, 1.0);
    final remaining = (pointsToNextTier - points).clamp(0, pointsToNextTier);

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF1E293B), Color(0xFF334155)],
        ),
        borderRadius: BorderRadius.circular(AppRadius.card),
        boxShadow: [
          BoxShadow(
            color: AppColors.primary.withValues(alpha: 0.15),
            blurRadius: 16,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(
                  Icons.stars_rounded,
                  color: AppColors.warning,
                  size: 28,
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'FIKIRI Loyalty',
                      style: AppTypography.caption.copyWith(
                        color: Colors.white70,
                        letterSpacing: 0.5,
                      ),
                    ),
                    Text(
                      tier,
                      style: AppTypography.heading3.copyWith(
                        color: Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
              ),
              Text(
                '$points',
                style: AppTypography.heading1.copyWith(
                  color: AppColors.warning,
                  fontSize: 32,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: progress,
              minHeight: 8,
              backgroundColor: Colors.white.withValues(alpha: 0.15),
              valueColor: const AlwaysStoppedAnimation<Color>(
                AppColors.warning,
              ),
            ),
          ),
          const SizedBox(height: 10),
          Text(
            remaining > 0
                ? '$remaining pts pour le niveau suivant'
                : 'Niveau maximum atteint',
            style: AppTypography.caption.copyWith(color: Colors.white60),
          ),
        ],
      ),
    );
  }
}
