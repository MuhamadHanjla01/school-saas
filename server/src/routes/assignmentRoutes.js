const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/assignments — list assignments
router.get('/', async (req, res) => {
  try {
    const { classId, teacherId, subjectId } = req.query;
    const where = { schoolId: req.schoolId };
    if (classId) where.classId = classId;
    if (teacherId) where.teacherId = teacherId;
    if (subjectId) where.subjectId = subjectId;

    const assignments = await dbCall(() => prisma.assignment.findMany({
      where,
      include: {
        teacher: { select: { name: true } },
        class: { select: { name: true } },
        subject: { select: { name: true } },
      },
      orderBy: { dueDate: 'desc' },
    }));
    res.json({ assignments });
  } catch (error) {
    console.error('[assignments] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// POST /api/assignments — create assignment
router.post('/', checkRole(['Teacher', 'SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { title, description, dueDate, classId, subjectId } = req.body;
    if (!title || !description || !dueDate || !classId || !subjectId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Get teacher ID from user or body
    const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { teacher: true } });
    let teacherId = user?.teacher?.id;
    if (['SchoolAdmin', 'SuperAdmin'].includes(req.user.role) && req.body.teacherId) {
      teacherId = req.body.teacherId;
    }
    if (!teacherId) return res.status(403).json({ error: 'Teacher profile not found or teacherId not provided' });

    const assignment = await prisma.assignment.create({
      data: { title, description, dueDate: new Date(dueDate), classId, subjectId, teacherId, schoolId: req.schoolId },
    });
    res.status(201).json({ assignment });
  } catch (error) {
    console.error('[assignments] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PUT /api/assignments/:id — update assignment
router.put('/:id', checkRole(['Teacher', 'SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { title, description, dueDate, status } = req.body;
    const assignment = await dbCall(() => prisma.assignment.update({
      where: { id: req.params.id },
      data: { title, description, dueDate: dueDate ? new Date(dueDate) : undefined, status },
    }));
    res.json({ assignment });
  } catch (error) {
    console.error('[assignments] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE /api/assignments/:id — delete assignment
router.delete('/:id', checkRole(['Teacher', 'SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    await dbCall(() => prisma.assignment.delete({ where: { id: req.params.id } }));
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    console.error('[assignments] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

module.exports = router;
