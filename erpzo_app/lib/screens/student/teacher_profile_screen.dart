import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api_client.dart';

class TeacherProfileScreen extends StatefulWidget {
  const TeacherProfileScreen({super.key});

  @override
  State<TeacherProfileScreen> createState() => _TeacherProfileScreenState();
}

class _TeacherProfileScreenState extends State<TeacherProfileScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  String? _teacherId;
  Map<String, dynamic>? _teacher;
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
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_teacherId == null) {
      final args = ModalRoute.of(context)?.settings.arguments as Map<String, dynamic>?;
      if (args != null && args['teacherId'] != null) {
        _teacherId = args['teacherId'];
        _fetchTeacher();
      } else {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _fetchTeacher() async {
    try {
      final res = await apiClient.get('/api/teachers/$_teacherId');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _teacher = data['teacher'];
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching teacher: $e');
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
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);

    if (_isLoading) {
      return const Scaffold(
        backgroundColor: backgroundColor,
        body: Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8))),
      );
    }

    if (_teacher == null) {
      return Scaffold(
        backgroundColor: backgroundColor,
        appBar: AppBar(title: const Text('Teacher Profile')),
        body: const Center(child: Text('Teacher not found.')),
      );
    }

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            // Custom App Bar with Back Button
            _buildAppBar(context),
            Expanded(
              child: FadeTransition(
                opacity: _fadeAnim,
                child: SingleChildScrollView(
                  physics: const BouncingScrollPhysics(),
                  padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
                  child: Column(
                    children: [
                      _buildProfileHeader(),
                      const SizedBox(height: 24),
                      _buildQuickStats(),
                      const SizedBox(height: 24),
                      _buildAboutSection(),
                      const SizedBox(height: 24),
                      _buildAssignedSubjects(),
                    ],
                  ),
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
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back, color: Color(0xFF006B5C)),
            onPressed: () => Navigator.of(context).pop(),
          ),
          const Text(
            'Teacher Profile',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1C1E),
            ),
          ),
          const SizedBox(width: 48), // balance back button
        ],
      ),
    );
  }

  Widget _buildProfileHeader() {
    final name = _teacher!['name'] ?? 'Unknown Teacher';
    final dept = _teacher!['department'] ?? 'Department';
    final initials = name.split(' ').where((s) => s.isNotEmpty).take(2).map((s) => s[0]).join().toUpperCase();

    return Container(
      width: double.infinity,
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
      child: Stack(
        alignment: Alignment.topCenter,
        children: [
          // Background soft gradient
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 150,
              height: 150,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFF00C2A8).withAlpha(50),
                    Colors.white.withAlpha(0)
                  ],
                ),
              ),
            ),
          ),
          Column(
            children: [
              // Avatar
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: const Color(0xFF00C2A8).withAlpha(25),
                  border: Border.all(color: Colors.white, width: 4),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withAlpha(20),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    )
                  ],
                ),
                alignment: Alignment.center,
                child: Text(
                  initials,
                  style: const TextStyle(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF00C2A8),
                  ),
                ),
              ),
              const SizedBox(height: 16),
              Text(
                name,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1C1E),
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Faculty',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF006B5C),
                ),
              ),
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: const Color(0xFFF3F3F6),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.domain, color: Color(0xFF9D4224), size: 16),
                    const SizedBox(width: 6),
                    Text(
                      dept,
                      style: const TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF3C4A46),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),
              // Buttons
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).pushNamed(
                        '/teacher_chat',
                        arguments: {
                          'otherUserId': _teacher!['user']?['id'],
                          'otherUserName': name
                        },
                      );
                    },
                    icon: const Icon(Icons.mail_outline, size: 18),
                    label: const Text('Message'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00C2A8),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
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

  Widget _buildQuickStats() {
    final subjects = (_teacher!['subjects'] as List<dynamic>? ?? []);
    final classes = (_teacher!['classTeacher'] as List<dynamic>? ?? []);
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            icon: Icons.menu_book,
            iconBg: const Color(0xFF00C2A8).withAlpha(25),
            iconColor: const Color(0xFF006B5C),
            value: '${subjects.length}',
            label: 'SUBJECTS',
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            icon: Icons.groups_outlined,
            iconBg: const Color(0xFF68ABFF).withAlpha(25),
            iconColor: const Color(0xFF0060AC),
            value: '${classes.length}',
            label: 'CLASSES',
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String value,
    required String label,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withAlpha(10),
            blurRadius: 10,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 24),
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1C1E),
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: const TextStyle(
              fontSize: 10,
              fontWeight: FontWeight.w600,
              color: Color(0xFF3C4A46),
              letterSpacing: 0.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAboutSection() {
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
            children: const [
              Icon(Icons.person_pin_outlined, color: Color(0xFF006B5C)),
              SizedBox(width: 8),
              Text(
                'About Me',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1C1E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          const Text(
            'Dedicated educator.',
            style: TextStyle(
              fontSize: 14,
              height: 1.5,
              color: Color(0xFF3C4A46),
            ),
          ),
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 20),
            child: Divider(color: Color(0xFFE2E2E5)),
          ),
          const Text(
            'CONTACT INFORMATION',
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.bold,
              color: Color(0xFF1A1C1E),
              letterSpacing: 1.0,
            ),
          ),
          const SizedBox(height: 16),
          if (_teacher!['email'] != null) ...[
            _buildContactRow(Icons.email_outlined, _teacher!['email']),
            const SizedBox(height: 12),
          ],
          if (_teacher!['phone'] != null)
            _buildContactRow(Icons.phone_outlined, _teacher!['phone']),
        ],
      ),
    );
  }

  Widget _buildContactRow(IconData icon, String text) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: const BoxDecoration(
            color: Color(0xFFF3F3F6),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 16, color: const Color(0xFF3C4A46)),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Text(
            text,
            style: const TextStyle(
              fontSize: 14,
              color: Color(0xFF1A1C1E),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildAssignedSubjects() {
    final subjects = (_teacher!['subjects'] as List<dynamic>? ?? []);
    if (subjects.isEmpty) {
      return const SizedBox.shrink();
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
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: const [
                  Icon(Icons.menu_book_outlined, color: Color(0xFF006B5C)),
                  SizedBox(width: 8),
                  Text(
                    'Assigned Subjects',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: Color(0xFF1A1C1E),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),
          ...subjects.map((sub) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: _buildSubjectCard(
                icon: Icons.book,
                iconBg: const Color(0xFF00C2A8).withAlpha(25),
                iconColor: const Color(0xFF006B5C),
                title: sub['name'] ?? 'Subject',
                grade: sub['class']?['name'] ?? '',
              ),
            );
          }),
        ],
      ),
    );
  }

  Widget _buildSubjectCard({
    required IconData icon,
    required Color iconBg,
    required Color iconColor,
    required String title,
    required String grade,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFE2E2E5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: iconBg,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF1A1C1E),
                  ),
                ),
                if (grade.isNotEmpty) ...[
                  const SizedBox(height: 2),
                  Text(
                    grade,
                    style: const TextStyle(
                      fontSize: 12,
                      color: Color(0xFF3C4A46),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
