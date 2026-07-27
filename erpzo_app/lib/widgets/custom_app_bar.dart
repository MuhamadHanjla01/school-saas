import 'dart:convert';
import 'package:flutter/material.dart';
import '../api_client.dart';

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

  @override
  void initState() {
    super.initState();
    _fetchUnreadCount();
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
                      image: const DecorationImage(
                        image: NetworkImage(
                            'https://lh3.googleusercontent.com/aida-public/AB6AXuCcTVQ55-LqWVrfBiaX87Kci_GwPVlKS0krtPHuSGG3jmN2SpoFOmUzEiiMXUNxR9zHcKWsdp2FWcg2NHaBJDEFnc10-0H9DseieBOuGSZMOafY7GA6olBvNYNe2UkEIIK7MRpQAWnMATzyd9cfi8ggDo9PCCOTic8osSEjM7_2N0NwaqvtZ5IBl5m_LvXVqU99Q0BAQBOTlwmd3Evs_P1qb-70W-s6xPtr2HQlKa7tU3sowUN-OLiGyGpoM_TxMYZeCKjudLpUeKg1'),
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
