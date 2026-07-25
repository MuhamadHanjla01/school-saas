import 'dart:convert';
import 'package:flutter/material.dart';
import '../../widgets/custom_app_bar.dart';
import '../../api_client.dart';

class TeachersScreen extends StatefulWidget {
  const TeachersScreen({super.key});

  @override
  State<TeachersScreen> createState() => _TeachersScreenState();
}

class _TeachersScreenState extends State<TeachersScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  List<dynamic> _teachers = [];
  List<dynamic> _filteredTeachers = [];
  bool _isLoading = true;
  final TextEditingController _searchController = TextEditingController();

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
    _fetchTeachers();
  }

  Future<void> _fetchTeachers() async {
    try {
      final res = await apiClient.get('/api/teachers');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        if (mounted) {
          setState(() {
            _teachers = data['teachers'] as List<dynamic>? ?? [];
            _filteredTeachers = _teachers;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching teachers: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  void _filterTeachers(String query) {
    setState(() {
      if (query.isEmpty) {
        _filteredTeachers = _teachers;
      } else {
        _filteredTeachers = _teachers.where((t) {
          final name = t['name']?.toString().toLowerCase() ?? '';
          final dept = t['department']?.toString().toLowerCase() ?? '';
          final search = query.toLowerCase();
          return name.contains(search) || dept.contains(search);
        }).toList();
      }
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                const CustomAppBar(
                  title: 'My Teachers',
                  showBackButton: true,
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


                          // Search Bar
                          Container(
                            decoration: BoxDecoration(
                              color: const Color(0xFFF3F3F6),
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(
                                color: const Color(0xFFE2E2E5),
                              ),
                            ),
                            child: TextField(
                              controller: _searchController,
                              onChanged: _filterTeachers,
                              decoration: const InputDecoration(
                                hintText: 'Search teachers...',
                                hintStyle: TextStyle(
                                  color: Color(0xFF6C7A76),
                                  fontSize: 14,
                                ),
                                prefixIcon: Icon(
                                  Icons.search,
                                  color: Color(0xFF6C7A76),
                                  size: 20,
                                ),
                                border: InputBorder.none,
                                contentPadding: EdgeInsets.symmetric(
                                  horizontal: 16,
                                  vertical: 12,
                                ),
                              ),
                            ),
                          ),
                          const SizedBox(height: 24),

                          // Teacher Cards
                          ..._filteredTeachers.map((t) => _buildTeacherCard(t as Map<String, dynamic>)),
                        ],
                      ),
                    ),
                  ),
                ),
              ],
            ),

          ],
        ),
      ),
    );
  }

  Widget _buildTeacherCard(Map<String, dynamic> teacher) {
    final name = teacher['name']?.toString() ?? 'Unknown Teacher';
    final dept = teacher['department']?.toString() ?? 'Department';
    final subjectsList = teacher['subjectNames'] as List<dynamic>? ?? [];
    final subjects = subjectsList.isNotEmpty ? subjectsList.join(', ').toUpperCase() : 'NO SUBJECTS';
    final color = const Color(0xFF00C2A8);
    final initials = name.split(' ').where((s) => s.isNotEmpty).take(2).map((s) => s[0]).join().toUpperCase();

    return InkWell(
      onTap: () {
        Navigator.of(context).pushNamed(
          '/teacher_profile',
          arguments: {'teacherId': teacher['id']},
        );
      },
      borderRadius: BorderRadius.circular(24),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
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
        child: Column(
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Avatar
                Container(
                  width: 64,
                  height: 64,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: color.withAlpha(25),
                    border: Border.all(
                      color: color.withAlpha(50),
                      width: 2,
                    ),
                  ),
                  alignment: Alignment.center,
                  child: Text(
                    initials,
                    style: TextStyle(
                      fontSize: 24,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Row(
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
                            child: Text(
                              subjects,
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF3C4A46),
                                letterSpacing: 0.5,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Text(
                        dept,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF6C7A76),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            // Divider
            Container(
              height: 1,
              color: const Color(0xFFE2E2E5).withAlpha(128),
            ),
            const SizedBox(height: 16),
            // Action Buttons
            Row(
              children: [
                Expanded(
                  child: ElevatedButton.icon(
                    onPressed: () {
                      Navigator.of(context).pushNamed(
                        '/teacher_chat',
                        arguments: {
                          'otherUserId': teacher['user']?['id'], 
                          'otherUserName': name
                        },
                      );
                    },
                    icon: const Icon(Icons.chat_bubble_outline, size: 18),
                    label: const Text('Message'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF00C2A8),
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      textStyle: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: () {
                      Navigator.of(context).pushNamed(
                        '/teacher_profile',
                        arguments: {'teacherId': teacher['id']},
                      );
                    },
                    icon: const Icon(Icons.person_outline, size: 18),
                    label: const Text('Profile'),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: const Color(0xFF00C2A8),
                      side: const BorderSide(color: Color(0xFF00C2A8)),
                      elevation: 0,
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      textStyle: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
