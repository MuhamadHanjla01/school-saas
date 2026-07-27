import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:package_info_plus/package_info_plus.dart';
import 'package:dio/dio.dart';
import 'package:path_provider/path_provider.dart';
import 'package:open_filex/open_filex.dart';

class UpdateService {
  // Update this to your live Vercel URL
  static const String updateJsonUrl = 'https://school-saas-olive.vercel.app/downloads/version.json';

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
      print('Download error: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    return WillPopScope(
      onWillPop: () async => !widget.forceUpdate && !_isDownloading,
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
              onPressed: () => Navigator.pop(context),
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
