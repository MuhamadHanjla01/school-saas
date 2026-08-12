import 'dart:async';
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

Future<void> initializeBackgroundService() async {
  final service = FlutterBackgroundService();

  const AndroidNotificationChannel channel = AndroidNotificationChannel(
    'my_foreground', // id
    'MY FOREGROUND SERVICE', // title
    description: 'This channel is used for important notifications.', // description
    importance: Importance.low, // low importance so it doesn't make sound
  );

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(channel);

  await service.configure(
    androidConfiguration: AndroidConfiguration(
      onStart: onStart,
      autoStart: false, // We manually start it after login
      isForegroundMode: true,
      notificationChannelId: 'my_foreground',
      initialNotificationTitle: 'ERPzo Service',
      initialNotificationContent: 'Running in background to receive messages',
      foregroundServiceNotificationId: 888,
    ),
    iosConfiguration: IosConfiguration(
      autoStart: false,
      onForeground: onStart,
      onBackground: onIosBackground,
    ),
  );
}

@pragma('vm:entry-point')
Future<bool> onIosBackground(ServiceInstance service) async {
  WidgetsFlutterBinding.ensureInitialized();
  DartPluginRegistrant.ensureInitialized();
  return true;
}

@pragma('vm:entry-point')
void onStart(ServiceInstance service) async {
  DartPluginRegistrant.ensureInitialized();

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  // Create message channel for actual push notifications
  const AndroidNotificationChannel messageChannel = AndroidNotificationChannel(
    'erpzo_messages',
    'Messages',
    description: 'New message notifications',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  await flutterLocalNotificationsPlugin
      .resolvePlatformSpecificImplementation<
          AndroidFlutterLocalNotificationsPlugin>()
      ?.createNotificationChannel(messageChannel);

  if (service is AndroidServiceInstance) {
    service.on('setAsForeground').listen((event) {
      service.setAsForegroundService();
    });
    service.on('setAsBackground').listen((event) {
      service.setAsBackgroundService();
    });
    service.on('stopService').listen((event) {
      service.stopSelf();
    });
  }

  // Set up socket connection
  IO.Socket? socket;
  String? currentToken;

  void connectSocket(String token) async {
    if (socket != null && socket!.connected) {
      socket!.disconnect();
    }
    
    // Read current user ID to filter out own messages
    SharedPreferences p = await SharedPreferences.getInstance();
    final currentUserId = p.getString('user_id');
    
    socket = IO.io('https://erpzo-backend.onrender.com', IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .setExtraHeaders({'Authorization': 'Bearer $token'})
      .build()
    );

    socket!.connect();

    socket!.onConnect((_) {
      print('Background Socket connected: ${socket!.id}');
      // Join the user's room so the server can target messages
      if (currentUserId != null) {
        socket!.emit('join', currentUserId);
      }
    });

    // Listen for incoming messages
    socket!.on('new_message', (data) async {
      try {
        // Skip notification if the current user is the sender
        final senderId = data['senderId']?.toString();
        if (senderId != null && senderId == currentUserId) {
          return;
        }

        final senderName = data['sender']?['name'] ?? data['senderName'] ?? 'Someone';
        final content = data['content'] ?? 'Sent an attachment';

        // Show local notification
        await flutterLocalNotificationsPlugin.show(
          id: DateTime.now().millisecond,
          title: senderName,
          body: content,
          notificationDetails: const NotificationDetails(
            android: AndroidNotificationDetails(
              'erpzo_messages',
              'Messages',
              channelDescription: 'New message notifications',
              importance: Importance.max,
              priority: Priority.high,
              icon: '@mipmap/ic_launcher',
              category: AndroidNotificationCategory.message,
            ),
          ),
          payload: 'chat_${data['senderId']}',
        );
        
        // Pass it to the UI if it's active
        service.invoke('onMessageReceived', data);
      } catch (e) {
        print('Background Service Notification Error: $e');
      }
    });
  }

  // Read initial token from SharedPreferences
  SharedPreferences prefs = await SharedPreferences.getInstance();
  currentToken = prefs.getString('jwt_token_bg');
  if (currentToken != null) {
    connectSocket(currentToken);
  }

  // Allow UI to send updated token
  service.on('updateToken').listen((event) {
    if (event != null && event['token'] != null) {
      currentToken = event['token'];
      connectSocket(currentToken!);
    }
  });

  // Keep it alive
  Timer.periodic(const Duration(seconds: 10), (timer) async {
    if (service is AndroidServiceInstance) {
      if (await service.isForegroundService()) {
        // We can update the persistent notification here if we want
      }
    }
  });
}
