import '../../services/device_token_sync_service.dart';
import 'secure_storage.dart';

class SessionManager {
  SessionManager._();

  static Future<bool> isLoggedIn() async {
    final token = await SecureStorage.getAccessToken();

    return token != null && token.isNotEmpty;
  }

  static Future<void> logout() async {
    await DeviceTokenSyncService.onLogout();
    await SecureStorage.clear();
  }
}
