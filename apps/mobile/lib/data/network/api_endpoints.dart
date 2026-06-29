class ApiEndpoints {
  ApiEndpoints._();

  // Émulateur Android → machine locale
  // static const baseUrl = 'http://10.0.2.2:7540/api/v1';
  // static const pythonBaseUrl = 'http://10.0.2.2:8000/api/v1';

  // Téléphone physique / production
  static const baseUrl = 'http://108.181.203.54:7540/api/v1';
  static const pythonBaseUrl = 'http://108.181.203.54:8600/api/v1';

  static const maps = 'https://nominatim.openstreetmap.org/reverse';

  // Auth
  static const login = '/auth/login';
  static const register = '/auth/register';
  static const incident = '/incidents';

  // Python routing microservice
  static const routingCompute = '/routing/compute';

  // Trafic passif (Phase 2)
  static const trafficTracks = '/traffic/tracks';

  // Destinations enregistrées
  static const trajets = '/trajets';

  // Utilisateur
  static const usersMe = '/users/me';
  static const usersMePreferences = '/users/me/preferences';

  // Notifications (api_python)
  static const notificationsDeviceToken = '/notifications/device-token';
}
