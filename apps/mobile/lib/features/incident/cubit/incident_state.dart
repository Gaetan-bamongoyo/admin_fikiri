import '../models/incident_response.dart';

abstract class IncidentState {}

class IncidentInitial extends IncidentState {}

class IncidentLoading extends IncidentState {}

class IncidentSuccess extends IncidentState {
  final String incidents;

  IncidentSuccess(this.incidents);
}

class IncidentListed extends IncidentState {
  final List<IncidentResponse> incidents;
  final String? feedbackMessage;

  IncidentListed(this.incidents, {this.feedbackMessage});
}

class IncidentError extends IncidentState {
  final String message;

  IncidentError(this.message);
}
