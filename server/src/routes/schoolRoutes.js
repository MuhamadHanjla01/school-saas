/**
 * Shared Data API — serves school-wide content that is identical across users
 * and changes infrequently. Every route is wrapped with the response cache.
 *
 * Cached endpoints:
 *   GET /api/school/dashboard-stats   (5 min TTL — aggregate numbers)
 *   GET /api/school/classes           (5 min TTL — class roster rarely changes)
 *   GET /api/school/notices           (2 min TTL — notices update more often)
 *   GET /api/school/exams             (5 min TTL — exam schedule is stable)
 *   GET /api/school/events            (5 min TTL — upcoming events)
 *   GET /api/school/timetable         (10 min TTL — timetable is very stable)
 *
 * POST/PUT/DELETE operations on these resources call cache.invalidateByTag()
 * so the next GET sees fresh data immediately.
 */

const express = require('express');
const router = express.Router();
const { cached, cache } = require('../responseCache');

// ─── Dashboard Stats ───────────────────────────────────────────────
// Identical for all admins. Aggregated numbers that update at most every few minutes.
router.get(
  '/dashboard-stats',
  cached({ ttlMs: 5 * 60_000, tags: ['dashboard'], varyKeys: ['x-school-id'] }),
  (req, res) => {
    // In production this would query the DB for aggregated counts.
    // The cache ensures the query only runs once every 5 minutes.
    res.json({
      stats: [
        { label: 'Total Students', value: '1,245', change: '+24', changeLabel: 'this month' },
        { label: 'Total Teachers', value: '86', change: '+3', changeLabel: 'new hires' },
        { label: 'Attendance Rate', value: '94.2%', isHealth: true },
        { label: 'Fee Collection', value: '$128.5k', change: '87%', changeLabel: 'collected' },
      ],
      recentActivities: [
        { title: 'New student enrolled', desc: 'Aarav Sharma joined Class 10-A', time: '2 hours ago' },
        { title: 'Fee payment received', desc: 'Maria Martinez - $2,500 for Term 2', time: '4 hours ago' },
        { title: 'Exam results published', desc: 'Mid-term results for Grade 9 are live', time: '6 hours ago' },
        { title: 'Notice posted', desc: 'Annual Day event on Dec 15th', time: '1 day ago' },
        { title: 'Attendance alert', desc: '5 students absent in Grade 12-B', time: '1 day ago' },
      ],
      topClasses: [
        { name: 'Class 10-A', attendance: 97, students: 42 },
        { name: 'Class 12-B', attendance: 95, students: 38 },
        { name: 'Class 9-C', attendance: 93, students: 40 },
        { name: 'Class 11-A', attendance: 91, students: 36 },
      ],
      generatedAt: new Date().toISOString(),
    });
  }
);

// ─── Classes ───────────────────────────────────────────────────────
router.get(
  '/classes',
  cached({ ttlMs: 5 * 60_000, tags: ['classes'], varyKeys: ['x-school-id'] }),
  (req, res) => {
    res.json({
      classes: [
        { name: 'Class 9-A', teacher: 'Ms. Emily Davis', students: 40, room: 'Room 101', subjects: ['English', 'History', 'Science'] },
        { name: 'Class 9-B', teacher: 'Mr. Raj Patel', students: 38, room: 'Room 102', subjects: ['Mathematics', 'Computer Science'] },
        { name: 'Class 10-A', teacher: 'Dr. Sarah Jenkins', students: 42, room: 'Room 201', subjects: ['Physics', 'Chemistry', 'Biology'] },
        { name: 'Class 10-B', teacher: 'Prof. John Smith', students: 36, room: 'Room 202', subjects: ['Mathematics', 'English'] },
        { name: 'Class 11-A', teacher: 'Mrs. Lisa Brown', students: 36, room: 'Room 301', subjects: ['History', 'Geography', 'Economics'] },
        { name: 'Class 11-C', teacher: 'Dr. Michael Lee', students: 34, room: 'Room 303', subjects: ['Chemistry', 'Physics'] },
        { name: 'Class 12-A', teacher: 'Dr. Sarah Jenkins', students: 38, room: 'Room 401', subjects: ['Advanced Physics', 'Quantum Mechanics'] },
        { name: 'Class 12-B', teacher: 'Prof. John Smith', students: 38, room: 'Room 402', subjects: ['Calculus', 'Statistics'] },
      ],
      generatedAt: new Date().toISOString(),
    });
  }
);

// ─── Notices ───────────────────────────────────────────────────────
router.get(
  '/notices',
  cached({ ttlMs: 2 * 60_000, tags: ['notices'], varyKeys: ['x-school-id'] }),
  (req, res) => {
    res.json({
      notices: [
        { id: 1, title: 'Annual Day Celebration 2024', date: 'Jul 18, 2024', type: 'Event', audience: 'All', priority: 'High', content: 'Annual Day celebrations will be held on December 15th.' },
        { id: 2, title: 'Mid-Term Exam Schedule Released', date: 'Jul 16, 2024', type: 'Academic', audience: 'Students', priority: 'High', content: 'Mid-term examinations for grades 9-12 will begin on July 22nd.' },
        { id: 3, title: 'Parent-Teacher Meeting', date: 'Jul 14, 2024', type: 'Event', audience: 'Parents', priority: 'Medium', content: 'PTM scheduled for July 18th.' },
        { id: 4, title: 'Library Book Return Reminder', date: 'Jul 12, 2024', type: 'General', audience: 'Students', priority: 'Low', content: 'All borrowed library books must be returned by July 20th.' },
        { id: 5, title: 'Summer Uniform Notice', date: 'Jul 10, 2024', type: 'General', audience: 'All', priority: 'Medium', content: 'Students must switch to summer uniforms starting August 1st.' },
      ],
      generatedAt: new Date().toISOString(),
    });
  }
);

