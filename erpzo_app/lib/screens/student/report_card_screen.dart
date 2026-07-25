import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../widgets/custom_app_bar.dart';
import '../../api_client.dart';

class ReportCardScreen extends StatefulWidget {
  const ReportCardScreen({super.key});

  @override
  State<ReportCardScreen> createState() => _ReportCardScreenState();
}

class _ReportCardScreenState extends State<ReportCardScreen> {
  String? _selectedExam;
  bool _isLoading = true;
  
  Map<String, dynamic>? _studentInfo;
  List<dynamic> _allResults = [];
  List<String> _examNames = [];

  @override
  void initState() {
    super.initState();
    _fetchReportCard();
  }

  Future<void> _fetchReportCard() async {
    try {
      const storage = FlutterSecureStorage();
      final userStr = await storage.read(key: 'user_data');
      String? studentId;
      if (userStr != null) {
        final userData = jsonDecode(userStr);
        studentId = userData['student']?['id'];
      }

      if (studentId != null) {
        final res = await apiClient.get('/api/exams/report-card/$studentId');
        if (res.statusCode == 200) {
          final data = jsonDecode(res.body);
          final results = data['results'] as List<dynamic>? ?? [];
          
          Set<String> exams = {};
          for (var r in results) {
            final eName = r['exam']?['name']?.toString();
            if (eName != null) exams.add(eName);
          }
          final examList = exams.toList();
          
          if (mounted) {
            setState(() {
              _studentInfo = data['student'];
              _allResults = results;
              _examNames = examList;
              if (examList.isNotEmpty) {
                _selectedExam = examList.first;
              }
              _isLoading = false;
            });
          }
          return;
        }
      }
    } catch (e) {
      debugPrint('Error fetching report card: $e');
    }
    if (mounted) {
      setState(() {
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    const Color backgroundColor = Color(0xFFF9F9FC);

    return Scaffold(
      backgroundColor: backgroundColor,
      body: SafeArea(
        child: Column(
          children: [
            const CustomAppBar(
              title: 'Report Card',
              showBackButton: true,
            ),
            Expanded(
              child: _isLoading 
                ? const Center(child: CircularProgressIndicator(color: Color(0xFF00C2A8)))
                : SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildFilters(),
                    const SizedBox(height: 24),
                    if (_studentInfo != null) _buildReportCard(),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFilters() {
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
          const Text(
            'Select Exam',
            style: TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1C1E),
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              color: const Color(0xFFF9F9FC),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: const Color(0xFFE2E2E5)),
            ),
            child: DropdownButtonHideUnderline(
              child: DropdownButton<String>(
                value: _selectedExam,
                isExpanded: true,
                icon: const Icon(Icons.expand_more, color: Color(0xFF3C4A46)),
                items: _examNames.isEmpty 
                    ? [const DropdownMenuItem(value: null, child: Text('No Exams'))]
                    : _examNames.map((String item) {
                  return DropdownMenuItem<String>(
                    value: item,
                    child: Text(
                      item,
                      style: const TextStyle(
                        fontSize: 14,
                        color: Color(0xFF1A1C1E),
                      ),
                    ),
                  );
                }).toList(),
                onChanged: (val) {
                  if (val != null) {
                    setState(() => _selectedExam = val);
                  }
                },
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildReportCard() {
    final filteredResults = _allResults.where((r) => r['exam']?['name'] == _selectedExam).toList();
    
    double totalMarks = 0;
    double totalMaxMarks = 0;
    for (var r in filteredResults) {
      totalMarks += (r['marks'] as num?)?.toDouble() ?? 0;
      totalMaxMarks += (r['maxMarks'] as num?)?.toDouble() ?? 100;
    }
    
    final percentage = totalMaxMarks > 0 ? (totalMarks / totalMaxMarks) * 100 : 0.0;
    String overallGrade = 'N/A';
    if (percentage >= 90) overallGrade = 'A+';
    else if (percentage >= 80) overallGrade = 'A';
    else if (percentage >= 70) overallGrade = 'B+';
    else if (percentage >= 60) overallGrade = 'B';
    else if (percentage >= 50) overallGrade = 'C';
    else if (percentage > 0) overallGrade = 'F';

    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFE2E2E5)),
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
          // Teal Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Color(0xFF00C2A8),
              borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _studentInfo?['name']?.toString() ?? 'Student Name',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF00493E),
                  ),
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(51),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        'ID: ${_studentInfo?['studentId'] ?? ''}',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF00493E),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.white.withAlpha(51),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Text(
                        _studentInfo?['class']?['name']?.toString() ?? 'Unknown Class',
                        style: const TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: Color(0xFF00493E),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 24),
                const Text(
                  'ACADEMIC TERM',
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: Color(0xCC00493E),
                    letterSpacing: 1.2,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  _selectedExam ?? 'N/A',
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Color(0xFF00493E),
                  ),
                ),
              ],
            ),
          ),
          
          // Subjects Table
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: DataTable(
              headingTextStyle: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Color(0xFF3C4A46),
              ),
              dataTextStyle: const TextStyle(
                fontSize: 14,
                color: Color(0xFF1A1C1E),
              ),
              columnSpacing: 24,
              horizontalMargin: 24,
              columns: const [
                DataColumn(label: Text('Subject')),
                DataColumn(label: Text('Marks'), numeric: true),
                DataColumn(label: Text('Max Marks'), numeric: true),
                DataColumn(label: Text('Grade'), numeric: true),
              ],
              rows: filteredResults.map((r) {
                final subj = r['subject']?['name']?.toString() ?? 'Subject';
                final marks = r['marks']?.toString() ?? '0';
                final maxMarks = r['maxMarks']?.toString() ?? '100';
                final grade = r['grade']?.toString() ?? '-';
                
                IconData icon = Icons.book;
                Color iconColor = Colors.blue;
                if (subj.toLowerCase().contains('math')) { icon = Icons.calculate; iconColor = Colors.blue; }
                else if (subj.toLowerCase().contains('sci') || subj.toLowerCase().contains('phy') || subj.toLowerCase().contains('chem')) { icon = Icons.science; iconColor = Colors.purple; }
                else if (subj.toLowerCase().contains('eng')) { icon = Icons.menu_book; iconColor = Colors.orange; }
                else if (subj.toLowerCase().contains('soc')) { icon = Icons.public; iconColor = Colors.red; }
                else if (subj.toLowerCase().contains('comp')) { icon = Icons.computer; iconColor = Colors.teal; }

                Color gradeColor = Colors.green;
                if (grade.startsWith('B')) gradeColor = Colors.orange;
                else if (grade.startsWith('C') || grade.startsWith('D')) gradeColor = Colors.deepOrange;
                else if (grade.startsWith('F')) gradeColor = Colors.red;
                else if (grade == '-') gradeColor = Colors.grey;

                return _buildTableRow(subj, icon, iconColor, marks, maxMarks, grade, gradeColor);
              }).toList(),
            ),
          ),
          
