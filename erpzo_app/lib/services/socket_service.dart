import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:permission_handler/permission_handler.dart';
import '../screens/student/teacher_chat_screen.dart'; // For activeChatUserId

class SocketService {
  static final SocketService _instance = SocketService._internal();
  IO.Socket? socket;
  
  final FlutterLocalNotificationsPlugin _localNotifications = FlutterLocalNotificationsPlugin();
  
  /// Global navigator key — set this from main.dart to enable tap-to-open
  static final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  // Use live Render backend URL
  static const String _serverUrl = 'https://erpzo-backend.onrender.com';

  // Notification IDs for grouping
  static const String _messageChannelId = 'erpzo_messages';
  static const String _messageChannelName = 'Messages';
  static const String _messageChannelDesc = 'New message notifications';
  
  static const String _noticeChannelId = 'erpzo_notices';
  static const String _noticeChannelName = 'Notices & Announcements';
  static const String _noticeChannelDesc = 'School notices and announcements';

  // Track notification IDs per sender for grouping
  final Map<String, int> _senderNotificationIds = {};
  int _notificationIdCounter = 1000;

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

    // Initialize local notifications with tap handler
    const AndroidInitializationSettings initAndroid = AndroidInitializationSettings('@mipmap/ic_launcher');
    const InitializationSettings initSettings = InitializationSettings(android: initAndroid);
    await _localNotifications.initialize(
      settings: initSettings,
      onDidReceiveNotificationResponse: _onNotificationTap,
    );

    // Create notification channels
    final androidPlugin = _localNotifications
        .resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
    if (androidPlugin != null) {
      await androidPlugin.createNotificationChannel(
        const AndroidNotificationChannel(
          _messageChannelId,
          _messageChannelName,
          description: _messageChannelDesc,
          importance: Importance.high,
          playSound: true,
          enableVibration: true,
          showBadge: true,
        ),
      );
      await androidPlugin.createNotificationChannel(
        const AndroidNotificationChannel(
          _noticeChannelId,
          _noticeChannelName,
          description: _noticeChannelDesc,
          importance: Importance.high,
          playSound: true,
        ),
      );
    }

    socket = IO.io(_serverUrl, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build()
    );

    socket!.connect();

    socket!.onConnect((_) {
      debugPrint('Socket connected: ${socket!.id}');
    });

    socket!.onDisconnect((_) {
      debugPrint('Socket disconnected');
    });
    
    socket!.onError((err) {
      debugPrint('Socket error: $err');
    });

    // Listen for new notices — push notification
    socket!.on('new_notice', (data) {
      _showNoticeNotification(data);
    });

    // Listen for new messages — WhatsApp-style push notification
    socket!.on('new_message', (data) async {
      final storage = const FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        final currentUserId = userData['id'];
        
        // Only show notification if:
        // 1. The message is for the current user
        // 2. The user is NOT currently viewing this chat
        if (data['receiverId'] == currentUserId) {
          final senderId = data['senderId'];
          
          // Suppress notification if user is already in the chat with this sender
          if (activeChatUserId == senderId) {
            debugPrint('Suppressing notification — user is in this chat');
            return;
          }
          
          _showMessageNotification(
            senderId: senderId ?? '',
            senderName: data['senderName'] ?? 'Someone',
            messageContent: data['content'] ?? 'You received a new message.',
          );
        }
      }
    });
  }

  /// WhatsApp-style message notification
  Future<void> _showMessageNotification({
    required String senderId,
    required String senderName,
    required String messageContent,
  }) async {
    // Get or create a stable notification ID per sender (groups messages)
    if (!_senderNotificationIds.containsKey(senderId)) {
      _senderNotificationIds[senderId] = _notificationIdCounter++;
    }
    final notificationId = _senderNotificationIds[senderId]!;

    // Build WhatsApp-style notification
    final AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _messageChannelId,
      _messageChannelName,
      channelDescription: _messageChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
      ticker: 'New message',
      category: AndroidNotificationCategory.message,
      styleInformation: BigTextStyleInformation(
        messageContent,
        contentTitle: senderName,
        summaryText: 'New message',
      ),
      groupKey: 'erpzo_messages_group',
      setAsGroupSummary: false,
      autoCancel: true,
    );
    
    final NotificationDetails platformDetails = NotificationDetails(android: androidDetails);
    
    await _localNotifications.show(
      id: notificationId,
      title: senderName,
      body: messageContent,
      notificationDetails: platformDetails,
      payload: jsonEncode({
        'type': 'message',
        'senderId': senderId,
        'senderName': senderName,
      }),
    );

    // Show group summary notification
    const AndroidNotificationDetails groupSummary = AndroidNotificationDetails(
      _messageChannelId,
      _messageChannelName,
      channelDescription: _messageChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
      groupKey: 'erpzo_messages_group',
      setAsGroupSummary: true,
      styleInformation: InboxStyleInformation(
        [],
        contentTitle: 'ERPZO Messages',
        summaryText: 'New messages',
      ),
    );
    
    await _localNotifications.show(
      id: 999, // Fixed ID for group summary
      title: 'ERPZO Messages',
      body: 'You have new messages',
      notificationDetails: const NotificationDetails(android: groupSummary),
    );
  }

  /// Notice notification with distinct styling
  Future<void> _showNoticeNotification(dynamic data) async {
    const AndroidNotificationDetails androidDetails = AndroidNotificationDetails(
      _noticeChannelId,
      _noticeChannelName,
      channelDescription: _noticeChannelDesc,
      importance: Importance.high,
      priority: Priority.high,
      ticker: 'New notice',
      category: AndroidNotificationCategory.social,
      styleInformation: BigTextStyleInformation(
        '', // Will be overridden
      ),
      autoCancel: true,
    );
    const NotificationDetails platformDetails = NotificationDetails(android: androidDetails);
    
    final title = data['title'] ?? 'Important Notice';
    final body = data['content'] ?? 'Check the dashboard for details.';
    
    await _localNotifications.show(
      id: DateTime.now().millisecondsSinceEpoch ~/ 1000, // Unique ID per notice
      title: '📢 $title',
      body: body,
      notificationDetails: platformDetails,
      payload: jsonEncode({
        'type': 'notice',
      }),
    );
  }

  /// Handle notification tap — navigate to the appropriate screen
  static void _onNotificationTap(NotificationResponse response) {
    if (response.payload == null) return;
    
    try {
      final data = jsonDecode(response.payload!);
      final type = data['type'];
      
      if (type == 'message') {
        final senderId = data['senderId'];
        final senderName = data['senderName'];
        
        navigatorKey.currentState?.pushNamed(
          '/teacher_chat',
          arguments: {
            'otherUserId': senderId,
            'otherUserName': senderName,
          },
        );
      }
      // For notices, just open the app (it will show dashboard)
    } catch (e) {
      debugPrint('Error handling notification tap: $e');
    }
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
