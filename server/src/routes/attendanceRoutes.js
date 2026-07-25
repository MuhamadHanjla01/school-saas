const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/attendance — get attendance by class and date
router.get('/', async (req, res) => {
  try {
    const { classId, date } = req.query;
    const where = { schoolId: req.schoolId };
    if (classId) where.classId = classId;
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.date = { gte: d, lt: next };
    }

    const records = await dbCall(() => prisma.attendance.findMany({
      where,
      include: {
        student: { select: { name: true, studentId: true } },
        class: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    }));
    res.json({ attendance: records });
  } catch (error) {
    console.error('[attendance] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch attendance' });
  }
});

// GET /api/attendance/summary — aggregated stats for admin
router.get('/summary', async (req, res) => {
  try {
    const classes = await dbCall(() => prisma.class.findMany({
      where: { schoolId: req.schoolId },
      include: { _count: { select: { students: true } } },
    }));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const summaryData = [];
    let totalPresent = 0, totalAbsent = 0, totalLate = 0, totalStudents = 0;

    for (const cls of classes) {
      const records = await prisma.attendance.findMany({
        where: { classId: cls.id, date: { gte: today, lt: tomorrow } },
      });

      const present = records.filter(r => r.status === 'Present').length;
      const absent = records.filter(r => r.status === 'Absent').length;
      const late = records.filter(r => r.status === 'Late').length;
      const total = cls._count.students;
      const rate = total > 0 ? Math.round((present / total) * 100) : 0;

      totalPresent += present;
      totalAbsent += absent;
      totalLate += late;
      totalStudents += total;

      summaryData.push({
        class: cls.name,
        date: today.toISOString().split('T')[0],
        present, absent, late, total,
        rate: `${rate}%`,
      });
    }

    const overallRate = totalStudents > 0 ? ((totalPresent / totalStudents) * 100).toFixed(1) : '0';

    // Weekly trend
    const weeklyTrend = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    for (let i = 4; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      if (d.getDay() === 0 || d.getDay() === 6) continue;
      const next = new Date(d);
      next.setDate(next.getDate() + 1);

      const dayRecords = await prisma.attendance.findMany({
        where: { date: { gte: d, lt: next }, schoolId: req.schoolId },
      });
      const dayPresent = dayRecords.filter(r => r.status === 'Present').length;
      const dayTotal = dayRecords.length || 1;
      weeklyTrend.push({
        day: dayNames[d.getDay()],
        rate: Math.round((dayPresent / dayTotal) * 100),
      });
    }

    res.json({
      summary: summaryData,
      overall: { rate: `${overallRate}%`, present: totalPresent, absent: totalAbsent, late: totalLate },
      weeklyTrend,
    });
  } catch (error) {
    console.error('[attendance] summary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch attendance summary' });
  }
});

// POST /api/attendance — mark attendance (batch)
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin', 'Teacher']), async (req, res) => {
  try {
    const { records, date, classId } = req.body;
    // records: [{ studentId, status }]
    if (!records || !date || !classId) {
      return res.status(400).json({ error: 'records, date, and classId are required' });
    }

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const results = [];
    for (const r of records) {
      const result = await prisma.attendance.upsert({
        where: { studentId_date: { studentId: r.studentId, date: d } },
        update: { status: r.status },
        create: { date: d, status: r.status, studentId: r.studentId, classId, schoolId: req.schoolId },
      });
      results.push(result);
    }

    res.json({ message: `Marked attendance for ${results.length} students`, attendance: results });
  } catch (error) {
    console.error('[attendance] POST error:', error.message);
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

// GET /api/attendance/student/:id — student's attendance history
router.get('/student/:id', async (req, res) => {
  try {
    const records = await dbCall(() => prisma.attendance.findMany({
      where: { studentId: req.params.id },
      orderBy: { date: 'desc' },
      take: 30,
    }));
    res.json({ attendance: records });
  } catch (error) {
    console.error('[attendance] student error:', error.message);
    res.status(500).json({ error: 'Failed to fetch student attendance' });
  }
});

// GET /api/attendance/teacher — teacher's own attendance
router.get('/teacher', async (req, res) => {
  try {
    const user = await dbCall(() => prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { teacher: true },
    }));
    if (!user?.teacher) return res.status(404).json({ error: 'Teacher profile not found' });

    const records = await prisma.teacherAttendance.findMany({
      where: { teacherId: user.teacher.id },
      orderBy: { date: 'desc' },
      take: 30,
    });
    res.json({ attendance: records });
  } catch (error) {
    console.error('[attendance] teacher error:', error.message);
    res.status(500).json({ error: 'Failed to fetch teacher attendance' });
  }
});

module.exports = router;
