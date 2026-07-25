const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/classes — list all classes
router.get('/', async (req, res) => {
  try {
    const { teacherId } = req.query;
    const where = { schoolId: req.schoolId };
    if (teacherId) where.classTeacherId = teacherId;

    const classes = await dbCall(() => prisma.class.findMany({
      where,
      include: {
        classTeacher: { select: { name: true, id: true } },
        _count: { select: { students: true } },
        subjects: { select: { name: true, teacher: { select: { name: true } } } },
      },
      orderBy: { name: 'asc' },
    }));

    const formatted = classes.map(c => ({
      id: c.id,
      name: c.name,
      room: c.room,
      teacher: c.classTeacher?.name || 'Unassigned',
      teacherId: c.classTeacher?.id,
      students: c._count.students,
      subjects: c.subjects.map(s => s.name),
    }));

    res.json({ classes: formatted });
  } catch (error) {
    console.error('[classes] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET /api/classes/:id — get class details
router.get('/:id', async (req, res) => {
  try {
    const cls = await dbCall(() => prisma.class.findUnique({
      where: { id: req.params.id },
      include: {
        classTeacher: { select: { name: true } },
        students: { select: { id: true, studentId: true, name: true, status: true } },
        subjects: { include: { teacher: { select: { name: true } } } },
      },
    }));
    if (!cls) return res.status(404).json({ error: 'Class not found' });
    res.json({ class: cls });
  } catch (error) {
    console.error('[classes] GET :id error:', error.message);
    res.status(500).json({ error: 'Failed to fetch class' });
  }
});

// POST /api/classes — create class
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, room, classTeacherId } = req.body;
    if (!name || !room) return res.status(400).json({ error: 'Name and room are required' });

    const cls = await prisma.class.create({
      data: { name, room, classTeacherId, schoolId: req.schoolId },
    });
    res.status(201).json({ class: cls });
  } catch (error) {
    console.error('[classes] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create class' });
  }
});

// PUT /api/classes/:id — update class
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, room, classTeacherId } = req.body;
    const cls = await dbCall(() => prisma.class.update({
      where: { id: req.params.id },
      data: { name, room, classTeacherId },
    }));
    res.json({ class: cls });
  } catch (error) {
    console.error('[classes] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update class' });
  }
});

module.exports = router;
