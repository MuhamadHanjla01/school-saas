import 'dart:convert';
import 'package:http/http.dart' as http;

void main() async {
  final url1 = 'https://school-saas.vercel.app/downloads/version.json';
  final url2 = 'https://school-saas-olive.vercel.app/downloads/version.json';

  try {
    var res1 = await http.get(Uri.parse(url1));
    print('URL 1: ${res1.statusCode} - ${res1.body}');
  } catch (e) {
    print('URL 1 Error: $e');
  }

  try {
    var res2 = await http.get(Uri.parse(url2));
    print('URL 2: ${res2.statusCode} - ${res2.body}');
  } catch (e) {
    print('URL 2 Error: $e');
  }
}
