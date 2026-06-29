import 'package:latlong2/latlong.dart';

class RouteRequest {
  final LatLng start;
  final LatLng end;

  const RouteRequest({required this.start, required this.end});

  Map<String, dynamic> toJson() => {
    'start': [start.longitude, start.latitude],
    'end': [end.longitude, end.latitude],
  };
}
