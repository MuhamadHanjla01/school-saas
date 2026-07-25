import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../widgets/custom_app_bar.dart';
import '../../api_client.dart';

class ClassRoutineScreen extends StatefulWidget {
  const ClassRoutineScreen({super.key});

  @override
  State<ClassRoutineScreen> createState() => _ClassRoutineScreenState();
}

class _ClassRoutineScreenState extends State<ClassRoutineScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final List<String> days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  final List<String> fullDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  int _selectedDayIndex = 1;
  
  bool _isLoading = true;
  Map<String, dynamic> _timetable = {};

  @override
  void initState() {
    super.initState();
    _selectedDayIndex = DateTime.now().weekday - 1;
    if (_selectedDayIndex > 5 || _selectedDayIndex < 0) _selectedDayIndex = 0;
    _fetchRoutine();
  }

  Future<void> _fetchRoutine() async {
    try {
      const storage = FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      String? classId;
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        classId = userData['student']?['classId'];
      }

      String url = '/api/school/timetable';
      if (classId != null) {
        url += '?classId=$classId';
      }

      final res = await apiClient.get(url);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        _timetable = data['timetable'] ?? {};
      }
    } catch (e) {
      debugPrint('Error fetching class routine: $e');
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const CustomAppBar(
              title: 'Class Routine',
              showBackButton: true,
            ),
            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [

                    const SizedBox(height: 24),
                    _buildDayTabs(),
                    const SizedBox(height: 24),
                    _buildClassCards(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDayTabs() {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: Row(
        children: List.generate(days.length, (index) {
          final isSelected = _selectedDayIndex == index;
          return Padding(
            padding: const EdgeInsets.only(right: 8.0),
            child: GestureDetector(
              onTap: () {
                setState(() {
                  _selectedDayIndex = index;
                });
              },
              child: Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: isSelected ? const Color(0xFF00C2A8) : Colors.transparent,
                  border: isSelected ? null : Border.all(color: const Color(0xFFBBCAC4)),
                ),
                alignment: Alignment.center,
                child: Text(
                  days[index],
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                    color: isSelected ? const Color(0xFF00493E) : const Color(0xFF3C4A46),
                  ),
                ),
              ),
            ),
          );
        }),
      ),
    );
  }

  Widget _buildClassCards() {
    final dayName = fullDays[_selectedDayIndex];
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
        final subject = cls['subject']?.toString() ?? 'Unknown';
        final isScience = subject.toLowerCase().contains('physics') || subject.toLowerCase().contains('science');
        final isMath = subject.toLowerCase().contains('math');
        
        Color leftBorderColor = const Color(0xFF68ABFF);
        Color tagColor = const Color(0xFF0060AC);
        
        if (isScience) {
          leftBorderColor = const Color(0xFF00C2A8);
          tagColor = const Color(0xFF006B5C);
        } else if (isMath) {
          leftBorderColor = const Color(0xFFFF8D69);
          tagColor = const Color(0xFF9D4224);
        }

        return Padding(
          padding: const EdgeInsets.only(bottom: 16),
          child: _buildClassCard(
            title: subject,
            teacher: cls['teacher']?.toString() ?? 'Unknown',
            time: cls['time']?.toString() ?? '',
            tag: cls['room'] != null ? 'Room ${cls['room']}' : 'TBD',
            tagColor: tagColor,
            tagBgColor: tagColor.withAlpha(25),
            leftBorderColor: leftBorderColor,
            actionButton: false, // For student, no join action needed unless it's live class
          ),
        );
      }).toList(),
    );
  }

  Widget _buildClassCard({
    required String title,
    required String teacher,
    required String time,
    required String tag,
    required Color tagColor,
    required Color tagBgColor,
    required Color leftBorderColor,
    bool actionButton = false,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E2E5).withAlpha(128)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(12),
            blurRadius: 20,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Stack(
        children: [
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            child: Container(
              decoration: BoxDecoration(
                color: leftBorderColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  bottomLeft: Radius.circular(24),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(width: 8), // Spacing for left border
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        title,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          const Icon(Icons.person_outline, size: 16, color: Color(0xFF3C4A46)),
                          const SizedBox(width: 6),
                          Text(
                            teacher,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF3C4A46),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.schedule, size: 16, color: Color(0xFF3C4A46)),
                          const SizedBox(width: 6),
                          Text(
                            time,
                            style: const TextStyle(
                              fontSize: 14,
                              color: Color(0xFF3C4A46),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                      decoration: BoxDecoration(
                        color: tagBgColor,
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(
                        tag,
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: tagColor,
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    if (actionButton)
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF00C2A8),
                          foregroundColor: const Color(0xFF00493E),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: const Text(
                          'Join Class',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      )
                    else
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFE2E2E5).withAlpha(76),
                          foregroundColor: const Color(0xFF3C4A46),
                          elevation: 0,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(20),
                          ),
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                        ),
                        child: const Text(
                          'Details',
                          style: TextStyle(fontWeight: FontWeight.w600),
                        ),
                      ),
                  ],
                )
              ],
            ),
          ),
        ],
      ),
    );
  }
}
