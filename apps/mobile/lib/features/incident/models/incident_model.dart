import 'incident_response.dart';

class IncidentModel {
  final List<IncidentResponse> incidents;

  IncidentModel({required this.incidents});

  factory IncidentModel.fromJson(Map<String, dynamic> json) => IncidentModel(
    // Sécurité si la clé "data" est absente ou nulle
    incidents: json["data"] != null
        ? List<IncidentResponse>.from(
            json["data"].map((x) => IncidentResponse.fromJson(x)),
          )
        : [],
  );
}
