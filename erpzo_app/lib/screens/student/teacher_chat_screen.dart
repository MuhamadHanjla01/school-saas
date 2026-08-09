import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;
import '../../api_client.dart';

class TeacherChatScreen extends StatefulWidget {
  const TeacherChatScreen({super.key});

  @override
  State<TeacherChatScreen> createState() => _TeacherChatScreenState();
}

class _TeacherChatScreenState extends State<TeacherChatScreen> {
  final TextEditingController _messageController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  bool _isLoading = true;
  String? _otherUserId;
  String? _otherUserName;
  String? _currentUserId;
  List<dynamic> _messages = [];
  IO.Socket? _socket;

  @override
  void initState() {
    super.initState();
    _connectSocket();
  }

  void _connectSocket() {
    _socket = IO.io('https://erpzo-backend.onrender.com', <String, dynamic>{
      'transports': ['websocket'],
      'autoConnect': true,
    });

    _socket?.onConnect((_) {
      debugPrint('Socket connected');
    });

    _socket?.on('new_message', (data) {
      if (!mounted) return;
      if (_otherUserId == null) return;
      
      // Only process message if it belongs to this conversation
      if ((data['senderId'] == _otherUserId && data['receiverId'] == _currentUserId) ||
          (data['senderId'] == _currentUserId && data['receiverId'] == _otherUserId)) {
        
        setState(() {
          // check if already added by optimistic UI
          bool exists = _messages.any((m) => m['id'] == data['id']);
          if (!exists) {
            _messages.add(data);
          }
        });
        _scrollToBottom();
      }
    });
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_otherUserId == null) {
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (args != null) {
        _otherUserId = args['otherUserId'];
        _otherUserName = args['otherUserName'];
        _fetchMessages();
      }
    }
  }

  Future<void> _fetchMessages() async {
    if (_otherUserId == null) return;
    
    try {
      const storage = FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        _currentUserId = userData['id'];
      }

      final res = await apiClient.get('/api/school/messages?withUser=$_otherUserId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            // API returns desc order (newest first). Reversing for UI.
            _messages = (data['messages'] as List<dynamic>? ?? []).reversed.toList();
            _isLoading = false;
          });
          _scrollToBottom();
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching chat messages: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _sendMessage() async {
    final text = _messageController.text.trim();
    if (text.isEmpty || _otherUserId == null) return;

    _messageController.clear();
    
    // Optimistic UI update
    final tempMsg = {
      'senderId': _currentUserId,
      'content': text,
      'createdAt': DateTime.now().toIso8601String(),
    };
    setState(() {
      _messages.add(tempMsg);
    });
    _scrollToBottom();

    try {
      final res = await apiClient.post('/api/school/messages', body: {
        'receiverId': _otherUserId,
        'content': text,
      });
      if (res.statusCode != 201) {
        // Handle failure if needed
        _fetchMessages(); // refresh to ensure consistency
      }
    } catch (e) {
      debugPrint('Error sending message: $e');
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  @override
  void dispose() {
    _socket?.disconnect();
    _socket?.dispose();
    _messageController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String _formatTime(String? isoStr) {
    if (isoStr == null) return '';
    try {
      final date = DateTime.parse(isoStr).toLocal();
      String twoDigits(int n) => n.toString().padLeft(2, '0');
      final hour = date.hour > 12 ? date.hour - 12 : (date.hour == 0 ? 12 : date.hour);
      final ampm = date.hour >= 12 ? 'PM' : 'AM';
      return '$hour:${twoDigits(date.minute)} $ampm';
    } catch (_) {
      return '';
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF9F9FC),
      appBar: _buildAppBar(context),
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                : ListView.builder(
                    controller: _scrollController,
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                    itemCount: _messages.length,
                    itemBuilder: (context, index) {
                      final msg = _messages[index];
                      final isMine = msg['senderId'] == _currentUserId;
                      final timeStr = _formatTime(msg['createdAt']);
                      
                      if (isMine) {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _buildOutgoingMessage(
                            text: msg['content'] ?? '',
                            time: timeStr,
                            isRead: false, // Not tracked in backend yet
                          ),
                        );
                      } else {
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: _buildIncomingMessage(
                            text: msg['content'] ?? '',
                            time: timeStr,
                          ),
                        );
                      }
                    },
                  ),
            ),
            _buildMessageInput(),
          ],
        ),
      ),
    );
  }

  PreferredSizeWidget _buildAppBar(BuildContext context) {
    final initials = (_otherUserName ?? 'Unknown')
        .split(' ')
        .where((s) => s.isNotEmpty)
        .take(2)
        .map((s) => s[0])
        .join()
        .toUpperCase();

    return AppBar(
      backgroundColor: const Color(0xFFF9F9FC),
      elevation: 0,
      scrolledUnderElevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Color(0xFF3C4A46)),
        onPressed: () => Navigator.of(context).pop(),
      ),
      titleSpacing: 0,
      title: Row(
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: const Color(0xFFE2E2E5),
              border: Border.all(color: const Color(0xFFE2E2E5), width: 1),
            ),
            alignment: Alignment.center,
            child: Text(
              initials,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: Color(0xFF003E73),
              ),
            ),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                _otherUserName ?? 'Chat',
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1C1E),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildIncomingMessage({
    required String text,
    String? time,
    bool showTime = true,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          constraints: BoxConstraints(
            maxWidth: MediaQuery.of(context).size.width * 0.85,
          ),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: const BorderRadius.only(
              topLeft: Radius.circular(4),
              topRight: Radius.circular(16),
              bottomLeft: Radius.circular(16),
              bottomRight: Radius.circular(16),
            ),
            border: Border.all(color: const Color(0xFFE2E2E5).withAlpha(128)),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withAlpha(12),
                blurRadius: 20,
                offset: const Offset(0, 4),
              )
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                text,
                style: const TextStyle(
                  fontSize: 14,
                  height: 1.4,
                  color: Color(0xFF1A1C1E),
                ),
              ),
            ],
          ),
        ),
        if (showTime && time != null) ...[
          const SizedBox(height: 4),
          Padding(
            padding: const EdgeInsets.only(left: 4),
            child: Text(
              time,
              style: const TextStyle(
                fontSize: 12,
                color: Color(0xFF6C7A76),
              ),
            ),
          ),
        ]
      ],
    );
  }

  Widget _buildOutgoingMessage({
    required String text,
    required String time,
    required bool isRead,
  }) {
    return Align(
      alignment: Alignment.centerRight,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          Container(
            constraints: BoxConstraints(
              maxWidth: MediaQuery.of(context).size.width * 0.85,
            ),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFF00C2A8),
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(16),
                topRight: Radius.circular(4),
                bottomLeft: Radius.circular(16),
                bottomRight: Radius.circular(16),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withAlpha(12),
                  blurRadius: 20,
                  offset: const Offset(0, 4),
                )
              ],
            ),
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 14,
                height: 1.4,
                color: Color(0xFF00493E), // on-primary-container equivalent
              ),
            ),
          ),
          const SizedBox(height: 4),
          Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                time,
                style: const TextStyle(
                  fontSize: 12,
                  color: Color(0xFF6C7A76),
                ),
              ),
              const SizedBox(width: 4),
              Icon(
                Icons.done_all,
                size: 14,
                color: isRead ? const Color(0xFF006B5C) : const Color(0xFF6C7A76),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMessageInput() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: const Color(0xFFE2E2E5).withAlpha(128)),
        ),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          IconButton(
            icon: const Icon(Icons.add, color: Color(0xFF3C4A46)),
            onPressed: () => _showAttachmentOptions(context),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                color: const Color(0xFFF3F3F6),
                borderRadius: BorderRadius.circular(24),
                border: Border.all(color: const Color(0xFFE2E2E5)),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Expanded(
                    child: TextField(
                      controller: _messageController,
                      minLines: 1,
                      maxLines: 5,
                      decoration: const InputDecoration(
                        hintText: 'Type a message...',
                        hintStyle: TextStyle(
                          color: Color(0xFF6C7A76),
                          fontSize: 14,
                        ),
                        border: InputBorder.none,
                        contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      ),
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(4.0),
                    child: Container(
                      decoration: const BoxDecoration(
                        color: Color(0xFF00C2A8),
                        shape: BoxShape.circle,
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.send, color: Color(0xFF00493E), size: 20),
                        onPressed: _sendMessage,
                        constraints: const BoxConstraints(),
                        padding: const EdgeInsets.all(8),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showAttachmentOptions(BuildContext context) {
    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 20),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const Padding(
                  padding: EdgeInsets.only(bottom: 16),
                  child: Text(
                    'Attach Image',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A1C1E),
                    ),
                  ),
                ),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00C2A8).withAlpha(25),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.image_outlined, color: Color(0xFF006B5C)),
                  ),
                  title: const Text('Gallery'),
                  onTap: () {
                    Navigator.pop(context);
                    // Handle gallery action
                  },
                ),
                ListTile(
                  leading: Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFF68ABFF).withAlpha(25),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.camera_alt_outlined, color: Color(0xFF0060AC)),
                  ),
                  title: const Text('Camera'),
                  onTap: () {
                    Navigator.pop(context);
                    // Handle camera action
                  },
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
