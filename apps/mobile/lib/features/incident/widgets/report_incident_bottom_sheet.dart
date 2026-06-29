import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_radius.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widget/app_button.dart';
import '../../../core/widget/app_gap.dart';
import '../../../core/widget/app_input.dart';
import '../cubit/incident_cubit.dart';
import '../cubit/incident_state.dart';
import '../../maps/cubit/map_cubit.dart';

class ReportIncidentBottomSheet extends StatefulWidget {
  /// Latitude de la position actuelle de l'utilisateur.
  final double latitude;

  /// Longitude de la position actuelle de l'utilisateur.
  final double longitude;

  const ReportIncidentBottomSheet({
    super.key,
    required this.latitude,
    required this.longitude,
  });

  /// Affiche la BottomSheet de signalement d'incident à la position donnée.
  static void show(BuildContext context, double latitude, double longitude) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => MultiBlocProvider(
        providers: [
          BlocProvider.value(value: context.read<IncidentCubit>()),
          BlocProvider.value(value: context.read<MapCubit>()),
        ],
        child: ReportIncidentBottomSheet(
          latitude: latitude,
          longitude: longitude,
        ),
      ),
    );
  }

  @override
  State<ReportIncidentBottomSheet> createState() =>
      _ReportIncidentBottomSheetState();
}

class _ReportIncidentBottomSheetState extends State<ReportIncidentBottomSheet> {
  String? _selectedType;
  final _descriptionController = TextEditingController();

  static const _types = [
    {
      'id': 'accident',
      'label': 'Accident',
      'color': AppColors.accident,
      'icon': Icons.warning_amber_rounded,
    },
    {
      'id': 'roadwork',
      'label': 'Travaux',
      'color': AppColors.roadWork,
      'icon': Icons.engineering,
    },
    {
      'id': 'checkpoint',
      'label': 'Contrôle Police',
      'color': AppColors.policeControl,
      'icon': Icons.local_police,
    },
    {
      'id': 'congestion',
      'label': 'Bouchon',
      'color': AppColors.trafficBlocked,
      'icon': Icons.traffic,
    },
  ];

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(AppRadius.modal),
        ),
      ),
      padding: EdgeInsets.only(
        left: 20,
        right: 20,
        top: 20,
        bottom: MediaQuery.of(context).viewInsets.bottom + 20,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // En-tête
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                "Signaler un incident",
                style: AppTypography.heading3.copyWith(
                  fontWeight: FontWeight.bold,
                  color: AppColors.textPrimary,
                ),
              ),
              IconButton(
                icon: const Icon(Icons.close),
                onPressed: () => Navigator.pop(context),
              ),
            ],
          ),
          const VGap.md(),
          Text(
            "Quel type de perturbation constatez-vous ?",
            style: AppTypography.bodySmall.copyWith(
              color: AppColors.textSecondary,
            ),
          ),
          const VGap.md(),

          // Grille de types d'incidents
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 2.2,
            ),
            itemCount: _types.length,
            itemBuilder: (context, index) {
              final type = _types[index];
              final isSelected = _selectedType == type['id'];
              final color = type['color'] as Color;

              return InkWell(
                onTap: () =>
                    setState(() => _selectedType = type['id'] as String),
                borderRadius: BorderRadius.circular(AppRadius.card),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  decoration: BoxDecoration(
                    color: isSelected
                        ? color.withValues(alpha: 0.15)
                        : AppColors.surface,
                    borderRadius: BorderRadius.circular(AppRadius.card),
                    border: Border.all(
                      color: isSelected ? color : AppColors.border,
                      width: isSelected ? 2 : 1,
                    ),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(type['icon'] as IconData, color: color, size: 24),
                      const HGap.sm(),
                      Text(
                        type['label'] as String,
                        style: AppTypography.bodySmall.copyWith(
                          fontWeight: isSelected
                              ? FontWeight.bold
                              : FontWeight.w500,
                          color: isSelected
                              ? AppColors.textPrimary
                              : AppColors.textSecondary,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          const VGap.lg(),

          // Champ de description
          AppInput(
            controller: _descriptionController,
            hint: "Ajouter des précisions...",
          ),
          const VGap.lg(),

          // Bouton de soumission
          BlocConsumer<IncidentCubit, IncidentState>(
            listener: (context, state) {
              if (state is IncidentError) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.message),
                    backgroundColor: AppColors.danger,
                  ),
                );
              }
              if (state is IncidentSuccess) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(state.incidents),
                    backgroundColor: AppColors.success,
                  ),
                );
                Navigator.pop(context);
              }
            },
            builder: (context, state) {
              if (state is IncidentLoading) {
                return const Center(child: CircularProgressIndicator());
              }
              return AppButton(
                text: "Signaler",
                onPressed: _selectedType == null
                    ? null
                    : () {
                        final position = context
                            .read<MapCubit>()
                            .state
                            .positionActuelle;
                        context.read<IncidentCubit>().reportIncident(
                          type: _selectedType!,
                          description: _descriptionController.text,
                          latitude: position.latitude,
                          longitude: position.longitude,
                        );
                      },
              );
            },
          ),
        ],
      ),
    );
  }
}
