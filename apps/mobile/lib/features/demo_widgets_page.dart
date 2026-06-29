import 'package:flutter/material.dart';
import '../core/theme/app_colors.dart';
import '../core/theme/app_typography.dart';
import '../core/widget/app_button.dart';
import '../core/widget/app_gap.dart';
import '../core/widget/app_input.dart';
import '../core/widget/app_logo.dart';
import '../core/widget/app_loader.dart';
import '../core/widget/app_error.dart';
import '../core/widget/app_empty.dart';

class DemoWidgetsPage extends StatefulWidget {
  const DemoWidgetsPage({super.key});

  @override
  State<DemoWidgetsPage> createState() => _DemoWidgetsPageState();
}

class _DemoWidgetsPageState extends State<DemoWidgetsPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Fikiri Traffic Components')),
      body: _buildWidgetGalleryTab(),
    );
  }

  Widget _buildWidgetGalleryTab() {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildSectionTitle('AppLogo (Variantes)'),
          const VGap.md(),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              AppLogo(size: 70, showText: false),
              AppLogo(size: 90, title: 'Fikiri Mini', showText: true),
            ],
          ),
          const VGap.xl(),

          _buildSectionTitle('AppButton (Styles)'),
          const VGap.md(),
          AppButton(text: 'Bouton Principal', onPressed: () {}),
          const VGap.md(),
          AppButton(
            text: 'Bouton Principal avec Icône',
            icon: Icons.send_rounded,
            onPressed: () {},
          ),
          const VGap.md(),
          AppButton(
            text: 'Bouton Principal (Chargement)',
            isLoading: true,
            onPressed: () {},
          ),
          const VGap.md(),
          AppButton(
            text: 'Bouton Secondaire',
            type: AppButtonType.secondary,
            onPressed: () {},
          ),
          const VGap.md(),
          AppButton(
            text: 'Bouton Secondaire avec Icône',
            type: AppButtonType.secondary,
            icon: Icons.download_rounded,
            onPressed: () {},
          ),
          const VGap.md(),
          Center(
            child: AppButton(
              text: 'Bouton Lien / Texte',
              type: AppButtonType.text,
              onPressed: () {},
            ),
          ),
          const VGap.xl(),

          _buildSectionTitle('AppInput (Champs de saisie)'),
          const VGap.md(),
          AppInput(
            controller: TextEditingController(),
            hint: 'Champ texte simple',
          ),
          const VGap.md(),
          AppInput(
            controller: TextEditingController(),
            label: 'Avec Libellé et Icône',
            hint: 'Saisir du texte...',
            prefixIcon: const Icon(
              Icons.search_rounded,
              color: AppColors.textSecondary,
            ),
          ),
          const VGap.md(),
          AppInput(
            controller: TextEditingController(),
            label: 'Mode Mot de passe intelligent (gère son propre état)',
            hint: 'Saisir mot de passe...',
            isPassword: true,
          ),
          const VGap.xl(),

          _buildSectionTitle('AppLoader (Chargement)'),
          const VGap.md(),
          const Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              AppLoader(size: 24, isCentered: false),
              AppLoader(
                size: 40,
                isCentered: false,
                color: AppColors.secondary,
              ),
              AppLoader(size: 56, isCentered: false, color: AppColors.success),
            ],
          ),
          const VGap.xl(),

          _buildSectionTitle('AppEmpty (État Vide)'),
          const VGap.md(),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const AppEmpty(
              title: 'Aucun signalement',
              message:
                  'Tous les feux de signalisation de la zone fonctionnent correctement.',
              icon: Icons.traffic_outlined,
            ),
          ),
          const VGap.xl(),

          _buildSectionTitle('AppError (État d\'Erreur)'),
          const VGap.md(),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.border),
              borderRadius: BorderRadius.circular(12),
            ),
            child: AppError(
              message:
                  'Connexion réseau perdue. Veuillez vérifier votre Wi-Fi ou vos données mobiles.',
              onRetry: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Nouvelle tentative...')),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: AppTypography.heading2.copyWith(
            color: AppColors.textPrimary,
            fontWeight: FontWeight.bold,
          ),
        ),
        const VGap.xs(),
        Container(
          width: 40,
          height: 3,
          decoration: BoxDecoration(
            color: AppColors.primary,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
      ],
    );
  }
}
