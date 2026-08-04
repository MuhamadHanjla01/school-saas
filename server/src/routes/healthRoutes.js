const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');

// Get all health records
router.get('/', async (req, res) => {
  try {
    const records = await prisma.healthRecord.findMany({
      where: { schoolId: req.tenant.id },
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
        where: { id },
        data: { studentName, bloodGroup, allergies, lastCheckup: new Date(lastCheckup), notes }
      });
      res.json(record);
    } else {
      const record = await prisma.healthRecord.create({
        data: {
          recordId: `HR-${Date.now()}`,
          studentName,
          bloodGroup,
          allergies,
          lastCheckup: new Date(lastCheckup),
          notes,
          schoolId: req.tenant.id
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
    await prisma.healthRecord.delete({ where: { id: req.params.id } });
    res.json({ message: 'Health record deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete health record' });
  }
});

module.exports = router;
