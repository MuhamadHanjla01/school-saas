import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api_client.dart';
import '../../services/socket_service.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  bool _isLoading = true;
  List<dynamic> _notifications = [];

  @override
  void initState() {
    super.initState();
    _fetchNotifications();
    _setupSocketListeners();
  }

  @override
  void dispose() {
    SocketService().off('new_notification');
    SocketService().off('new_notice');
    super.dispose();
  }

  void _setupSocketListeners() {
    final socket = SocketService();
    socket.on('new_notification', (data) {
      if (!mounted) return;
      _fetchNotifications();
    });
    socket.on('new_notice', (data) {
      if (!mounted) return;
      _fetchNotifications();
    });
  }

  Future<void> _fetchNotifications() async {
    try {
      final res = await apiClient.get('/api/notifications');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final fetchedNotifications = data['notifications'] ?? [];
        
        if (mounted) {
          setState(() {
            _notifications = fetchedNotifications;
            _isLoading = false;
          });
        }

        // Mark all unread notifications as read on the backend
        final unreadIds = (fetchedNotifications as List<dynamic>)
            .where((n) => n['isRead'] == false)
            .map((n) => n['id'])
            .toList();

        if (unreadIds.isNotEmpty) {
          apiClient.post('/api/notifications/read', body: {'notificationIds': unreadIds});
          if (mounted) {
            setState(() {
              for (var notification in _notifications) {
                notification['isRead'] = true;
              }
            });
          }
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _clearAllNotifications() async {
    try {
      final res = await apiClient.delete('/api/notifications');
      if (res.statusCode == 200) {
        if (mounted) {
          setState(() {
            _notifications.clear();
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Notifications cleared')),
          );
        }
      }
    } catch (e) {
      debugPrint('Error clearing notifications: $e');
    }
  }

  void _handleNotificationTap(Map<String, dynamic> item) {
    final type = (item['type'] ?? '').toString();
    if (type == 'Message') {
      Navigator.of(context).pushNamed('/messages');
    } else if (type == 'Assignment') {
      Navigator.of(context).pushNamed('/assignments');
    } else if (type == 'Notice') {
      Navigator.of(context).pushNamed('/notices');
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'Notice':
        return Icons.campaign_rounded;
      case 'Assignment':
        return Icons.assignment_rounded;
      case 'Message':
        return Icons.chat_rounded;
      case 'Attendance':
        return Icons.event_available_rounded;
      case 'Fee':
        return Icons.receipt_long_rounded;
      default:
        return Icons.notifications_rounded;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'Notice':
        return const Color(0xFFE91E63);
      case 'Assignment':
        return const Color(0xFFFF9800);
      case 'Message':
        return const Color(0xFF0060AC);
      case 'Attendance':
        return const Color(0xFF006B5C);
      case 'Fee':
        return const Color(0xFF9D4224);
      default:
        return const Color(0xFF00C2A8);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9FC),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Color(0xFF1A1C1E)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          'Notifications',
          style: TextStyle(
            color: Color(0xFF1A1C1E),
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        actions: [
          if (_notifications.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.delete_outline, color: Color(0xFF6C7A76)),
              tooltip: 'Clear all',
              onPressed: () {
                showDialog(
                  context: context,
                  builder: (ctx) => AlertDialog(
                    title: const Text('Clear Notifications?'),
                    content: const Text('Are you sure you want to clear all notifications?'),
                    actions: [
                      TextButton(
                        onPressed: () => Navigator.pop(ctx),
                        child: const Text('Cancel'),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.pop(ctx);
                          _clearAllNotifications();
                        },
                        child: const Text('Clear All', style: TextStyle(color: Colors.red)),
                      ),
                    ],
                  ),
                );
              },
            ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
          : _notifications.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: const Color(0xFF00C2A8).withAlpha(20),
                          shape: BoxShape.circle,
                        ),
                        child: const Icon(
                          Icons.notifications_none_rounded,
                          size: 48,
                          color: Color(0xFF006B5C),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'No notifications',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                      const SizedBox(height: 6),
                      const Text(
                        'You are all caught up!',
                        style: TextStyle(color: Color(0xFF6C7A76)),
                      ),
                    ],
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchNotifications,
                  color: const Color(0xFF00C2A8),
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final item = _notifications[index];
                      final type = (item['type'] ?? 'General').toString();
                      final title = (item['title'] ?? 'Notification').toString();
                      final description = (item['description'] ?? '').toString();
                      final isRead = item['isRead'] == true;
                      
                      DateTime date = DateTime.now();
                      if (item['date'] != null) {
                        try {
                          date = DateTime.parse(item['date']).toLocal();
                        } catch (_) {}
                      }

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: InkWell(
                          onTap: () => _handleNotificationTap(Map<String, dynamic>.from(item)),
                          borderRadius: BorderRadius.circular(16),
                          child: Container(
                            padding: const EdgeInsets.all(16),
                            decoration: BoxDecoration(
                              color: isRead ? Colors.white : const Color(0xFFF0FDFB),
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isRead 
                                    ? const Color(0xFFE2E2E5).withAlpha(128) 
                                    : const Color(0xFF00C2A8).withAlpha(100),
                              ),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withAlpha(8),
                                  blurRadius: 10,
                                  offset: const Offset(0, 3),
                                )
                              ],
                            ),
                            child: Row(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Container(
                                  padding: const EdgeInsets.all(10),
                                  decoration: BoxDecoration(
                                    color: _getColorForType(type).withAlpha(25),
                                    shape: BoxShape.circle,
                                  ),
                                  child: Icon(
                                    _getIconForType(type),
                                    color: _getColorForType(type),
                                    size: 22,
                                  ),
                                ),
                                const SizedBox(width: 14),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Text(
                                            type,
                                            style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: _getColorForType(type),
                                            ),
                                          ),
                                          Text(
                                            _formatTimeAgo(date),
                                            style: const TextStyle(
                                              fontSize: 11,
                                              color: Color(0xFF6C7A76),
                                            ),
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        title,
                                        style: TextStyle(
                                          fontSize: 15,
                                          fontWeight: isRead ? FontWeight.w600 : FontWeight.w700,
                                          color: const Color(0xFF1A1C1E),
                                        ),
                                      ),
                                      if (description.isNotEmpty) ...[
                                        const SizedBox(height: 3),
                                        Text(
                                          description,
                                          style: const TextStyle(
                                            fontSize: 13,
                                            height: 1.3,
                                            color: Color(0xFF3C4A46),
                                          ),
                                          maxLines: 3,
                                          overflow: TextOverflow.ellipsis,
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _formatTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.isNegative || diff.inSeconds < 60) {
      return 'Just now';
    } else if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else if (diff.inDays < 7) {
      return '${diff.inDays}d ago';
    } else {
      final months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return '${months[date.month - 1]} ${date.day}';
    }
  }
}