// ── Notice mutation → invalidate cache ──
router.post('/notices', (req, res) => {
  // ... create notice in DB ...
  cache.invalidateByTag('notices');
  cache.invalidateByTag('dashboard'); // dashboard shows recent activities
  res.status(201).json({ message: 'Notice created', notice: req.body });
});

router.delete('/notices/:id', (req, res) => {
  // ... delete notice from DB ...
  cache.invalidateByTag('notices');
  cache.invalidateByTag('dashboard');
  res.json({ message: 'Notice deleted' });
});

// ─── Exams ─────────────────────────────────────────────────────────
router.get(
  '/exams',
  cached({ ttlMs: 5 * 60_000, tags: ['exams'], varyKeys: ['x-school-id'] }),
  (req, res) => {
    res.json({
      exams: [
        { id: 'EX-001', name: 'Mid-Term Examination', type: 'Internal', startDate: 'Jul 22, 2024', endDate: 'Jul 30, 2024', classes: 'Grade 9-12', status: 'Upcoming' },
        { id: 'EX-002', name: 'Unit Test 2', type: 'Internal', startDate: 'Aug 05, 2024', endDate: 'Aug 08, 2024', classes: 'Grade 9-11', status: 'Scheduled' },
        { id: 'EX-003', name: 'Annual Examination 2024', type: 'Board', startDate: 'Mar 01, 2024', endDate: 'Mar 25, 2024', classes: 'Grade 10, 12', status: 'Completed' },
        { id: 'EX-004', name: 'Unit Test 1', type: 'Internal', startDate: 'May 10, 2024', endDate: 'May 14, 2024', classes: 'Grade 9-12', status: 'Completed' },
      ],
      results: [
        { class: '10-A', exam: 'Unit Test 1', avgScore: 78, toppers: 'Maria M. (96%)', passRate: '95%' },
        { class: '12-A', exam: 'Unit Test 1', avgScore: 82, toppers: 'Sarah J. (98%)', passRate: '97%' },
        { class: '9-A', exam: 'Unit Test 1', avgScore: 71, toppers: 'Aarav S. (92%)', passRate: '90%' },
        { class: '11-A', exam: 'Unit Test 1', avgScore: 75, toppers: 'Emma W. (94%)', passRate: '92%' },
      ],
      generatedAt: new Date().toISOString(),
    });
  }
);

// ─── Upcoming Events ───────────────────────────────────────────────
router.get(
  '/events',
  cached({ ttlMs: 5 * 60_000, tags: ['events'], varyKeys: ['x-school-id'] }),
  (req, res) => {
    res.json({
      events: [
        { date: '18', month: 'Jul', title: 'Parent-Teacher Meeting', type: 'event' },
        { date: '22', month: 'Jul', title: 'Mid-Term Exam Begins', type: 'exam' },
        { date: '25', month: 'Jul', title: 'Sports Day', type: 'event' },
        { date: '01', month: 'Aug', title: 'Fee Due Date', type: 'deadline' },
      ],
      generatedAt: new Date().toISOString(),
    });
  }
);

// ─── Timetable ─────────────────────────────────────────────────────
// Most stable data — 10 minute cache
router.get(
  '/timetable',
  cached({ ttlMs: 10 * 60_000, tags: ['timetable'], varyKeys: ['x-school-id'] }),
  (req, res) => {
    res.json({
      timetable: {
        'Monday': [
          { time: '8:00 - 8:45', subject: 'Mathematics', teacher: 'Dr. Sarah Jenkins', room: '201' },
          { time: '8:50 - 9:35', subject: 'Physics', teacher: 'Dr. Sarah Jenkins', room: '201' },
          { time: '9:40 - 10:25', subject: 'English', teacher: 'Ms. Emily Davis', room: '101' },
          { time: '10:40 - 11:25', subject: 'Chemistry', teacher: 'Dr. Michael Lee', room: '303' },
          { time: '11:30 - 12:15', subject: 'History', teacher: 'Mrs. Lisa Brown', room: '301' },
        ],
        'Tuesday': [
          { time: '8:00 - 8:45', subject: 'Physics', teacher: 'Dr. Sarah Jenkins', room: '201' },
          { time: '8:50 - 9:35', subject: 'Computer Science', teacher: 'Mr. Raj Patel', room: '102' },
          { time: '9:40 - 10:25', subject: 'Mathematics', teacher: 'Prof. John Smith', room: '202' },
          { time: '10:40 - 11:25', subject: 'Biology', teacher: 'Dr. Sarah Jenkins', room: '201' },
          { time: '11:30 - 12:15', subject: 'English', teacher: 'Ms. Emily Davis', room: '101' },
        ],
      },
      generatedAt: new Date().toISOString(),
    });
  }
);

module.exports = router;
