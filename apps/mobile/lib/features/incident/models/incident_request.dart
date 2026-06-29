class IncidentRequest {
  String type;
  double latitude;
  double longitude;
  String description;
  String address;

  IncidentRequest({
    required this.type,
    required this.latitude,
    required this.longitude,
    required this.description,
    required this.address,
  });

  Map<String, dynamic> toJson() => {
    "type": type,
    "latitude": latitude,
    "longitude": longitude,
    "description": description,
    "address": address,
  };
}
