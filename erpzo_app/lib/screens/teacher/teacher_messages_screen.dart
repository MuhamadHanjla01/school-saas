import 'dart:convert';
import 'package:flutter/material.dart';
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
  List<dynamic> _messages = [];
  bool _isLoading = true;
  String _searchQuery = '';
  
  @override
  void initState() {
    super.initState();
    _fetchMessages();
  }

  Future<void> _fetchMessages() async {
    try {
      final res = await apiClient.get('/api/school/messages');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _messages = data['messages'] as List;
          _isLoading = false;
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching messages: $e');
      if (mounted) setState(() => _isLoading = false);
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
                    if (_messages.isEmpty)
                      const Center(child: Text("No messages.")),
                    ..._messages.where((m) {
                      if (_searchQuery.isEmpty) return true;
                      final sender = (m['senderName'] ?? '').toString().toLowerCase();
                      final content = (m['content'] ?? '').toString().toLowerCase();
                      final query = _searchQuery.toLowerCase();
                      return sender.contains(query) || content.contains(query);
                    }).map((m) {
                      String rawDate = m['createdAt'] ?? '';
                      String formattedTime = '';
                      if (rawDate.isNotEmpty) {
                        try {
                          final dt = DateTime.parse(rawDate).toLocal();
                          formattedTime = "${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}";
                        } catch (_) {}
                      }
                      
                      String senderName = m['senderName'] ?? 'Unknown';
                      String initials = senderName.isNotEmpty ? senderName[0].toUpperCase() : '?';

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 12.0),
                        child: _buildMessageItem(
                          name: senderName,
                          time: formattedTime,
                          subject: m['content'] ?? '',
                          snippet: '',
                          initials: initials,
                          isUnread: !(m['read'] ?? true),
                          onTap: () {},
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
        onChanged: (val) {
          setState(() {
            _searchQuery = val;
          });
        },
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
