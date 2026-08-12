import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../widgets/custom_app_bar.dart';
import '../../api_client.dart';
import '../../services/socket_service.dart';


class MessagesScreen extends StatefulWidget {
  const MessagesScreen({super.key});

  @override
  State<MessagesScreen> createState() => _MessagesScreenState();
}

class _MessagesScreenState extends State<MessagesScreen> with WidgetsBindingObserver {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _isLoading = true;
  List<Map<String, dynamic>> _conversations = [];
  List<Map<String, dynamic>> _filteredConversations = [];
  String? _currentUserId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    _fetchMessages();
    _listenForNewMessages();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    SocketService().off('new_message');
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _fetchMessages();
    }
  }

  void _listenForNewMessages() {
    SocketService().on('new_message', (data) {
      if (!mounted || _currentUserId == null) return;
      // Only refresh if this message involves the current user
      if (data['senderId'] == _currentUserId || data['receiverId'] == _currentUserId) {
        _fetchMessages();
      }
    });
  }

  Future<void> _fetchMessages() async {
    try {
      const storage = FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        _currentUserId = userData['id'];
      }

      final res = await apiClient.get('/api/school/messages');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final messages = data['messages'] as List<dynamic>? ?? [];
        
        // Group by conversation
        final Map<String, Map<String, dynamic>> convs = {};
        for (var msg in messages) {
          final isSender = msg['senderId'] == _currentUserId;
          final otherUserId = isSender ? msg['receiverId'] : msg['senderId'];
          final otherUserName = isSender ? msg['receiverName'] : msg['senderName'];
          // Safely access nested sender/receiver role
          final otherUser = isSender ? msg['receiver'] : msg['sender'];
          final otherRole = (otherUser is Map) ? (otherUser['role'] ?? 'Unknown') : 'Unknown';

          if (otherUserId != null && !convs.containsKey(otherUserId)) {
            // Count unread: messages sent TO me by this user that are not read
            final unreadCount = messages.where((m) =>
              m['senderId'] == otherUserId &&
              m['receiverId'] == _currentUserId &&
              m['read'] == false
            ).length;

            final content = (msg['content'] as String?)?.trim() ?? '';
            final snippet = content.isNotEmpty ? content : (msg['imageUrl'] != null ? '📷 Photo' : '');

            convs[otherUserId] = {
              'userId': otherUserId,
              'name': otherUserName ?? 'Unknown User',
              'latestMessage': snippet,
              'time': msg['createdAt'],
              'isUnread': unreadCount > 0,
              'unreadCount': unreadCount,
              'role': otherRole,
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
      } else {
        if (mounted) {
          setState(() {
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

  void _showNewMessageDialog() {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      isScrollControlled: true,
      builder: (context) {
        return const _NewMessageSheet();
      },
    );
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
                : RefreshIndicator(
                    color: const Color(0xFF00C2A8),
                    onRefresh: _fetchMessages,
                    child: _filteredConversations.isEmpty
                      ? ListView(
                          children: const [
                            SizedBox(height: 120),
                            Center(child: Text('No messages found.')),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
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
                              isUnread: conv['isUnread'] ?? false,
                              unreadCount: conv['unreadCount'] ?? 0,
                              onTap: () {
                                Navigator.of(context).pushNamed('/teacher_chat', arguments: {
                                  'otherUserId': conv['userId'],
                                  'otherUserName': name,
                                }).then((_) => _fetchMessages()); // Refresh on return
                              },
                            );
                          },
                        ),
                  ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showNewMessageDialog,
        backgroundColor: const Color(0xFF00C2A8),
        child: const Icon(Icons.add, color: Colors.white),
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
    int unreadCount = 0,
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
                if (isUnread && unreadCount > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C2A8),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: Colors.white, width: 2),
                      ),
                      child: Text(
                        unreadCount > 99 ? '99+' : '$unreadCount',
                        style: const TextStyle(
                          color: Color(0xFF00493E),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
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
                          style: TextStyle(
                            fontSize: 18,
                            fontWeight: isUnread ? FontWeight.w700 : FontWeight.w600,
                            color: const Color(0xFF1A1C1E),
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
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: isUnread ? FontWeight.w500 : FontWeight.normal,
                        color: const Color(0xFF3C4A46),
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

class _NewMessageSheet extends StatefulWidget {
  const _NewMessageSheet({super.key});

  @override
  State<_NewMessageSheet> createState() => _NewMessageSheetState();
}

class _NewMessageSheetState extends State<_NewMessageSheet> {
  bool _isLoading = true;
  List<dynamic> _teachers = [];
  List<dynamic> _filteredTeachers = [];

  @override
  void initState() {
    super.initState();
    _fetchTeachers();
  }

  Future<void> _fetchTeachers() async {
    try {
      final res = await apiClient.get('/api/teachers');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _teachers = data['teachers'] ?? [];
            _filteredTeachers = _teachers;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching teachers: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _filter(String query) {
    if (query.isEmpty) {
      setState(() => _filteredTeachers = _teachers);
      return;
    }
    setState(() {
      _filteredTeachers = _teachers.where((t) {
        final name = (t['name'] ?? '').toString().toLowerCase();
        final dept = (t['department'] ?? '').toString().toLowerCase();
        return name.contains(query.toLowerCase()) || dept.contains(query.toLowerCase());
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.only(
          topLeft: Radius.circular(24),
          topRight: Radius.circular(24),
        ),
      ),
      child: Column(
        children: [
          const SizedBox(height: 12),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey[300],
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'New Message',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1B2522),
            ),
          ),
          const SizedBox(height: 16),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20),
            child: TextField(
              onChanged: _filter,
              decoration: InputDecoration(
                hintText: 'Search teachers...',
                prefixIcon: const Icon(Icons.search, color: Color(0xFF6C7A76)),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: Color(0xFFE2E2E5)),
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                : _filteredTeachers.isEmpty
                    ? const Center(child: Text('No teachers found.'))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        itemCount: _filteredTeachers.length,
                        itemBuilder: (context, index) {
                          final teacher = _filteredTeachers[index];
                          final name = teacher['name'] ?? 'Unknown';
                          final dept = teacher['department'] ?? 'Teacher';
                          final user = teacher['user'];
                          final userId = user != null ? user['id'] : null;

                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFF00C2A8).withAlpha(25),
                              child: Text(
                                name[0].toUpperCase(),
                                style: const TextStyle(
                                  color: Color(0xFF00C2A8),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            title: Text(
                              name,
                              style: const TextStyle(
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF1B2522),
                              ),
                            ),
                            subtitle: Text(
                              dept,
                              style: const TextStyle(color: Color(0xFF6C7A76)),
                            ),
                            onTap: () {
                              if (userId != null) {
                                Navigator.pop(context); // Close sheet
                                Navigator.of(context).pushNamed('/teacher_chat', arguments: {
                                  'otherUserId': userId,
                                  'otherUserName': name,
                                });
                              } else {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  const SnackBar(content: Text('This teacher has no user account.')),
                                );
                              }
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
