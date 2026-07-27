import 'dart:convert';
import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../api_client.dart';
import '../../services/update_service.dart';

class TeacherDashboardScreen extends StatefulWidget {
  final String userName;
  const TeacherDashboardScreen({super.key, this.userName = 'Teacher'});

  @override
  State<TeacherDashboardScreen> createState() => _TeacherDashboardScreenState();
}

class _TeacherDashboardScreenState extends State<TeacherDashboardScreen>
    with SingleTickerProviderStateMixin {
  final int _selectedIndex = 0;
  int _selectedDay = DateTime.now().weekday % 7; // Default to today (Sunday=0 in dart? No, Mon=1... Sun=7. We'll map Mon=0, Tue=1)
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  Map<String, List<dynamic>> _timetable = {};
  bool _isLoading = true;

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
    
    // Map today to 0-5 index (Mon=0, Sat=5, Sun mapped to Mon)
    final today = DateTime.now().weekday; // 1=Mon, 7=Sun
    _selectedDay = today >= 1 && today <= 6 ? today - 1 : 0;
    
    _fetchTimetable();
    UpdateService.checkForUpdates(context);
  }

  Future<void> _fetchTimetable() async {
    try {
      final res = await apiClient.get('/api/timetable');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _timetable = {};
            if (data['timetable'] != null) {
              final raw = data['timetable'] as Map<String, dynamic>;
              for (final entry in raw.entries) {
                _timetable[entry.key] = entry.value as List<dynamic>;
              }
            }
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching timetable: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  String _getDayName(int index) {
    const map = {
      0: 'Monday',
      1: 'Tuesday',
      2: 'Wednesday',
      3: 'Thursday',
      4: 'Friday',
      5: 'Saturday',
    };
    return map[index] ?? 'Monday';
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);
    final dayName = _getDayName(_selectedDay);
    final daySchedule = _timetable[dayName] ?? [];

    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(isTeacher: true, currentRoute: '/teacher_dashboard'),
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                CustomAppBar(
                  isTeacher: true,
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
                          // Greeting with subtle emoji
                          _buildGreeting(),
                          const SizedBox(height: 24),
                          // Bento Grid
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
                          // Class Routine Section
                          _buildClassRoutineHeader(),
                          const SizedBox(height: 16),
                          _buildDaySelector(),
                          const SizedBox(height: 16),
                          
                          if (daySchedule.isEmpty)
                            Container(
                              padding: const EdgeInsets.all(24),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(24),
                                border: Border.all(color: const Color(0xFFE2E2E5).withAlpha(128)),
                              ),
                              child: const Center(
                                child: Text('No classes scheduled', style: TextStyle(color: Color(0xFF6C7A76))),
                              ),
                            )
                          else
                            ...daySchedule.map((cls) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 16),
                                child: _buildClassCard(
                                  subject: cls['subject']?['name'] ?? 'Subject',
                                  details: '${cls['class']?['name'] ?? ''} • Room ${cls['room'] ?? 'TBD'}',
                                  time: '${cls['startTime']} - ${cls['endTime']}',
                                  icon: Icons.science_outlined,
                                  iconColor: const Color(0xFF00C2A8),
                                  iconBg: const Color(0xFF00C2A8).withAlpha(25),
                                  borderColor: const Color(0xFFBBCAC4).withAlpha(100),
                                  timeIcon: Icons.schedule,
                                ),
                              );
                            }),
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
      '/teacher_dashboard',  // 0: Home
      '/teacher_calendar',   // 1: Calendar
      '/teacher_give_assignments',  // 2: Assignments
      '/teacher_salary',     // 3: Payments/Salary
      '/teacher_own_profile',            // 4: Profile
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
          widget.userName,
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
    return Column(
      children: [
        _buildMetricCard(
          title: 'Attendance',
          mainValue: '73',
          subValue: '/ 76',
          percent: '95%',
          icon: Icons.check_circle_outline,
          gradientColors: [const Color(0xFF00C2A8), const Color(0xFF00A389)],
          bgColor: const Color(0xFFE6F8F5),
        ),
        const SizedBox(height: 12),
        _buildMetricCard(
          title: 'Assignment',
          mainValue: '18',
          subValue: '/ 20',
          percent: '90%',
          icon: Icons.assignment_outlined,
          gradientColors: [const Color(0xFFFFCA28), const Color(0xFFF5B800)],
          bgColor: const Color(0xFFFFF8E1),
        ),
        const SizedBox(height: 12),
        _buildMetricCard(
          title: 'Quiz',
          mainValue: '12',
          subValue: '/ 15',
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
                  const Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        '95%',
                        style: TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                      Text(
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
              'My Schedule',
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
            Navigator.of(context).pushReplacementNamed('/teacher_schedule');
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

  // --- Class Card ---
  Widget _buildClassCard({
    required String subject,
    required String details,
    required String time,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required Color borderColor,
    double borderWidth = 1.0,
    required IconData timeIcon,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor, width: borderWidth),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(8),
            blurRadius: 16,
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
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: iconBg,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Icon(icon, color: iconColor, size: 28),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      subject,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1C1E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      details,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF3C4A46),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Divider(color: Color(0xFFEEEEF0), height: 1),
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(timeIcon, size: 18, color: const Color(0xFF3C4A46)),
              const SizedBox(width: 8),
              Text(
                time,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF3C4A46),
                  letterSpacing: 0.1,
                ),
              ),
            ],
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
