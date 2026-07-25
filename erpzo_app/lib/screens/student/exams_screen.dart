import 'dart:convert';
import 'package:flutter/material.dart';
import '../../widgets/custom_app_bar.dart';
import '../../api_client.dart';

class ExamsScreen extends StatefulWidget {
  const ExamsScreen({super.key});

  @override
  State<ExamsScreen> createState() => _ExamsScreenState();
}

class _ExamsScreenState extends State<ExamsScreen> {
  String? _selectedExam;
  int _selectedRoutineTab = 0;
  List<dynamic> _exams = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchExams();
  }

  Future<void> _fetchExams() async {
    try {
      final res = await apiClient.get('/api/exams');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final exams = data['exams'] as List<dynamic>? ?? [];
        if (mounted) {
          setState(() {
            _exams = exams;
            if (exams.isNotEmpty) {
              _selectedExam = exams[0]['name'];
            } else {
              _selectedExam = 'No Exams Available';
            }
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching exams: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
          _selectedExam = 'Error loading exams';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF8FAFB);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            const CustomAppBar(
              title: 'Exams & Routine',
              showBackButton: true,
            ),
            Expanded(
              child: _isLoading
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildAdmitCardSection(),
                    const SizedBox(height: 32),
                    _buildExamRoutineSection(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }



  Widget _buildAdmitCardSection() {
    final List<String> examNames = _exams.map((e) => e['name'].toString()).toList();
    if (examNames.isEmpty) {
      examNames.add('No Exams Available');
    }

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
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
          Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: const Color(0xFF00C2A8).withAlpha(51),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.badge, color: Color(0xFF00C2A8)),
              ),
              const SizedBox(width: 12),
              const Text(
                'Download Admit Card',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1C1E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          const Text(
            'Select Exam',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF3C4A46),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9F9FC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFBBCAC4)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: examNames.contains(_selectedExam) ? _selectedExam : examNames.first,
                isExpanded: true,
                icon: const Icon(Icons.expand_more, color: Color(0xFF3C4A46)),
                items: examNames.map((String item) {
                  return DropdownMenuItem<String>(
                    value: item,
                    child: Text(
                      item,
                      style: const TextStyle(
                        fontSize: 16,
                        color: Color(0xFF1A1C1E),
                      ),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  setState(() {
                    _selectedExam = val!;
                  });
                },
              ),
            ),
          ),
          const SizedBox(height: 16),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.download, size: 20),
              label: const Text(
                'Download Admit Card',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
              ),
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF00C2A8),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(24),
                ),
                elevation: 0,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildExamRoutineSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: const Color(0xFF68ABFF).withAlpha(51),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.event_note, color: Color(0xFF0060AC)),
            ),
            const SizedBox(width: 12),
            const Text(
              'Exam Routine',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1C1E),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            color: const Color(0xFFF3F3F6),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedRoutineTab = 0),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _selectedRoutineTab == 0 ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: _selectedRoutineTab == 0
                          ? [
                              BoxShadow(
                                color: Colors.black.withAlpha(12),
                                blurRadius: 2,
                                offset: const Offset(0, 1),
                              )
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'Mid-Term 2024',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: _selectedRoutineTab == 0 ? const Color(0xFF006B5C) : const Color(0xFF3C4A46),
                      ),
                    ),
                  ),
                ),
              ),
              Expanded(
                child: GestureDetector(
                  onTap: () => setState(() => _selectedRoutineTab = 1),
                  child: Container(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    decoration: BoxDecoration(
                      color: _selectedRoutineTab == 1 ? Colors.white : Colors.transparent,
                      borderRadius: BorderRadius.circular(8),
                      boxShadow: _selectedRoutineTab == 1
                          ? [
                              BoxShadow(
                                color: Colors.black.withAlpha(12),
                                blurRadius: 2,
                                offset: const Offset(0, 1),
                              )
                            ]
                          : null,
                    ),
                    alignment: Alignment.center,
                    child: Text(
                      'Final Term 2024',
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: _selectedRoutineTab == 1 ? const Color(0xFF006B5C) : const Color(0xFF3C4A46),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 24),
        _buildRoutineCard(
          date: '15 Jan',
          day: 'Monday',
          subject: 'Mathematics',
          topic: 'Advanced Calculus I',
          time: '10:00 AM - 01:00 PM',
          location: 'Hall A, Room 302',
          accentColor: const Color(0xFF00C2A8),
        ),
        const SizedBox(height: 16),
        _buildRoutineCard(
          date: '17 Jan',
          day: 'Wednesday',
          subject: 'Physics',
          topic: 'Thermodynamics',
          time: '02:00 PM - 05:00 PM',
          location: 'Science Block, Room 104',
          accentColor: const Color(0xFF0060AC),
        ),
        const SizedBox(height: 16),
        _buildRoutineCard(
          date: '20 Jan',
          day: 'Saturday',
          subject: 'Computer Science',
          topic: 'Data Structures',
          time: '10:00 AM - 01:00 PM',
          location: 'IT Center, Lab 2',
          accentColor: const Color(0xFF9D4224),
        ),
      ],
    );
  }

  Widget _buildRoutineCard({
    required String date,
    required String day,
    required String subject,
    required String topic,
    required String time,
    required String location,
    required Color accentColor,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(12),
            blurRadius: 20,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(24),
        child: Container(
          decoration: BoxDecoration(
            border: Border(
              left: BorderSide(color: accentColor, width: 6),
            ),
          ),
          padding: const EdgeInsets.all(20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          date,
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.w600,
                            color: accentColor,
                          ),
                        ),
                        Text(
                          day,
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
              const Padding(
                padding: EdgeInsets.symmetric(vertical: 16),
                child: Divider(color: Color(0xFFE2E2E5), height: 1),
              ),
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
                topic,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF3C4A46),
                ),
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F3F6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.schedule, size: 16, color: Color(0xFF3C4A46)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              time,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF3C4A46),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF3F3F6),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.room, size: 16, color: Color(0xFF3C4A46)),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              location,
                              style: const TextStyle(
                                fontSize: 12,
                                color: Color(0xFF3C4A46),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
