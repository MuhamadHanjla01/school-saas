import 'dart:convert';
import 'package:flutter/material.dart';
import '../../widgets/app_drawer.dart';
import '../../widgets/custom_app_bar.dart';
import '../../widgets/custom_bottom_nav.dart';
import '../../api_client.dart';

class CalendarScreen extends StatefulWidget {
  const CalendarScreen({super.key});

  @override
  State<CalendarScreen> createState() => _CalendarScreenState();
}

class _CalendarScreenState extends State<CalendarScreen>
    with SingleTickerProviderStateMixin {
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();
  late AnimationController _animController;
  late Animation<double> _fadeAnim;

  // Calendar state
  int _currentMonth = 1; // January
  int _currentYear = 2024;
  int? _selectedDay;
  bool _isLoading = true;

  // Event types mapped to days: {day: 'type'}
  final Map<int, String> _monthEvents = {};

  static const Map<String, Color> _eventColors = {
    'holiday': Color(0xFFBA1A1A),
    'event': Color(0xFF0060AC),
    'exam': Color(0xFF9D4224),
    'deadline': Color(0xFF006B5C),
  };

  static const Map<String, Color> _eventAccentColors = {
    'holiday': Color(0xFFBA1A1A),
    'event': Color(0xFF68ABFF),
    'exam': Color(0xFFFF8D69),
    'deadline': Color(0xFF00C2A8),
  };

  List<Map<String, String>> _upcomingEvents = [];

  @override
  void initState() {
    super.initState();
    _currentMonth = DateTime.now().month;
    _currentYear = DateTime.now().year;

    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 800),
    );
    _fadeAnim = CurvedAnimation(
      parent: _animController,
      curve: Curves.easeOutCubic,
    );
    _animController.forward();

    _fetchEvents();
  }

  Future<void> _fetchEvents() async {
    try {
      final res = await apiClient.get('/api/school/events');
      if (res.statusCode == 200) {
        final data = jsonDecode(res.body);
        final eventsList = data['events'] as List<dynamic>? ?? [];
        
        List<Map<String, String>> events = [];
        Map<int, String> monthEvents = {};

        for (var e in eventsList) {
          final dateStr = e['date']?.toString() ?? '1';
          final monthStr = e['month']?.toString() ?? 'Jan';
          final title = e['title']?.toString() ?? 'Event';
          final type = e['type']?.toString() ?? 'event';
          
          events.add({
            'title': title,
            'date': '$monthStr $dateStr',
            'time': 'Scheduled',
            'desc': 'Details for $title',
            'type': type,
          });

          // Just putting it in current month mapping for the calendar UI Demo
          final dayNum = int.tryParse(dateStr) ?? 1;
          monthEvents[dayNum] = type;
        }

        if (mounted) {
          setState(() {
            _upcomingEvents = events;
            _monthEvents.clear();
            _monthEvents.addAll(monthEvents);
            _isLoading = false;
          });
        }
      }
    } catch (e) {
      debugPrint('Error fetching events: $e');
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

    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(currentRoute: '/calendar'),
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
                      padding:
                          const EdgeInsets.fromLTRB(20, 16, 20, 100),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Academic Calendar',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A1C1E),
                              letterSpacing: -0.5,
                            ),
                          ),
                          const SizedBox(height: 24),
                          _buildCalendarCard(),
                          const SizedBox(height: 28),
                          const Text(
                            'Upcoming Events',
                            style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.bold,
                              color: Color(0xFF1A1C1E),
                            ),
                          ),
                          const SizedBox(height: 16),
                          if (_upcomingEvents.isEmpty)
                            const Text('No upcoming events', style: TextStyle(color: Colors.grey))
                          else
                            ..._upcomingEvents.map(_buildEventCard),
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
                selectedIndex: 1, // Calendar tab
                onItemSelected: (index) {
                  if (index == 1) return; // Already on calendar
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

  // ────────────────────────────────────────────
  // Calendar Card
  // ────────────────────────────────────────────
  Widget _buildCalendarCard() {
    final monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    return Container(
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
          // Month header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${monthNames[_currentMonth - 1]} $_currentYear',
                style: const TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                  color: Color(0xFF1A1C1E),
                ),
              ),
              Row(
                children: [
                  _buildNavButton(Icons.chevron_left, () {
                    setState(() {
                      if (_currentMonth == 1) {
                        _currentMonth = 12;
                        _currentYear--;
                      } else {
                        _currentMonth--;
                      }
                      _selectedDay = null;
                    });
                  }),
                  const SizedBox(width: 4),
                  _buildNavButton(Icons.chevron_right, () {
                    setState(() {
                      if (_currentMonth == 12) {
                        _currentMonth = 1;
                        _currentYear++;
                      } else {
                        _currentMonth++;
                      }
                      _selectedDay = null;
                    });
                  }),
                ],
              ),
            ],
          ),
          const SizedBox(height: 20),

          // Weekday headers
          Row(
            children: ['S', 'M', 'T', 'W', 'T', 'F', 'S']
                .map(
                  (d) => Expanded(
                    child: Center(
                      child: Text(
                        d,
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF3C4A46),
                        ),
                      ),
                    ),
                  ),
                )
                .toList(),
          ),
          const SizedBox(height: 12),

          // Day grid
          _buildDayGrid(),

          const SizedBox(height: 20),

          // Legend
          Container(
            padding: const EdgeInsets.only(top: 16),
            decoration: const BoxDecoration(
              border: Border(
                top: BorderSide(
                  color: Color(0xFFE2E2E5),
                  width: 0.5,
                ),
              ),
            ),
            child: Wrap(
              spacing: 16,
              runSpacing: 8,
              children: [
                _buildLegendDot('Holiday', _eventColors['holiday']!),
                _buildLegendDot('Program', _eventColors['program']!),
                _buildLegendDot('Exam', _eventColors['exam']!),
                _buildLegendDot('Result', _eventColors['result']!),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNavButton(IconData icon, VoidCallback onPressed) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(20),
        child: Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(
              color: const Color(0xFFE2E2E5),
            ),
          ),
          child: Icon(icon, size: 20, color: const Color(0xFF1A1C1E)),
        ),
      ),
    );
  }

  Widget _buildDayGrid() {
    // First day of the month (0 = Monday in DateTime, we need 0 = Sunday)
    final firstDay = DateTime(_currentYear, _currentMonth, 1);
    final daysInMonth =
        DateTime(_currentYear, _currentMonth + 1, 0).day;
    // DateTime.weekday: 1=Mon..7=Sun. We want 0=Sun..6=Sat
    final startWeekday = firstDay.weekday % 7;

    // Previous month's trailing days
    final prevMonthDays =
        DateTime(_currentYear, _currentMonth, 0).day;

    final List<Widget> cells = [];

    // Previous month fill
    for (int i = 0; i < startWeekday; i++) {
      final day = prevMonthDays - startWeekday + 1 + i;
      cells.add(
        Center(
          child: Text(
            '$day',
            style: TextStyle(
              fontSize: 14,
              color: const Color(0xFF1A1C1E).withAlpha(100),
            ),
          ),
        ),
      );
    }

    // Current month days
    for (int day = 1; day <= daysInMonth; day++) {
      final eventType = _monthEvents[day];
      final isSelected = _selectedDay == day;
      final today = DateTime.now();
      final isToday = today.day == day &&
          today.month == _currentMonth &&
          today.year == _currentYear;

      cells.add(
        GestureDetector(
          onTap: () {
            setState(() {
              _selectedDay = day;
            });
          },
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            decoration: BoxDecoration(
              color: isSelected
                  ? const Color(0xFF006B5C)
                  : isToday
                      ? const Color(0xFF006B5C).withAlpha(20)
                      : eventType != null
                          ? _eventColors[eventType]!.withAlpha(25)
                          : Colors.transparent,
              shape: BoxShape.circle,
              border: eventType != null && !isSelected
                  ? Border.all(
                      color: _eventColors[eventType]!.withAlpha(60),
                      width: 1.5,
                    )
                  : null,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  '$day',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight:
                        (isSelected || isToday || eventType != null) ? FontWeight.bold : FontWeight.normal,
                    color: isSelected
                        ? Colors.white
                        : eventType != null
                            ? _eventColors[eventType]!
                            : const Color(0xFF1A1C1E),
                  ),
                ),
                if (eventType != null)
                  Container(
                    margin: const EdgeInsets.only(top: 1),
                    width: 4,
                    height: 4,
                    decoration: BoxDecoration(
                      color: isSelected
                          ? Colors.white
                          : _eventColors[eventType]!,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ),
          ),
        ),
      );
    }

    // Next month fill to complete the grid
    final remaining = 7 - (cells.length % 7);
    if (remaining < 7) {
      for (int i = 1; i <= remaining; i++) {
        cells.add(
          Center(
            child: Text(
              '$i',
              style: TextStyle(
                fontSize: 14,
                color: const Color(0xFF1A1C1E).withAlpha(100),
              ),
            ),
          ),
        );
      }
    }

    return GridView.count(
      crossAxisCount: 7,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1,
      mainAxisSpacing: 4,
      crossAxisSpacing: 4,
      children: cells,
    );
  }

  Widget _buildLegendDot(String label, Color color) {
    return Row(
      mainAxisSize: MainAxisSize.min,
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
        Text(
          label,
          style: const TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Color(0xFF3C4A46),
          ),
        ),
      ],
    );
  }

  // ────────────────────────────────────────────
  // Event Card
  // ────────────────────────────────────────────
  Widget _buildEventCard(Map<String, String> event) {
    final accentColor =
        _eventAccentColors[event['type']!] ?? const Color(0xFF006B5C);

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
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
      child: Stack(
        children: [
          // Left accent bar
          Positioned(
            left: 0,
            top: 0,
            bottom: 0,
            width: 6,
            child: Container(
              decoration: BoxDecoration(
                color: accentColor,
                borderRadius: const BorderRadius.only(
                  topLeft: Radius.circular(24),
                  bottomLeft: Radius.circular(24),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 18, 18, 18),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Title row + date
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Text(
                        event['title']!,
                        style: const TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.bold,
                          color: Color(0xFF1A1C1E),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: accentColor.withAlpha(20),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        event['date']!,
                        style: TextStyle(
                          fontSize: 11,
                          fontWeight: FontWeight.w600,
                          color: accentColor,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 6),
                // Time / location
                Row(
                  children: [
                    Icon(Icons.schedule, size: 14, color: accentColor),
                    const SizedBox(width: 4),
                    Expanded(
                      child: Text(
                        event['time']!,
                        style: const TextStyle(
                          fontSize: 13,
                          color: Color(0xFF3C4A46),
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                // Description
                Text(
                  event['desc']!,
                  style: const TextStyle(
                    fontSize: 13,
                    color: Color(0xFF6C7A76),
                    height: 1.4,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
