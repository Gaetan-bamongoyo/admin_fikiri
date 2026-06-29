class RegisterRequest {
  final String email;
  final String password;
  final String? firstName;
  final String? lastName;
  final String? phone;

  RegisterRequest({
    required this.email,
    required this.password,
    this.firstName,
    this.lastName,
    this.phone,
  });

  Map<String, dynamic> toJson() {
    return {
      'email': email.trim(),
      'password': password,
      if (firstName != null && firstName!.trim().isNotEmpty)
        'firstName': firstName!.trim(),
      if (lastName != null && lastName!.trim().isNotEmpty)
        'lastName': lastName!.trim(),
      if (phone != null && phone!.trim().isNotEmpty) 'phone': phone!.trim(),
    };
  }
}
