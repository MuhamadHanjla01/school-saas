const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'healthRecord', readRoles: ADMIN_ROLES });
const prisma = require('../prismaClient');

// Get all health records
router.get('/', async (req, res) => {
  try {
    const records = await prisma.healthRecord.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(records);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch health records' });
  }
});

// Create or update a health record
router.post('/', async (req, res) => {
  try {
    const { id, studentName, bloodGroup, allergies, lastCheckup, notes } = req.body;
    if (id) {
      const record = await prisma.healthRecord.update({
        where: { id, schoolId: req.schoolId },
        data: { studentName, bloodGroup, allergies, lastCheckup: lastCheckup ? new Date(lastCheckup) : null, notes }
      });
      res.json(record);
    } else {
      const record = await prisma.healthRecord.create({
        data: {
          recordId: `HR-${Date.now()}`,
          studentName,
          bloodGroup,
          allergies,
          lastCheckup: lastCheckup ? new Date(lastCheckup) : null,
          notes,
          schoolId: req.schoolId
        }
      });
      res.status(201).json(record);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save health record' });
  }
});

// Delete health record
router.delete('/:id', async (req, res) => {
  try {
    await prisma.healthRecord.delete({ where: { id: req.params.id, schoolId: req.schoolId } });
    res.json({ message: 'Health record deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete health record' });
  }
});

module.exports = router;
