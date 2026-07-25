import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api_client.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../widgets/custom_app_bar.dart';

class TeacherOwnProfileScreen extends StatefulWidget {
  const TeacherOwnProfileScreen({super.key});

  @override
  State<TeacherOwnProfileScreen> createState() => _TeacherOwnProfileScreenState();
}

class _TeacherOwnProfileScreenState extends State<TeacherOwnProfileScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  bool _isLoading = true;
  bool _isSaving = false;

  // Colors based on the provided tailwind config
  static const Color surfaceColor = Color(0xFFF9F9FC);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color primaryColor = Color(0xFF006B5C);
  static const Color primaryContainer = Color(0xFF00C2A8);
  static const Color onSurface = Color(0xFF1A1C1E);
  static const Color onSurfaceVariant = Color(0xFF3C4A46);
  static const Color outlineColor = Color(0xFF6C7A76);

  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _titleController = TextEditingController();
  final TextEditingController _aboutController = TextEditingController();
  final TextEditingController _emailController = TextEditingController();
  final TextEditingController _phoneController = TextEditingController();
  final TextEditingController _addressController = TextEditingController();

  List<String> _qualifications = [];

  @override
  void initState() {
    super.initState();
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      final res = await apiClient.get('/api/teachers/me/profile');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final teacher = data['teacher'];
        setState(() {
          _nameController.text = teacher['name'] ?? '';
          _titleController.text = teacher['title'] ?? '';
          _aboutController.text = teacher['about'] ?? '';
          _emailController.text = data['email'] ?? '';
          _phoneController.text = teacher['phone'] ?? '';
          _addressController.text = teacher['address'] ?? '';
          if (teacher['qualifications'] != null && teacher['qualifications'].toString().isNotEmpty) {
            try {
              _qualifications = List<String>.from(jsonDecode(teacher['qualifications']));
            } catch (e) {
              _qualifications = teacher['qualifications'].toString().split(',').map((e) => e.trim()).toList();
            }
          }
          _isLoading = false;
        });
      } else {
        if (mounted) setState(() => _isLoading = false);
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  Future<void> _saveProfile() async {
    if (_isSaving) return;
    setState(() => _isSaving = true);
    try {
      final res = await apiClient.put(
        '/api/teachers/me/profile',
        body: {
          'name': _nameController.text.trim(),
          'title': _titleController.text.trim(),
          'about': _aboutController.text.trim(),
          'phone': _phoneController.text.trim(),
          'address': _addressController.text.trim(),
          'qualifications': jsonEncode(_qualifications),
        },
      );
      if (res.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Profile saved successfully!'), backgroundColor: primaryColor),
          );
        }
      }
    } catch (e) {
      debugPrint('Error saving profile: $e');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _titleController.dispose();
    _aboutController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  void _addQualification() {
    showDialog(
      context: context,
      builder: (context) {
        String newQual = '';
        return AlertDialog(
          title: const Text('Add Qualification'),
          content: TextField(
            onChanged: (value) => newQual = value,
            decoration: const InputDecoration(
              hintText: 'e.g. B.Ed in Science Education',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('Cancel', style: TextStyle(color: outlineColor)),
            ),
            ElevatedButton(
              onPressed: () {
                if (newQual.trim().isNotEmpty) {
                  setState(() {
                    _qualifications.add(newQual.trim());
                  });
                }
                Navigator.of(context).pop();
              },
              style: ElevatedButton.styleFrom(backgroundColor: primaryColor, foregroundColor: Colors.white),
              child: const Text('Add'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: surfaceColor,
      drawer: const AppDrawer(isTeacher: true, currentRoute: '/teacher_own_profile'),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                CustomAppBar(
                  title: 'My Profile',
                  isTeacher: true,
                  onMenuPressed: () {
                    _scaffoldKey.currentState?.openDrawer();
                  },
                  trailing: ElevatedButton(
                    onPressed: _saveProfile,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: primaryContainer,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                          )
                        : const Text('Save', style: TextStyle(fontWeight: FontWeight.w600)),
                  ),
                ),
                Expanded(
                  child: _isLoading
                      ? const Center(child: CircularProgressIndicator(color: primaryColor))
                      : SingleChildScrollView(
                          padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                          physics: const BouncingScrollPhysics(),
                          child: Column(
                            children: [
                              _buildProfileHeader(),
                              const SizedBox(height: 24),
                              _buildAboutSection(),
                              const SizedBox(height: 24),
                              _buildPersonalDetailsSection(),
                              const SizedBox(height: 24),
                              _buildQualificationsSection(),
                            ],
                          ),
                        ),
                ),
              ],
            ),
            Positioned(
              bottom: 24,
              left: 20,
              right: 20,
              child: CustomBottomNav(
                selectedIndex: 4, // Profile tab
                onItemSelected: (index) {
                  const routes = [
                    '/teacher_dashboard',
                    '/teacher_calendar',
                    '/teacher_give_assignments',
                    '/teacher_salary',
                    '/teacher_own_profile',
                  ];
                  if (index != 4) {
                    Navigator.of(context).pushReplacementNamed(routes[index]);
                  }
                },
              ),
            ),
          ],
        ),
      ),
    );
  }


  Widget _buildProfileHeader() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: surfaceContainerLowest,
        borderRadius: BorderRadius.circular(24),
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
          Stack(
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  border: Border.all(color: primaryContainer.withOpacity(0.3), width: 4),
                  image: const DecorationImage(
                    image: NetworkImage(
                      'https://lh3.googleusercontent.com/aida-public/AB6AXuBcfgQAkY-VfzF4Os14Csuh80J_HVS7GUC2WJfL-0cIALdo_gSM6HdFW3_JGWD-t-8eQE0uEkqUtaojjVIr5H3thlRxoPP2j4zsxaH5hKJ08_uXZNJPsT-1PSOqS49KOKUg9GAuOuBo-xnPq74NL9UojxiJfq9-q3AVGNrp5CtH9p72GGHI4wiz3_qpx_JlxH-fg4IYDKcIt7i79nQFB4KWy91s3Cq_vU1vLMBV5EUZkO2_l8t0rf_M7A5A32UMSDqanVkTwe2okeJr',
                    ),
                    fit: BoxFit.cover,
                  ),
                ),
              ),
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  padding: const EdgeInsets.all(6),
                  decoration: BoxDecoration(
                    color: primaryColor,
                    shape: BoxShape.circle,
                    border: Border.all(color: surfaceContainerLowest, width: 2),
                  ),
                  child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _nameController,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: onSurface,
            ),
            decoration: const InputDecoration(
              isDense: true,
              border: InputBorder.none,
              hintText: 'Full Name',
            ),
          ),
          TextField(
            controller: _titleController,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: primaryColor,
            ),
            decoration: const InputDecoration(
              isDense: true,
              border: InputBorder.none,
              hintText: 'Job Title',
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
        color: surfaceContainerLowest,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.person_pin_outlined, color: primaryColor),
              SizedBox(width: 8),
              Text(
                'About Me',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _aboutController,
            maxLines: 4,
            style: const TextStyle(
              fontSize: 14,
              height: 1.5,
              color: onSurfaceVariant,
            ),
            decoration: InputDecoration(
              hintText: 'Write a short bio about yourself...',
              hintStyle: const TextStyle(color: outlineColor),
              filled: true,
              fillColor: const Color(0xFFF3F3F6),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              contentPadding: const EdgeInsets.all(16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPersonalDetailsSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: surfaceContainerLowest,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
            offset: const Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: const [
              Icon(Icons.contact_mail_outlined, color: primaryColor),
              SizedBox(width: 8),
              Text(
                'Contact Details',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: onSurface,
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildTextFieldWithIcon(Icons.email_outlined, _emailController, 'Email Address'),
          const SizedBox(height: 12),
          _buildTextFieldWithIcon(Icons.phone_outlined, _phoneController, 'Phone Number'),
          const SizedBox(height: 12),
          _buildTextFieldWithIcon(Icons.location_on_outlined, _addressController, 'Location/Office'),
        ],
      ),
    );
  }

  Widget _buildTextFieldWithIcon(IconData icon, TextEditingController controller, String hint) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: const BoxDecoration(
            color: Color(0xFFF3F3F6),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, size: 20, color: outlineColor),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: TextField(
            controller: controller,
            style: const TextStyle(
              fontSize: 14,
              color: onSurface,
              fontWeight: FontWeight.w500,
            ),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: const TextStyle(color: outlineColor, fontWeight: FontWeight.normal),
              isDense: true,
              filled: true,
              fillColor: Colors.transparent,
              contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 12),
              enabledBorder: const UnderlineInputBorder(
                borderSide: BorderSide(color: Color(0xFFE2E2E5)),
              ),
              focusedBorder: const UnderlineInputBorder(
                borderSide: BorderSide(color: primaryColor, width: 2),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildQualificationsSection() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: surfaceContainerLowest,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 16,
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
                  Icon(Icons.workspace_premium_outlined, color: primaryColor),
                  SizedBox(width: 8),
                  Text(
                    'Qualifications',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: onSurface,
                    ),
                  ),
                ],
              ),
              IconButton(
                onPressed: _addQualification,
                icon: const Icon(Icons.add_circle, color: primaryContainer),
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(),
              ),
            ],
          ),
          const SizedBox(height: 16),
          if (_qualifications.isEmpty)
            const Text(
              'No qualifications added yet.',
              style: TextStyle(color: outlineColor, fontSize: 14),
            ),
          ..._qualifications.asMap().entries.map((entry) {
            final index = entry.key;
            final qual = entry.value;
            return Padding(
              padding: const EdgeInsets.only(bottom: 12.0),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(8),
                    decoration: BoxDecoration(
                      color: primaryContainer.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Icon(Icons.school, size: 16, color: primaryColor),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      qual,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: onSurface,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18, color: Colors.redAccent),
                    onPressed: () {
                      setState(() {
                        _qualifications.removeAt(index);
                      });
                    },
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            );
          }),
        ],
      ),
    );
  }
}
