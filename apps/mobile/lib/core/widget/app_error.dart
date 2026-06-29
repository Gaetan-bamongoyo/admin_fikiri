import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_typography.dart';
import 'app_button.dart';
import 'app_gap.dart';

class AppError extends StatelessWidget {
  final String message;
  final VoidCallback? onRetry;
  final String retryText;
  final IconData icon;

  const AppError({
    super.key,
    required this.message,
    this.onRetry,
    this.retryText = 'Réessayer',
    this.icon = Icons.error_outline_rounded,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          mainAxisAlignment: MainAxisAlignment.center,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: AppColors.danger.withValues(alpha: 0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: AppColors.danger, size: 40),
            ),
            const VGap.lg(),
            Text(
              'Oups ! Une erreur est survenue',
              style: AppTypography.heading3.copyWith(
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const VGap.sm(),
            Text(
              message,
              style: AppTypography.bodySmall.copyWith(
                color: AppColors.textSecondary,
              ),
              textAlign: TextAlign.center,
            ),
            if (onRetry != null) ...[
              const VGap.xl(),
              AppButton(
                text: retryText,
                onPressed: onRetry,
                type: AppButtonType.secondary,
                icon: Icons.replay_rounded,
                width: 160,
                height: 44,
                backgroundColor: AppColors.danger.withValues(alpha: 0.05),
                textColor: AppColors.danger,
                borderColor: AppColors.danger.withValues(alpha: 0.2),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
