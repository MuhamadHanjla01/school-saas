import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';

class UpdateService {
  // Update this to your live Vercel URL
  static const String updateJsonUrl = 'https://school-saas.vercel.app/downloads/version.json';

  static Future<void> checkForUpdates(BuildContext context) async {
    try {
      final response = await http.get(Uri.parse(updateJsonUrl));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final latestVersion = data['latest_version'] as String;
        final downloadUrl = data['download_url'] as String;
        final releaseNotes = data['release_notes'] as String;
        final forceUpdate = data['force_update'] as bool;

        final packageInfo = await PackageInfo.fromPlatform();
        final currentVersion = packageInfo.version;

        if (_isUpdateAvailable(currentVersion, latestVersion)) {
          // Add a short delay so it doesn't pop up before the UI is fully rendered
          Future.delayed(const Duration(milliseconds: 500), () {
            _showUpdateDialog(
              context, 
              latestVersion, 
              downloadUrl, 
              releaseNotes, 
              forceUpdate
            );
          });
        }
      }
    } catch (e) {
      print('Error checking for updates: $e');
    }
  }

  static bool _isUpdateAvailable(String currentVersion, String latestVersion) {
    List<String> currentParts = currentVersion.split('.');
    List<String> latestParts = latestVersion.split('.');

    for (int i = 0; i < currentParts.length && i < latestParts.length; i++) {
      int current = int.tryParse(currentParts[i]) ?? 0;
      int latest = int.tryParse(latestParts[i]) ?? 0;
      if (latest > current) return true;
      if (latest < current) return false;
    }
    return latestParts.length > currentParts.length;
  }

  static void _showUpdateDialog(
    BuildContext context, 
    String latestVersion, 
    String downloadUrl, 
    String releaseNotes, 
    bool forceUpdate
  ) {
    showDialog(
      context: context,
      barrierDismissible: !forceUpdate,
      builder: (context) {
        return WillPopScope(
          onWillPop: () async => !forceUpdate,
          child: AlertDialog(
            title: Text('Update Available ($latestVersion)'),
            content: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('A new version of ERPZO is available.'),
                const SizedBox(height: 12),
                Text('Release Notes:', style: TextStyle(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                Text(releaseNotes),
              ],
            ),
            actions: [
              if (!forceUpdate)
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Later'),
                ),
              ElevatedButton(
                onPressed: () async {
                  final uri = Uri.parse(downloadUrl);
                  if (await canLaunchUrl(uri)) {
                    await launchUrl(uri, mode: LaunchMode.externalApplication);
                  }
                },
                child: const Text('Update Now'),
              ),
            ],
          ),
        );
      },
    );
  }
}
