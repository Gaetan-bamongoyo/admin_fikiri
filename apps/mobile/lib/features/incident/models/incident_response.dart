import 'package:latlong2/latlong.dart';

class IncidentResponse {
  final String id;
  final String type;
  final String status;
  final double latitude;
  final double longitude;
  final String description;
  final String address;
  final String reporterId;
  final int confirmationCount;
  final DateTime expiresAt;
  final dynamic resolvedAt;
  final DateTime createdAt;

  IncidentResponse({
    required this.id,
    required this.type,
    required this.status,
    required this.latitude,
    required this.longitude,
    required this.description,
    required this.address,
    required this.reporterId,
    required this.confirmationCount,
    required this.expiresAt,
    required this.resolvedAt,
    required this.createdAt,
  });

  factory IncidentResponse.fromJson(Map<String, dynamic> json) {
    final latStr =
        json["latitude"]?.toString().replaceAll(',', '.').trim() ?? '0.0';
    final lngStr =
        json["longitude"]?.toString().replaceAll(',', '.').trim() ?? '0.0';

    return IncidentResponse(
      id: json["id"]?.toString() ?? '',
      type: json["type"]?.toString() ?? '',
      status: json["status"]?.toString() ?? '',
      latitude: double.tryParse(latStr) ?? 0.0,
      longitude: double.tryParse(lngStr) ?? 0.0,
      description: json["description"]?.toString() ?? '',
      address: json["address"]?.toString() ?? '',
      reporterId: json["reporterId"]?.toString() ?? '',
      confirmationCount: json["confirmationCount"] is int
          ? json["confirmationCount"]
          : int.tryParse(json["confirmationCount"]?.toString() ?? '0') ?? 0,
      expiresAt: json["expiresAt"] != null
          ? DateTime.parse(json["expiresAt"])
          : DateTime.now(),
      resolvedAt: json["resolvedAt"],
      createdAt: json["createdAt"] != null
          ? DateTime.parse(json["createdAt"])
          : DateTime.now(),
    );
  }

  LatLng get toLatLng => LatLng(latitude, longitude);
}
