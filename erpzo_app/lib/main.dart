import 'dart:convert';
import 'package:flutter/material.dart';
import 'api_client.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:jwt_decoder/jwt_decoder.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:http/http.dart' as http;
import 'screens/student/dashboard_screen.dart';
import 'screens/student/class_routine_screen.dart';
import 'screens/student/calendar_screen.dart';
import 'screens/student/assignments_screen.dart';
import 'screens/student/fee_screen.dart';
import 'screens/student/teachers_screen.dart';
import 'screens/notifications_screen.dart';
import 'screens/student/profile_screen.dart';
import 'screens/student/teacher_profile_screen.dart';
import 'screens/student/teacher_chat_screen.dart';
import 'screens/student/messages_screen.dart';
import 'screens/student/report_card_screen.dart';
import 'screens/student/exams_screen.dart';
import 'screens/teacher/teacher_dashboard_screen.dart';
import 'screens/teacher/teacher_schedule_screen.dart';
import 'screens/teacher/teacher_class_screen.dart';
import 'screens/teacher/teacher_give_assignments_screen.dart';
import 'screens/teacher/teacher_report_card_screen.dart';
import 'screens/teacher/teacher_calendar_screen.dart';
import 'screens/teacher/teacher_attendance_screen.dart';
import 'screens/teacher/teacher_messages_screen.dart';
import 'screens/teacher/teacher_salary_screen.dart';
import 'screens/teacher/teacher_own_profile_screen.dart';

class SplashScreen extends StatefulWidget {
  const SplashScreen({super.key});

  @override
  State<SplashScreen> createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  final _storage = const FlutterSecureStorage();

  @override
  void initState() {
    super.initState();
    _checkLoginStatus();
  }

