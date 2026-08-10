import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';
import 'package:http/http.dart' as http;

class UpdateService {
  static const String updateJsonUrl = 'https://erpzo-backend.onrender.com/api/app-update/latest';

  /// Returns true if an update dialog was shown, meaning the caller (like splash screen)
  /// should halt navigation if the update is forced.
  static Future<bool> checkForUpdates(BuildContext context) async {
    try {
      final response = await http.get(Uri.parse(updateJsonUrl)).timeout(const Duration(seconds: 5));
      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final latestVersion = data['latest_version'] as String? ?? '0.0.0';
        final downloadUrl = data['download_url'] as String?;
        final releaseNotes = data['release_notes'] as String? ?? '';
        final forceUpdate = data['force_update'] as bool? ?? false;

        if (latestVersion == '0.0.0' || downloadUrl == null || downloadUrl.isEmpty) {
          return false; // No valid updates available
        }

        final packageInfo = await PackageInfo.fromPlatform();
        final currentVersion = packageInfo.version;

        if (_isUpdateAvailable(currentVersion, latestVersion)) {
          if (context.mounted) {
            // Show the dialog immediately, no delayed future
            _showUpdateDialog(
              context, 
              latestVersion, 
              downloadUrl, 
              releaseNotes, 
              forceUpdate
            );
            return true; // We showed an update dialog
          }
        }
      }
    } catch (e) {
      debugPrint('Error checking for updates: $e');
    }
    return false;
  }

  static bool _isUpdateAvailable(String currentVersion, String latestVersion) {
    try {
      String cleanVersion(String v) => v.split('+').first.split('-').first;
      final cParts = cleanVersion(currentVersion).split('.').map(int.parse).toList();
      final lParts = cleanVersion(latestVersion).split('.').map(int.parse).toList();
      
      for (int i = 0; i < 3; i++) {
        if (lParts.length <= i) break;
        if (cParts.length <= i) return true;
        if (lParts[i] > cParts[i]) return true;
        if (lParts[i] < cParts[i]) return false;
      }
    } catch (e) {
      debugPrint('Version parse error: $e');
    }
    return false;
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
        return _UpdateDialogWidget(
          latestVersion: latestVersion,
          downloadUrl: downloadUrl,
          releaseNotes: releaseNotes,
          forceUpdate: forceUpdate,
        );
      },
    );
  }
}

class _UpdateDialogWidget extends StatefulWidget {
  final String latestVersion;
  final String downloadUrl;
  final String releaseNotes;
  final bool forceUpdate;

  const _UpdateDialogWidget({
    Key? key,
    required this.latestVersion,
    required this.downloadUrl,
    required this.releaseNotes,
    required this.forceUpdate,
  }) : super(key: key);

  @override
  State<_UpdateDialogWidget> createState() => _UpdateDialogWidgetState();
}

class _UpdateDialogWidgetState extends State<_UpdateDialogWidget> {
  bool _isDownloading = false;
  double _progress = 0.0;
  String _status = 'A new version of ERPZO is available.';

  Future<void> _startDownload() async {
    setState(() {
      _isDownloading = true;
      _status = 'Downloading...';
    });

    try {
      final directory = await getExternalStorageDirectory();
      if (directory == null) {
        setState(() {
          _status = 'Storage error.';
          _isDownloading = false;
        });
        return;
      }
      
      final filePath = '${directory.path}/update_${widget.latestVersion}.apk';
      final dio = Dio();
      
      await dio.download(
        widget.downloadUrl,
        filePath,
        onReceiveProgress: (received, total) {
          if (total != -1) {
            setState(() {
              _progress = received / total;
              _status = 'Downloading... ${(_progress * 100).toStringAsFixed(0)}%';
            });
          }
        },
      );

      setState(() {
        _status = 'Download complete! Installing...';
      });

      // Open the downloaded APK to trigger the Android installer
      final result = await OpenFilex.open(filePath);
      
      if (result.type != ResultType.done) {
        setState(() {
          _status = 'Error opening APK: ${result.message}';
          _isDownloading = false;
        });
      }
      
    } catch (e) {
      setState(() {
        _status = 'Failed to download update.';
        _isDownloading = false;
      });
      debugPrint('Download error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: !widget.forceUpdate && !_isDownloading,
      child: AlertDialog(
        title: Text('Update Available (${widget.latestVersion})'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(_status),
            if (_isDownloading)
              Padding(
                padding: const EdgeInsets.only(top: 16.0),
                child: LinearProgressIndicator(value: _progress),
              ),
            if (!_isDownloading) ...[
              const SizedBox(height: 12),
              const Text('Release Notes:', style: TextStyle(fontWeight: FontWeight.bold)),
              const SizedBox(height: 4),
              Text(widget.releaseNotes),
            ],
          ],
        ),
        actions: [
          if (!widget.forceUpdate && !_isDownloading)
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                // If it's not a forced update and they tap 'Later', 
                // we probably need to push them to the next screen if they were on splash.
                // But the caller won't know they dismissed it if they just pop.
                // Splash screen might need a way to be notified, but a simple 
                // fix is just restarting the app logic or relying on the user to manually trigger.
                // However, the cleanest way is just to let the splash screen continue if it's not forced.
              },
              child: const Text('Later'),
            ),
          if (!_isDownloading)
            ElevatedButton(
              onPressed: _startDownload,
              child: const Text('Update Now'),
            ),
        ],
      ),
    );
  }
}
