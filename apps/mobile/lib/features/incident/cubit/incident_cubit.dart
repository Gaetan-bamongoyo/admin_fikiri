import 'package:flutter_bloc/flutter_bloc.dart';
import '../models/incident_response.dart';
import '../repositories/incident_repository.dart';
import 'incident_state.dart';

class IncidentCubit extends Cubit<IncidentState> {
  final IncidentRepository repository;

  IncidentCubit(this.repository) : super(IncidentInitial());

  List<IncidentResponse> _cachedIncidents = const [];
  double? _lastLatitude;
  double? _lastLongitude;

  List<IncidentResponse> get cachedIncidents => _cachedIncidents;

  Future<void> getIncidents({
    bool showLoading = true,
    double? latitude,
    double? longitude,
    double radiusKm = 15,
  }) async {
    if (latitude != null && longitude != null) {
      _lastLatitude = latitude;
      _lastLongitude = longitude;
    }

    try {
      if (showLoading && state is! IncidentListed) {
        emit(IncidentLoading());
      }

      final response = await repository.getIncidents(
        latitude: _lastLatitude,
        longitude: _lastLongitude,
        radiusKm: radiusKm,
      );

      _cachedIncidents = response.incidents;
      emit(IncidentListed(_cachedIncidents));
    } catch (e) {
      emit(IncidentError(e.toString()));
    }
  }

  Future<void> reportIncident({
    required String type,
    required String description,
    required double latitude,
    required double longitude,
  }) async {
    try {
      emit(IncidentLoading());
      await repository.reportIncident(
        type: type,
        description: description,
        latitude: latitude,
        longitude: longitude,
        address: '',
      );
      emit(IncidentSuccess('Incident signalé avec succès.'));
      await getIncidents(
        showLoading: false,
        latitude: latitude,
        longitude: longitude,
      );
    } catch (e) {
      emit(IncidentError(e.toString()));
    }
  }

  Future<void> confirmIncident(
    String incidentId, {
    bool isConfirm = true,
  }) async {
    try {
      emit(IncidentLoading());
      await repository.confirmIncident(incidentId, isConfirm: isConfirm);

      if (!isConfirm) {
        _cachedIncidents = _cachedIncidents
            .where((incident) => incident.id != incidentId)
            .toList();
        emit(
          IncidentListed(
            _cachedIncidents,
            feedbackMessage: 'Incident retiré de la carte.',
          ),
        );
        return;
      }

      final response = await repository.getIncidents(
        latitude: _lastLatitude,
        longitude: _lastLongitude,
      );
      _cachedIncidents = response.incidents;
      emit(
        IncidentListed(
          _cachedIncidents,
          feedbackMessage: 'Incident confirmé, merci !',
        ),
      );
    } catch (e) {
      final message = e.toString().replaceFirst('Exception: ', '');
      emit(IncidentError(message));
    }
  }

  void clearFeedback() {
    emit(IncidentListed(_cachedIncidents));
  }
}
