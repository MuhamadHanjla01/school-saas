const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/parents — list parents
router.get('/', async (req, res) => {
  try {
    const { search, page = 1, limit = 25 } = req.query;
    const where = { schoolId: req.schoolId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { parentId: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [parents, total] = await Promise.all([
      dbCall(() => prisma.parent.findMany({
        where, skip, take: parseInt(limit), orderBy: { name: 'asc' },
        include: { students: { select: { id: true, name: true, studentId: true, class: { select: { name: true } } } } }
      })),
      dbCall(() => prisma.parent.count({ where })),
    ]);

    res.json({ parents, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('[parents] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch parents' });
  }
});

// POST /api/parents — create parent
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { parentId, name, phone, email, occupation, address, relationship } = req.body;
    if (!parentId || !name || !phone) return res.status(400).json({ error: 'parentId, name, phone required' });

    const parent = await prisma.parent.create({
      data: { parentId, name, phone, email, occupation, address, relationship: relationship || 'Father', schoolId: req.schoolId },
    });
    res.status(201).json({ parent });
  } catch (error) {
    console.error('[parents] POST error:', error.message);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Parent ID already exists' });
    res.status(500).json({ error: 'Failed to create parent' });
  }
});

// PUT /api/parents/:id — update parent
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, phone, email, occupation, address, relationship } = req.body;
    const parent = await dbCall(() => prisma.parent.update({
      where: { id: req.params.id },
      data: { name, phone, email, occupation, address, relationship },
    }));
    res.json({ parent });
  } catch (error) {
    console.error('[parents] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update parent' });
  }
});

// DELETE /api/parents/:id
router.delete('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    await dbCall(() => prisma.parent.delete({ where: { id: req.params.id } }));
    res.json({ message: 'Parent deleted' });
  } catch (error) {
    console.error('[parents] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete parent' });
  }
});

module.exports = router;
