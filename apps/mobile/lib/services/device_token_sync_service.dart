import 'dart:async';

import 'package:flutter/foundation.dart';

import '../data/local/app_settings_service.dart';
import '../data/local/secure_storage.dart';
import '../data/repositories/device_token_repository.dart';
import 'notification_service.dart';

/// Synchronise le token FCM avec api_python après auth / refresh.
class DeviceTokenSyncService {
  DeviceTokenSyncService._();

  static final DeviceTokenRepository _repository = DeviceTokenRepository();
  static StreamSubscription<String>? _tokenRefreshSubscription;

  static void startListening() {
    if (!NotificationService.isSupported) return;

    _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = NotificationService.onTokenRefresh.listen(
      (_) => syncIfEnabled(),
    );
  }

  static Future<void> stopListening() async {
    await _tokenRefreshSubscription?.cancel();
    _tokenRefreshSubscription = null;
  }

  /// À appeler après login / register ou au démarrage si session active.
  static Future<void> onSessionStarted({bool? notificationsEnabled}) async {
    if (!NotificationService.isSupported) return;

    await syncIfEnabled(notificationsEnabled: notificationsEnabled);
    startListening();
  }

  /// Enregistre le token si les notifications sont activées.
  static Future<void> syncIfEnabled({bool? notificationsEnabled}) async {
    if (!NotificationService.isSupported) return;

    final token = await SecureStorage.getAccessToken();
    if (token == null || token.isEmpty) return;

    final enabled =
        notificationsEnabled ??
        await AppSettingsService.getNotificationsEnabled();
    if (!enabled) {
      await unregister();
      return;
    }

    final fcmToken = await NotificationService.getFcmToken();
    if (fcmToken == null || fcmToken.isEmpty) {
      debugPrint('DeviceTokenSync: aucun token FCM disponible.');
      return;
    }

    try {
      await _repository.registerToken(fcmToken);
      debugPrint('DeviceTokenSync: token FCM enregistré sur api_python.');
    } catch (error) {
      debugPrint('DeviceTokenSync: échec enregistrement — $error');
    }
  }

  static Future<void> unregister() async {
    if (!NotificationService.isSupported) return;

    final fcmToken = NotificationService.cachedFcmToken;

    try {
      await _repository.unregisterToken(fcmToken: fcmToken);
      debugPrint('DeviceTokenSync: token FCM retiré de api_python.');
    } catch (error) {
      debugPrint('DeviceTokenSync: échec suppression — $error');
    }
  }

  /// À appeler à la déconnexion.
  static Future<void> onLogout() async {
    await unregister();
    await stopListening();
  }
}