  Future<void> _checkAppUpdate() async {
    try {
      final res = await http.get(Uri.parse('https://school-saas-olive.vercel.app/downloads/version.json')).timeout(const Duration(seconds: 5));
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final latestVersion = data['latest_version'];
        final forceUpdate = data['force_update'] ?? false;
        final downloadUrl = data['download_url'];
        final releaseNotes = data['release_notes'] ?? '';

        final packageInfo = await PackageInfo.fromPlatform();
        final currentVersion = packageInfo.version;

        if (_isUpdateAvailable(currentVersion, latestVersion)) {
          if (mounted) {
            showDialog(
              context: context,
              barrierDismissible: !forceUpdate,
              builder: (ctx) => AlertDialog(
                title: const Text('Update Available'),
                content: Text('A new version ($latestVersion) is available.\n\n$releaseNotes'),
                actions: [
                  if (!forceUpdate)
                    TextButton(
                      onPressed: () {
                        Navigator.of(ctx).pop();
                        _continueLogin();
                      },
                      child: const Text('Later'),
                    ),
                  ElevatedButton(
                    onPressed: () async {
                      final url = Uri.parse(downloadUrl);
                      if (await canLaunchUrl(url)) {
                        await launchUrl(url, mode: LaunchMode.externalApplication);
                      }
                    },
                    child: const Text('Update Now'),
                  ),
                ],
              ),
            );
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('Update check failed: $e');
    }
    _continueLogin();
  }

  bool _isUpdateAvailable(String current, String latest) {
    try {
      final cParts = current.split('.').map(int.parse).toList();
      final lParts = latest.split('.').map(int.parse).toList();
      for (int i = 0; i < 3; i++) {
        if (lParts[i] > cParts[i]) return true;
        if (lParts[i] < cParts[i]) return false;
      }
    } catch (_) {}
    return false;
  }

  Future<void> _checkLoginStatus() async {
    // Add a tiny delay just so the splash screen doesn't instantly flash
    await Future.delayed(const Duration(milliseconds: 500));
    await _checkAppUpdate();
  }

  Future<void> _continueLogin() async {

    final token = await _storage.read(key: 'jwt_token');

    if (token == null) {
      if (mounted) Navigator.of(context).pushReplacementNamed('/login');
      return;
    }

    String activeToken = token;
    if (JwtDecoder.isExpired(token)) {
      final refreshed = await apiClient.refreshToken();
      if (!refreshed) {
        if (mounted) Navigator.of(context).pushReplacementNamed('/login');
        return;
      }
      activeToken = (await _storage.read(key: 'jwt_token')) ?? token;
    }

    // Token exists and is valid -> decode and check role
    try {
      Map<String, dynamic> decodedToken = JwtDecoder.decode(activeToken);
      final role = decodedToken['role']?.toString().toLowerCase();

      if (mounted) {
        if (role == 'teacher') {
          Navigator.of(context).pushReplacementNamed('/teacher_dashboard');
        } else {
          Navigator.of(context).pushReplacementNamed('/dashboard');
        }
      }
    } catch (e) {
      // Fallback if token is malformed
      if (mounted) {
        Navigator.of(context).pushReplacementNamed('/login');
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return const Scaffold(
      backgroundColor: Color(0xFF00C2A8),
      body: Center(
        child: CircularProgressIndicator(color: Colors.white),
      ),
    );
  }
}


class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  bool isStudent = true;
  bool isPasswordVisible = false;
  bool isLoading = false;
  
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _storage = const FlutterSecureStorage();

  Future<void> _login() async {
    setState(() => isLoading = true);
    try {
      final response = await apiClient.post(
        '/api/auth/login',
        body: {
          'email': _emailController.text.trim(),
          'password': _passwordController.text,
          'clientType': 'app', // Enforces platform restriction!
          'role': isStudent ? 'student' : 'teacher'
        },
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        // Enforce role check if backend returns a role
        final userRole = data['user']?['role']?.toString().toLowerCase();
        final expectedRole = isStudent ? 'student' : 'teacher';
        
        if (userRole != null && userRole != expectedRole) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('Please login from the ${userRole == 'teacher' ? 'Teacher' : 'Student'} tab.'),
                backgroundColor: Colors.red
              ),
            );
          }
          setState(() => isLoading = false);
          return;
        }

        await _storage.write(key: 'jwt_token', value: data['accessToken']);
        if (data['refreshToken'] != null) {
          await _storage.write(key: 'refresh_token', value: data['refreshToken']);
        }
        if (data['user'] != null) {
          await _storage.write(key: 'user_data', value: jsonEncode(data['user']));
        }
        
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Login successful!'), backgroundColor: Colors.green),
          );
          
          if (!isStudent) {
            Navigator.of(context).pushNamedAndRemoveUntil(
              '/teacher_dashboard', (route) => false,
            );
          } else {
            Navigator.of(context).pushNamedAndRemoveUntil(
              '/dashboard', (route) => false,
            );
          }
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['error'] ?? 'Login failed'), backgroundColor: Colors.red),
          );
        }
      }
    } on ApiCircuitOpenException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.orange),
        );
      }
    } on ApiTimeoutException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.orange),
        );
      }
    } on ApiServiceUnavailableException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.orange),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Network error. Please try again.'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  Future<void> _forgotPassword() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter your email first to reset your password.'), backgroundColor: Colors.orange),
        );
      }
      return;
    }

    setState(() => isLoading = true);
    try {
      final response = await apiClient.post(
        '/api/auth/forgot-password',
        body: {'email': email},
      );

      final data = jsonDecode(response.body);

      if (response.statusCode == 200) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['message'] ?? 'Password reset link sent!'), backgroundColor: Colors.green),
          );
        }
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(data['error'] ?? 'Failed to send reset link.'), backgroundColor: Colors.red),
          );
        }
      }
    } on ApiCircuitOpenException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.orange),
        );
      }
    } on ApiTimeoutException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message), backgroundColor: Colors.orange),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Network error. Please try again.'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => isLoading = false);
    }
  }

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final double heroHeight = size.height * 0.35;
    final double imageHeight = heroHeight * 0.70;
    final double formHorizontalPadding = size.width > 600 ? size.width * 0.2 : 32.0;

    const Color primaryColor = Color(0xFF00C2A8);
    const Color backgroundColor = Colors.white; // Solid white to match the design

    return Scaffold(
      backgroundColor: backgroundColor,
      body: Column(
        children: [
          // Hero Section
          Container(
            width: double.infinity,
            height: heroHeight,
            decoration: const BoxDecoration(
              color: primaryColor,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(48),
                bottomRight: Radius.circular(48),
              ),
            ),
            child: Stack(
              clipBehavior: Clip.none,
              alignment: Alignment.bottomCenter,
              children: [
                // Animated Welcome Text
                Positioned(
                  top: MediaQuery.of(context).padding.top + 16,
                  left: 0,
                  right: 0,
                  child: TweenAnimationBuilder<double>(
                    tween: Tween<double>(begin: 0.0, end: 1.0),
                    duration: const Duration(milliseconds: 1200),
                    curve: Curves.easeOutBack,
                    builder: (context, value, child) {
                      return Opacity(
                        opacity: value.clamp(0.0, 1.0),
                        child: Transform.translate(
                          offset: Offset(0, -30 * (1 - value)),
                          child: const Text(
                            'Welcome!',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white,
                              fontSize: 36,
                              fontWeight: FontWeight.w900,
                              letterSpacing: 1.2,
                              shadows: [
                                Shadow(
                                  color: Colors.black26,
                                  blurRadius: 12,
                                  offset: Offset(0, 4),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
                Positioned(
                  bottom: (imageHeight * 0.02), // Moved up inside the box
                  child: TweenAnimationBuilder<double>(
                    key: ValueKey(isStudent), // Forces animation replay when switching tabs
                    tween: Tween<double>(begin: 0.0, end: 1.0),
                    duration: const Duration(milliseconds: 1500),
                    curve: Curves.elasticOut,
                    builder: (context, value, child) {
                      return Transform.scale(
                        scale: value,
                        alignment: Alignment.bottomCenter,
                        child: SizedBox(
                          width: imageHeight,
                          height: imageHeight,
                          child: child,
                        ),
                      );
                    },
                    child: isStudent
                      ? Image.asset(
                          'assets/student_new.png',
                          fit: BoxFit.contain,
                        )
                      : Image.asset(
                          'assets/teacher_new.png',
                          fit: BoxFit.contain,
                        ),
                  ),
                ),
              ],
            ),
          ),

          const SizedBox(height: 24), // Adjusted spacer since image is fully in the box
          // Form Container
          Expanded(
            child: Container(
              width: double.infinity,
              padding: EdgeInsets.symmetric(
                  horizontal: formHorizontalPadding, 
                  vertical: 10),
              color: backgroundColor, // Match scaffold background
              child: SingleChildScrollView(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Tabs
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(32),
                        border: Border.all(color: Colors.grey.shade200),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => isStudent = true),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                decoration: BoxDecoration(
                                  color: isStudent
                                      ? primaryColor
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(32),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  'Student',
                                  style: TextStyle(
                                    color: isStudent
                                        ? Colors.white
                                        : Colors.grey.shade600,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ),
                          ),
                          Expanded(
                            child: GestureDetector(
                              onTap: () => setState(() => isStudent = false),
                              child: AnimatedContainer(
                                duration: const Duration(milliseconds: 200),
                                padding: const EdgeInsets.symmetric(
                                  vertical: 14,
                                ),
                                decoration: BoxDecoration(
                                  color: !isStudent
                                      ? primaryColor
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(32),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  'Teacher',
                                  style: TextStyle(
                                    color: !isStudent
                                        ? Colors.white
                                        : Colors.grey.shade600,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 14,
                                  ),
                                ),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Email Label & Field
                    const Text(
                      'Email',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF454647),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _emailController,
                      keyboardType: TextInputType.emailAddress,
                      decoration: InputDecoration(
                        hintText: 'yourname@email.com',
                        hintStyle: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 14,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 18,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(32),
                          borderSide: BorderSide(color: Colors.grey.shade200),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(32),
                          borderSide: BorderSide(color: Colors.grey.shade200),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(32),
                          borderSide: const BorderSide(
                            color: primaryColor,
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 20),

                    // Password Label & Field
                    const Text(
                      'Password',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: Color(0xFF454647),
                      ),
                    ),
                    const SizedBox(height: 8),
                    TextField(
                      controller: _passwordController,
                      obscureText: !isPasswordVisible,
                      decoration: InputDecoration(
                        hintText: '••••••••••',
                        hintStyle: TextStyle(
                          color: Colors.grey.shade400,
                          fontSize: 14,
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 18,
                        ),
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(32),
                          borderSide: BorderSide(color: Colors.grey.shade200),
                        ),
                        enabledBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(32),
                          borderSide: BorderSide(color: Colors.grey.shade200),
                        ),
                        focusedBorder: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(32),
                          borderSide: const BorderSide(
                            color: primaryColor,
                            width: 2,
                          ),
                        ),
                        suffixIcon: Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: IconButton(
                            icon: Icon(
                              isPasswordVisible
                                  ? Icons.visibility
                                  : Icons.visibility_off,
                              color: Colors.grey.shade400,
                              size: 20,
                            ),
                            onPressed: () {
                              setState(() {
                                isPasswordVisible = !isPasswordVisible;
                              });
                            },
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Forgot Password
                    Align(
                      alignment: Alignment.centerRight,
                      child: TextButton(
                        onPressed: isLoading ? null : _forgotPassword,
                        style: TextButton.styleFrom(
                          foregroundColor: primaryColor,
                          padding: EdgeInsets.zero,
                          minimumSize: Size.zero,
                          tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        ),
                        child: const Text(
                          'Forgot Password',
                          style: TextStyle(
                            fontSize: 12,
                            color: Color(0xFF71717A), // Gray 500
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 24),

                    // Log In Button
                    ElevatedButton(
                      onPressed: isLoading ? null : _login,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: primaryColor,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 18),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(32),
                        ),
                        elevation: 0,
                      ),
                      child: isLoading 
                          ? const SizedBox(
                              height: 20, 
                              width: 20, 
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2)
                            )
                          : const Text(
                              'Log In',
                              style: TextStyle(
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
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
}

void main() {
  runApp(
    MaterialApp(
      debugShowCheckedModeBanner: false,
      initialRoute: '/',
      routes: {
        '/': (context) => const SplashScreen(),
        '/login': (context) => const LoginPage(),
        '/dashboard': (context) => const DashboardScreen(),
        '/teacher_dashboard': (context) => const TeacherDashboardScreen(),
        '/teacher_schedule': (context) => const TeacherScheduleScreen(),
        '/teacher_class': (context) => const TeacherClassScreen(),
        '/teacher_give_assignments': (context) => const TeacherGiveAssignmentsScreen(),
        '/teacher_make_report_card': (context) => const TeacherReportCardScreen(),
        '/teacher_calendar': (context) => const TeacherCalendarScreen(),
        '/teacher_attendance': (context) => const TeacherAttendanceScreen(),
        '/teacher_messages': (context) => const TeacherMessagesScreen(),
        '/teacher_salary': (context) => const TeacherSalaryScreen(),
        '/teacher_own_profile': (context) => const TeacherOwnProfileScreen(),
        '/class_routine': (context) => const ClassRoutineScreen(),
        '/calendar': (context) => const CalendarScreen(),
        '/assignments': (context) => const AssignmentsScreen(),
        '/fee': (context) => const FeeScreen(),
        '/teacher': (context) => const TeachersScreen(),
        '/profile': (context) => const ProfileScreen(),
        '/teacher_profile': (context) => const TeacherProfileScreen(),
        '/teacher_chat': (context) => const TeacherChatScreen(),
        '/messages': (context) => const MessagesScreen(),
        '/report_card': (context) => const ReportCardScreen(),
        '/exams': (context) => const ExamsScreen(),
        '/notifications': (context) => const NotificationsScreen(),
      },
    ),
  );
}
