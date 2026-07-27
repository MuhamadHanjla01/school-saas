import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';

class SocketService {
  static final SocketService _instance = SocketService._internal();
  IO.Socket? socket;
  
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();

  // Use live Render backend URL
  static const String _serverUrl = 'https://school-backend-70ny.onrender.com';

  factory SocketService() {
    return _instance;
  }

  SocketService._internal();

  Future<void> initSocket() async {
    if (socket != null && socket!.connected) return;

    // Request notification permissions
    if (await Permission.notification.isDenied) {
      await Permission.notification.request();
    }

    // Initialize local notifications
    const AndroidInitializationSettings initAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initSettings = InitializationSettings(android: initAndroid);
    await _localNotifications.initialize(
      settings: initSettings,
    );

    socket = IO.io(_serverUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build()
    );

    socket!.connect();

    socket!.onConnect((_) {
      print('Socket connected: ${socket!.id}');
    });

    socket!.onDisconnect((_) {
      print('Socket disconnected');
    });
    
    socket!.onError((err) {
      print('Socket error: $err');
    });

    // Listen for new notices specifically to push local notification
    socket!.on('new_notice', (data) {
      _showLocalNotification(
        title: 'New Notice: ${data['title'] ?? 'Important'}',
        body: data['content'] ?? 'Check the dashboard for details.',
      );
    });

    // Listen for new messages for push notifications
    socket!.on('new_message', (data) async {
      final storage = const FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        final currentUserId = userData['id'];
        
        // Only show notification if the message is for the current user
        if (data['receiverId'] == currentUserId) {
          _showLocalNotification(
            title: 'Message from ${data['senderName'] ?? 'Someone'}',
            body: data['content'] ?? 'You received a new message.',
          );
        }
      }
    });
  }

  Future<void> _showLocalNotification({required String title, required String body}) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      'erpzo_channel', 
      'ERPZO Notifications',
      channelDescription: 'Real-time notifications for ERPZO',
      importance: Importance.max,
      priority: Priority.high,
      ticker: 'ticker'
    );
    const NotificationDetails platformDetails = NotificationDetails(android: androidDetails);
    
    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 100000, 
      title: title, 
      body: body, 
      notificationDetails: platformDetails,
    );
  }

  void on(String event, Function(dynamic) callback) {
    socket?.on(event, callback);
  }

  void off(String event) {
    socket?.off(event);
  }

  void emit(String event, dynamic data) {
    socket?.emit(event, data);
  }

  void disconnect() {
    socket?.disconnect();
  }
}

