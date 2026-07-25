import 'dart:convert';
import 'package:flutter/material.dart';
import '../../api_client.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_bottom_nav.dart';

class TeacherSalaryScreen extends StatefulWidget {
  const TeacherSalaryScreen({super.key});

  @override
  State<TeacherSalaryScreen> createState() => _TeacherSalaryScreenState();
}

class _TeacherSalaryScreenState extends State<TeacherSalaryScreen> {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  List<dynamic> _salaries = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _fetchSalaries();
  }

  Future<void> _fetchSalaries() async {
    try {
      final res = await apiClient.get('/api/teachers/me/salary');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        setState(() {
          _salaries = data['salaries'] as List;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error fetching salaries: $e');
      if (mounted) setState(() => _isLoading = false);
    }
  }

  // Colors based on the provided tailwind config
  static const Color surfaceColor = Color(0xFFF8FAFB);
  static const Color surfaceContainerLowest = Color(0xFFFFFFFF);
  static const Color surfaceContainerLow = Color(0xFFF3F3F6);
  static const Color primaryColor = Color(0xFF006B5C);
  static const Color primaryContainer = Color(0xFF00C2A8);
  static const Color onSurface = Color(0xFF1A1C1E);
  static const Color onSurfaceVariant = Color(0xFF3C4A46);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: surfaceColor,
      drawer: const AppDrawer(isTeacher: true, currentRoute: '/teacher_salary'),
      body: SafeArea(
        child: Stack(
          children: [
            Column(
              children: [
                CustomAppBar(
                  isTeacher: true,
                  onMenuPressed: () {
                    _scaffoldKey.currentState?.openDrawer();
                  },
                ),
                Expanded(
                  child: _isLoading 
                    ? const Center(child: CircularProgressIndicator(color: primaryColor))
                    : SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(20, 16, 20, 100),
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        _buildTotalAmountCard(),
                        const SizedBox(height: 16),
                        _buildWithdrawButton(),
                        const SizedBox(height: 32),
                        _buildInvoiceHistory(),
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
                selectedIndex: 3, // Payments tab
                onItemSelected: (index) {
                  const routes = [
                    '/teacher_dashboard',
                    '/teacher_calendar',
                    '/teacher_give_assignments',
                    '/teacher_salary',
                    '/teacher_own_profile',
                  ];
                  if (index != 3) {
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

  Widget _buildTotalAmountCard() {
    double totalAmount = 0;
    for (var s in _salaries) {
      if (s['status'] == 'Pending') {
        totalAmount += s['amount']?.toDouble() ?? 0.0;
      }
    }

    return Container(
      decoration: BoxDecoration(
        color: primaryColor,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 20,
            offset: const Offset(0, 4),
          )
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          // Decorative background elements
          Positioned(
            top: -40,
            right: -40,
            child: Container(
              width: 128,
              height: 128,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Positioned(
            bottom: -32,
            left: -32,
            child: Container(
              width: 96,
              height: 96,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'PENDING AMOUNT',
                  style: TextStyle(
                    color: Colors.white70,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 8),
                Row(
                  crossAxisAlignment: CrossAxisAlignment.baseline,
                  textBaseline: TextBaseline.alphabetic,
                  children: [
                    Text(
                      '\$${totalAmount.toStringAsFixed(0)}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 40,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(width: 4),
                    Text(
                      '.00',
                      style: TextStyle(
                        color: Colors.white.withOpacity(0.8),
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWithdrawButton() {
    return ElevatedButton(
      onPressed: () {},
      style: ElevatedButton.styleFrom(
        backgroundColor: primaryContainer,
        foregroundColor: Colors.white,
        padding: const EdgeInsets.symmetric(vertical: 16),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(100),
        ),
        elevation: 0,
        shadowColor: Colors.black.withOpacity(0.05),
      ),
      child: const Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(
            'Withdraw Request',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(width: 8),
          Icon(Icons.arrow_forward, size: 20),
        ],
      ),
    );
  }

  Widget _buildInvoiceHistory() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.end,
          children: [
            const Text(
              'Invoice History',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: onSurface,
              ),
            ),
            GestureDetector(
              onTap: () {},
              child: const Text(
                'View All',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: primaryContainer,
                ),
              ),
            ),
          ],
        ),
        const SizedBox(height: 16),
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
            children: _salaries.isEmpty 
              ? [const Padding(padding: EdgeInsets.all(16), child: Text("No salary records."))]
              : _salaries.asMap().entries.map((entry) {
              final index = entry.key;
              final s = entry.value;
              String rawDate = s['paidDate'] ?? s['createdAt'] ?? '';
              String formattedDate = rawDate.isNotEmpty ? rawDate.split('T').first : '';
              return _buildInvoiceItem(
                invoiceId: 'INV-${s['id'].toString().split('-').last}',
                date: formattedDate,
                amount: '\$${s['amount']}',
                isPaid: s['status'] == 'Paid',
                showBorder: index != _salaries.length - 1,
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildInvoiceItem({
    required String invoiceId,
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
                  color: Color(0xFFE2E2E5), // surface-variant
                  width: 1,
                ),
              )
            : null,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: [
              Container(
                width: 48,
                height: 48,
                decoration: const BoxDecoration(
                  color: surfaceContainerLow,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.receipt_long,
                  color: primaryColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    invoiceId,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: onSurface,
                    ),
                  ),
                  Text(
                    date,
                    style: const TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ],
          ),
          Column(
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text(
                amount,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: onSurface,
                ),
              ),
              Row(
                children: [
                  Icon(
                    isPaid ? Icons.check_circle : Icons.pending,
                    color: isPaid ? primaryColor : onSurfaceVariant,
                    size: 14,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    isPaid ? 'Paid' : 'Pending',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                      color: isPaid ? primaryColor : onSurfaceVariant,
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
