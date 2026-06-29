import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

class SharedPreferencesService {
  SharedPreferencesService._();

  static const String userKey = 'user';

  static Future<void> saveUser({
    required String id,
    required String firstName,
    required String lastName,
    required String email,
    String? phone,
    String? avatar,
    int? loyaltyPoints,
  }) async {
    final prefs = await SharedPreferences.getInstance();

    final user = {
      'id': id,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'phone': phone,
      'avatar': avatar,
      if (loyaltyPoints != null) 'loyaltyPoints': loyaltyPoints,
    };

    await prefs.setString(userKey, jsonEncode(user));
  }

  static Future<Map<String, dynamic>?> getUser() async {
    final prefs = await SharedPreferences.getInstance();

    final userString = prefs.getString(userKey);

    if (userString == null) {
      return null;
    }

    return jsonDecode(userString);
  }

  static Future<void> removeUser() async {
    final prefs = await SharedPreferences.getInstance();

    await prefs.remove(userKey);
  }
}
