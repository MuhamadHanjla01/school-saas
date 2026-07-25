import 'dart:convert';
import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../../api_client.dart';

class TeacherAttendanceScreen extends StatefulWidget {
  const TeacherAttendanceScreen({super.key});

  @override
  State<TeacherAttendanceScreen> createState() => _TeacherAttendanceScreenState();
}

class _TeacherAttendanceScreenState extends State<TeacherAttendanceScreen> {
  // Colors from the theme
  static const Color primaryColor = Color(0xFF006B5C);
  static const Color primaryContainer = Color(0xFF00C2A8);
  static const Color onPrimaryContainer = Color(0xFF00493E);
  static const Color errorColor = Color(0xFFBA1A1A);
  static const Color errorContainer = Color(0xFFFFDAD6);
  static const Color tertiaryColor = Color(0xFF9D4224);
  static const Color surfaceColor = Color(0xFFF9F9FC);
  static const Color surfaceContainerLow = Color(0xFFF3F3F6);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color outlineColor = Color(0xFF6C7A76);
  static const Color onSurface = Color(0xFF1A1C1E);
  static const Color onSurfaceVariant = Color(0xFF3C4A46);

  // Status Colors
  static const Color presentColor = Color(0xFF00C2A8);
  static const Color presentBgColor = Color(0xFFD9F4F0);
  
  static const Color absentColor = Color(0xFFAB47BC);
  static const Color absentBgColor = Color(0xFFF3E3F5);

  static const Color leaveColor = Color(0xFFFFCA28);
  static const Color leaveBgColor = Color(0xFFFFF4D4);

  static const Color lateColor = Color(0xFFFF5252);
  static const Color lateBgColor = Color(0xFFFFE5E5);

  bool _isLoading = true;
  List<Map<String, dynamic>> _calendarDays = [];
  int _presentCount = 0;
  int _absentCount = 0;
  int _lateCount = 0;
  int _leaveCount = 0;

  @override
  void initState() {
    super.initState();
    _fetchAttendance();
  }

