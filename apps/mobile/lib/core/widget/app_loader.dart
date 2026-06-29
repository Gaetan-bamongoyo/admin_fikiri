import 'package:flutter/material.dart';
import '../theme/app_colors.dart';

class AppLoader extends StatelessWidget {
  final double size;
  final Color color;
  final bool isCentered;

  const AppLoader({
    super.key,
    this.size = 36.0,
    this.color = AppColors.primary,
    this.isCentered = true,
  });

  @override
  Widget build(BuildContext context) {
    final loader = SizedBox(
      width: size,
      height: size,
      child: CircularProgressIndicator(
        strokeWidth: 3.0,
        valueColor: AlwaysStoppedAnimation<Color>(color),
      ),
    );

    if (isCentered) {
      return Center(child: loader);
    }
    return loader;
  }
}
