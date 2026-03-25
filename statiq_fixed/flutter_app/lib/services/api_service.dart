import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiService {
  // ⚠ Change this URL if running on a physical device (use your machine's IP)
  // e.g.  static const baseUrl = 'http://192.168.1.10:3000/api';
  static const String baseUrl = 'http://localhost:3000/api';

  static Future<Map<String, dynamic>> _post(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    try {
      final response = await http
          .post(
            Uri.parse('$baseUrl/$endpoint'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode(body),
          )
          .timeout(const Duration(seconds: 10));
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (e) {
      return {
        'success': false,
        'error':
            'Cannot connect to backend.\n'
            'Make sure Node.js server is running:\n'
            '  cd backend  →  npm start\n\n'
            'Error: $e',
      };
    }
  }

  static Future<Map<String, dynamic>> frequency(String data) =>
      _post('frequency', {'data': data});

  static Future<Map<String, dynamic>> averages(String data) =>
      _post('averages', {'data': data});

  static Future<Map<String, dynamic>> variability(String data) =>
      _post('variability', {'data': data});

  static Future<Map<String, dynamic>> outliers(String data) =>
      _post('outliers', {'data': data});

  static Future<Map<String, dynamic>> normalDist(
    double value,
    double mean,
    double stdDev,
  ) => _post('normal', {'value': value, 'mean': mean, 'stdDev': stdDev});

  static Future<Map<String, dynamic>> zScores(String data) =>
      _post('zscores', {'data': data});

  static Future<Map<String, dynamic>> correlation(String x, String y) =>
      _post('correlation', {'x': x, 'y': y});

  static Future<Map<String, dynamic>> regression(String x, String y) =>
      _post('regression', {'x': x, 'y': y});

  static Future<Map<String, dynamic>> multipleRegression(
    String y,
    List<String> predictors,
  ) => _post('multiple-regression', {'y': y, 'predictors': predictors});
}
