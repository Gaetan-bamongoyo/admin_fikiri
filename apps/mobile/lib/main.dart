import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/cubit/auth_cubit.dart';
import 'features/auth/repositories/auth_repository.dart';
import 'features/incident/cubit/incident_cubit.dart';
import 'features/incident/repositories/incident_repository.dart';
import 'features/maps/cubit/map_cubit.dart';
import 'features/maps/repositories/map_repository.dart';
import 'data/local/session_manager.dart';
import 'routes/app_router.dart';
import 'routes/app_routes.dart';
import 'features/trial/trial_expired_page.dart';
import 'services/device_token_sync_service.dart';
import 'services/notification_service.dart';
import 'services/trial_guard_service.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  if (await TrialGuardService.isExpired()) {
    runApp(
      const MaterialApp(
        debugShowCheckedModeBanner: false,
        home: TrialExpiredPage(),
      ),
    );
    return;
  }

  await NotificationService.init();

  if (await SessionManager.isLoggedIn()) {
    await DeviceTokenSyncService.onSessionStarted();
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthCubit>(
          create: (context) => AuthCubit(AuthRepository()),
        ),
        BlocProvider<MapCubit>(create: (context) => MapCubit(MapRepository())),
        BlocProvider<IncidentCubit>(
          create: (context) => IncidentCubit(IncidentRepository()),
        ),
      ],
      child: MaterialApp(
        title: 'Fikiri traffic',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.lightTheme,
        initialRoute: AppRoutes.splashPage,
        onGenerateRoute: AppRouter.generateRoute,
      ),
    );
  }
}
