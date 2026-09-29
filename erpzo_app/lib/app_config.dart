import 'package:flutter/foundation.dart';

class AppConfig {
  static const apiUrl = String.fromEnvironment('API_BASE_URL', defaultValue: 'http://10.0.2.2:3000');
  static void validate() {
    final uri = Uri.tryParse(apiUrl);
    if (uri == null || !uri.hasAuthority || (kReleaseMode && uri.scheme != 'https')) {
      throw StateError('Set an HTTPS API_BASE_URL for release builds.');
    }
  }
}
