class RoutingException implements Exception {
  final int statusCode;
  final String? detail;

  const RoutingException(this.statusCode, [this.detail]);

  @override
  String toString() => 'RoutingException($statusCode): $detail';
}
