const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'labItem' });
const prisma = require('../prismaClient');

// Get all lab items
router.get('/', async (req, res) => {
  try {
    const items = await prisma.labItem.findMany({
      where: { schoolId: req.schoolId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch lab items' });
  }
});

// Create/Update a lab item (Using itemId as logic)
router.post('/', async (req, res) => {
  try {
    const { id, itemId, name, category, quantity, status } = req.body;
    if (id) {
      const item = await prisma.labItem.update({
        where: { id, schoolId: req.schoolId },
        data: { name, category, quantity, status }
      });
      res.json(item);
    } else {
      const item = await prisma.labItem.create({
        data: {
          itemId: `LAB-${Date.now()}`,
          name,
          category,
          quantity,
          status,
          schoolId: req.schoolId
        }
      });
      res.status(201).json(item);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to save lab item' });
  }
});

// Delete lab item
router.delete('/:id', async (req, res) => {
  try {
    await prisma.labItem.delete({ where: { id: req.params.id, schoolId: req.schoolId } });
    res.json({ message: 'Lab item deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete lab item' });
  }
});

module.exports = router;
