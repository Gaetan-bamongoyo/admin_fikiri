import 'package:flutter/material.dart';
import '../features/settings/pages/planned_trajets_settings_page.dart';
import '../features/settings/pages/general_settings_page.dart';
import '../features/settings/pages/notifications_settings_page.dart';
import '../features/settings/pages/settings_page.dart';
import '../features/profile/pages/personal_space_page.dart';
import '../features/demo_widgets_page.dart';
import '../features/maps/pages/map_page.dart';
import '../features/splash/splash_page.dart';
import '../features/auth/pages/login_page.dart';
import '../features/auth/pages/register_page.dart';
import 'app_routes.dart';

class AppRouter {
  static Route<dynamic> generateRoute(RouteSettings settings) {
    switch (settings.name) {
      case AppRoutes.widgetDemoPage:
        return MaterialPageRoute(builder: (_) => const DemoWidgetsPage());

      case AppRoutes.splashPage:
        return MaterialPageRoute(builder: (_) => const SplashPage());

      case AppRoutes.loginPage:
        return MaterialPageRoute(builder: (_) => const LoginPage());

      case AppRoutes.registerPage:
        return MaterialPageRoute(builder: (_) => const RegisterPage());

      case AppRoutes.homePage:
        return MaterialPageRoute(builder: (_) => const MapPage());

      case AppRoutes.personalSpacePage:
        return MaterialPageRoute(builder: (_) => const PersonalSpacePage());

      case AppRoutes.settingsPage:
        return MaterialPageRoute(builder: (_) => const SettingsPage());

      case AppRoutes.generalSettingsPage:
        return MaterialPageRoute(builder: (_) => const GeneralSettingsPage());

      case AppRoutes.notificationsSettingsPage:
        return MaterialPageRoute(
          builder: (_) => const NotificationsSettingsPage(),
        );

      case AppRoutes.plannedTrajetsSettingsPage:
        return MaterialPageRoute(
          builder: (_) => const PlannedTrajetsSettingsPage(),
        );

      default:
        return MaterialPageRoute(
          builder: (_) =>
              const Scaffold(body: Center(child: Text('Page not found'))),
        );
    }
  }
}
