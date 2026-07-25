import 'dart:convert';
import 'package:flutter/material.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../api_client.dart';

class TeacherGiveAssignmentsScreen extends StatefulWidget {
  const TeacherGiveAssignmentsScreen({super.key});

  @override
  State<TeacherGiveAssignmentsScreen> createState() => _TeacherGiveAssignmentsScreenState();
}

class _TeacherGiveAssignmentsScreenState extends State<TeacherGiveAssignmentsScreen> {
  String _selectedTab = 'pdf'; // 'pdf' or 'quiz'
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  final int _selectedIndex = 2; // Assignments tab

  bool _isLoading = true;
  bool _isSubmitting = false;

  List<dynamic> _classes = [];
  List<dynamic> _subjects = [];
  String? _selectedClassId;
  String? _selectedSubjectId;

  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _descController = TextEditingController();
  DateTime? _dueDate;

  @override
  void initState() {
    super.initState();
    _fetchClasses();
  }

  Future<void> _fetchClasses() async {
    try {
      final res = await apiClient.get('/api/classes');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final classes = data['classes'] as List;
        if (classes.isNotEmpty) {
          _classes = classes;
          _selectedClassId = classes.first['id'];
          await _fetchSubjects(_selectedClassId!);
        } else {
          setState(() {
            _isLoading = false;
          });
        }
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching classes: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _fetchSubjects(String classId) async {
    try {
      final res = await apiClient.get('/api/classes/$classId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final subjects = data['class']['subjects'] as List;
        setState(() {
          _subjects = subjects;
          if (subjects.isNotEmpty) {
            _selectedSubjectId = subjects.first['id'];
          } else {
            _selectedSubjectId = null;
          }
          _isLoading = false;
        });
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching subjects: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _selectDueDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _dueDate ?? DateTime.now().add(const Duration(days: 1)),
      firstDate: DateTime.now(),
      lastDate: DateTime(2030),
    );
    if (picked != null && picked != _dueDate) {
      setState(() {
        _dueDate = picked;
      });
    }
  }

  Future<void> _postAssignment() async {
    if (_titleController.text.trim().isEmpty || _descController.text.trim().isEmpty || _dueDate == null || _selectedClassId == null || _selectedSubjectId == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please fill all required fields.')));
      return;
    }

    setState(() {
      _isSubmitting = true;
    });

    try {
      final res = await apiClient.post('/api/assignments', body: {
        'title': _titleController.text.trim(),
        'description': _descController.text.trim(),
        'dueDate': _dueDate!.toIso8601String(),
        'classId': _selectedClassId,
        'subjectId': _selectedSubjectId,
      });

      if (!mounted) return;

      if (res.statusCode == 201) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Assignment posted successfully!')));
        _titleController.clear();
        _descController.clear();
        setState(() {
          _dueDate = null;
        });
      } else {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: ${res.body}')));
      }
    } catch (e) {
      debugPrint('Post error: $e');
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error posting assignment.')));
    } finally {
      if (mounted) setState(() => _isSubmitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: backgroundColor,
      drawer: const AppDrawer(isTeacher: true, currentRoute: '/teacher_give_assignments'),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                CustomAppBar(
                  title: 'Create Assignment',
                  isTeacher: true,
                  onMenuPressed: () {
                    _scaffoldKey.currentState?.openDrawer();
                  },
                ),
                Expanded(
                  child: _isLoading
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                    : SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
                    child: Column(
                      children: [
                        _buildAssignmentBasicsCard(),
                        const SizedBox(height: 20),
                        _buildSegmentedControl(),
                        const SizedBox(height: 20),
                        if (_selectedTab == 'pdf') _buildPdfSection() else _buildQuizSection(),
                        const SizedBox(height: 40),
                        ElevatedButton(
                          onPressed: _isSubmitting ? null : _postAssignment,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF00C2A8),
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 16),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                            elevation: 8,
                            shadowColor: const Color(0xFF00C2A8).withAlpha(51),
                            minimumSize: const Size(double.infinity, 56),
                          ),
                          child: _isSubmitting
                              ? const SizedBox(
                                  width: 24,
                                  height: 24,
                                  child: CircularProgressIndicator(
                                    color: Colors.white,
                                    strokeWidth: 2,
                                  ),
                                )
                              : const Text(
                                  'Post Assignment',
                                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                                ),
                        ),
                        const SizedBox(height: 120), // Padding for bottom nav
                      ],
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
    if (index == _selectedIndex) return;
    Navigator.of(context).pushReplacementNamed(routes[index]);
  }

  Widget _buildAssignmentBasicsCard() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFBBCAC4).withAlpha(77)),
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
          // Title Field
          _buildLabel(Icons.edit_note, 'Assignment Title'),
          const SizedBox(height: 6),
          TextField(
            controller: _titleController,
            decoration: InputDecoration(
              hintText: 'e.g. Photosynthesis Lab Report',
              hintStyle: const TextStyle(color: Color(0xFFBBCAC4)),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Class & Subject Grid
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel(Icons.groups, 'Class'),
                    const SizedBox(height: 6),
                    _buildDropdown(
                      value: _selectedClassId,
                      items: _classes.map<DropdownMenuItem<String>>((c) {
                        return DropdownMenuItem<String>(
                          value: c['id'],
                          child: Text(c['name'] ?? 'Unknown', style: const TextStyle(fontSize: 14)),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedClassId = val;
                          _isLoading = true;
                        });
                        _fetchSubjects(val!);
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildLabel(Icons.book, 'Subject'),
                    const SizedBox(height: 6),
                    _buildDropdown(
                      value: _selectedSubjectId,
                      items: _subjects.map<DropdownMenuItem<String>>((s) {
                        return DropdownMenuItem<String>(
                          value: s['id'],
                          child: Text(s['name'] ?? 'Unknown', style: const TextStyle(fontSize: 14)),
                        );
                      }).toList(),
                      onChanged: (val) => setState(() => _selectedSubjectId = val),
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Due Date Field
          _buildLabel(Icons.calendar_today, 'Due Date'),
          const SizedBox(height: 6),
          GestureDetector(
            onTap: () => _selectDueDate(context),
            child: AbsorbPointer(
              child: TextField(
                controller: TextEditingController(
                  text: _dueDate == null ? '' : '${_dueDate!.month.toString().padLeft(2, '0')}/${_dueDate!.day.toString().padLeft(2, '0')}/${_dueDate!.year}',
                ),
                readOnly: true,
                decoration: InputDecoration(
                  hintText: 'mm/dd/yyyy',
                  hintStyle: const TextStyle(color: Color(0xFFBBCAC4)),
                  filled: true,
                  fillColor: Colors.white,
                  suffixIcon: const Icon(Icons.calendar_today, color: Color(0xFF1A1C1E), size: 20),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(8),
                    borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(height: 20),

          // Description Field
          _buildLabel(Icons.description, 'Description'),
          const SizedBox(height: 6),
          TextField(
            controller: _descController,
            maxLines: 3,
            decoration: InputDecoration(
              hintText: 'Outline the learning objectives...',
              hintStyle: const TextStyle(color: Color(0xFFBBCAC4)),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLabel(IconData icon, String text) {
    return Row(
      children: [
        Icon(icon, size: 18, color: const Color(0xFF4B5563)),
        const SizedBox(width: 6),
        Text(
          text,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF4B5563),
          ),
        ),
      ],
    );
  }

  Widget _buildDropdown({
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required ValueChanged<String?> onChanged,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: const Color(0xFFBBCAC4)),
      ),
      child: DropdownButtonHideUnderline(
        child: DropdownButton<String>(
          value: value,
          isExpanded: true,
          icon: const Icon(Icons.expand_more, color: Color(0xFF4B5563)),
          items: items,
          onChanged: onChanged,
        ),
      ),
    );
  }

  Widget _buildSegmentedControl() {
    return Container(
      padding: const EdgeInsets.all(6),
      decoration: BoxDecoration(
        color: const Color(0xFFE2E2E5), // surface-container-highest
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedTab = 'pdf'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _selectedTab == 'pdf' ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: _selectedTab == 'pdf'
                      ? [
                          BoxShadow(
                            color: Colors.black.withAlpha(12),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          )
                        ]
                      : [],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.picture_as_pdf_outlined,
                      size: 18,
                      color: _selectedTab == 'pdf' ? const Color(0xFF00C2A8) : const Color(0xFF4B5563),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'PDF Resource',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _selectedTab == 'pdf' ? const Color(0xFF00C2A8) : const Color(0xFF4B5563),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
          Expanded(
            child: GestureDetector(
              onTap: () => setState(() => _selectedTab = 'quiz'),
              child: Container(
                padding: const EdgeInsets.symmetric(vertical: 12),
                decoration: BoxDecoration(
                  color: _selectedTab == 'quiz' ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(8),
                  boxShadow: _selectedTab == 'quiz'
                      ? [
                          BoxShadow(
                            color: Colors.black.withAlpha(12),
                            blurRadius: 4,
                            offset: const Offset(0, 2),
                          )
                        ]
                      : [],
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.help_outline,
                      size: 18,
                      color: _selectedTab == 'quiz' ? const Color(0xFF00C2A8) : const Color(0xFF4B5563),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      'Interactive Quiz',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: _selectedTab == 'quiz' ? const Color(0xFF00C2A8) : const Color(0xFF4B5563),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPdfSection() {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFF00C2A8).withAlpha(77), width: 2),
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
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFF00C2A8).withAlpha(12),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.cloud_upload_outlined, color: Color(0xFF00C2A8), size: 40),
          ),
          const SizedBox(height: 20),
          const Text(
            'Upload PDF Document',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1C1E),
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Drag and drop your files here or\nbrowse to upload',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Color(0xFF4B5563),
            ),
          ),
          const SizedBox(height: 12),
          const Text(
            'MAX FILE SIZE 50MB',
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.bold,
              letterSpacing: 1.0,
              color: Color(0xFF6C7A76),
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {},
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF00C2A8),
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(30),
              ),
            ),
            child: const Text(
              'Browse Files',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuizSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFBBCAC4).withAlpha(77)),
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
          _buildLabel(Icons.quiz_outlined, 'Quiz Title'),
          const SizedBox(height: 6),
          TextField(
            decoration: InputDecoration(
              hintText: 'e.g. Biology Midterm Quiz',
              hintStyle: const TextStyle(color: Color(0xFFBBCAC4)),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
              ),
            ),
          ),
          const SizedBox(height: 20),
          _buildLabel(Icons.timer_outlined, 'Time Limit (minutes)'),
          const SizedBox(height: 6),
          TextField(
            keyboardType: TextInputType.number,
            decoration: InputDecoration(
              hintText: '30',
              hintStyle: const TextStyle(color: Color(0xFFBBCAC4)),
              filled: true,
              fillColor: Colors.white,
              contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(8),
                borderSide: const BorderSide(color: Color(0xFFBBCAC4)),
              ),
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.add_circle_outline, color: Color(0xFF4B5563)),
            label: const Text(
              'Add Question',
              style: TextStyle(
                color: Color(0xFF4B5563),
                fontSize: 14,
                fontWeight: FontWeight.w600,
              ),
            ),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              minimumSize: const Size(double.infinity, 50),
              side: BorderSide(color: const Color(0xFFBBCAC4).withAlpha(128)),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
            ),
          ),
        ],
      ),
    );
  }
}
