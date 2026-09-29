const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'timetable' });
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/timetable — get timetable for a specific class
router.get('/', async (req, res) => {
  try {
    const classId = req.user.role === 'Student' ? req.user.classId : req.query.classId;
    if (!classId) return res.status(400).json({ error: 'classId is required' });

    const records = await dbCall(() => prisma.timetable.findMany({
      where: { classId, schoolId: req.schoolId },
      include: {
        subject: { select: { name: true } },
        teacher: { select: { name: true } }
      }
    }));

    // Format for frontend: { 'Monday': [{time, subject, teacher}], ... }
    const timetable = {};
    records.forEach(r => {
      const time = `${r.startTime} - ${r.endTime}`;
      if (!timetable[r.dayOfWeek]) timetable[r.dayOfWeek] = [];
      timetable[r.dayOfWeek].push({
        id: r.id,
        time,
        startTime: r.startTime,
        endTime: r.endTime,
        subject: r.subject.name,
        subjectId: r.subjectId,
        teacher: r.teacher.name,
        teacherId: r.teacherId
      });
    });

    res.json({ timetable });
  } catch (error) {
    console.error('[timetable] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch timetable' });
  }
});

// POST /api/timetable — add a timetable slot
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { dayOfWeek, startTime, endTime, classId, subjectId, teacherId } = req.body;
    if (!dayOfWeek || !startTime || !endTime || !classId || !subjectId || !teacherId) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].includes(dayOfWeek) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime) || endTime <= startTime) return res.status(400).json({ error: 'Select a valid day and time range' });
    const collision = await prisma.timetable.findFirst({ where: { schoolId: req.schoolId, dayOfWeek, startTime: { lt: endTime }, endTime: { gt: startTime }, OR: [{classId}, {teacherId}] } });
    if (collision) return res.status(409).json({ error: 'The class or teacher already has a lesson during this time' });
    const slot = await prisma.timetable.create({
      data: { dayOfWeek, startTime, endTime, classId, subjectId, teacherId, schoolId: req.schoolId }
    });
    res.status(201).json({ slot });
  } catch (error) {
    console.error('[timetable] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create timetable slot' });
  }
});

// DELETE /api/timetable/:id — delete a timetable slot
router.delete('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    await prisma.timetable.delete({ where: { id: req.params.id, schoolId: req.schoolId } });
    res.json({ message: 'Timetable slot deleted' });
  } catch (error) {
    console.error('[timetable] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete timetable slot' });
  }
});

module.exports = router;
