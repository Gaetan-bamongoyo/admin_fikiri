import 'dart:async';

import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';

import '../firebase_options.dart';

const _androidIcon = '@drawable/ic_stat_fikiri';

/// Handler background — doit rester top-level.
@pragma('vm:entry-point')
Future<void> firebaseBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  await NotificationService.ensureLocalNotificationsReady();
  debugPrint('FCM background message: ${message.messageId}');
  await NotificationService.showLocalNotification(message);
}

/// Réception FCM + affichage local (foreground / background).
class NotificationService {
  NotificationService._();

  static final FlutterLocalNotificationsPlugin _localNotif =
      FlutterLocalNotificationsPlugin();

  static const AndroidNotificationChannel _channel = AndroidNotificationChannel(
    'fikiri_traffic_alerts',
    'Alertes Trafic FIKIRI',
    description: 'Notifications de trafic préventives',
    importance: Importance.max,
    playSound: true,
    enableVibration: true,
  );

  static bool _initialized = false;
  static String? _cachedFcmToken;
  static final StreamController<String> _tokenRefreshController =
      StreamController<String>.broadcast();

  static bool get isSupported =>
      !kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.android ||
          defaultTargetPlatform == TargetPlatform.iOS);

  static Stream<String> get onTokenRefresh => _tokenRefreshController.stream;

  static String? get cachedFcmToken => _cachedFcmToken;

  /// Initialise Firebase Messaging et les notifications locales.
  static Future<void> init() async {
    if (_initialized || !isSupported) return;

    await Firebase.initializeApp(
      options: DefaultFirebaseOptions.currentPlatform,
    );
    FirebaseMessaging.onBackgroundMessage(firebaseBackgroundHandler);

    await ensureLocalNotificationsReady();
    await _requestPermissions();

    FirebaseMessaging.onMessage.listen((message) async {
      debugPrint('FCM foreground message: ${message.messageId}');
      await showLocalNotification(message);
    });

    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      debugPrint('FCM opened from notification: ${message.messageId}');
    });

    FirebaseMessaging.instance.onTokenRefresh.listen((token) {
      _cachedFcmToken = token;
      debugPrint('FCM token refreshed');
      _tokenRefreshController.add(token);
    });

    _cachedFcmToken = await FirebaseMessaging.instance.getToken();
    debugPrint('FCM Token: $_cachedFcmToken');

    _initialized = true;
  }

  static Future<void> ensureLocalNotificationsReady() async {
    final androidPlugin = _localNotif
        .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin
        >();
    await androidPlugin?.createNotificationChannel(_channel);

    const initSettings = InitializationSettings(
      android: AndroidInitializationSettings(_androidIcon),
    );
    await _localNotif.initialize(initSettings);
  }

  static Future<void> _requestPermissions() async {
    if (defaultTargetPlatform == TargetPlatform.android) {
      final androidPlugin = _localNotif
          .resolvePlatformSpecificImplementation<
            AndroidFlutterLocalNotificationsPlugin
          >();
      final granted = await androidPlugin?.requestNotificationsPermission();
      final enabled = await androidPlugin?.areNotificationsEnabled();
      debugPrint(
        'Notifications Android — permission: $granted, enabled: $enabled',
      );
    }

    final settings = await FirebaseMessaging.instance.requestPermission(
      alert: true,
      badge: true,
      sound: true,
    );
    debugPrint('FCM permission status: ${settings.authorizationStatus}');
  }

  /// Token FCM actuel (null si indisponible).
  static Future<String?> getFcmToken() async {
    if (!isSupported) return null;
    if (!_initialized) await init();
    _cachedFcmToken ??= await FirebaseMessaging.instance.getToken();
    return _cachedFcmToken;
  }

  static Future<void> showLocalNotification(RemoteMessage message) async {
    final notification = message.notification;
    final title = notification?.title ?? message.data['title']?.toString();
    final body = notification?.body ?? message.data['body']?.toString();

    if ((title == null || title.isEmpty) && (body == null || body.isEmpty)) {
      debugPrint('FCM message ignoré (pas de titre ni corps)');
      return;
    }

    await _localNotif.show(
      notification?.hashCode ?? message.hashCode,
      title ?? 'Alerte Trafic FIKIRI',
      body ?? '',
      NotificationDetails(
        android: AndroidNotificationDetails(
          _channel.id,
          _channel.name,
          channelDescription: _channel.description,
          importance: Importance.max,
          priority: Priority.high,
          icon: _androidIcon,
          color: const Color(0xFF2563EB),
          playSound: true,
          enableVibration: true,
        ),
      ),
    );
  }
}
