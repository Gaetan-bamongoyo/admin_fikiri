import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../core/widget/app_button.dart';
import '../../../core/widget/app_constants.dart';
import '../../../core/widget/app_gap.dart';
import '../../../core/widget/app_input.dart';
import '../../../core/widget/app_logo.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_typography.dart';
import '/features/auth/cubit/auth_cubit.dart';
import '/features/auth/cubit/auth_state.dart';
import '/routes/app_routes.dart';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _stayAnonymous = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  void _login() {
    if (_formKey.currentState!.validate()) {
      Navigator.pushReplacementNamed(context, AppRoutes.homePage);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.background,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppConstants.defaultPadding),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              const VGap.xxxl(),

              // Logo + titre + sous-titre
              const AppLogo(
                size: 72,
                showText: true,
                subtitle: 'Connectez-vous pour continuer',
              ),

              const VGap.xxxl(),

              // Formulaire
              Form(
                key: _formKey,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Champ Email
                    AppInput(
                      controller: _emailController,
                      label: 'Email',
                      hint: 'exemple@email.com',
                      keyboardType: TextInputType.emailAddress,
                      textInputAction: TextInputAction.next,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Veuillez saisir votre email';
                        }
                        return null;
                      },
                    ),

                    const VGap.md(),

                    // Champ Mot de passe
                    AppInput(
                      controller: _passwordController,
                      label: 'Mot de passe',
                      hint: '••••••••',
                      isPassword: true,
                      textInputAction: TextInputAction.done,
                      onFieldSubmitted: (_) => _login(),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Veuillez saisir votre mot de passe';
                        }
                        return null;
                      },
                    ),
                    const VGap.md(),

                    // Checkbox + label "Rester anonyme"
                    InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: () {
                        setState(() {
                          _stayAnonymous = !_stayAnonymous;
                        });
                      },
                      child: Row(
                        children: [
                          Checkbox(
                            value: _stayAnonymous,
                            activeColor: AppColors.primary,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(4),
                            ),
                            onChanged: (value) {
                              setState(() {
                                _stayAnonymous = value ?? false;
                              });
                            },
                          ),
                          Text(
                            'Continuer en mode anonyme',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                    ),

                    const VGap.sm(),

                    // Mot de passe oublié
                    Align(
                      alignment: Alignment.centerRight,
                      child: AppButton(
                        text: 'Mot de passe oublié ?',
                        type: AppButtonType.text,
                        onPressed: () {},
                      ),
                    ),

                    const VGap.md(),

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
                          text: 'Se connecter',
                          onPressed: () {
                            // _login();
                            if (_formKey.currentState!.validate()) {
                              context.read<AuthCubit>().login(
                                email: _emailController.text,
                                password: _passwordController.text,
                              );
                            }
                          },
                        );
                      },
                    ),
                    const VGap.xl(),

                    // Lien créer un compte
                    Center(
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Pas encore de compte ? ',
                            style: AppTypography.bodySmall.copyWith(
                              color: AppColors.textSecondary,
                            ),
                          ),
                          AppButton(
                            text: 'Créer un compte',
                            type: AppButtonType.text,
                            onPressed: () {
                              Navigator.pushNamed(
                                context,
                                AppRoutes.registerPage,
                              );
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
