import 'dart:convert';
import 'package:flutter/material.dart';
import 'dart:math' as math;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../api_client.dart';
import '../../services/socket_service.dart';
import '../../services/update_service.dart';
import 'package:permission_handler/permission_handler.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen>
    with SingleTickerProviderStateMixin {
  final int _selectedIndex = 0;
  int _selectedDay = 1; // Tue
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  final _storage = const FlutterSecureStorage();
  bool _isLoading = true;
  String _userName = 'Loading...';
  String? _classId;

  Map<String, dynamic> _stats = {};
  Map<String, dynamic> _timetable = {};
  
  final List<String> _days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
    _animController.forward();
    _selectedDay = DateTime.now().weekday - 1;
    if (_selectedDay > 5 || _selectedDay < 0) _selectedDay = 0; // default to Monday if Sunday

    _loadData();

    // Setup Socket.io real-time connection
    final socketService = SocketService();
    socketService.initSocket();
    socketService.on('new_notice', (data) {
      debugPrint('Real-time event received: new_notice');
      // Reload dashboard data instantly
      _loadData();
    });
    socketService.on('profile_updated', (data) async {
      debugPrint('Real-time event received: profile_updated');
      if (data != null && data['userId'] != null) {
        final userStr = await _storage.read(key: 'user_data');
        if (userStr != null) {
          final userData = jsonDecode(userStr);
          if (userData['id'] == data['userId']) {
            // Re-fetch profile data to sync live edits from Admin Dashboard
            try {
              final res = await apiClient.get('/api/auth/me');
              if (res.statusCode == 200) {
                final newUserData = jsonDecode(res.body)['user'];
                await _storage.write(key: 'user_data', value: jsonEncode(newUserData));
                _loadData(); // reload UI
              }
            } catch (e) {
              debugPrint('Failed to refresh profile: $e');
            }
          }
        }
      }
    });
    
    _requestNotificationPermission();
    UpdateService.checkForUpdates(context);
  }

  Future<void> _requestNotificationPermission() async {
    final status = await Permission.notification.status;
    if (status.isDenied) {
      await Permission.notification.request();
    }
  }

  Future<void> _loadData() async {
    try {
      final userStr = await _storage.read(key: 'user_data');
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        _userName = userData['name'] ?? userData['student']?['name'] ?? userData['email'] ?? 'Student';
        _classId = userData['student']?['classId'];
      }

      final statsRes = await apiClient.get('/api/school/dashboard-stats');
      if (statsRes.statusCode == 200) {
        final statsData = jsonDecode(statsRes.body);
        _stats = statsData;
      }

      String ttUrl = '/api/school/timetable';
      if (_classId != null) {
        ttUrl += '?classId=$_classId';
      }
      final ttRes = await apiClient.get(ttUrl);
      if (ttRes.statusCode == 200) {
        _timetable = jsonDecode(ttRes.body)['timetable'] ?? {};
      }
    } catch (e) {
      debugPrint('Error loading dashboard data: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    SocketService().off('new_notice');
    SocketService().off('profile_updated');
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);

    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(currentRoute: '/dashboard'),
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                CustomAppBar(
                  onMenuPressed: () {
                    _scaffoldKey.currentState?.openDrawer();
                  },
                ),
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                      : FadeTransition(
                          opacity: _fadeAnim,
                          child: SingleChildScrollView(
                            physics: const BouncingScrollPhysics(),
                            padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                _buildGreeting(),
                                const SizedBox(height: 24),
                                Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Expanded(
                                      flex: 1,
                                      child: _buildMetricsColumn(),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      flex: 1,
                                      child: _buildDonutChartCard(),
                                    ),
                                  ],
                                ),
                                const SizedBox(height: 28),
                                _buildClassRoutineHeader(),
                                const SizedBox(height: 16),
                                _buildDaySelector(),
                                const SizedBox(height: 16),
                                _buildClassList(),
                              ],
                            ),
                          ),
                        ),
                ),
              ],
            ),
            // Bottom Nav
            Positioned(
              bottom: 24,
              left: 20,
              right: 20,
              child: CustomBottomNav(
                selectedIndex: _selectedIndex,
                onItemSelected: (index) {
                  _handleBottomNavTap(context, index);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _handleBottomNavTap(BuildContext context, int index) {
    const routes = [
      '/dashboard',      // 0: Home
      '/calendar',       // 1: Calendar
      '/assignments',    // 2: Assignments
      '/fee',            // 3: Payments
      '/profile',        // 4: Profile
    ];
    if (index == 0) return; // Already on dashboard
    Navigator.of(context).pushReplacementNamed(routes[index]);
  }

  // --- Greeting ---
  Widget _buildGreeting() {
    // Determine greeting based on time of day
    final hour = DateTime.now().hour;
    String greeting;
    String emoji;
    if (hour < 12) {
      greeting = 'Good Morning';
      emoji = '☀️';
    } else if (hour < 17) {
      greeting = 'Good Afternoon';
      emoji = '🌤️';
    } else {
      greeting = 'Good Evening';
      emoji = '🌙';
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$greeting $emoji',
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF6C7A76),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          _userName,
          style: const TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.w700,
            color: Color(0xFF1A1C1E),
            letterSpacing: -0.5,
          ),
        ),
      ],
    );
  }

  // --- Metrics Column ---
  Widget _buildMetricsColumn() {
    final statsList = _stats['stats'] as List<dynamic>? ?? [];
    
    // Find attendance stat
    final attStat = statsList.firstWhere((s) => s['label'] == 'Attendance Rate', orElse: () => null);
    final attVal = attStat != null ? attStat['value']?.toString() ?? '0%' : '0%';
    
    // Find assignment stat (mocking these for student as backend currently returns admin stats)
    // We'll use the stats as placeholders if they aren't exactly matching student needs
    final asgVal = '18'; 
    final asgTotal = '/ 20';
    
    final quizVal = '12';
    final quizTotal = '/ 15';

    return Column(
      children: [
        _buildMetricCard(
          title: 'Attendance',
          mainValue: attVal.replaceAll('%', ''),
          subValue: '',
          percent: attVal,
          icon: Icons.check_circle_outline,
          gradientColors: [const Color(0xFF00C2A8), const Color(0xFF00A389)],
          bgColor: const Color(0xFFE6F8F5),
        ),
        const SizedBox(height: 12),
        _buildMetricCard(
          title: 'Assignment',
          mainValue: asgVal,
          subValue: asgTotal,
          percent: '90%',
          icon: Icons.assignment_outlined,
          gradientColors: [const Color(0xFFFFCA28), const Color(0xFFF5B800)],
          bgColor: const Color(0xFFFFF8E1),
        ),
        const SizedBox(height: 12),
        _buildMetricCard(
          title: 'Quiz',
          mainValue: quizVal,
          subValue: quizTotal,
          percent: '80%',
          icon: Icons.quiz_outlined,
          gradientColors: [const Color(0xFFAB47BC), const Color(0xFF8E24AA)],
          bgColor: const Color(0xFFF3E5F5),
        ),
      ],
    );
  }

  Widget _buildMetricCard({
    required String title,
    required String mainValue,
    required String subValue,
    required String percent,
    required IconData icon,
    required List<Color> gradientColors,
    required Color bgColor,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: bgColor,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: gradientColors[0].withAlpha(30)),
        boxShadow: [
          BoxShadow(
            color: gradientColors[0].withAlpha(20),
            blurRadius: 12,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: gradientColors[0].withAlpha(30),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, size: 14, color: gradientColors[0]),
              ),
              const SizedBox(width: 6),
              Text(
                title,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: gradientColors[1],
                ),
              ),
            ],
          ),
          const SizedBox(height: 10),
          LayoutBuilder(
            builder: (context, constraints) {
              return FittedBox(
                fit: BoxFit.scaleDown,
                alignment: Alignment.centerLeft,
                child: ConstrainedBox(
                  constraints: BoxConstraints(minWidth: constraints.maxWidth),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.baseline,
                        textBaseline: TextBaseline.alphabetic,
                        children: [
                          Text(
                            mainValue,
                            style: TextStyle(
                              fontSize: 26,
                              fontWeight: FontWeight.bold,
                              color: gradientColors[0],
                            ),
                          ),
                          const SizedBox(width: 3),
                          Text(
                            subValue,
                            style: const TextStyle(
                              fontSize: 12,
                              color: Color(0xFF3C4A46),
                            ),
                          ),
                        ],
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 8,
                          vertical: 3,
                        ),
                        decoration: BoxDecoration(
                          gradient: LinearGradient(colors: gradientColors),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          percent,
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  // --- Donut Chart Card ---
  Widget _buildDonutChartCard() {
    final statsList = _stats['stats'] as List<dynamic>? ?? [];
    final attStat = statsList.firstWhere((s) => s['label'] == 'Attendance Rate', orElse: () => null);
    final attVal = attStat != null ? attStat['value']?.toString() ?? '0%' : '0%';

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E2E5).withAlpha(128)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 16,
            offset: const Offset(0, 6),
          )
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F3F6),
              borderRadius: BorderRadius.circular(10),
            ),
            child: const Text(
              'Academic Year Attendance',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: Color(0xFF3C4A46),
              ),
            ),
          ),
          const SizedBox(height: 16),
          LayoutBuilder(builder: (context, constraints) {
            final size = constraints.maxWidth * 0.85;
            return SizedBox(
              width: size,
              height: size,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  CustomPaint(
                    size: Size(size, size),
                    painter: DonutChartPainter(),
                  ),
                  // Center label
                  Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        attVal,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                      const Text(
                        'Overall',
                        style: TextStyle(
                          fontSize: 10,
                          color: Color(0xFF6C7A76),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            );
          }),
          const SizedBox(height: 16),
          Column(
            children: [
              Row(
                children: [
                  Expanded(
                    child: _buildLegendItem(
                      'Present',
                      '113',
                      const Color(0xFF00C2A8),
                    ),
                  ),
                  Expanded(
                    child: _buildLegendItem(
                      'Late',
                      '2',
                      const Color(0xFFFF5252),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: _buildLegendItem(
                      'Illness',
                      '9',
                      const Color(0xFFFFCA28),
                    ),
                  ),
                  Expanded(
                    child: _buildLegendItem(
                      'Absent',
                      '3',
                      const Color(0xFFAB47BC),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, String value, Color color) {
    return Row(
      children: [
        Container(
          width: 8,
          height: 8,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 6),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 10,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF3C4A46),
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: color,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }

  // --- Class Routine Header ---
  Widget _buildClassRoutineHeader() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        const Row(
          children: [
            Icon(Icons.calendar_today, size: 18, color: Color(0xFF006B5C)),
            SizedBox(width: 8),
            Text(
              'Class Routine',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1C1E),
              ),
            ),
          ],
        ),
        TextButton.icon(
          onPressed: () {
            Navigator.of(context).pushReplacementNamed('/class_routine');
          },
          icon: const Icon(Icons.arrow_forward, size: 16),
          label: const Text('View All'),
          style: TextButton.styleFrom(
            foregroundColor: const Color(0xFF006B5C),
            textStyle: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 13,
            ),
          ),
        ),
      ],
    );
  }

  // --- Day Selector ---
  Widget _buildDaySelector() {
    final days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: List.generate(days.length, (index) {
        final isSelected = index == _selectedDay;
        return GestureDetector(
          onTap: () {
            setState(() {
              _selectedDay = index;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 250),
            curve: Curves.easeOutCubic,
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: isSelected
                  ? const Color(0xFF00C2A8)
                  : Colors.transparent,
              border: isSelected
                  ? null
                  : Border.all(color: const Color(0xFFBBCAC4)),
              boxShadow: isSelected
                  ? [
                      BoxShadow(
                        color: const Color(0xFF00C2A8).withAlpha(76),
                        blurRadius: 12,
                        offset: const Offset(0, 4),
                      )
                    ]
                  : null,
            ),
            alignment: Alignment.center,
            child: Text(
              days[index],
              style: TextStyle(
                fontSize: 13,
                fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                color: isSelected
                    ? Colors.white
                    : const Color(0xFF3C4A46),
              ),
            ),
          ),
        );
      }),
    );
  }

  // --- Class List ---
  Widget _buildClassList() {
    final dayName = _days[_selectedDay];
    final todayClasses = _timetable[dayName] as List<dynamic>? ?? [];

    if (todayClasses.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(24),
        alignment: Alignment.center,
        child: const Text(
          'No classes scheduled for this day.',
          style: TextStyle(
            color: Color(0xFF6C7A76),
            fontSize: 14,
          ),
        ),
      );
    }

    return Column(
      children: todayClasses.map((cls) {
        // Just mock some alternating colors/icons based on subject name length or something
        final isScience = (cls['subject']?.toString().toLowerCase().contains('physics') ?? false) || (cls['subject']?.toString().toLowerCase().contains('science') ?? false);
        final color = isScience ? const Color(0xFF00C2A8) : const Color(0xFF68ABFF);
        final icon = isScience ? Icons.science_outlined : Icons.book_outlined;

        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildClassCard(
            subject: cls['subject']?.toString() ?? 'Unknown',
            teacher: cls['teacher']?.toString() ?? 'Unknown',
            time: cls['time']?.toString() ?? '',
            room: cls['room']?.toString() ?? 'TBD',
            accentColor: color,
            icon: icon,
            isUpcoming: false, // Could do real time comparison here
          ),
        );
      }).toList(),
    );
  }

  // --- Class Card ---
  Widget _buildClassCard({
    required String subject,
    required String teacher,
    required String time,
    required String room,
    required Color accentColor,
    required IconData icon,
    required bool isUpcoming,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFE2E2E5).withAlpha(128)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 16,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Stack(
        children: [
          // Left accent bar
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 5,
            child: Container(
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(20),
                  bottomLeft: Radius.circular(20),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(18, 16, 16, 16),
            child: Row(
              children: [
                // Subject icon
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: accentColor.withAlpha(25),
                    borderRadius: BorderRadius.circular(14),
                  ),
                  child: Icon(icon, color: accentColor, size: 22),
                ),
                const SizedBox(width: 14),
                // Text content
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        subject,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Icon(Icons.person_outline,
                              size: 14, color: accentColor),
                          const SizedBox(width: 4),
                          Text(
                            teacher,
                            style: const TextStyle(
                              fontSize: 13,
                              color: Color(0xFF3C4A46),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.schedule,
                              size: 14, color: Color(0xFF6C7A76)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              time,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF6C7A76),
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                // Right side: Room + Status
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: accentColor.withAlpha(20),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        room,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.w600,
                          color: accentColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    if (isUpcoming)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 6),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: const Color(0xFFBBCAC4),
                          ),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Upcoming',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF3C4A46),
                          ),
                        ),
                      )
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// --- Donut Chart Painter ---
class DonutChartPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius =
        math.max(0.0, math.min(size.width / 2, size.height / 2) - 10);
    const strokeWidth = 18.0;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    final sections = [
      {'color': const Color(0xFF00C2A8), 'sweep': 0.60},
      {'color': const Color(0xFFFF5252), 'sweep': 0.12},
      {'color': const Color(0xFFFFCA28), 'sweep': 0.10},
      {'color': const Color(0xFFAB47BC), 'sweep': 0.14},
    ];

    const gap = 0.04;
    double startAngle = -math.pi / 2;

    // Draw background track
    final bgPaint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..color = const Color(0xFFF3F3F6);
    canvas.drawCircle(center, radius, bgPaint);

    for (var section in sections) {
      paint.color = section['color'] as Color;
      final sweepAngle = (section['sweep'] as double) * 2 * math.pi;

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        startAngle,
        sweepAngle - gap,
        false,
        paint,
      );

      startAngle += sweepAngle;
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
