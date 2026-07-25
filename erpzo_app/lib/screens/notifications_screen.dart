import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api_client.dart';

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
  }

  Future<void> _fetchNotifications() async {
    try {
      final res = await apiClient.get('/api/notifications');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _notifications = data['notifications'] ?? [];
        });
      }
    } catch (e) {
      debugPrint('Error fetching notifications: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  IconData _getIconForType(String type) {
    switch (type) {
      case 'Notice':
        return Icons.campaign;
      case 'Assignment':
        return Icons.assignment;
      case 'Message':
        return Icons.message;
      default:
        return Icons.notifications;
    }
  }

  Color _getColorForType(String type) {
    switch (type) {
      case 'Notice':
        return const Color(0xFFE91E63);
      case 'Assignment':
        return const Color(0xFFFF9800);
      case 'Message':
        return const Color(0xFF2196F3);
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
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
          : _notifications.isEmpty
              ? const Center(
                  child: Text(
                    'No new notifications',
                    style: TextStyle(color: Color(0xFF6C7A76)),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _fetchNotifications,
                  color: const Color(0xFF00C2A8),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: _notifications.length,
                    itemBuilder: (context, index) {
                      final item = _notifications[index];
                      final type = item['type'] ?? 'General';
                      final title = item['title'] ?? 'Notification';
                      final description = item['description'] ?? '';
                      final isRead = item['isRead'] ?? true;
                      final date = item['date'] != null 
                          ? DateTime.parse(item['date']) 
                          : DateTime.now();

                      return Container(
                        margin: const EdgeInsets.only(bottom: 12),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: isRead ? Colors.white : const Color(0xFFE6F8F5),
                          borderRadius: BorderRadius.circular(16),
                          border: Border.all(
                            color: isRead 
                                ? const Color(0xFFE2E2E5).withAlpha(128) 
                                : const Color(0xFF00C2A8).withAlpha(128),
                          ),
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withAlpha(8),
                              blurRadius: 10,
                              offset: const Offset(0, 4),
                            )
                          ],
                        ),
                        child: Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: _getColorForType(type).withAlpha(30),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                _getIconForType(type),
                                color: _getColorForType(type),
                                size: 24,
                              ),
                            ),
                            const SizedBox(width: 16),
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
                                          fontSize: 12,
                                          color: Color(0xFF6C7A76),
                                        ),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    title,
                                    style: const TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.bold,
                                      color: Color(0xFF1A1C1E),
                                    ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    description,
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF3C4A46),
                                    ),
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ),
                      );
                    },
                  ),
                ),
    );
  }

  String _formatTimeAgo(DateTime date) {
    final diff = DateTime.now().difference(date);
    if (diff.inMinutes < 60) {
      return '${diff.inMinutes}m ago';
    } else if (diff.inHours < 24) {
      return '${diff.inHours}h ago';
    } else {
      return '${diff.inDays}d ago';
    }
  }
}
