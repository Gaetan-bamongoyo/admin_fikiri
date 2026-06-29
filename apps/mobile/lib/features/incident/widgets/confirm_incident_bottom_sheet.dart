import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../cubit/incident_cubit.dart';
import '../cubit/incident_state.dart';

class ConfirmIncidentDialog extends StatelessWidget {
  final dynamic incident;
  final Map<String, dynamic> style;

  const ConfirmIncidentDialog({
    super.key,
    required this.incident,
    required this.style,
  });

  static Future<void> show(
    BuildContext context,
    dynamic incident,
    Map<String, dynamic> style,
  ) {
    return showDialog<void>(
      context: context,
      barrierDismissible: true,
      builder: (_) => BlocProvider.value(
        value: context.read<IncidentCubit>(),
        child: ConfirmIncidentDialog(incident: incident, style: style),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final Color typeColor = style['color'] as Color;
    final IconData typeIcon = style['icon'] as IconData;

    return BlocListener<IncidentCubit, IncidentState>(
      listenWhen: (previous, current) =>
          current is IncidentError ||
          (previous is IncidentLoading &&
              current is IncidentListed &&
              current.feedbackMessage != null),
      listener: (context, state) {
        final cubit = context.read<IncidentCubit>();

        if (state is IncidentError) {
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(state.message),
              backgroundColor: AppColors.danger,
            ),
          );
          cubit.clearFeedback();
          return;
        }

        if (state is IncidentListed && state.feedbackMessage != null) {
          final message = state.feedbackMessage!;
          Navigator.of(context).pop();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(message),
              backgroundColor: AppColors.success,
            ),
          );
          cubit.clearFeedback();
        }
      },
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        backgroundColor: AppColors.surface,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(24, 28, 24, 20),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Icône de l'incident
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: typeColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                  border: Border.all(color: typeColor, width: 2),
                ),
                child: Icon(typeIcon, color: typeColor, size: 32),
              ),
              const SizedBox(height: 16),

              // Type d'incident
              Text(
                incident.type.toString().toUpperCase(),
                style: AppTypography.heading3.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              // Description
              Text(
                incident.description ?? 'Aucune précision fournie.',
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),

              // Sous-texte
              Text(
                'Cet incident est-il toujours présent ?',
                style: AppTypography.bodySmall.copyWith(
                  color: AppColors.textSecondary,
                  fontStyle: FontStyle.italic,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),

              // Boutons
              BlocBuilder<IncidentCubit, IncidentState>(
                builder: (context, state) {
                  if (state is IncidentLoading) {
                    return const Center(child: CircularProgressIndicator());
                  }
                  return Row(
                    children: [
                      // Bouton Non
                      Expanded(
                        child: OutlinedButton(
                          style: OutlinedButton.styleFrom(
                            side: const BorderSide(color: AppColors.border),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                          ),
                          onPressed: () {
                            context.read<IncidentCubit>().confirmIncident(
                              incident.id.toString(),
                              isConfirm: false,
                            );
                          },
                          child: Text(
                            'Non',
                            style: AppTypography.bodySmall.copyWith(
                              fontWeight: FontWeight.w600,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      // Bouton Confirmer
                      Expanded(
                        child: ElevatedButton(
                          style: ElevatedButton.styleFrom(
                            backgroundColor: typeColor,
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            padding: const EdgeInsets.symmetric(vertical: 14),
                            elevation: 0,
                          ),
                          onPressed: () {
                            context.read<IncidentCubit>().confirmIncident(
                              incident.id.toString(),
                              isConfirm: true,
                            );
                          },
                          child: Text(
                            'Confirmer',
                            style: AppTypography.bodySmall.copyWith(
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    ],
                  );
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
