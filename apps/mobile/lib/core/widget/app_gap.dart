import 'package:flutter/material.dart';
import '../theme/app_spacing.dart';

class VGap extends StatelessWidget {
  final double height;

  const VGap(this.height, {super.key});

  const VGap.xs({super.key}) : height = AppSpacing.xs;
  const VGap.sm({super.key}) : height = AppSpacing.sm;
  const VGap.md({super.key}) : height = AppSpacing.md;
  const VGap.lg({super.key}) : height = AppSpacing.lg;
  const VGap.xl({super.key}) : height = AppSpacing.xl;
  const VGap.xxl({super.key}) : height = AppSpacing.xxl;
  const VGap.xxxl({super.key}) : height = AppSpacing.xxxl;
  const VGap.huge({super.key}) : height = AppSpacing.huge;
  const VGap.giant({super.key}) : height = AppSpacing.giant;

  @override
  Widget build(BuildContext context) {
    return SizedBox(height: height);
  }
}

class HGap extends StatelessWidget {
  final double width;

  const HGap(this.width, {super.key});

  const HGap.xs({super.key}) : width = AppSpacing.xs;
  const HGap.sm({super.key}) : width = AppSpacing.sm;
  const HGap.md({super.key}) : width = AppSpacing.md;
  const HGap.lg({super.key}) : width = AppSpacing.lg;
  const HGap.xl({super.key}) : width = AppSpacing.xl;
  const HGap.xxl({super.key}) : width = AppSpacing.xxl;
  const HGap.xxxl({super.key}) : width = AppSpacing.xxxl;
  const HGap.huge({super.key}) : width = AppSpacing.huge;
  const HGap.giant({super.key}) : width = AppSpacing.giant;

  @override
  Widget build(BuildContext context) {
    return SizedBox(width: width);
  }
}
