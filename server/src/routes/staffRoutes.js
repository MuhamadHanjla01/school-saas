const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/staff — list staff with search, filters, pagination
router.get('/', async (req, res) => {
  try {
    const { search, department, status, page = 1, limit = 25 } = req.query;
    const where = { schoolId: req.schoolId };

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { staffId: { contains: search } },
        { role: { contains: search } },
      ];
    }
    if (department && department !== 'All') where.department = department;
    if (status && status !== 'All') where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [staff, total] = await Promise.all([
      dbCall(() => prisma.staff.findMany({ where, skip, take: parseInt(limit), orderBy: { name: 'asc' } })),
      dbCall(() => prisma.staff.count({ where })),
    ]);

    res.json({ staff, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('[staff] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch staff' });
  }
});

// POST /api/staff — create staff
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { staffId, name, role, department, phone, email, address, emergencyContact, joiningDate, status } = req.body;
    if (!staffId || !name || !role || !department) return res.status(400).json({ error: 'staffId, name, role, department required' });

    const staff = await prisma.staff.create({
      data: { staffId, name, role, department, phone, email, address, emergencyContact, joiningDate: joiningDate ? new Date(joiningDate) : null, status: status || 'Active', schoolId: req.schoolId },
    });
    res.status(201).json({ staff });
  } catch (error) {
    console.error('[staff] POST error:', error.message);
    if (error.code === 'P2002') return res.status(400).json({ error: 'Staff ID already exists' });
    res.status(500).json({ error: 'Failed to create staff' });
  }
});

// PUT /api/staff/:id — update staff
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, role, department, phone, email, address, emergencyContact, joiningDate, status } = req.body;
    const staff = await dbCall(() => prisma.staff.update({
      where: { id: req.params.id },
      data: { name, role, department, phone, email, address, emergencyContact, joiningDate: joiningDate ? new Date(joiningDate) : undefined, status },
    }));
    res.json({ staff });
  } catch (error) {
    console.error('[staff] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update staff' });
  }
});

// DELETE /api/staff/:id — delete staff
router.delete('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    await dbCall(() => prisma.staff.delete({ where: { id: req.params.id } }));
    res.json({ message: 'Staff deleted' });
  } catch (error) {
    console.error('[staff] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete staff' });
  }
});

module.exports = router;
