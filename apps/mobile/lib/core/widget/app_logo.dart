import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'app_gap.dart';

class AppLogo extends StatelessWidget {
  final double size;
  final bool showText;
  final String? title;
  final String? subtitle;

  const AppLogo({
    super.key,
    this.size = 120,
    this.showText = true,
    this.title = 'Fikiri Traffic',
    this.subtitle,
  });

  @override
  Widget build(BuildContext context) {
    final logoCard = Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(size * 0.24),
        color: const Color(0xFF0D2B5E), // Dark navy blue
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0D2B5E).withValues(alpha: 0.35),
            blurRadius: 18,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Center(
        child: Icon(
          Icons.directions_car_outlined,
          color: Colors.white,
          size: size * 0.52,
        ),
      ),
    );

    if (!showText) return logoCard;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        logoCard,
        const VGap.xl(),
        Text(
          title ?? '',
          style: AppTypography.heading1.copyWith(
            color: AppColors.primary,
            fontWeight: FontWeight.bold,
          ),
          textAlign: TextAlign.center,
        ),
        if (subtitle != null) ...[
          const VGap.sm(),
          Text(
            subtitle!,
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}
