import 'dart:convert';
import 'package:flutter/material.dart';
import '../api_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../services/socket_service.dart';

class CustomAppBar extends StatefulWidget {
  final VoidCallback? onMenuPressed;
  final String? title;
  final bool showBackButton;
  final bool isTeacher;
  final Widget? trailing;

  const CustomAppBar({
    super.key, 
    this.onMenuPressed, 
    this.title,
    this.showBackButton = false,
    this.isTeacher = false,
    this.trailing,
  });

  @override
  State<CustomAppBar> createState() => _CustomAppBarState();
}

class _CustomAppBarState extends State<CustomAppBar> {
  int _unreadCount = 0;
  Map<String, dynamic>? _userData;
  final _storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    _fetchUnreadCount();
    _loadUserData();
    
    final socketService = SocketService();
    socketService.on('profile_updated', _onProfileUpdated);
    socketService.on('new_notification', _onNewNotification);
    socketService.on('new_notice', _onNewNotice);
  }

  void _onProfileUpdated(dynamic data) {
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        _loadUserData();
      }
    });
  }

  void _onNewNotification(dynamic data) {
    if (mounted) {
      _fetchUnreadCount();
    }
  }

  void _onNewNotice(dynamic data) {
    if (mounted) {
      _fetchUnreadCount();
    }
  }

  @override
  void dispose() {
    final socket = SocketService();
    socket.off('profile_updated');
    socket.off('new_notification');
    socket.off('new_notice');
    super.dispose();
  }

  Future<void> _loadUserData() async {
    final dataStr = await _storage.read(key: 'user_data');
    if (dataStr != null) {
      if (mounted) {
        setState(() {
          _userData = jsonDecode(dataStr);
        });
      }
    }
  }

  Future<void> _fetchUnreadCount() async {
    try {
      final res = await apiClient.get('/api/notifications');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final notifications = data['notifications'] as List<dynamic>? ?? [];
        final count = notifications.where((n) => n['isRead'] == false).length;
        if (mounted) {
          setState(() {
            _unreadCount = count;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching unread notifications: $e');
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color primaryColor = Color(0xFF006B5C);
    
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20.0, vertical: 8.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: Icon(widget.showBackButton ? Icons.arrow_back : Icons.grid_view, color: primaryColor, size: 28),
            onPressed: widget.showBackButton 
                ? () => Navigator.of(context).pushNamedAndRemoveUntil(
                    widget.isTeacher ? '/teacher_dashboard' : '/dashboard', 
                    (route) => false,
                  )
                : widget.onMenuPressed,
          ),
          Text(
            widget.title ?? 'iNiLabs School',
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              letterSpacing: -0.5,
              color: Color(0xFF1A1C1E),
            ),
          ),
          if (widget.trailing != null)
            widget.trailing!
          else if (widget.showBackButton)
            IconButton(
              icon: const Icon(Icons.person_outline, color: primaryColor, size: 28),
              onPressed: () => Navigator.of(context).pushReplacementNamed(widget.isTeacher ? '/teacher_own_profile' : '/profile'),
            )
          else
            Row(
              children: [
                Stack(
                  children: [
                    IconButton(
                      icon: const Icon(Icons.notifications_none, color: primaryColor, size: 28),
                      onPressed: () async {
                        // Navigate to Notifications Screen
                        await Navigator.pushNamed(context, '/notifications');
                        // Refresh count when coming back
                        _fetchUnreadCount();
                      },
                    ),
                    if (_unreadCount > 0)
                      Positioned(
                        right: 12,
                        top: 12,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: Colors.red,
                            borderRadius: BorderRadius.circular(6),
                          ),
                          constraints: const BoxConstraints(
                            minWidth: 12,
                            minHeight: 12,
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 8),
                GestureDetector(
                  onTap: () {
                    Navigator.of(context).pushReplacementNamed(widget.isTeacher ? '/teacher_own_profile' : '/profile');
                  },
                  child: Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withAlpha(13),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                      image: DecorationImage(
                        image: _userData != null && _userData!['avatar'] != null 
                            ? NetworkImage('https://erpzo-backend.onrender.com${_userData!['avatar']}') 
                            : const NetworkImage('https://lh3.googleusercontent.com/aida-public/AB6AXuDxthVtnHUvyZC61rtsLhP74xe_zGLJVf3Ov4ljqyDYCzxFc0SsPJxfpiGN6Eh_94yGTSBnRcfCOY1LwlEZo1g5h-ofMHCyj8Sf0mLMrmliU3Jxe8gdO2BC_6iZXnu9PT-a93A1zroL91g2b_9Z4UiDCeq_dEtsCi5QqA9ryrcvJ_yZbZQqpnAsi4jlsdlojVLremQx101IiUG2CEalvWueFVRFHKqA-ILpw3WLZrJxtPWP0TWvl8AF-da_Ez8OadpLsNwSdxe2Nq6b') as ImageProvider,
                        fit: BoxFit.cover,
                      ),
                    ),
                  ),
                ),
              ],
            ),
        ],
      ),
    );
  }
}
