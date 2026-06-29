import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Blocage temporaire pour builds testeurs (hardcodé).
/// Mettre [enabled] à false avant une release production.
class TrialGuardService {
  TrialGuardService._();

  static const bool enabled = true;
  static const int trialDays = 4;

  static const String _firstLaunchKey = 'trial_first_launch_ms';

  static const FlutterSecureStorage _storage = FlutterSecureStorage();

  static Future<DateTime> _firstLaunchAt() async {
    final stored = await _storage.read(key: _firstLaunchKey);
    if (stored != null) {
      return DateTime.fromMillisecondsSinceEpoch(int.parse(stored));
    }

    final now = DateTime.now();
    await _storage.write(
      key: _firstLaunchKey,
      value: now.millisecondsSinceEpoch.toString(),
    );
    return now;
  }

  static Future<bool> isExpired() async {
    if (!enabled) return false;

    final firstLaunch = await _firstLaunchAt();
    final expiry = firstLaunch.add(const Duration(days: trialDays));
    return !DateTime.now().isBefore(expiry);
  } 
}
