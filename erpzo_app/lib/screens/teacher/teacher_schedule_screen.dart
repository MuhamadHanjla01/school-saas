import 'dart:convert';
import 'package:flutter/material.dart';
import '../../widgets/custom_app_bar.dart';
import '../../api_client.dart';

class TeacherScheduleScreen extends StatefulWidget {
  const TeacherScheduleScreen({super.key});

  @override
  State<TeacherScheduleScreen> createState() => _TeacherScheduleScreenState();
}

class _TeacherScheduleScreenState extends State<TeacherScheduleScreen> {
  int _selectedDay = DateTime.now().weekday % 7; // Map Mon=0 ...
  Map<String, List<dynamic>> _timetable = {};
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    final today = DateTime.now().weekday;
    _selectedDay = today >= 1 && today <= 6 ? today - 1 : 0;
    _fetchTimetable();
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
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const CustomAppBar(
              title: 'My Schedule',
              showBackButton: true,
              isTeacher: true,
            ),
            Expanded(
              child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                : SingleChildScrollView(
                physics: const BouncingScrollPhysics(),
                padding: const EdgeInsets.symmetric(vertical: 20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Padding(
                      padding: EdgeInsets.symmetric(horizontal: 20),
                      child: Text(
                        'WEEKLY ROUTINE',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF006B5C),
                          letterSpacing: 1.0,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    _buildDaySelector(),
                    const SizedBox(height: 32),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        crossAxisAlignment: CrossAxisAlignment.center,
                        children: [
                          const Text(
                            'Scheduled Classes',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1A1C1E),
                            ),
                          ),
                          Text(
                            '${daySchedule.length} Classes today',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF006B5C),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      child: Column(
                        children: [
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
                          const SizedBox(height: 40),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDaySelector() {
    final days = [
      {'day': 'Mon', 'date': '12'},
      {'day': 'Tue', 'date': '13'},
      {'day': 'Wed', 'date': '14'},
      {'day': 'Thu', 'date': '15'},
      {'day': 'Fri', 'date': '16'},
      {'day': 'Sat', 'date': '17'},
    ];

    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      physics: const BouncingScrollPhysics(),
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: Row(
        children: List.generate(days.length, (index) {
          final isSelected = index == _selectedDay;
          final dayInfo = days[index];

          return GestureDetector(
            onTap: () {
              setState(() {
                _selectedDay = index;
              });
            },
            child: Container(
              margin: const EdgeInsets.only(right: 12),
              width: 64,
              padding: const EdgeInsets.symmetric(vertical: 16),
              decoration: BoxDecoration(
                color: isSelected ? const Color(0xFF00C2A8) : const Color(0xFFEEEEF0),
                borderRadius: BorderRadius.circular(24),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: const Color(0xFF00C2A8).withAlpha(51),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        )
                      ]
                    : null,
              ),
              child: Column(
                children: [
                  Text(
                    dayInfo['day']!,
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isSelected ? const Color(0xFF00493E).withAlpha(200) : const Color(0xFF3C4A46),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    dayInfo['date']!,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w600,
                      color: isSelected ? const Color(0xFF00493E) : const Color(0xFF1A1C1E),
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
    );
  }

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
