import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter_background_service/flutter_background_service.dart';
import '../services/socket_service.dart';

class AppDrawer extends StatefulWidget {
  final String currentRoute; 
  final bool isTeacher;

  const AppDrawer({super.key, this.currentRoute = '/dashboard', this.isTeacher = false});

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  Map<String, dynamic>? _userData;
  final _storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    _loadUserData();
    
    // Setup Socket.io real-time connection for live updates while drawer is open
    final socketService = SocketService();
    socketService.on('profile_updated', _onProfileUpdated);
  }

  void _onProfileUpdated(dynamic data) {
    // We delay slightly to allow the main screen to fetch and save the new data to SecureStorage
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        _loadUserData();
      }
    });
  }

  @override
  void dispose() {
    SocketService().off('profile_updated');
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

  @override
  Widget build(BuildContext context) {
    const Color primaryColor = Color(0xFF006B5C);
    const Color primaryContainer = Color(0xFF00C2A8);
    const Color onPrimaryContainer = Color(0xFF00493E);
    const Color surfaceColor = Color(0xFFF9F9FC);
    const Color onSurface = Color(0xFF1A1C1E);
    const Color onSurfaceVariant = Color(0xFF3C4A46);
    const Color outlineVariant = Color(0xFFBBCAC4);
    const Color errorColor = Color(0xFFBA1A1A);
    const Color onError = Colors.white;

    String userName = widget.isTeacher ? 'Loading...' : 'Loading...';
    String subText1 = widget.isTeacher ? '...' : '...';
    String subText2 = widget.isTeacher ? '...' : '...';

    if (_userData != null) {
      if (widget.isTeacher) {
        final teacher = _userData!['teacher'];
        if (teacher != null) {
          userName = teacher['name'] ?? 'Teacher';
          subText1 = teacher['department'] ?? 'Department';
          subText2 = 'EMP ID: ${teacher['employeeId'] ?? ''}';
        } else {
          userName = _userData!['email'] ?? 'Teacher';
        }
      } else {
        final student = _userData!['student'];
        if (student != null) {
          userName = student['name'] ?? 'Student';
          subText1 = student['class']?['name'] != null ? 'Grade ${student['class']['name']}' : 'No Class';
          subText2 = 'ID: ${student['studentId'] ?? ''}';
        } else {
          userName = _userData!['email'] ?? 'Student';
        }
      }
    }

    return Drawer(
      backgroundColor: surfaceColor,
      surfaceTintColor: Colors.transparent,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.horizontal(right: Radius.circular(16)),
      ),
      child: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Brand Logo Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 24, 24, 32),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'iNiLabs School',
                    style: TextStyle(
                      fontFamily: 'Inter',
                      fontSize: 24,
                      fontWeight: FontWeight.w900,
                      color: primaryColor,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: onSurfaceVariant),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                ],
              ),
            ),
            
            // Profile Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: null,
                  borderRadius: BorderRadius.circular(16),
                  child: Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8.0, horizontal: 8.0),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.center,
                      children: [
                        Container(
                          width: 48,
                          height: 48,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: primaryContainer, width: 2),
                            image: DecorationImage(
                              image: _userData != null && _userData!['avatar'] != null 
                                  ? NetworkImage('https://erpzo-backend.onrender.com${_userData!['avatar']}') 
                                  : const NetworkImage('https://lh3.googleusercontent.com/aida-public/AB6AXuDxthVtnHUvyZC61rtsLhP74xe_zGLJVf3Ov4ljqyDYCzxFc0SsPJxfpiGN6Eh_94yGTSBnRcfCOY1LwlEZo1g5h-ofMHCyj8Sf0mLMrmliU3Jxe8gdO2BC_6iZXnu9PT-a93A1zroL91g2b_9Z4UiDCeq_dEtsCi5QqA9ryrcvJ_yZbZQqpnAsi4jlsdlojVLremQx101IiUG2CEalvWueFVRFHKqA-ILpw3WLZrJxtPWP0TWvl8AF-da_Ez8OadpLsNwSdxe2Nq6b') as ImageProvider,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                userName,
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.w600,
                                  color: onSurface,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                subText1,
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: onSurfaceVariant,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                              Text(
                                subText2,
                                style: const TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                  color: Color(0xFF6C7A76),
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // Navigation Links
            Expanded(
              child: ListView(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                children: widget.isTeacher ? _buildTeacherNavItems(
                  context,
                  primaryContainer: primaryContainer,
                  onPrimaryContainer: onPrimaryContainer,
                  onSurfaceVariant: onSurfaceVariant,
                  outlineVariant: outlineVariant,
                ) : [
                  _buildNavItem(
                    icon: Icons.dashboard,
                    title: 'Dashboard',
                    isActive: widget.currentRoute == '/dashboard',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/dashboard') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/dashboard', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  _buildNavItem(
                    icon: Icons.school_outlined,
                    title: 'Class',
                    isActive: widget.currentRoute == '/class',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/class') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/class_routine', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  _buildNavItem(
                    icon: Icons.calendar_month_outlined,
                    title: 'Calendar',
                    isActive: widget.currentRoute == '/calendar',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/calendar') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/calendar', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  _buildNavItem(
                    icon: Icons.assignment_outlined,
                    title: 'Assignments',
                    isActive: widget.currentRoute == '/assignments',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/assignments') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/assignments', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  _buildNavItem(
                    icon: Icons.payments_outlined,
                    title: 'Fee',
                    isActive: widget.currentRoute == '/fee',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/fee') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/fee', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  _buildNavItem(
                    icon: Icons.menu_book_outlined,
                    title: 'My Teacher',
                    isActive: widget.currentRoute == '/teacher',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/teacher') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/teacher', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  _buildNavItem(
                    icon: Icons.mail_outline,
                    title: 'My Message',
                    isActive: widget.currentRoute == '/messages',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    errorColor: errorColor,
                    onError: onError,
                    onTap: () {
                      if (widget.currentRoute != '/messages') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/messages', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  _buildNavItem(
                    icon: Icons.bar_chart_outlined,
                    title: 'Report Card',
                    isActive: widget.currentRoute == '/report_card',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/report_card') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/report_card', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  _buildNavItem(
                    icon: Icons.description_outlined,
                    title: 'Exams',
                    isActive: widget.currentRoute == '/exams',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/exams') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/exams', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 16.0),
                    child: Divider(color: outlineVariant.withAlpha(128), height: 1),
                  ),
                  _buildNavItem(
                    icon: Icons.account_circle_outlined,
                    title: 'Profile',
                    isActive: widget.currentRoute == '/profile',
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () {
                      if (widget.currentRoute != '/profile') {
                        Navigator.of(context).pushNamedAndRemoveUntil('/profile', (route) => false);
                      } else {
                        Navigator.of(context).pop();
                      }
                    },
                  ),
                ],
              ),
            ),
            
            // Logout
            Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                children: [
                  Divider(color: outlineVariant.withAlpha(77), height: 1),
                  const SizedBox(height: 16),
                  _buildNavItem(
                    icon: Icons.logout,
                    title: 'Logout',
                    isActive: false,
                    primaryContainer: primaryContainer,
                    onPrimaryContainer: onPrimaryContainer,
                    onSurfaceVariant: onSurfaceVariant,
                    onTap: () async {
                      await _storage.delete(key: 'jwt_token');
                      await _storage.delete(key: 'refresh_token');
                      await _storage.delete(key: 'user_data');
                      
                      final prefs = await SharedPreferences.getInstance();
                      await prefs.remove('jwt_token_bg');
                      
                      final service = FlutterBackgroundService();
                      service.invoke('stopService');
                      
                      if (context.mounted) {
                        Navigator.of(context).pushNamedAndRemoveUntil('/login', (route) => false);
                      }
                    },
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNavItem({
    required IconData icon,
    required String title,
    required bool isActive,
    required Color primaryContainer,
    required Color onPrimaryContainer,
    required Color onSurfaceVariant,
    int? badgeCount,
    Color? errorColor,
    Color? onError,
    VoidCallback? onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 4),
      decoration: BoxDecoration(
        color: isActive ? primaryContainer : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        leading: Icon(
          icon,
          color: isActive ? onPrimaryContainer : onSurfaceVariant,
        ),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 14,
            fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
            color: isActive ? onPrimaryContainer : onSurfaceVariant,
          ),
        ),
        trailing: badgeCount != null
            ? Container(
                padding: const EdgeInsets.all(6),
                decoration: BoxDecoration(
                  color: errorColor,
                  shape: BoxShape.circle,
                ),
                child: Text(
                  badgeCount.toString(),
                  style: TextStyle(
                    color: onError,
                    fontSize: 10,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              )
            : null,
        onTap: onTap ?? () {},
      ),
    );
  }

  List<Widget> _buildTeacherNavItems(
    BuildContext context, {
    required Color primaryContainer,
    required Color onPrimaryContainer,
    required Color onSurfaceVariant,
    required Color outlineVariant,
  }) {
    return [
      _buildNavItem(
        icon: Icons.dashboard,
        title: 'Dashboard',
        isActive: widget.currentRoute == '/teacher_dashboard',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_dashboard') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_dashboard', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      _buildNavItem(
        icon: Icons.schedule_outlined,
        title: 'My Schedule',
        isActive: widget.currentRoute == '/teacher_schedule',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_schedule') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_schedule', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      _buildNavItem(
        icon: Icons.school_outlined,
        title: 'My Class',
        isActive: widget.currentRoute == '/teacher_class',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_class') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_class', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      _buildNavItem(
        icon: Icons.assignment_turned_in_outlined,
        title: 'Give Assignments',
        isActive: widget.currentRoute == '/teacher_give_assignments',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_give_assignments') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_give_assignments', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      _buildNavItem(
        icon: Icons.calendar_month_outlined,
        title: 'Calendar',
        isActive: widget.currentRoute == '/teacher_calendar',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_calendar') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_calendar', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      _buildNavItem(
        icon: Icons.mail_outline,
        title: 'My Messages',
        isActive: widget.currentRoute == '/teacher_messages',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_messages') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_messages', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      _buildNavItem(
        icon: Icons.bar_chart_outlined,
        title: 'Make Report Card',
        isActive: widget.currentRoute == '/teacher_make_report_card',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_make_report_card') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_make_report_card', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      _buildNavItem(
        icon: Icons.how_to_reg_outlined,
        title: 'My Attendance',
        isActive: widget.currentRoute == '/teacher_attendance',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_attendance') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_attendance', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      _buildNavItem(
        icon: Icons.payments_outlined,
        title: 'My Salary',
        isActive: widget.currentRoute == '/teacher_salary',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_salary') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_salary', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
      Padding(
        padding: const EdgeInsets.symmetric(vertical: 16.0),
        child: Divider(color: outlineVariant.withAlpha(128), height: 1),
      ),
      _buildNavItem(
        icon: Icons.account_circle_outlined,
        title: 'Profile',
        isActive: widget.currentRoute == '/teacher_own_profile',
        primaryContainer: primaryContainer,
        onPrimaryContainer: onPrimaryContainer,
        onSurfaceVariant: onSurfaceVariant,
        onTap: () {
          if (widget.currentRoute != '/teacher_own_profile') {
            Navigator.of(context).pushNamedAndRemoveUntil('/teacher_own_profile', (route) => false);
          } else {
            Navigator.of(context).pop();
          }
        },
      ),
    ];
  }
}
