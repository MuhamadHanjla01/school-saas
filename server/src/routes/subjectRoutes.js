const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'subject' });
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/subjects — list all subjects
router.get('/', async (req, res) => {
  try {
    const subjects = await dbCall(() => prisma.subject.findMany({
      where: { schoolId: req.schoolId, ...(req.user.role === 'Student' ? { OR: [{ classId: req.user.classId || noProfileId }, { classId: null }] } : {}) },
      orderBy: { name: 'asc' },
    }));
    res.json({ subjects });
  } catch (error) {
    console.error('[subjects] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// POST /api/subjects — create a new subject
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, code, description, classId, teacherId } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'Name and Code are required' });

    const subject = await prisma.subject.create({
      data: { name, code, description, classId, teacherId, schoolId: req.schoolId },
    });
    res.status(201).json({ subject });
  } catch (error) {
    console.error('[subjects] POST error:', error.message);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Subject code must be unique' });
    res.status(500).json({ error: 'Failed to create subject' });
  }
});

// PUT /api/subjects/:id — update a subject
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, code, description, classId, teacherId } = req.body;
    const subject = await prisma.subject.update({
      where: { id: req.params.id, schoolId: req.schoolId },
      data: { name, code, description, classId, teacherId },
    });
    res.json({ subject });
  } catch (error) {
    console.error('[subjects] PUT error:', error.message);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Subject code must be unique' });
    res.status(500).json({ error: 'Failed to update subject' });
  }
});

// DELETE /api/subjects/:id — delete a subject
router.delete('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    await prisma.subject.delete({ where: { id: req.params.id, schoolId: req.schoolId } });
    res.json({ message: 'Subject deleted' });
  } catch (error) {
    console.error('[subjects] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete subject' });
  }
});

module.exports = router;
