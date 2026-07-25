import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../api_client.dart';

class FeeScreen extends StatefulWidget {
  const FeeScreen({super.key});

  @override
  State<FeeScreen> createState() => _FeeScreenState();
}

class _FeeScreenState extends State<FeeScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  List<dynamic> _payments = [];
  bool _isLoading = true;
  double _totalDue = 0.0;

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
    
    _fetchFees();
  }

  Future<void> _fetchFees() async {
    try {
      const storage = FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      String? studentId;
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        studentId = userData['student']?['id'];
      }

      if (studentId != null) {
        final res = await apiClient.get('/api/fees/student/$studentId');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final payments = data['payments'] as List<dynamic>? ?? [];
          
          double due = 0;
          for (var p in payments) {
            if (p['status'] != 'Paid') {
              due += (p['amount'] as num?)?.toDouble() ?? 0.0;
            }
          }
          
          if (mounted) {
            setState(() {
              _payments = payments;
              _totalDue = due;
              _isLoading = false;
            });
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('Error fetching fees: $e');
    }
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
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
      drawer: const AppDrawer(currentRoute: '/fee'),
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
                          // Header
                          const Text(
                            'Fee Management',
                            style: TextStyle(
                              fontSize: 24,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1A1C1E),
                            ),
                          ),
                          const SizedBox(height: 4),
                          const Text(
                            'Current Academic Year',
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF3C4A46),
                            ),
                          ),
                          const SizedBox(height: 20),

                          // Total Due Card
                          _buildTotalDueCard(),
                          const SizedBox(height: 16),

                          // Pay Now Button
                          if (_totalDue > 0)
                            _buildPayNowButton(),
                          if (_totalDue > 0)
                            const SizedBox(height: 28),

                          // Breakdown
                          const Text(
                            'Breakdown',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1A1C1E),
                            ),
                          ),
                          const SizedBox(height: 16),
                          _buildBreakdownGrid(),
                          const SizedBox(height: 28),

                          // Invoice History
                          _buildInvoiceSection(),
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
                selectedIndex: 3, // Fee/Payments tab
                onItemSelected: (index) {
                  if (index == 3) return;
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

  // ─── Total Due Card ───
  Widget _buildTotalDueCard() {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF006B5C), Color(0xFF00897B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF006B5C).withAlpha(60),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Decorative circles
          Positioned(
            top: -30,
            right: -30,
            child: Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withAlpha(25),
              ),
            ),
          ),
          Positioned(
            bottom: -25,
            left: -25,
            child: Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: Colors.white.withAlpha(25),
              ),
            ),
          ),
          // Content
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'TOTAL DUE',
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Colors.white.withAlpha(200),
                  letterSpacing: 1.2,
                ),
              ),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text(
                    '\$${_totalDue.toStringAsFixed(0)}',
                    style: const TextStyle(
                      fontSize: 36,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                      height: 1.0,
                    ),
                  ),
                  Padding(
                    padding: const EdgeInsets.only(bottom: 4, left: 4),
                    child: Text(
                      '.00',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                        color: Colors.white.withAlpha(200),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Icon(Icons.info_outline,
                      size: 16, color: Colors.white.withAlpha(230)),
                  const SizedBox(width: 6),
                  Text(
                    'Clear dues promptly',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: Colors.white.withAlpha(230),
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

  // ─── Pay Now Button ───
  Widget _buildPayNowButton() {
    return SizedBox(
      width: double.infinity,
      child: ElevatedButton(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: const Color(0xFF00C2A8),
          foregroundColor: Colors.white,
          elevation: 4,
          shadowColor: const Color(0xFF00C2A8).withAlpha(100),
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(32),
          ),
          padding: const EdgeInsets.symmetric(vertical: 16),
          textStyle: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w600,
          ),
        ),
        child: const Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Pay Now'),
            SizedBox(width: 8),
            Icon(Icons.arrow_forward, size: 20),
          ],
        ),
      ),
    );
  }

  // ─── Breakdown Grid ───
  Widget _buildBreakdownGrid() {
    return Column(
      children: [
        // Top row: Tuition + Transport
        Row(
          children: [
            Expanded(
              child: _buildFeeCard(
                icon: Icons.school,
                iconBgColor: const Color(0xFF68ABFF).withAlpha(40),
                iconColor: const Color(0xFF0060AC),
                label: 'Tuition Fee',
                amount: '\$800',
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildFeeCard(
                icon: Icons.directions_bus,
                iconBgColor: const Color(0xFFFF8D69).withAlpha(40),
                iconColor: const Color(0xFF9D4224),
                label: 'Transport',
                amount: '\$300',
              ),
            ),
          ],
        ),
        const SizedBox(height: 12),
        // Full width: Library Fee with Overdue badge
        _buildLibraryFeeCard(),
      ],
    );
  }

  Widget _buildFeeCard({
    required IconData icon,
    required Color iconBgColor,
    required Color iconColor,
    required String label,
    required String amount,
  }) {
    return Container(
      padding: const EdgeInsets.all(18),
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
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: iconBgColor,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Icon(icon, color: iconColor, size: 22),
          ),
          const SizedBox(height: 14),
          Text(
            label,
            style: const TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: Color(0xFF3C4A46),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            amount,
            style: const TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1C1E),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLibraryFeeCard() {
    return Container(
      padding: const EdgeInsets.all(18),
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
      child: Row(
        children: [
          Container(
            width: 42,
            height: 42,
            decoration: BoxDecoration(
              color: const Color(0xFF00C2A8).withAlpha(40),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Icon(Icons.local_library,
                color: Color(0xFF006B5C), size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: const [
                Text(
                  'Library Fee',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF3C4A46),
                  ),
                ),
                SizedBox(height: 2),
                Text(
                  '\$150',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1C1E),
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
            decoration: BoxDecoration(
              color: const Color(0xFFFFDAD6),
              borderRadius: BorderRadius.circular(16),
            ),
            child: const Text(
              'Overdue',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w600,
                color: Color(0xFF93000A),
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Invoice History ───
  Widget _buildInvoiceSection() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Invoice History',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: Color(0xFF1A1C1E),
              ),
            ),
            if (_payments.isNotEmpty)
              TextButton(
                onPressed: () {},
                child: const Text(
                  'View All',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF00C2A8),
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(height: 8),
        if (_payments.isEmpty)
          const Center(child: Padding(padding: EdgeInsets.all(20), child: Text('No invoices found.', style: TextStyle(color: Colors.grey))))
        else
          Container(
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
              children: List.generate(_payments.length, (index) {
                final p = _payments[index];
                final idStr = p['id']?.toString() ?? '';
                final shortId = idStr.length > 8 ? idStr.substring(0, 8).toUpperCase() : idStr.toUpperCase();
                
                String dateStr = '';
                if (p['fee'] != null && p['fee']['dueDate'] != null) {
                  final parsed = DateTime.tryParse(p['fee']['dueDate']);
                  if (parsed != null) {
                    dateStr = parsed.toString().split(' ')[0];
                  }
                }

                return _buildInvoiceItem(
                  id: 'INV-$shortId',
                  date: dateStr,
                  amount: '\$${p['amount']}',
                  isPaid: p['status'] == 'Paid',
                  showBorder: index != _payments.length - 1,
                );
              }),
            ),
          ),
      ],
    );
  }

  Widget _buildInvoiceItem({
    required String id,
    required String date,
    required String amount,
    required bool isPaid,
    required bool showBorder,
  }) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: showBorder
            ? const Border(
                bottom: BorderSide(
                  color: Color(0xFFE2E2E5),
                  width: 0.5,
                ),
              )
            : null,
      ),
      child: Row(
        children: [
          // Receipt icon
          Container(
            width: 48,
            height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFFF3F3F6),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.receipt_long,
                color: Color(0xFF006B5C), size: 22),
          ),
          const SizedBox(width: 14),
          // Invoice details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  id,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF1A1C1E),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  date,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xFF3C4A46),
                  ),
                ),
              ],
            ),
          ),
          // Amount + status
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1C1E),
                ),
              ),
              const SizedBox(height: 2),
              Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    Icons.check_circle,
                    size: 14,
                    color: isPaid
                        ? const Color(0xFF006B5C)
                        : const Color(0xFFBA1A1A),
                  ),
                  const SizedBox(width: 3),
                  Text(
                    isPaid ? 'Paid' : 'Unpaid',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: isPaid
                          ? const Color(0xFF006B5C)
                          : const Color(0xFFBA1A1A),
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
}
