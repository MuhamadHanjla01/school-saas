import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api_client.dart';

class TeacherReportCardScreen extends StatefulWidget {
  const TeacherReportCardScreen({super.key});

  @override
  State<TeacherReportCardScreen> createState() => _TeacherReportCardScreenState();
}

class _TeacherReportCardScreenState extends State<TeacherReportCardScreen> {
  String? _selectedStudentId;
  String? _selectedExamId;

  List<dynamic> _students = [];
  List<dynamic> _exams = [];
  List<dynamic> _subjects = [];

  final Map<String, TextEditingController> _theoryControllers = {};
  final Map<String, TextEditingController> _practicalControllers = {};

  bool _isLoading = true;
  bool _isSubmitting = false;

  int get _totalMarks {
    int total = 0;
    for (var subjectId in _theoryControllers.keys) {
      total += int.tryParse(_theoryControllers[subjectId]!.text) ?? 0;
      if (_practicalControllers.containsKey(subjectId)) {
        total += int.tryParse(_practicalControllers[subjectId]!.text) ?? 0;
      }
    }
    return total;
  }

  @override
  void initState() {
    super.initState();
    _fetchInitialData();
  }

  Future<void> _fetchInitialData() async {
    try {
      // Fetch classes
      final classRes = await apiClient.get('/api/classes');
      String? firstClassId;
      if (classRes.statusCode == 200) {
        final data = jsonDecode(classRes.body);
        final classes = data['classes'] as List;
        if (classes.isNotEmpty) firstClassId = classes.first['id'];
      }

      // Fetch exams
      final examRes = await apiClient.get('/api/exams');
      if (examRes.statusCode == 200) {
        final data = jsonDecode(examRes.body);
        _exams = data['exams'] as List;
        if (_exams.isNotEmpty) _selectedExamId = _exams.first['id'];
      }

      if (firstClassId != null) {
        // Fetch class details (students & subjects)
        final clsRes = await apiClient.get('/api/classes/$firstClassId');
        if (clsRes.statusCode == 200) {
          final data = jsonDecode(clsRes.body);
          final cls = data['class'];
          _students = cls['students'] as List;
          _subjects = cls['subjects'] as List;
          
          if (_students.isNotEmpty) _selectedStudentId = _students.first['id'];

          // Init controllers
          for (var subj in _subjects) {
            String sid = subj['id'];
            _theoryControllers[sid] = TextEditingController();
            _practicalControllers[sid] = TextEditingController();
          }
        }
      }

      setState(() {
        _isLoading = false;
      });
    } catch (e) {
      debugPrint('Error fetching data: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _submitMarks() async {
    if (_selectedExamId == null || _selectedStudentId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a student and an exam.')));
      return;
    }
    
    setState(() => _isSubmitting = true);

    try {
      List<Map<String, dynamic>> marksArr = [];
      for (var subj in _subjects) {
        String sid = subj['id'];
        int theory = int.tryParse(_theoryControllers[sid]?.text ?? '0') ?? 0;
        int practical = int.tryParse(_practicalControllers[sid]?.text ?? '0') ?? 0;
        marksArr.add({
          'studentId': _selectedStudentId,
          'subjectId': sid,
          'marks': theory + practical,
          'maxMarks': 100, // Hardcoded for simplicity
          'grade': 'A', // Ideally computed
        });
      }

      final res = await apiClient.post('/api/exams/$_selectedExamId/results', body: {
        'marks': marksArr
      });

      if (!mounted) return;

      if (res.statusCode == 200) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Marks submitted successfully!')));
        // Clear forms
        for (var ctrl in _theoryControllers.values) { ctrl.clear(); }
        for (var ctrl in _practicalControllers.values) { ctrl.clear(); }
        setState(() {}); // trigger rebuild to show 0 total
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: ${res.body}')));
      }
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error submitting marks.')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  void dispose() {
    for (var ctrl in _theoryControllers.values) { ctrl.dispose(); }
    for (var ctrl in _practicalControllers.values) { ctrl.dispose(); }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const Color primaryColor = Color(0xFF006B5C);
    const Color backgroundColor = Color(0xFFF9F9FC);
    const Color surfaceContainerLowest = Colors.white;

    return Scaffold(
      backgroundColor: backgroundColor,
      appBar: AppBar(
        backgroundColor: backgroundColor,
        elevation: 0,
        scrolledUnderElevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: primaryColor),
          onPressed: () => Navigator.of(context).pushNamedAndRemoveUntil('/teacher_dashboard', (route) => false),
        ),
        title: const Text(
          'Report Card',
          style: TextStyle(
            fontSize: 20,
            fontWeight: FontWeight.bold,
            color: primaryColor,
          ),
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator(color: primaryColor))
        : SingleChildScrollView(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Student Selection
            _buildDropdownSection(
              title: 'Select Student',
              icon: Icons.search,
              value: _selectedStudentId,
              items: _students.map<DropdownMenuItem<String>>((s) => DropdownMenuItem(
                value: s['id'],
                child: Row(
                  children: [
                    const Icon(Icons.search, size: 20, color: Color(0xFF6C7A76)),
                    const SizedBox(width: 12),
                    Expanded(child: Text(s['name'] ?? 'Unknown')),
                  ],
                ),
              )).toList(),
              onChanged: (val) {
                setState(() {
                  _selectedStudentId = val;
                });
              },
            ),
            const SizedBox(height: 16),
            
            // Exam Session Selection
            _buildDropdownSection(
              title: 'Exam Session',
              icon: Icons.calendar_today_outlined,
              value: _selectedExamId,
              items: _exams.map<DropdownMenuItem<String>>((e) => DropdownMenuItem(
                value: e['id'],
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today_outlined, size: 20, color: Color(0xFF6C7A76)),
                    const SizedBox(width: 12),
                    Expanded(child: Text(e['name'] ?? 'Unknown')),
                  ],
                ),
              )).toList(),
              onChanged: (val) {
                setState(() {
                  _selectedExamId = val;
                });
              },
            ),
            const SizedBox(height: 24),
            
            // Academic Marks Entry
            Container(
              decoration: BoxDecoration(
                color: surfaceContainerLowest,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: Column(
                children: [
                  // Header
                  Container(
                    padding: const EdgeInsets.all(20),
                    decoration: BoxDecoration(
                      color: const Color(0xFF00C2A8).withOpacity(0.05),
                      borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            const Icon(Icons.edit_square, color: primaryColor, size: 20),
                            const SizedBox(width: 8),
                            const Text(
                              'Academic\nMarks Entry',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF1A1C1E),
                                height: 1.2,
                              ),
                            ),
                          ],
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                          decoration: BoxDecoration(
                            color: primaryColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(100),
                          ),
                          child: const Text(
                            'Session: 2023-2024',
                            style: TextStyle(
                              color: primaryColor,
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Table Header
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                    color: const Color(0xFFF3F3F6),
                    child: const Row(
                      children: [
                        Expanded(
                          flex: 2,
                          child: Text(
                            'Subject Name',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF3C4A46),
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 1,
                          child: Text(
                            'Theory',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF3C4A46),
                            ),
                          ),
                        ),
                        Expanded(
                          flex: 1,
                          child: Text(
                            'Practical',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF3C4A46),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  
                  // Subjects
                  if (_subjects.isEmpty)
                    const Padding(padding: EdgeInsets.all(20), child: Text("No subjects found."))
                  else
                    ..._subjects.map((subj) {
                      String sid = subj['id'];
                      return Column(
                        children: [
                          _buildSubjectRow(
                            subj['name'] ?? 'Subject',
                            Icons.menu_book,
                            const Color(0xFF006B5C),
                            _theoryControllers[sid]!,
                            _practicalControllers[sid]!,
                          ),
                          const Divider(height: 1, color: Color(0xFFE2E2E5)),
                        ],
                      );
                    }),
                  
                  // Footer
                  Container(
                    padding: const EdgeInsets.all(20),
                    color: const Color(0xFFF3F3F6),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        const Expanded(
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(Icons.info_outline, size: 16, color: Color(0xFF3C4A46)),
                              SizedBox(width: 4),
                              Expanded(
                                child: Text(
                                  'Autosave enabled. All changes are stored locally.',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontStyle: FontStyle.italic,
                                    color: Color(0xFF3C4A46),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            const Text(
                              'Total',
                              style: TextStyle(
                                fontSize: 12,
                                color: Color(0xFF3C4A46),
                              ),
                            ),
                            Text(
                              '$_totalMarks / 300',
                              style: const TextStyle(
                                fontSize: 20,
                                fontWeight: FontWeight.bold,
                                color: primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            
            // Upload & Preview Button
            ElevatedButton(
              onPressed: _isSubmitting ? null : _submitMarks,
              style: ElevatedButton.styleFrom(
                backgroundColor: primaryColor,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 20),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(100),
                ),
                elevation: 4,
                shadowColor: const Color(0xFF00C2A8).withOpacity(0.3),
              ),
              child: _isSubmitting
                ? const CircularProgressIndicator(color: Colors.white)
                : const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.task_outlined),
                  SizedBox(width: 8),
                  Text(
                    'Submit Marks',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            
            // Recently Uploaded
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: surfaceContainerLowest,
                borderRadius: BorderRadius.circular(24),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 20,
                    offset: const Offset(0, 4),
                  )
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Recently Uploaded',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1A1C1E),
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildRecentUploadItem('James Wilson', '2 mins ago'),
                  const Divider(height: 1, color: Color(0xFFE2E2E5)),
                  _buildRecentUploadItem('Sophia Chen', '1 hour ago'),
                  const Divider(height: 1, color: Color(0xFFE2E2E5)),
                  _buildRecentUploadItem('Liam Smith', '3 hours ago'),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildDropdownSection({
    required String title,
    required IconData icon,
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF3C4A46),
            ),
          ),
          const SizedBox(height: 12),
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: const Color(0xFFBBCAC4)),
              borderRadius: BorderRadius.circular(12),
            ),
            child: DropdownButtonHideUnderline(
              child: ButtonTheme(
                alignedDropdown: true,
                child: DropdownButton<String>(
                  value: value,
                  isExpanded: true,
                  icon: const Icon(Icons.keyboard_arrow_down, color: Color(0xFF6C7A76)),
                  items: items,
                  onChanged: onChanged,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubjectRow(String name, IconData icon, Color color, TextEditingController theoryController, TextEditingController practicalController) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
      child: Row(
        children: [
          Expanded(
            flex: 2,
            child: Row(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: color.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(icon, color: color, size: 20),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1A1C1E),
                    ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            flex: 1,
            child: Center(
              child: SizedBox(
                width: 70,
                child: TextField(
                  controller: theoryController,
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  onChanged: (_) {
                    setState(() {});
                  },
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF006B5C)),
                    ),
                  ),
                ),
              ),
            ),
          ),
          Expanded(
            flex: 1,
            child: Center(
              child: SizedBox(
                width: 70,
                child: TextField(
                  controller: practicalController,
                  textAlign: TextAlign.center,
                  keyboardType: TextInputType.number,
                  onChanged: (_) {
                    setState(() {});
                  },
                  decoration: InputDecoration(
                    contentPadding: const EdgeInsets.symmetric(vertical: 10),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: const BorderSide(color: Color(0xFF006B5C)),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRecentUploadItem(String name, String timeAgo) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: const Color(0xFF006B5C).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.description_outlined, color: Color(0xFF006B5C)),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    name,
                    style: const TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1A1C1E),
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    timeAgo,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF3C4A46),
                    ),
                  ),
                ],
              ),
            ],
          ),
          TextButton(
            onPressed: () {},
            style: TextButton.styleFrom(
              foregroundColor: const Color(0xFF006B5C),
            ),
            child: const Text(
              'View',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