  Future<void> _fetchAttendance() async {
    try {
      final res = await apiClient.get('/api/attendance/teacher');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final records = data['attendance'] as List;

        int present = 0, absent = 0, lateCnt = 0, leave = 0;
        Map<int, int> dayTypeMap = {}; // Maps day of month to type index
        
        final now = DateTime.now();

        for (var rec in records) {
          final dateStr = rec['date'] as String;
          final d = DateTime.parse(dateStr);
          final status = rec['status'] as String;

          if (d.year == now.year && d.month == now.month) {
            int type = 0;
            if (status == 'Present') { type = 1; present++; }
            else if (status == 'Absent') { type = 2; absent++; }
            else if (status == 'Leave') { type = 3; leave++; }
            else if (status == 'Late') { type = 4; lateCnt++; }
            dayTypeMap[d.day] = type;
          }
        }

        // Generate calendar for current month
        final daysInMonth = DateUtils.getDaysInMonth(now.year, now.month);
        final firstDayOffset = DateTime(now.year, now.month, 1).weekday % 7; // Sun=0
        List<Map<String, dynamic>> cal = [];
        
        // Prev month padding
        final prevMonthDays = DateUtils.getDaysInMonth(now.year, now.month == 1 ? 12 : now.month - 1);
        for (int i = 0; i < firstDayOffset; i++) {
          cal.add({'day': prevMonthDays - firstDayOffset + i + 1, 'type': -1});
        }
        
        // Current month
        for (int i = 1; i <= daysInMonth; i++) {
          int type = dayTypeMap[i] ?? 0;
          if (i == now.day && type == 0) type = 5; // Highlight today if no record
          cal.add({'day': i, 'type': type});
        }

        if (mounted) {
          setState(() {
            _calendarDays = cal;
            _presentCount = present;
            _absentCount = absent;
            _lateCount = lateCnt;
            _leaveCount = leave;
            _isLoading = false;
          });
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching attendance: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: surfaceColor,
      body: SafeArea(
        child: Column(
          children: [
            _buildAppBar(context),
            Expanded(
              child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: primaryColor))
                : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    _buildDonutChartCard(),
                    const SizedBox(height: 24),
                    _buildCalendarSection(),
                    const SizedBox(height: 24),
                    _buildRecentRequests(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAppBar(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      color: surfaceColor,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.arrow_back, color: primaryColor),
                onPressed: () {
                  Navigator.of(context).pushNamedAndRemoveUntil('/teacher_dashboard', (route) => false);
                },
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
              const SizedBox(width: 12),
              const Text(
                'My Attendance',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: primaryColor,
                ),
              ),
            ],
          ),
          Container(
            width: 40,
            height: 40,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: primaryContainer, width: 2),
              image: const DecorationImage(
                image: NetworkImage(
                    'https://lh3.googleusercontent.com/aida-public/AB6AXuBRioSJWrzpZO79NTusDn21QYitHqNUQE5wqD0xBuhpFQzwk6ta4ecwi90QwSlfMKVq3OHIcoAcZ_i-TF9KcRRLd3WrDP9KR6IqQjB1hwy00-8dbj1gOKGwu6QSr5SMmpw_5FvIPXYq_DewK3E21VVbt5h0f5v6oTIpUbUquAk2C03fu5g93DzXXNcSNYDZOY9AK3qWwDAJlpp4XJyVqr-VAK4qF_aMSqyq93Y0ZU6PkYG0qaNvrdTH1g'),
                fit: BoxFit.cover,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDonutChartCard() {
    int total = _presentCount + _absentCount + _lateCount + _leaveCount;
    if (total == 0) total = 1; // avoid div/0
    int rate = ((_presentCount / total) * 100).round();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 18),
      decoration: BoxDecoration(
        color: surfaceContainerLowest,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E2E5).withAlpha(128)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Expanded(
                flex: 5,
                child: Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Expanded(child: _buildDonutLegendItem('Present', '$_presentCount', const Color(0xFF00C2A8))),
                          Expanded(child: _buildDonutLegendItem('Absent', '$_absentCount', const Color(0xFFAB47BC))),
                        ],
                      ),
                      const SizedBox(height: 16),
                      Row(
                        children: [
                          Expanded(child: _buildDonutLegendItem('Late', '$_lateCount', const Color(0xFFFF5252))),
                          Expanded(child: _buildDonutLegendItem('Leave', '$_leaveCount', const Color(0xFFFFCA28))),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
              Expanded(
                flex: 4,
                child: LayoutBuilder(builder: (context, constraints) {
                  final size = constraints.maxWidth * 0.9;
                  return SizedBox(
                    width: size,
                    height: size,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        CustomPaint(
                          size: Size(size, size),
                          painter: DonutChartPainter(
                            present: _presentCount,
                            absent: _absentCount,
                            lateCnt: _lateCount,
                            leave: _leaveCount,
                          ),
                        ),
                        Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              '$rate%',
                              style: const TextStyle(
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                                color: onSurface,
                              ),
                            ),
                            const Text(
                              'Overall',
                              style: TextStyle(
                                fontSize: 12,
                                color: outlineColor,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  );
                }),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDonutLegendItem(String label, String value, Color color) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Container(
          width: 10,
          height: 10,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  fontSize: 13,
                  fontWeight: FontWeight.w500,
                  color: onSurfaceVariant,
                ),
                overflow: TextOverflow.ellipsis,
              ),
              Text(
                value,
                style: TextStyle(
                  fontSize: 16,
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

  Widget _buildCalendarSection() {
    final now = DateTime.now();
    final months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: surfaceContainerLow,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFEEEEF0)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.02),
            blurRadius: 10,
            offset: const Offset(0, 2),
          )
        ],
      ),
      child: Column(
        children: [
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${months[now.month - 1]} ${now.year}',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: onSurface,
                ),
              ),
              Row(
                children: [
                  IconButton(
                    icon: const Icon(Icons.chevron_left, color: outlineColor),
                    onPressed: () {},
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(4),
                  ),
                  IconButton(
                    icon: const Icon(Icons.chevron_right, color: outlineColor),
                    onPressed: () {},
                    constraints: const BoxConstraints(),
                    padding: const EdgeInsets.all(4),
                  ),
                ],
              )
            ],
          ),
          const SizedBox(height: 16),
          // Weekdays
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                .map((day) => Expanded(
                      child: Center(
                        child: Text(
                          day,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w500,
                            color: outlineColor,
                          ),
                        ),
                      ),
                    ))
                .toList(),
          ),
          const SizedBox(height: 12),
          // Days Grid
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 7,
              childAspectRatio: 1.2,
              mainAxisSpacing: 8,
              crossAxisSpacing: 4,
            ),
            itemCount: _calendarDays.length,
            itemBuilder: (context, index) {
              final item = _calendarDays[index];
              final int day = item['day'];
              final int type = item['type'];

              Color bgColor = Colors.transparent;
              Color textColor = onSurface;
              bool isBold = false;

              if (type == -1) {
                textColor = outlineColor.withOpacity(0.3);
              } else if (type == 1) {
                bgColor = presentBgColor;
                textColor = presentColor;
                isBold = true;
              } else if (type == 2) {
                bgColor = absentBgColor;
                textColor = absentColor;
                isBold = true;
              } else if (type == 3) {
                bgColor = leaveBgColor.withOpacity(0.7);
                textColor = leaveColor;
                isBold = true;
              } else if (type == 4) {
                bgColor = lateBgColor;
                textColor = lateColor;
                isBold = true;
              } else if (type == 5) {
                bgColor = primaryContainer;
                textColor = onPrimaryContainer;
                isBold = true;
              }

              return Container(
                decoration: BoxDecoration(
                  color: bgColor,
                  borderRadius: BorderRadius.circular(8),
                ),
                alignment: Alignment.center,
                child: Text(
                  day.toString(),
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
                    color: textColor,
                  ),
                ),
              );
            },
          ),
          const SizedBox(height: 24),
          // Legend
          Container(
            padding: const EdgeInsets.only(top: 16),
            decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: Color(0xFFEEEEF0))),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: [
                _buildLegendItem('Present', presentBgColor, primaryColor.withOpacity(0.2)),
                _buildLegendItem('Absent', absentBgColor, errorColor.withOpacity(0.2)),
                _buildLegendItem('Leave', leaveBgColor.withOpacity(0.7), leaveColor.withOpacity(0.4)),
                _buildLegendItem('Late', lateBgColor, lateColor.withOpacity(0.4)),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLegendItem(String label, Color bgColor, Color borderColor) {
    return Row(
      children: [
        Container(
          width: 16,
          height: 16,
          decoration: BoxDecoration(
            color: bgColor,
            borderRadius: BorderRadius.circular(4),
            border: Border.all(color: borderColor),
          ),
        ),
        const SizedBox(width: 6),
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: outlineColor,
          ),
        ),
      ],
    );
  }

  Widget _buildRecentRequests() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Recent Request',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: onSurface,
              ),
            ),
            ElevatedButton(
              onPressed: () => _showApplyLeaveModal(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryContainer,
                foregroundColor: onPrimaryContainer,
                elevation: 0,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              ),
              child: const Text(
                'Apply for Leave',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w500),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        _buildRequestCard(
          title: 'Sick Leave',
          date: 'Jan 15 - Jan 16',
          status: 'Pending',
          icon: Icons.medical_services_outlined,
          iconColor: tertiaryColor,
          iconBg: tertiaryColor.withOpacity(0.1),
          statusColor: onSurfaceVariant,
          statusBg: const Color(0xFFE2E2E5),
        ),
        const SizedBox(height: 12),
        _buildRequestCard(
          title: 'Casual Leave',
          date: 'Dec 10 - Dec 11',
          status: 'Approved',
          icon: Icons.person_outline,
          iconColor: primaryColor,
          iconBg: primaryColor.withOpacity(0.1),
          statusColor: onPrimaryContainer,
          statusBg: primaryContainer.withOpacity(0.2),
        ),
        const SizedBox(height: 12),
        _buildRequestCard(
          title: 'Personal Leave',
          date: 'Nov 22',
          status: 'Rejected',
          icon: Icons.work_off_outlined,
          iconColor: errorColor,
          iconBg: errorColor.withOpacity(0.1),
          statusColor: errorColor,
          statusBg: errorContainer.withOpacity(0.4),
        ),
        const SizedBox(height: 40),
      ],
    );
  }

  Widget _buildRequestCard({
    required String title,
    required String date,
    required String status,
    required IconData icon,
    required Color iconColor,
    required Color iconBg,
    required Color statusColor,
    required Color statusBg,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surfaceContainerLow,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: iconBg,
                  shape: BoxShape.circle,
                ),
                child: Icon(icon, color: iconColor, size: 20),
              ),
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: onSurface,
                    ),
                  ),
                  Text(
                    date,
                    style: const TextStyle(
                      fontSize: 12,
                      color: outlineColor,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
            decoration: BoxDecoration(
              color: statusBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Text(
              status,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: statusColor,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showApplyLeaveModal(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) {
        return Container(
          decoration: const BoxDecoration(
            color: surfaceContainerLowest,
            borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
            left: 24,
            right: 24,
            top: 24,
          ),
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Apply for Leave',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w600,
                        color: onSurface,
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close, color: outlineColor),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                // Type of Leave Dropdown
                const Text('Leave Type', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: onSurfaceVariant)),
                const SizedBox(height: 8),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    border: Border.all(color: const Color(0xFFEEEEF0)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: DropdownButtonHideUnderline(
                    child: DropdownButton<String>(
                      isExpanded: true,
                      value: 'Sick Leave',
                      icon: const Icon(Icons.keyboard_arrow_down, color: outlineColor),
                      items: ['Sick Leave', 'Casual Leave', 'Personal Leave', 'Other']
                          .map((type) => DropdownMenuItem(value: type, child: Text(type)))
                          .toList(),
                      onChanged: (val) {},
                    ),
                  ),
                ),
                const SizedBox(height: 16),
                // Dates Row
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('Start Date', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: onSurfaceVariant)),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              border: Border.all(color: const Color(0xFFEEEEF0)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Select', style: TextStyle(color: outlineColor, fontSize: 14)),
                                Icon(Icons.calendar_today, size: 18, color: outlineColor),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('End Date', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: onSurfaceVariant)),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                            decoration: BoxDecoration(
                              border: Border.all(color: const Color(0xFFEEEEF0)),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: const Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Select', style: TextStyle(color: outlineColor, fontSize: 14)),
                                Icon(Icons.calendar_today, size: 18, color: outlineColor),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                // Reason text area
                const Text('Reason', style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500, color: onSurfaceVariant)),
                const SizedBox(height: 8),
                TextField(
                  maxLines: 4,
                  decoration: InputDecoration(
                    hintText: 'Type your reason here...',
                    hintStyle: const TextStyle(color: outlineColor, fontSize: 14),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFEEEEF0)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFEEEEF0)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: primaryColor),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
                // Submit button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.pop(context);
                      // In a real app, this is where you'd handle the submission
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Leave request submitted successfully!')),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryColor,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(16),
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'Submit Request',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                    ),
                  ),
                ),
                const SizedBox(height: 32),
              ],
            ),
          ),
        );
      },
    );
  }
}

class DonutChartPainter extends CustomPainter {
  final int present;
  final int absent;
  final int lateCnt;
  final int leave;

  DonutChartPainter({
    this.present = 0,
    this.absent = 0,
    this.lateCnt = 0,
    this.leave = 0,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = math.max(0.0, math.min(size.width / 2, size.height / 2) - 10);
    const strokeWidth = 24.0;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = strokeWidth
      ..strokeCap = StrokeCap.round;

    int total = present + absent + lateCnt + leave;
    if (total == 0) total = 1;

    final sections = [
      {'color': const Color(0xFF00C2A8), 'sweep': present / total},
      {'color': const Color(0xFFFF5252), 'sweep': lateCnt / total},
      {'color': const Color(0xFFFFCA28), 'sweep': leave / total},
      {'color': const Color(0xFFAB47BC), 'sweep': absent / total},
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
