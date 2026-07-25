const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/exams — list exams
router.get('/', async (req, res) => {
  try {
    const exams = await dbCall(() => prisma.exam.findMany({
      where: { schoolId: req.schoolId },
      include: {
        examClasses: { include: { class: { select: { name: true } } } },
      },
      orderBy: { startDate: 'desc' },
    }));

    const formatted = exams.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      startDate: e.startDate,
      endDate: e.endDate,
      status: e.status,
      classes: e.examClasses.map(ec => ec.class.name).join(', '),
    }));

    res.json({ exams: formatted });
  } catch (error) {
    console.error('[exams] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// POST /api/exams — create exam
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, type, startDate, endDate, status, classIds } = req.body;
    if (!name || !type || !startDate || !endDate) {
      return res.status(400).json({ error: 'Name, type, startDate, endDate are required' });
    }

    const exam = await prisma.exam.create({
      data: {
        name, type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'Scheduled',
        schoolId: req.schoolId,
      },
    });

    if (classIds?.length) {
      for (const classId of classIds) {
        await prisma.examClass.create({ data: { examId: exam.id, classId } });
      }
    }

    res.status(201).json({ exam });
  } catch (error) {
    console.error('[exams] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create exam' });
  }
});

// PUT /api/exams/:id — update exam
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, type, startDate, endDate, status } = req.body;
    const exam = await dbCall(() => prisma.exam.update({
      where: { id: req.params.id },
      data: {
        name, type, status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
      },
    }));
    res.json({ exam });
  } catch (error) {
    console.error('[exams] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update exam' });
  }
});

// GET /api/exams/:id/results — get results for an exam
router.get('/:id/results', async (req, res) => {
  try {
    const results = await dbCall(() => prisma.examResult.findMany({
      where: { examId: req.params.id },
      include: {
        student: { select: { name: true, studentId: true, class: { select: { name: true } } } },
        subject: { select: { name: true } },
      },
    }));

    // Group by class for summary
    const classSummary = {};
    for (const r of results) {
      const cn = r.student.class?.name || 'Unknown';
      if (!classSummary[cn]) classSummary[cn] = { scores: [], topScore: 0, topperName: '' };
      classSummary[cn].scores.push(r.marks);
      if (r.marks > classSummary[cn].topScore) {
        classSummary[cn].topScore = r.marks;
        classSummary[cn].topperName = r.student.name;
      }
    }

    const summary = Object.entries(classSummary).map(([cls, data]) => {
      const avg = Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length);
      const passed = data.scores.filter(s => s >= 40).length;
      return {
        class: cls,
        avgScore: avg,
        toppers: `${data.topperName} (${data.topScore}%)`,
        passRate: `${Math.round((passed / data.scores.length) * 100)}%`,
      };
    });

    res.json({ results, summary });
  } catch (error) {
    console.error('[exams] results error:', error.message);
    res.status(500).json({ error: 'Failed to fetch exam results' });
  }
});

// POST /api/exams/:id/results — enter/update marks
router.post('/:id/results', checkRole(['Teacher', 'SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { marks: marksArr } = req.body;
    // marksArr: [{ studentId, subjectId, marks, maxMarks, grade }]
    if (!marksArr?.length) return res.status(400).json({ error: 'marks array is required' });

    const results = [];
    for (const m of marksArr) {
      const result = await prisma.examResult.upsert({
        where: { examId_studentId_subjectId: { examId: req.params.id, studentId: m.studentId, subjectId: m.subjectId } },
        update: { marks: m.marks, maxMarks: m.maxMarks || 100, grade: m.grade },
        create: { examId: req.params.id, studentId: m.studentId, subjectId: m.subjectId, marks: m.marks, maxMarks: m.maxMarks || 100, grade: m.grade },
      });
      results.push(result);
    }

    res.json({ message: `Saved ${results.length} results` });
  } catch (error) {
    console.error('[exams] POST results error:', error.message);
    res.status(500).json({ error: 'Failed to save results' });
  }
});

// GET /api/report-card/:studentId — generate report card
router.get('/report-card/:studentId', async (req, res) => {
  try {
    const student = await dbCall(() => prisma.student.findUnique({
      where: { id: req.params.studentId },
      include: { class: { select: { name: true } } },
    }));
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const results = await prisma.examResult.findMany({
      where: { studentId: req.params.studentId },
      include: {
        exam: { select: { name: true, type: true } },
        subject: { select: { name: true } },
      },
      orderBy: { exam: { startDate: 'desc' } },
    });

    res.json({ student, results });
  } catch (error) {
    console.error('[report-card] error:', error.message);
    res.status(500).json({ error: 'Failed to generate report card' });
  }
});

module.exports = router;
