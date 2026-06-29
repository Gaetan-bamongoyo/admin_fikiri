import 'user_preferences_model.dart';

class UserModel {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String phone;
  final String role;
  final int loyaltyPoints;
  final String createdAt;
  final UserPreferences preferences;

  UserModel({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    required this.phone,
    required this.role,
    required this.loyaltyPoints,
    required this.createdAt,
    required this.preferences,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id']?.toString() ?? '',
      email: json['email']?.toString() ?? '',
      firstName: json['firstName']?.toString() ?? '',
      lastName: json['lastName']?.toString() ?? '',
      phone: json['phone']?.toString() ?? '',
      role: json['role']?.toString() ?? 'user',
      loyaltyPoints: json['loyaltyPoints'] as int? ?? 0,
      createdAt: json['createdAt']?.toString() ?? '',
      preferences: json['preferences'] is Map
          ? UserPreferences.fromJson(
              Map<String, dynamic>.from(json['preferences'] as Map),
            )
          : UserPreferences.defaults(),
    );
  }
}
