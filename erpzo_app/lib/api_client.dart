import 'dart:async';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

/// Circuit breaker states.
enum CircuitState { closed, open, halfOpen }

/// A resilient HTTP client with built-in circuit breaker protection and JWT auth.
class ApiClient {
  final String baseUrl;
  final int failureThreshold;
  final Duration cooldownDuration;
  final Duration timeout;
  final int maxConcurrency;

  CircuitState _state = CircuitState.closed;
  int _failureCount = 0;
  DateTime? _lastFailureTime;
  int _inFlight = 0;

  final _storage = const FlutterSecureStorage();

  ApiClient({
    required this.baseUrl,
    this.failureThreshold = 5,
    this.cooldownDuration = const Duration(seconds: 15),
    this.timeout = const Duration(seconds: 10),
    this.maxConcurrency = 6,
  });

  CircuitState get state => _state;
  int get inFlight => _inFlight;
  int get failureCount => _failureCount;

  /// Fetch headers including the JWT token
  Future<Map<String, String>> _getAuthHeaders(Map<String, String>? customHeaders) async {
    final headers = {'Content-Type': 'application/json'};
    if (customHeaders != null) headers.addAll(customHeaders);
    
    final token = await _storage.read(key: 'jwt_token');
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    return headers;
  }

  /// Handle Token Refresh
  Future<bool> _refreshToken() async {
    final refreshToken = await _storage.read(key: 'refresh_token');
    if (refreshToken == null) return false;

    try {
      final res = await http.post(
        Uri.parse('$baseUrl/api/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'refreshToken': refreshToken}),
      ).timeout(timeout);

      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        await _storage.write(key: 'jwt_token', value: data['token']);
        return true;
      }
    } catch (_) {}
    return false;
  }

  /// GET request
  Future<http.Response> get(String path, {Map<String, String>? headers}) async {
    return _executeWithAuth(() async {
      final mergedHeaders = await _getAuthHeaders(headers);
      return http.get(Uri.parse('$baseUrl$path'), headers: mergedHeaders);
    });
  }

  /// POST request
  Future<http.Response> post(String path, {Map<String, String>? headers, Object? body}) async {
    return _executeWithAuth(() async {
      final mergedHeaders = await _getAuthHeaders(headers);
      return http.post(
        Uri.parse('$baseUrl$path'),
        headers: mergedHeaders,
        body: body is String ? body : jsonEncode(body),
      );
    });
  }

  /// PUT request
  Future<http.Response> put(String path, {Map<String, String>? headers, Object? body}) async {
    return _executeWithAuth(() async {
      final mergedHeaders = await _getAuthHeaders(headers);
      return http.put(
        Uri.parse('$baseUrl$path'),
        headers: mergedHeaders,
        body: body is String ? body : jsonEncode(body),
      );
    });
  }

  /// DELETE request
  Future<http.Response> delete(String path, {Map<String, String>? headers}) async {
    return _executeWithAuth(() async {
      final mergedHeaders = await _getAuthHeaders(headers);
      return http.delete(Uri.parse('$baseUrl$path'), headers: mergedHeaders);
    });
  }

  /// Executes request with automatic token refresh on 401
  Future<http.Response> _executeWithAuth(Future<http.Response> Function() requestFn) async {
    http.Response response = await _execute(requestFn);

    if (response.statusCode == 401) {
      final refreshed = await _refreshToken();
      if (refreshed) {
        response = await _execute(requestFn);
      } else {
        throw ApiUnauthorizedException('Session expired. Please log in again.');
      }
    }
    return response;
  }

  /// Core execution wrapper: enforces circuit breaker, timeout, concurrency.
  Future<http.Response> _execute(Future<http.Response> Function() requestFn) async {
    if (_state == CircuitState.open) {
      if (_lastFailureTime != null && DateTime.now().difference(_lastFailureTime!) >= cooldownDuration) {
        _state = CircuitState.halfOpen;
      } else {
        throw ApiCircuitOpenException('Backend is temporarily unavailable.');
      }
    }

    if (_inFlight >= maxConcurrency) {
      throw ApiOverloadedException('Too many requests in progress.');
    }

    _inFlight++;
    try {
      final response = await requestFn().timeout(timeout);

      if (response.statusCode == 503) {
        _onFailure();
        throw ApiServiceUnavailableException('Service temporarily unavailable.', response: response);
      }

      _onSuccess();
      return response;
    } on TimeoutException {
      _onFailure();
      throw ApiTimeoutException('Request timed out after ${timeout.inSeconds}s.');
    } catch (e) {
      if (e is ApiCircuitOpenException ||
          e is ApiOverloadedException ||
          e is ApiServiceUnavailableException ||
          e is ApiTimeoutException ||
          e is ApiUnauthorizedException) {
        rethrow;
      }
      _onFailure();
      rethrow;
    } finally {
      _inFlight--;
    }
  }

  void _onSuccess() {
    _failureCount = 0;
    _state = CircuitState.closed;
  }

  void _onFailure() {
    _failureCount++;
    _lastFailureTime = DateTime.now();
    if (_failureCount >= failureThreshold || _state == CircuitState.halfOpen) {
      _state = CircuitState.open;
    }
  }

  void reset() {
    _state = CircuitState.closed;
    _failureCount = 0;
    _lastFailureTime = null;
  }
}

class ApiCircuitOpenException implements Exception {
  final String message;
  ApiCircuitOpenException(this.message);
  @override String toString() => message;
}

class ApiOverloadedException implements Exception {
  final String message;
  ApiOverloadedException(this.message);
  @override String toString() => message;
}

class ApiTimeoutException implements Exception {
  final String message;
  ApiTimeoutException(this.message);
  @override String toString() => message;
}

class ApiServiceUnavailableException implements Exception {
  final String message;
  final http.Response? response;
  ApiServiceUnavailableException(this.message, {this.response});
  @override String toString() => message;
}

class ApiUnauthorizedException implements Exception {
  final String message;
  ApiUnauthorizedException(this.message);
  @override String toString() => message;
}

/// Global singleton API client for the app.
// If testing locally on Android emulator, use http://10.0.2.2:3000
// final apiClient = ApiClient(baseUrl: 'http://10.0.2.2:3000');
final apiClient = ApiClient(baseUrl: 'https://school-backend-70ny.onrender.com'); // Live Production API

