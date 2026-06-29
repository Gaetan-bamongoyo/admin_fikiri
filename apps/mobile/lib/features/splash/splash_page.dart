import 'package:flutter/material.dart';
import '../../core/widget/app_constants.dart';
import '../../core/widget/app_logo.dart';
import '../../routes/app_routes.dart';

class SplashPage extends StatefulWidget {
  const SplashPage({super.key});

  @override
  State<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends State<SplashPage> {
  @override
  void initState() {
    super.initState();
    Future.delayed(const Duration(seconds: AppConstants.splashDuration), () {
      if (!mounted) return;
      Navigator.pushReplacementNamed(context, AppRoutes.loginPage);
    });
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      body: Center(child: AppLogo(size: 70, showText: false)),
    );
  }
}
