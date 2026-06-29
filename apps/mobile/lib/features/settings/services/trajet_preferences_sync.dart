import '../../trajet/models/trajet_model.dart';
import '../repositories/user_preferences_repository.dart';
import '../../auth/models/user_preferences_model.dart';

/// Synchronise les trajets Maison/Travail vers user_preferences.
class TrajetPreferencesSync {
  TrajetPreferencesSync({UserPreferencesRepository? repository})
    : _repository = repository ?? UserPreferencesRepository();

  final UserPreferencesRepository _repository;

  static bool isHomeTrajet(TrajetModel trajet) {
    return trajet.label == 'Maison' || trajet.category == 'home';
  }

  static bool isWorkTrajet(TrajetModel trajet) {
    return trajet.label == 'Travail' || trajet.category == 'work';
  }

  Future<UserPreferences?> syncTrajetCoords(TrajetModel trajet) async {
    if (isHomeTrajet(trajet)) {
      return _repository.updatePreferences(
        homeLatitude: trajet.latitude,
        homeLongitude: trajet.longitude,
      );
    }

    if (isWorkTrajet(trajet)) {
      return _repository.updatePreferences(
        workLatitude: trajet.latitude,
        workLongitude: trajet.longitude,
      );
    }

    return null;
  }

  Future<UserPreferences?> syncTrajet(TrajetModel trajet) async {
    if (isHomeTrajet(trajet)) {
      return _repository.updatePreferences(
        homeLatitude: trajet.latitude,
        homeLongitude: trajet.longitude,
        homeTrafficAlertsEnabled: true,
      );
    }

    if (isWorkTrajet(trajet)) {
      return _repository.updatePreferences(
        workLatitude: trajet.latitude,
        workLongitude: trajet.longitude,
        workTrafficAlertsEnabled: true,
      );
    }

    return null;
  }

  Future<UserPreferences> clearHomeSlot() {
    return _repository.updatePreferences(
      clearHomeLocation: true,
      homeTrafficAlertsEnabled: false,
    );
  }

  Future<UserPreferences> clearWorkSlot() {
    return _repository.updatePreferences(
      clearWorkLocation: true,
      workTrafficAlertsEnabled: false,
    );
  }

  Future<UserPreferences> setHomeAlerts({
    required TrajetModel trajet,
    required bool enabled,
  }) {
    if (!enabled) {
      return _repository.updatePreferences(homeTrafficAlertsEnabled: false);
    }

    return _repository.updatePreferences(
      homeLatitude: trajet.latitude,
      homeLongitude: trajet.longitude,
      homeTrafficAlertsEnabled: true,
    );
  }

  Future<UserPreferences> setWorkAlerts({
    required TrajetModel trajet,
    required bool enabled,
  }) {
    if (!enabled) {
      return _repository.updatePreferences(workTrafficAlertsEnabled: false);
    }

    return _repository.updatePreferences(
      workLatitude: trajet.latitude,
      workLongitude: trajet.longitude,
      workTrafficAlertsEnabled: true,
    );
  }
}
