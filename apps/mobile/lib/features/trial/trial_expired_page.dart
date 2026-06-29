import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

import '../../core/theme/app_colors.dart';
import '../../core/theme/app_typography.dart';
import '../../core/widget/app_gap.dart';
import '../../core/widget/app_logo.dart';

class TrialExpiredPage extends StatelessWidget {
  const TrialExpiredPage({super.key});

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
      child: AnnotatedRegion<SystemUiOverlayStyle>(
        value: SystemUiOverlayStyle.dark,
        child: Scaffold(
          backgroundColor: AppColors.background,
          body: SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const AppLogo(
                    size: 72,
                    showText: true,
                    subtitle: 'Version test expirée',
                  ),
                  const VGap.xxxl(),
                  Icon(
                    Icons.lock_clock_outlined,
                    size: 56,
                    color: AppColors.primary.withValues(alpha: 0.85),
                  ),
                  const VGap.xl(),
                  const Text(
                    'Période de test terminée',
                    style: AppTypography.heading2,
                    textAlign: TextAlign.center,
                  ),
                  const VGap.md(),
                  Text(
                    'Cette version de l\'application était limitée à 4 jours '
                    'après la première installation.\n\n'
                    'Contactez l\'équipe FIKIRI pour obtenir une nouvelle version.',
                    style: AppTypography.body.copyWith(
                      color: AppColors.textSecondary,
                      height: 1.5,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
