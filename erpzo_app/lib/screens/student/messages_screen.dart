import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../widgets/custom_app_bar.dart';
import '../../api_client.dart';


class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _isLoading = true;
  List<Map<String, dynamic>> _conversations = [];
  List<Map<String, dynamic>> _filteredConversations = [];
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    _fetchMessages();
  }

  Future<void> _fetchMessages() async {
    try {
      const storage = FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        _currentUserId = userData['id'];
      }

      final res = await apiClient.get('/api/messages');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final messages = data['messages'] as List<dynamic>? ?? [];
        
        // Group by conversation
        final Map<String, Map<String, dynamic>> convs = {};
        for (var msg in messages) {
          final isSender = msg['senderId'] == _currentUserId;
          final otherUser = isSender ? msg['receiver'] : msg['sender'];
          final otherUserId = isSender ? msg['receiverId'] : msg['senderId'];
          final otherUserName = isSender ? msg['receiverName'] : msg['senderName'];

          if (otherUserId != null && !convs.containsKey(otherUserId)) {
            convs[otherUserId] = {
              'userId': otherUserId,
              'name': otherUserName ?? 'Unknown User',
              'latestMessage': msg['content'] ?? '',
              'time': msg['createdAt'],
              'isUnread': false, // No read status in backend yet
              'role': otherUser['role'],
            };
          }
        }

        if (mounted) {
          setState(() {
            _conversations = convs.values.toList();
            _filteredConversations = _conversations;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching messages: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _filter(String query) {
    if (query.isEmpty) {
      setState(() => _filteredConversations = _conversations);
      return;
    }
    setState(() {
      _filteredConversations = _conversations.where((c) {
        final name = c['name']?.toString().toLowerCase() ?? '';
        return name.contains(query.toLowerCase());
      }).toList();
    });
  }

  String _formatTime(String? isoStr) {
    if (isoStr == null) return '';
    try {
      final date = DateTime.parse(isoStr).toLocal();
      final now = DateTime.now();
      
      String twoDigits(int n) => n.toString().padLeft(2, '0');
      
      if (date.year == now.year && date.month == now.month && date.day == now.day) {
        final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
        final ampm = date.hour >= 12 ? 'PM' : 'AM';
        return '$hour:${twoDigits(date.minute)} $ampm';
      }
      
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      final month = months[date.month - 1];
      return '$month ${date.day}';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            const CustomAppBar(
              title: 'Messages',
              showBackButton: true,
            ),
            // Search Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 24, 20, 24),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFE2E2E5)),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(12),
                      blurRadius: 20,
                      offset: const Offset(0, 4),
                    )
                  ],
                ),
                child: TextField(
                  onChanged: _filter,
                  decoration: const InputDecoration(
                    hintText: 'Search conversations...',
                    hintStyle: TextStyle(
                      color: Color(0xFF6C7A76),
                      fontSize: 14,
                    ),
                    prefixIcon: Icon(Icons.search, color: Color(0xFF6C7A76)),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                  ),
                ),
              ),
            ),
            
            // Message List
            Expanded(
              child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                : _filteredConversations.isEmpty
                  ? const Center(child: Text('No messages found.'))
                  : ListView.separated(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                      physics: const BouncingScrollPhysics(),
                      itemCount: _filteredConversations.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 8),
                      itemBuilder: (context, index) {
                        final conv = _filteredConversations[index];
                        final name = conv['name'] as String;
                        final initials = name.split(' ').where((s) => s.isNotEmpty).take(2).map((s) => s[0]).join().toUpperCase();
                        
                        return _buildMessageItem(
                          name: name,
                          time: _formatTime(conv['time']),
                          subject: conv['role']?.toString() ?? '',
                          snippet: conv['latestMessage'],
                          initials: initials,
                          isUnread: conv['isUnread'],
                          onTap: () {
                            Navigator.of(context).pushNamed('/teacher_chat', arguments: {
                              'otherUserId': conv['userId'],
                              'otherUserName': name,
                            });
                          },
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMessageItem({
    required String name,
    required String time,
    required String subject,
    required String snippet,
    String? imageUrl,
    String? initials,
    Color? initialsColor,
    bool isUnread = false,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isUnread ? const Color(0xFF00C2A8).withAlpha(50) : Colors.transparent,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withAlpha(12),
              blurRadius: 20,
              offset: const Offset(0, 4),
            )
          ],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Avatar
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  width: 56,
                  height: 56,
                  decoration: BoxDecoration(
                    color: initialsColor ?? const Color(0xFFE2E2E5),
                    shape: BoxShape.circle,
                    image: imageUrl != null
                        ? DecorationImage(
                            image: NetworkImage(imageUrl),
                            fit: BoxFit.cover,
                          )
                        : null,
                  ),
                  child: initials != null
                      ? Center(
                          child: Text(
                            initials,
                            style: const TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF003E73), // on-secondary-container
                            ),
                          ),
                        )
                      : null,
                ),
                if (isUnread)
                  Positioned(
                    top: -2,
                    right: -2,
                    child: Container(
                      width: 16,
                      height: 16,
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C2A8),
                        shape: BoxShape.circle,
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                    ),
                  ),
              ],
            ),
            const SizedBox(width: 16),
            
            // Content
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: Text(
                          name,
                          style: const TextStyle(
                            fontSize: 18,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF1A1C1E),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        time,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: isUnread ? const Color(0xFF006B5C) : const Color(0xFF6C7A76),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 4),
                  Text(
                    subject,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isUnread ? FontWeight.w600 : FontWeight.normal,
                      color: isUnread ? const Color(0xFF1A1C1E) : const Color(0xFF3C4A46),
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (snippet.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      snippet,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF3C4A46),
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ]
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
