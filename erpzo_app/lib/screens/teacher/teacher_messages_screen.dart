import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../api_client.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_app_bar.dart';

class TeacherMessagesScreen extends StatefulWidget {
  const TeacherMessagesScreen({super.key});

  @override
  State<TeacherMessagesScreen> createState() => _TeacherMessagesScreenState();
}

class _TeacherMessagesScreenState extends State<TeacherMessagesScreen> {
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

          if (otherUserId != null && !convs.containsKey(otherUserId)) {
            convs[otherUserId] = {
              'userId': otherUserId,
              'name': otherUserName ?? 'Unknown User',
              'latestMessage': msg['content'] ?? '',
              'time': msg['createdAt'],
              'isUnread': false, // No read status in backend yet
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
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching messages: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _filter(String query) {
    if (query.isEmpty) {
      setState(() {
        _filteredConversations = _conversations;
      });
      return;
    }
    setState(() {
      _filteredConversations = _conversations.where((c) {
        final name = c['name']?.toString().toLowerCase() ?? '';
        final content = c['latestMessage']?.toString().toLowerCase() ?? '';
        final q = query.toLowerCase();
        return name.contains(q) || content.contains(q);
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

  // Colors based on the provided tailwind config
  static const Color surfaceColor = Color(0xFFF9F9FC);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color primaryColor = Color(0xFF006B5C);
  static const Color primaryContainer = Color(0xFF00C2A8);
  static const Color onSurface = Color(0xFF1A1C1E);
  static const Color onSurfaceVariant = Color(0xFF3C4A46);
  static const Color outlineColor = Color(0xFF6C7A76);
  static const Color surfaceVariant = Color(0xFFE2E2E5);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: surfaceColor,
      drawer: const AppDrawer(isTeacher: true, currentRoute: '/teacher_messages'),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          showModalBottomSheet(
            context: context,
            isScrollControlled: true,
            backgroundColor: Colors.transparent,
            builder: (context) => const _NewMessageSheet(),
          );
        },
        backgroundColor: primaryContainer,
        child: const Icon(Icons.edit, color: Color(0xFF00493E)),
      ),
      body: SafeArea(
        child: Column(
          children: [
            CustomAppBar(
              title: 'Messages',
              isTeacher: true,
              onMenuPressed: () {
                _scaffoldKey.currentState?.openDrawer();
              },
            ),
            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: primaryColor))
                : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildSearchBar(),
                    const SizedBox(height: 24),
                    if (_filteredConversations.isEmpty)
                      const Center(child: Text("No messages.")),
                    ..._filteredConversations.map((conv) {
                      final name = conv['name'] as String;
                      final initials = name.split(' ').where((s) => s.isNotEmpty).take(2).map((s) => s[0]).join().toUpperCase();

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: _buildMessageItem(
                          name: name,
                          time: _formatTime(conv['time']),
                          subject: '', // No subject in model
                          snippet: conv['latestMessage'],
                          initials: initials,
                          isUnread: conv['isUnread'],
                          onTap: () {
                            Navigator.of(context).pushNamed('/teacher_chat', arguments: {
                              'otherUserId': conv['userId'],
                              'otherUserName': name,
                            });
                          },
                        ),
                      );
                    }),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildSearchBar() {
    return Container(
      decoration: BoxDecoration(
        color: surfaceContainerLowest,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: surfaceVariant),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: TextField(
        onChanged: _filter,
        decoration: const InputDecoration(
          hintText: 'Search conversations...',
          hintStyle: TextStyle(
            color: outlineColor,
            fontSize: 14,
          ),
          prefixIcon: Icon(Icons.search, color: outlineColor),
          border: InputBorder.none,
          contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
          color: surfaceContainerLowest,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(
            color: isUnread ? primaryContainer.withOpacity(0.2) : Colors.transparent,
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 16,
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
                    color: initialsColor ?? surfaceVariant,
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
                        color: primaryContainer,
                        shape: BoxShape.circle,
                        border: Border.all(color: surfaceContainerLowest, width: 2),
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
                            color: onSurface,
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
                          color: isUnread ? primaryColor : outlineColor,
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
                      color: isUnread ? onSurface : onSurfaceVariant,
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
                        color: onSurfaceVariant,
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
  List<dynamic> _students = [];
  List<dynamic> _filteredStudents = [];

  @override
  void initState() {
    super.initState();
    _fetchStudents();
  }

  Future<void> _fetchStudents() async {
    try {
      final res = await apiClient.get('/api/students');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _students = data['students'] ?? [];
            _filteredStudents = _students;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching students: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _filter(String query) {
    if (query.isEmpty) {
      setState(() => _filteredStudents = _students);
      return;
    }
    setState(() {
      _filteredStudents = _students.where((s) {
        final name = (s['name'] ?? '').toString().toLowerCase();
        final email = (s['email'] ?? '').toString().toLowerCase();
        return name.contains(query.toLowerCase()) || email.contains(query.toLowerCase());
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
                hintText: 'Search students...',
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
                : _filteredStudents.isEmpty
                    ? const Center(child: Text('No students found.'))
                    : ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                        itemCount: _filteredStudents.length,
                        itemBuilder: (context, index) {
                          final student = _filteredStudents[index];
                          final name = student['name'] ?? 'Unknown';
                          final className = student['class'] != null ? 'Class ${student['class']['name']}' : 'Student';
                          final user = student['user'];
                          final userId = user != null ? user['id'] : null;

                          return ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: CircleAvatar(
                              backgroundColor: const Color(0xFF00C2A8).withOpacity(0.1),
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
                              className,
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
                                  const SnackBar(content: Text('This student has no user account.')),
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
