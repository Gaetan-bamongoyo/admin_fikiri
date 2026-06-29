import 'package:flutter/material.dart';
import '../theme/app_colors.dart';
import '../theme/app_radius.dart';

enum AppButtonType { primary, secondary, text }

enum AppIconPosition { prefix, suffix }

class AppButton extends StatelessWidget {
  final String text;
  final VoidCallback? onPressed;
  final bool isLoading;
  final IconData? icon;
  final AppButtonType type;
  final AppIconPosition iconPosition;
  final double? width;
  final double height;
  final Color? backgroundColor;
  final Color? textColor;
  final Color? borderColor;
  final double? borderRadius;

  const AppButton({
    super.key,
    required this.text,
    required this.onPressed,
    this.isLoading = false,
    this.icon,
    this.type = AppButtonType.primary,
    this.iconPosition = AppIconPosition.prefix,
    this.width = double.infinity,
    this.height = 52,
    this.backgroundColor,
    this.textColor,
    this.borderColor,
    this.borderRadius,
  });

  @override
  Widget build(BuildContext context) {
    // For text buttons, we default to no fixed width unless specified
    final effectiveWidth = type == AppButtonType.text
        ? (width == double.infinity ? null : width)
        : width;

    return SizedBox(
      height: type == AppButtonType.text ? null : height,
      width: effectiveWidth,
      child: _buildButton(context),
    );
  }

  Widget _buildButton(BuildContext context) {
    final Widget childWidget = _buildContent();

    switch (type) {
      case AppButtonType.primary:
        return ElevatedButton(
          onPressed: (isLoading || onPressed == null) ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: backgroundColor ?? AppColors.primary,
            foregroundColor: textColor ?? Colors.white,
            disabledBackgroundColor: (backgroundColor ?? AppColors.primary)
                .withValues(alpha: 0.6),
            disabledForegroundColor: Colors.white.withValues(alpha: 0.8),
            elevation: 2,
            shadowColor: (backgroundColor ?? AppColors.primary).withValues(
              alpha: 0.3,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(
                borderRadius ?? AppRadius.button,
              ),
            ),
          ),
          child: childWidget,
        );
      case AppButtonType.secondary:
        return OutlinedButton(
          onPressed: (isLoading || onPressed == null) ? null : onPressed,
          style: OutlinedButton.styleFrom(
            backgroundColor:
                backgroundColor ?? AppColors.primary.withValues(alpha: 0.06),
            foregroundColor: textColor ?? AppColors.primary,
            disabledForegroundColor: AppColors.primary.withValues(alpha: 0.4),
            side: BorderSide(
              color: borderColor ?? AppColors.primary.withValues(alpha: 0.2),
              width: 1.2,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(
                borderRadius ?? AppRadius.button,
              ),
            ),
          ),
          child: childWidget,
        );
      case AppButtonType.text:
        return TextButton(
          onPressed: (isLoading || onPressed == null) ? null : onPressed,
          style: TextButton.styleFrom(
            foregroundColor: textColor ?? AppColors.primary,
            disabledForegroundColor: AppColors.textSecondary.withValues(
              alpha: 0.5,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            minimumSize: Size.zero,
            tapTargetSize: MaterialTapTargetSize.shrinkWrap,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(borderRadius ?? 6),
            ),
          ),
          child: childWidget,
        );
    }
  }

  Widget _buildContent() {
    if (isLoading) {
      return SizedBox(
        width: 20,
        height: 20,
        child: CircularProgressIndicator(
          strokeWidth: 2,
          valueColor: AlwaysStoppedAnimation<Color>(
            type == AppButtonType.primary ? Colors.white : AppColors.primary,
          ),
        ),
      );
    }

    final Color color =
        textColor ??
        (type == AppButtonType.primary ? Colors.white : AppColors.primary);
    final iconWidget = icon != null
        ? Icon(
            icon,
            size: 20,
            color: onPressed == null ? color.withValues(alpha: 0.5) : color,
          )
        : null;

    final textWidget = Text(
      text,
      style: TextStyle(
        fontWeight: type == AppButtonType.text
            ? FontWeight.w500
            : FontWeight.w600,
        fontSize: type == AppButtonType.text ? 14 : 16,
      ),
    );

    return Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (iconWidget != null && iconPosition == AppIconPosition.prefix) ...[
          iconWidget,
          const SizedBox(width: 8),
        ],
        textWidget,
        if (iconWidget != null && iconPosition == AppIconPosition.suffix) ...[
          const SizedBox(width: 8),
          iconWidget,
        ],
      ],
    );
  }
}
