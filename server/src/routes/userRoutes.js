const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/users — list all users for this school
router.get('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 25 } = req.query;
    const where = { schoolId: req.schoolId };

    if (search) {
      where.OR = [
        { email: { contains: search } },
        { name: { contains: search } },
      ];
    }
    if (role && role !== 'All') where.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      dbCall(() => prisma.user.findMany({
        where, skip, take: parseInt(limit), orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, role: true, name: true, phone: true, lastLoginAt: true, createdAt: true, schoolId: true }
      })),
      dbCall(() => prisma.user.count({ where })),
    ]);

    res.json({ users, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('[users] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// PUT /api/users/:id/role — change user role
router.put('/:id/role', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const user = await dbCall(() => prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: { id: true, email: true, role: true, name: true }
    }));
    res.json({ user });
  } catch (error) {
    console.error('[users] PUT role error:', error.message);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// POST /api/users/:id/reset-password — admin password reset
router.post('/:id/reset-password', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) return res.status(400).json({ error: 'newPassword is required' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await dbCall(() => prisma.user.update({
      where: { id: req.params.id },
      data: { passwordHash, plainPassword: newPassword }
    }));
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('[users] reset-password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
