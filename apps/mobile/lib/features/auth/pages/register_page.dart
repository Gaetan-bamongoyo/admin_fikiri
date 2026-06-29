import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '../../../core/widget/app_button.dart';
import '../../../core/widget/app_constants.dart';
import '../../../core/widget/app_gap.dart';
import '../../../core/widget/app_input.dart';
import '../../../core/widget/app_logo.dart';
import '../cubit/auth_cubit.dart';
import '../cubit/auth_state.dart';
import '/routes/app_routes.dart';

class RegisterPage extends StatefulWidget {
  const RegisterPage({super.key});

  @override
  State<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends State<RegisterPage> {
  final _formKey = GlobalKey<FormState>();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _register() {
    if (!_formKey.currentState!.validate()) return;

    context.read<AuthCubit>().register(
      email: _emailController.text,
      password: _passwordController.text,
      firstName: _firstNameController.text,
      lastName: _lastNameController.text,
      phone: _phoneController.text,
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      appBar: AppBar(
        backgroundColor: AppColors.background,
        elevation: 0,
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const AppLogo(
                size: 64,
                showText: true,
                subtitle: 'Créez votre compte Fikiri',
              ),
              const VGap.xl(),
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: AppInput(
                            controller: _firstNameController,
                            label: 'Prénom',
                            hint: 'Jean',
                            textInputAction: TextInputAction.next,
                          ),
                        ),
                        const HGap.sm(),
                        Expanded(
                          child: AppInput(
                            controller: _lastNameController,
                            label: 'Nom',
                            hint: 'Kabila',
                            textInputAction: TextInputAction.next,
                          ),
                        ),
                      ],
                    ),
                    const VGap.md(),
                    AppInput(
                      controller: _emailController,
                      label: 'Email',
                      hint: 'exemple@email.com',
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.trim().isEmpty) {
                          return 'Veuillez saisir votre email';
                        }
                        if (!value.contains('@') || !value.contains('.')) {
                          return 'Email invalide';
                        }
                        return null;
                      },
                    ),
                    const VGap.md(),
                    AppInput(
                      controller: _phoneController,
                      label: 'Téléphone (optionnel)',
                      hint: '+243900000000',
                      keyboardType: TextInputType.phone,
                      textInputAction: TextInputAction.next,
                    ),
                    const VGap.md(),
                    AppInput(
                      controller: _passwordController,
                      label: 'Mot de passe',
                      hint: 'Minimum 8 caractères',
                      isPassword: true,
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Veuillez saisir un mot de passe';
                        }
                        if (value.length < 8) {
                          return 'Le mot de passe doit contenir au moins 8 caractères';
                        }
                        return null;
                      },
                    ),
                    const VGap.md(),
                    AppInput(
                      controller: _confirmPasswordController,
                      label: 'Confirmer le mot de passe',
                      hint: '••••••••',
                      isPassword: true,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _register(),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Veuillez confirmer votre mot de passe';
                        }
                        if (value != _passwordController.text) {
                          return 'Les mots de passe ne correspondent pas';
                        }
                        return null;
                      },
                    ),
                    const VGap.lg(),
                    BlocConsumer<AuthCubit, AuthState>(
                      listener: (context, state) {
                        if (state is AuthError) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(state.message),
                              backgroundColor: AppColors.danger,
                            ),
                          );
                        }

                        if (state is AuthSuccess) {
                          Navigator.pushReplacementNamed(
                            context,
                            AppRoutes.homePage,
                          );
                        }
                      },
                      builder: (context, state) {
                        if (state is AuthLoading) {
                          return const Center(
                            child: CircularProgressIndicator(),
                          );
                        }

                        return AppButton(
                          text: 'Créer mon compte',
                          onPressed: _register,
                        );
                      },
                    ),
                    const VGap.xl(),
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Déjà un compte ? ',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          AppButton(
                            text: 'Se connecter',
                            type: AppButtonType.text,
                            onPressed: () {
                              Navigator.pop(context);
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
