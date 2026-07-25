import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../api_client.dart';

class AssignmentsScreen extends StatefulWidget {
  const AssignmentsScreen({super.key});

  @override
  State<AssignmentsScreen> createState() => _AssignmentsScreenState();
}

class _AssignmentsScreenState extends State<AssignmentsScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  List<Map<String, dynamic>> _assignments = [];
  bool _isLoading = true;

  // Map subject icon names to Flutter icons
  static const Map<String, IconData> _subjectIcons = {
    'science': Icons.science_outlined,
    'calculate': Icons.calculate_outlined,
    'history_edu': Icons.history_edu_outlined,
  };

  static const Map<String, IconData> _dateIcons = {
    'calendar_today': Icons.calendar_today,
    'history': Icons.history,
  };

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
    
    _fetchAssignments();
  }

  Future<void> _fetchAssignments() async {
    try {
      const storage = FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      String? classId;
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        classId = userData['student']?['classId'];
      }

      String url = '/api/assignments';
      if (classId != null) {
        url += '?classId=$classId';
      }

      final res = await apiClient.get(url);
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final assignmentsList = data['assignments'] as List<dynamic>? ?? [];
        
        List<Map<String, dynamic>> assignments = [];
        
        for (var a in assignmentsList) {
          final isPending = a['status'] != 'Completed';
          
          String subjectIcon = 'history_edu';
          final subj = a['subject']?['name']?.toString().toLowerCase() ?? '';
          if (subj.contains('math')) subjectIcon = 'calculate';
          if (subj.contains('sci') || subj.contains('phy') || subj.contains('chem')) subjectIcon = 'science';

          assignments.add({
            'subject': a['subject']?['name'] ?? 'Unknown',
            'subjectIcon': subjectIcon,
            'title': a['title'] ?? 'Assignment',
            'dueLabel': isPending 
                ? 'Due: ${DateTime.parse(a['dueDate']).toString().split(' ')[0]}' 
                : 'Submitted',
            'dateIcon': isPending ? 'calendar_today' : 'history',
            'status': isPending ? 'pending' : 'submitted',
            'actionLabel': isPending ? 'View Work' : 'View Submission',
          });
        }
        
        if (mounted) {
          setState(() {
            _assignments = assignments;
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching assignments: $e');
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

  int get _pendingCount =>
      _assignments.where((a) => a['status'] == 'pending').length;

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);

    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(currentRoute: '/assignments'),
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                CustomAppBar(
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
                          _buildHeader(),
                          const SizedBox(height: 24),
                          if (_assignments.isEmpty)
                            const Center(child: Text('No assignments found.', style: TextStyle(color: Colors.grey)))
                          else
                            ..._assignments.map(_buildAssignmentCard),
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
                selectedIndex: 2, // Assignments tab
                onItemSelected: (index) {
                  if (index == 2) return;
                  const routes = [
                    '/dashboard',
                    '/calendar',
                    '/assignments',
                    '/fee',
                    '/profile',
                  ];
                  Navigator.of(context).pushReplacementNamed(routes[index]);
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ─── Header ───
  Widget _buildHeader() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.end,
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Assignments',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1C1E),
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 4),
              const Text(
                'Manage your coursework and submissions',
                style: TextStyle(
                  fontSize: 14,
                  color: Color(0xFF3C4A46),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(width: 12),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          decoration: BoxDecoration(
            color: const Color(0xFF006B5C).withAlpha(20),
            borderRadius: BorderRadius.circular(20),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.task_outlined, size: 18, color: Color(0xFF006B5C)),
              const SizedBox(width: 6),
              Text(
                '$_pendingCount\nPending',
                textAlign: TextAlign.center,
                style: const TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF006B5C),
                  height: 1.3,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  // ─── Assignment Card ───
  Widget _buildAssignmentCard(Map<String, dynamic> assignment) {
    final isPending = assignment['status'] == 'pending';
    final Color accentColor = isPending
        ? const Color(0xFFFF8D69) // tertiary-container orange
        : const Color(0xFF00C2A8); // primary-container teal
    final Color statusTextColor = isPending
        ? const Color(0xFF9D4224) // tertiary
        : const Color(0xFF006B5C); // primary
    final Color statusBgColor = isPending
        ? const Color(0xFF9D4224).withAlpha(20)
        : const Color(0xFF006B5C).withAlpha(20);

    final subjectIcon =
        _subjectIcons[assignment['subjectIcon']] ?? Icons.book_outlined;
    final dateIcon =
        _dateIcons[assignment['dateIcon']] ?? Icons.calendar_today;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
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
          // Right accent bar
          Positioned(
            right: 0,
            top: 0,
            bottom: 0,
            width: 6,
            child: Container(
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: const BorderRadius.only(
                  topRight: Radius.circular(20),
                  bottomRight: Radius.circular(20),
                ),
              ),
            ),
          ),
          Opacity(
            opacity: isPending ? 1.0 : 0.8,
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Subject chip + Status badge
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      // Subject chip
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF3F3F6),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(subjectIcon,
                                size: 14, color: statusTextColor),
                            const SizedBox(width: 6),
                            Text(
                              assignment['subject'],
                              style: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                                color: Color(0xFF3C4A46),
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 10, vertical: 5),
                        decoration: BoxDecoration(
                          color: statusBgColor,
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            if (!isPending)
                              Padding(
                                padding: const EdgeInsets.only(right: 4),
                                child: Icon(Icons.check_circle,
                                    size: 14, color: statusTextColor),
                              ),
                            Text(
                              isPending ? 'Pending' : 'Submitted',
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                                color: statusTextColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Title
                  Text(
                    assignment['title'],
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1A1C1E),
                    ),
                  ),
                  const SizedBox(height: 8),

                  // Due / Submitted date
                  Row(
                    children: [
                      Icon(dateIcon,
                          size: 16, color: const Color(0xFF3C4A46)),
                      const SizedBox(width: 6),
                      Text(
                        assignment['dueLabel'],
                        style: const TextStyle(
                          fontSize: 14,
                          color: Color(0xFF3C4A46),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Action button
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton.icon(
                      onPressed: () {},
                      icon: Icon(
                        isPending ? Icons.visibility : Icons.description,
                        size: 18,
                      ),
                      label: Text(assignment['actionLabel']),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: isPending
                            ? const Color(0xFF006B5C).withAlpha(20)
                            : const Color(0xFFE2E2E5).withAlpha(76),
                        foregroundColor: isPending
                            ? const Color(0xFF006B5C)
                            : const Color(0xFF3C4A46),
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
            ),
          ),
        ],
      ),
    );
  }
}
