import 'package:flutter_bloc/flutter_bloc.dart';

import '../../../data/local/app_settings_service.dart';
import '../../../data/local/secure_storage.dart';
import '../../../data/local/shared_preferences_service.dart';
import '../../../services/device_token_sync_service.dart';
import '../models/login_response.dart';
import '../repositories/auth_repository.dart';
import 'auth_state.dart';

class AuthCubit extends Cubit<AuthState> {
  final AuthRepository repository;

  AuthCubit(this.repository) : super(AuthInitial());

  Future<void> login({required String email, required String password}) async {
    await _authenticate(
      () => repository.login(email: email.trim(), password: password),
    );
  }

  Future<void> register({
    required String email,
    required String password,
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    await _authenticate(
      () => repository.register(
        email: email.trim(),
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      ),
    );
  }

  Future<void> _authenticate(Future<LoginResponse> Function() request) async {
    try {
      emit(AuthLoading());
      final response = await request();
      await _persistSession(response);
      emit(AuthSuccess(response.user.email));
    } catch (error) {
      emit(AuthError(error.toString().replaceFirst('Exception: ', '')));
    }
  }

  Future<void> _persistSession(LoginResponse response) async {
    await SecureStorage.saveAccessToken(response.accessToken);
    await SecureStorage.saveRefreshToken(response.accessToken);
    await SharedPreferencesService.saveUser(
      id: response.user.id,
      firstName: response.user.firstName,
      lastName: response.user.lastName,
      email: response.user.email,
      phone: response.user.phone.isEmpty ? null : response.user.phone,
      loyaltyPoints: response.user.loyaltyPoints,
    );
    await AppSettingsService.applyFromUserPreferences(
      response.user.preferences,
    );
    await DeviceTokenSyncService.onSessionStarted(
      notificationsEnabled: response.user.preferences.notificationsEnabled,
    );
  }
}
