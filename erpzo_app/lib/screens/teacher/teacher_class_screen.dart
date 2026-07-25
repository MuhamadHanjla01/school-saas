import 'dart:convert';
import 'package:flutter/material.dart';
import '../../widgets/custom_app_bar.dart';
import '../../api_client.dart';

class TeacherClassScreen extends StatefulWidget {
  const TeacherClassScreen({super.key});

  @override
  State<TeacherClassScreen> createState() => _TeacherClassScreenState();
}

class Student {
  final String id;
  final String name;
  String status; // 'Present', 'Absent', 'Late', 'none'
  final bool hasAvatar;
  bool isSyncing;

  Student({
    required this.id,
    required this.name,
    this.status = 'none',
    this.hasAvatar = true,
    this.isSyncing = false,
  });
}

class _TeacherClassScreenState extends State<TeacherClassScreen> {
  List<Student> _students = [];
  bool _isLoading = true;
  bool _isSubmitting = false;
  String _className = 'Loading...';
  String? _classId;
  int _totalPresent = 0;
  int _totalAbsent = 0;
  final DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    _fetchClassData();
  }

  Future<void> _fetchClassData() async {
    try {
      // Get all classes, pick the first one (in a real app, pick the teacher's class)
      final classesRes = await apiClient.get('/api/classes');
      if (classesRes.statusCode == 200) {
        final classesData = jsonDecode(classesRes.body);
        final classes = classesData['classes'] as List;
        if (classes.isNotEmpty) {
          _classId = classes.first['id'];
          _className = classes.first['name'];

          // Fetch students for this class
          final clsRes = await apiClient.get('/api/classes/$_classId');
          if (clsRes.statusCode == 200) {
            final clsData = jsonDecode(clsRes.body);
            final rawStudents = clsData['class']['students'] as List;

            // Fetch attendance for today to pre-fill status
            final dateStr = _selectedDate.toIso8601String().split('T')[0];
            final attRes = await apiClient.get('/api/attendance?classId=$_classId&date=$dateStr');
            
            Map<String, String> existingAtt = {};
            if (attRes.statusCode == 200) {
              final attData = jsonDecode(attRes.body);
              for (var rec in (attData['attendance'] as List)) {
                existingAtt[rec['studentId']] = rec['status'];
              }
            }

            final mapped = rawStudents.map((s) {
              String status = existingAtt[s['id']] ?? 'none';
              return Student(
                id: s['id'],
                name: s['name'] ?? 'Unknown',
                status: status,
              );
            }).toList();

            if (mounted) {
              setState(() {
                _students = mapped;
                _updateSummary();
                _isLoading = false;
              });
            }
          } else {
             if (mounted) setState(() => _isLoading = false);
          }
        } else {
          if (mounted) {
            setState(() {
              _className = 'No Classes found';
              _isLoading = false;
            });
          }
        }
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching class: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  void _updateSummary() {
    _totalPresent = _students.where((s) => s.status == 'Present').length;
    _totalAbsent = _students.where((s) => s.status == 'Absent').length;
  }

  void _toggleAttendance(Student student, String newStatus) {
    if (_isSubmitting) return; // Disable changes while submitting
    setState(() {
      student.status = newStatus;
      _updateSummary();
    });
  }

  Future<void> _submitAttendance() async {
    if (_classId == null) return;
    setState(() => _isSubmitting = true);

    try {
      final dateStr = _selectedDate.toIso8601String().split('T')[0];
      final records = _students
          .where((s) => s.status != 'none')
          .map((s) => {'studentId': s.id, 'status': s.status})
          .toList();

      final res = await apiClient.post('/api/attendance', body: {
        'classId': _classId,
        'date': dateStr,
        'records': records,
      });

      if (res.statusCode == 200 || res.statusCode == 201) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Row(
                children: [
                  Icon(Icons.check_circle, color: Colors.white, size: 18),
                  SizedBox(width: 8),
                  Text('Attendance submitted!', style: TextStyle(fontSize: 13)),
                ],
              ),
              backgroundColor: const Color(0xFF006B5C),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              duration: const Duration(seconds: 2),
            ),
          );
        }
      } else {
        throw Exception('Failed to submit');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Row(
              children: [
                const Icon(Icons.error_outline, color: Colors.white, size: 18),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    'Failed to submit attendance.',
                    style: const TextStyle(fontSize: 13),
                  ),
                ),
              ],
            ),
            backgroundColor: const Color(0xFFBA1A1A),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            duration: const Duration(seconds: 4),
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);
    
    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                CustomAppBar(
                  title: 'My Class - $_className',
                  showBackButton: true,
                  isTeacher: true,
                ),
                Expanded(
                  child: _isLoading 
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                    : SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Search Bar
                        Container(
                          decoration: BoxDecoration(
                            color: const Color(0xFFF3F3F6),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: const TextField(
                            decoration: InputDecoration(
                              hintText: 'Find students by name or ID...',
                              hintStyle: TextStyle(color: Color(0xFF6C7A76), fontSize: 16),
                              prefixIcon: Icon(Icons.search, color: Color(0xFF6C7A76)),
                              border: InputBorder.none,
                              contentPadding: EdgeInsets.symmetric(vertical: 16),
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),
                        
                        // Summary Card
                        _buildSummaryCard(),
                        const SizedBox(height: 24),
                        
                        // Student Roster Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'Student Roster',
                              style: TextStyle(
                                fontSize: 24,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF1A1C1E),
                              ),
                            ),
                            Text(
                              'Showing ${_students.length} students',
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF6C7A76),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        
                        // Student List
                        if (_students.isEmpty)
                           const Padding(
                             padding: EdgeInsets.all(24.0),
                             child: Center(child: Text('No students in this class')),
                           ),
                        ..._students.map((student) {
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _buildStudentCard(student),
                          );
                        }),
                        
                        // Extra padding for bottom submit button
                        const SizedBox(height: 80),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            
            // Submit Button
            if (!_isLoading && _students.isNotEmpty)
              Positioned(
                bottom: 24,
                left: 20,
                right: 20,
                child: ElevatedButton.icon(
                  onPressed: _isSubmitting ? null : _submitAttendance,
                  icon: _isSubmitting
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                        )
                      : const Icon(Icons.check_circle, size: 24),
                  label: Text(
                    _isSubmitting ? 'Submitting...' : 'Submit Attendance',
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF006B5C),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    elevation: 8,
                    shadowColor: const Color(0xFF006B5C).withAlpha(100),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCard() {
    final dateStr = '${_selectedDate.year}-${_selectedDate.month.toString().padLeft(2, '0')}-${_selectedDate.day.toString().padLeft(2, '0')}';
    final total = _students.length;
    final presentFlex = total > 0 ? ((_totalPresent / total) * 100).toInt() : 0;
    final absentFlex = total > 0 ? 100 - presentFlex : 0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFBBCAC4).withAlpha(51)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(12),
            blurRadius: 20,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  const Icon(Icons.calendar_today, color: Color(0xFF006B5C), size: 20),
                  const SizedBox(width: 8),
                  Text(
                    'Date: $dateStr',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1A1C1E),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF006B5C).withAlpha(12),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'TOTAL',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF6C7A76),
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$total',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF00C2A8).withAlpha(25),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'PRESENT',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF006B5C),
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$_totalPresent',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF006B5C),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFBA1A1A).withAlpha(25),
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    children: [
                      const Text(
                        'ABSENT',
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFFBA1A1A),
                          letterSpacing: 1.0,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '$_totalAbsent',
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFFBA1A1A),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (total > 0)
            Container(
              height: 8,
              width: double.infinity,
              decoration: BoxDecoration(
                color: const Color(0xFFE8E8EA),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Row(
                children: [
                  Expanded(
                    flex: presentFlex,
                    child: Container(
                      decoration: BoxDecoration(
                        color: const Color(0xFF00C2A8),
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ),
                  if (absentFlex > 0)
                    Expanded(
                      flex: absentFlex,
                      child: Container(
                        decoration: BoxDecoration(
                          color: const Color(0xFFBA1A1A),
                          borderRadius: BorderRadius.circular(4),
                        ),
                      ),
                    ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildStudentCard(Student student) {
    Color borderColor = const Color(0xFFBBCAC4).withAlpha(25);
    if (student.status == 'Present') borderColor = const Color(0xFF00C2A8).withAlpha(128);
    if (student.status == 'Absent') borderColor = const Color(0xFFBA1A1A).withAlpha(128);
    if (student.status == 'Late') borderColor = const Color(0xFFFF8D69).withAlpha(128);

    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: borderColor),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(12),
            blurRadius: 20,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: [
          Row(
            children: [
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: const Color(0xFFE8E8EA),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFBBCAC4).withAlpha(51), width: 2),
                ),
                child: student.hasAvatar
                    ? const Icon(Icons.person, color: Colors.white, size: 40)
                    : const Icon(Icons.person_outline, color: Color(0xFF6C7A76), size: 32),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      student.name,
                      style: const TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1C1E),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'ID: ${student.id}',
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: Color(0xFF6C7A76),
                      ),
                    ),
                  ],
                ),
              ),
              if (student.status == 'Present')
                const Icon(Icons.check_circle, color: Color(0xFF00C2A8), size: 24)
              else if (student.status == 'Absent')
                const Icon(Icons.cancel, color: Color(0xFFBA1A1A), size: 24)
              else if (student.status == 'Late')
                const Icon(Icons.access_time_filled, color: Color(0xFFFF8D69), size: 24),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: const Color(0xFFF3F3F6),
              borderRadius: BorderRadius.circular(30),
            ),
            child: Row(
              children: [
                _buildAttendanceOption(
                  student: student,
                  option: 'Present',
                  label: 'Present',
                  activeColor: const Color(0xFF00C2A8),
                  activeTextColor: const Color(0xFF00493E),
                ),
                _buildAttendanceOption(
                  student: student,
                  option: 'Absent',
                  label: 'Absent',
                  activeColor: const Color(0xFFBA1A1A),
                  activeTextColor: Colors.white,
                ),
                _buildAttendanceOption(
                  student: student,
                  option: 'Late',
                  label: 'Late',
                  activeColor: const Color(0xFFFF8D69),
                  activeTextColor: const Color(0xFF752509),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAttendanceOption({
    required Student student,
    required String option,
    required String label,
    required Color activeColor,
    required Color activeTextColor,
  }) {
    bool isSelected = student.status == option;
    
    return Expanded(
      child: GestureDetector(
        onTap: () {
          _toggleAttendance(student, option);
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          padding: const EdgeInsets.symmetric(vertical: 10),
          decoration: BoxDecoration(
            color: isSelected ? activeColor : Colors.transparent,
            borderRadius: BorderRadius.circular(24),
            boxShadow: isSelected
                ? [
                    BoxShadow(
                      color: activeColor.withAlpha(51),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    )
                  ]
                : null,
          ),
          alignment: Alignment.center,
          child: Text(
            label,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: isSelected ? activeTextColor : const Color(0xFF3C4A46),
            ),
          ),
        ),
      ),
    );
  }
}