          // Footer
          Container(
            padding: const EdgeInsets.all(24),
            decoration: const BoxDecoration(
              color: Color(0xFFF3F3F6),
              borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
              border: Border(top: BorderSide(color: Color(0xFFE2E2E5))),
            ),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildSummaryItem('TOTAL MARKS', totalMarks.toStringAsFixed(0), suffix: '/ ${totalMaxMarks.toStringAsFixed(0)}'),
                    Container(width: 1, height: 40, color: const Color(0xFFE2E2E5)),
                    _buildSummaryItem('PERCENTAGE', '${percentage.toStringAsFixed(1)}%', valueColor: const Color(0xFF006B5C)),
                    Container(width: 1, height: 40, color: const Color(0xFFE2E2E5)),
                    _buildSummaryItem('OVERALL GRADE', overallGrade, valueColor: const Color(0xFF006B5C)),
                  ],
                ),
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.print, size: 20),
                    label: const Text(
                      'Print Report',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 0.5,
                      ),
                    ),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF006B5C),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(24),
                      ),
                      elevation: 2,
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

  DataRow _buildTableRow(String subject, IconData icon, Color iconColor, String marks, String maxMarks, String grade, Color gradeColor) {
    return DataRow(
      cells: [
        DataCell(
          Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconColor.withAlpha(25),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: iconColor, size: 18),
              ),
              const SizedBox(width: 12),
              Text(
                subject,
                style: const TextStyle(fontWeight: FontWeight.w500),
              ),
            ],
          ),
        ),
        DataCell(Text(marks)),
        DataCell(Text(maxMarks)),
        DataCell(
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            decoration: BoxDecoration(
              color: gradeColor.withAlpha(25),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(
              grade,
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: gradeColor,
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryItem(String label, String value, {String? suffix, Color? valueColor}) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: const TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w500,
            color: Color(0xFF3C4A46),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 4),
        Row(
          crossAxisAlignment: CrossAxisAlignment.baseline,
          textBaseline: TextBaseline.alphabetic,
          children: [
            Text(
              value,
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w600,
                color: valueColor ?? const Color(0xFF1A1C1E),
              ),
            ),
            if (suffix != null) ...[
              const SizedBox(width: 4),
              Text(
                suffix,
                style: const TextStyle(
                  fontSize: 14,
                  color: Color(0xFF3C4A46),
                ),
              ),
            ]
          ],
        ),
      ],
    );
  }
}
