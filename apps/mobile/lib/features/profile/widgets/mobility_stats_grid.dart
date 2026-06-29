import 'package:flutter/material.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_typography.dart';
import '../models/mobility_stats.dart';

class MobilityStatsGrid extends StatelessWidget {
  final MobilityStats stats;

  const MobilityStatsGrid({super.key, required this.stats});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Statistiques de mobilité', style: AppTypography.heading3),
        const SizedBox(height: 12),
        GridView.count(
          crossAxisCount: 2,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 12,
          crossAxisSpacing: 12,
          childAspectRatio: 1.45,
          children: [
            _StatTile(
              icon: Icons.route_rounded,
              label: 'Trajets',
              value: '${stats.totalTrips}',
              color: AppColors.primary,
            ),
            _StatTile(
              icon: Icons.straighten_rounded,
              label: 'Distance',
              value: '${stats.totalDistanceKm.toStringAsFixed(0)} km',
              color: AppColors.secondary,
            ),
            _StatTile(
              icon: Icons.timer_outlined,
              label: 'Temps gagné',
              value: '${stats.totalTimeSavedMinutes} min',
              color: AppColors.success,
            ),
            _StatTile(
              icon: Icons.report_outlined,
              label: 'Signalements',
              value: '${stats.incidentsReported}',
              color: AppColors.warning,
            ),
          ],
        ),
      ],
    );
  }
}

class _StatTile extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _StatTile({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(AppRadius.card),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withValues(alpha: 0.12),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: color, size: 22),
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                value,
                style: AppTypography.heading3.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(label, style: AppTypography.caption),
            ],
          ),
        ],
      ),
    );
  }
}
