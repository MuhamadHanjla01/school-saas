import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../api_client.dart';
import 'package:image_picker/image_picker.dart';
import 'package:http/http.dart' as http;

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  Map<String, dynamic>? _student;
  bool _isLoading = true;
  bool _isUploadingAvatar = false;

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
    _fetchProfile();
  }

  Future<void> _fetchProfile() async {
    try {
      const storage = FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        final studentId = userData['student']?['id'];
        
        if (studentId != null) {
          final res = await apiClient.get('/api/students/$studentId');
          if (res.statusCode == 200) {
            final data = jsonDecode(res.body);
            if (mounted) {
              setState(() {
                _student = data['student'];
                _isLoading = false;
              });
            }
            return;
          }
        }
      }
    } catch (e) {
      debugPrint('Error fetching profile: $e');
    }
    
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _uploadAvatar() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(source: ImageSource.gallery);
    
    if (pickedFile == null) return;

    setState(() {
      _isUploadingAvatar = true;
    });

    try {
      final storage = const FlutterSecureStorage();
      final token = await storage.read(key: 'jwt_token');
      
      var request = http.MultipartRequest('POST', Uri.parse('${apiClient.baseUrl}/api/auth/me/avatar'));
      request.headers['Authorization'] = 'Bearer $token';
      request.files.add(await http.MultipartFile.fromPath('avatar', pickedFile.path));
      
      var response = await request.send();
      if (response.statusCode == 200) {
        final resStr = await response.stream.bytesToString();
        final data = jsonDecode(resStr);
        final updatedUser = data['user'];
        
        // update secure storage
        final userStr = await storage.read(key: 'user_data');
        if (userStr != null) {
          final userData = jsonDecode(userStr);
          userData['avatar'] = updatedUser['avatar'];
          await storage.write(key: 'user_data', value: jsonEncode(userData));
        }

        // fetch profile again to update _student map
        await _fetchProfile(); 
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Avatar updated successfully!')));
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update avatar')));
        }
      }
    } catch (e) {
      debugPrint('Avatar upload error: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Error uploading avatar')));
      }
    } finally {
      if (mounted) {
        setState(() {
          _isUploadingAvatar = false;
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

    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(currentRoute: '/profile'),
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
                        children: [
                          _buildProfileHeader(),
                          const SizedBox(height: 24),
                          _buildPersonalDetails(),
                          const SizedBox(height: 24),
                          _buildAcademicDetails(),
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
                selectedIndex: 4, // Profile tab
                onItemSelected: (index) {
                  if (index == 4) return;
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

  // ─── Profile Header & ID Card ───
  Widget _buildProfileHeader() {
    final name = _student?['name']?.toString() ?? 'Student Name';
    final studentId = _student?['studentId']?.toString() ?? 'STD-XXXX-XXXX';
    final className = _student?['class']?['name']?.toString() ?? 'N/A';
    final initials = name.split(' ').where((s) => s.isNotEmpty).take(2).map((s) => s[0]).join().toUpperCase();

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
      child: Column(
        children: [
          // Top Decorative Banner
          Container(
            height: 80,
            decoration: const BoxDecoration(
              color: Color(0xFFD4EBE7), // Soft teal matching image
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
          ),
          // Content
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 24),
            child: Column(
              children: [
                // Avatar
                Transform.translate(
                  offset: const Offset(0, -40),
                  child: GestureDetector(
                    onTap: _isUploadingAvatar ? null : _uploadAvatar,
                    child: Stack(
                      alignment: Alignment.center,
                      children: [
                        Container(
                          width: 100,
                          height: 100,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 4),
                            color: const Color(0xFF00C2A8),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withAlpha(20),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              )
                            ],
                            image: (_student?['user']?['avatar'] != null)
                                ? DecorationImage(
                                    image: NetworkImage(apiClient.baseUrl + _student!['user']['avatar']),
                                    fit: BoxFit.cover,
                                  )
                                : null,
                          ),
                          alignment: Alignment.center,
                          child: _student?['user']?['avatar'] == null
                              ? Text(
                                  initials,
                                  style: const TextStyle(
                                    fontSize: 36,
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                )
                              : null,
                        ),
                        if (_isUploadingAvatar)
                          const CircularProgressIndicator(color: Colors.white),
                        if (!_isUploadingAvatar)
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(6),
                              decoration: const BoxDecoration(
                                color: Color(0xFF00C2A8),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.camera_alt, color: Colors.white, size: 16),
                            ),
                          ),
                      ],
                    ),
                  ),
                ),
                // Name & ID
                Transform.translate(
                  offset: const Offset(0, -28),
                  child: Column(
                    children: [
                      Text(
                        name,
                        style: const TextStyle(
                          fontSize: 22,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Student ID: $studentId',
                        style: TextStyle(
                          fontSize: 14,
                          color: const Color(0xFF3C4A46).withAlpha(200),
                        ),
                      ),
                    ],
                  ),
                ),
                // Digital ID Card Section
                Transform.translate(
                  offset: const Offset(0, -12),
                  child: Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF9F9FC),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: const Color(0xFFE2E2E5),
                      ),
                    ),
                    child: Column(
                      children: [
                        const Text(
                          'DIGITAL ID CARD',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                            color: Color(0xFF006B5C),
                            letterSpacing: 1.2,
                          ),
                        ),
                        const SizedBox(height: 16),
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _IDInfoField(label: 'Class', value: className),
                                  const SizedBox(height: 12),
                                  const _IDInfoField(label: 'Status', value: 'Active'),
                                ],
                              ),
                            ),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  _IDInfoField(label: 'Guardian', value: _student?['guardianName']?.toString() ?? 'N/A'),
                                  const SizedBox(height: 12),
                                  const _IDInfoField(label: 'Blood Group', value: 'O+'),
                                ],
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),
                        // Barcode placeholder
                        Container(
                          width: 140,
                          height: 40,
                          decoration: BoxDecoration(
                            color: const Color(0xFFE2E2E5), // Placeholder color
                            borderRadius: BorderRadius.circular(4),
                          ),
                          alignment: Alignment.center,
                          child: const Text('|||||||||||||||||||||||', style: TextStyle(fontSize: 24, letterSpacing: 2)),
                        ),
                      ],
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

  // ─── Personal Details ───
  Widget _buildPersonalDetails() {
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
              const Icon(Icons.person_outline, color: Color(0xFF006B5C)),
              const SizedBox(width: 8),
              const Text(
                'Personal Details',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1C1E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          _buildDetailRow('Guardian Name', _student?['guardianName']?.toString() ?? 'N/A'),
          _buildDivider(),
          _buildDetailRow('Phone', _student?['phone']?.toString() ?? 'N/A'),
          _buildDivider(),
          _buildDetailRow('Status', _student?['status']?.toString() ?? 'Active'),
        ],
      ),
    );
  }

  // ─── Academic Details ───
  Widget _buildAcademicDetails() {
    final createdAt = _student?['createdAt']?.toString();
    String admissionDate = 'N/A';
    if (createdAt != null) {
      final parsed = DateTime.tryParse(createdAt);
      if (parsed != null) {
        admissionDate = parsed.toString().split(' ')[0];
      }
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
              const Icon(Icons.school_outlined, color: Color(0xFF006B5C)),
              const SizedBox(width: 8),
              const Text(
                'Academic Details',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1C1E),
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          Row(
            children: [
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF006B5C).withAlpha(10), // primary/5
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Admission Date',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF3C4A46),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        admissionDate,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF68ABFF).withAlpha(25), // secondary-container/10
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: const [
                      Text(
                        'Session',
                        style: TextStyle(
                          fontSize: 12,
                          color: Color(0xFF3C4A46),
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        '2024-2025',
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFFF8D69).withAlpha(25), // tertiary-container/10
              borderRadius: BorderRadius.circular(16),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: const [
                    Text(
                      'Current Shift',
                      style: TextStyle(
                        fontSize: 12,
                        color: Color(0xFF3C4A46),
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Morning',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF1A1C1E),
                      ),
                    ),
                  ],
                ),
                const Icon(
                  Icons.wb_sunny_outlined,
                  color: Color(0xFFFF8D69), // tertiary-container
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 14,
            color: Color(0xFF3C4A46),
          ),
        ),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w500,
            color: Color(0xFF1A1C1E),
          ),
        ),
      ],
    );
  }

  Widget _buildDivider() {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Container(
        height: 1,
        color: const Color(0xFFE2E2E5).withAlpha(128),
      ),
    );
  }
}

class _IDInfoField extends StatelessWidget {
  final String label;
  final String value;

  const _IDInfoField({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF6C7A76),
          ),
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: Color(0xFF1A1C1E),
          ),
        ),
      ],
    );
  }
}
