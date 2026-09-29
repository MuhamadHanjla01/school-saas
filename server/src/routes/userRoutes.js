const express = require('express');
const router = express.Router();
const { secureRouter, validateRequestReferences, requireRecord, ADMIN_ROLES, STAFF_ROLES, safeUserSelect, studentScope, classScope, noProfileId } = require('../middleware/routeSecurity');
secureRouter(router, { model: 'user', readRoles: ADMIN_ROLES });
const bcrypt = require('bcryptjs');
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');
// Role grants are explicit; school administrators cannot grant platform access.
router.use((req, res, next) => {
  const roles = ['SchoolAdmin', 'Teacher', 'Student', 'Parent', 'Staff'];
  if (req.body?.role !== undefined && !roles.includes(req.body.role)) return res.status(403).json({ error: 'This role cannot be assigned through school user management' });
  if (req.params.id === req.user.userId && req.body?.role && req.body.role !== req.user.role) return res.status(409).json({ error: 'Cannot change your own administrator role' });
  if (req.body?.email !== undefined) {
    if (typeof req.body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email.trim())) return res.status(400).json({ error: 'Invalid email' });
    req.body.email = req.body.email.trim().toLowerCase();
  }
  next();
});


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

// POST /api/users — create a new user
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { email, password, role, name, phone, studentId, teacherId } = req.body;
    if ((role === 'Student' && !studentId) || (role === 'Teacher' && !teacherId)) return res.status(400).json({ error: 'Create teacher and student accounts through their profile management pages, or supply a linked profile ID' });
    if (!email || !password || !role) return res.status(400).json({ error: 'Email, password, and role are required' });

    // Check if email already exists
    const existing = await dbCall(() => prisma.user.findUnique({ where: { email } }));
    if (existing) return res.status(400).json({ error: 'A user with this email already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const user = await dbCall(() => prisma.user.create({
      data: { email, passwordHash, role, studentId: role === 'Student' ? studentId : null, teacherId: role === 'Teacher' ? teacherId : null, name: name || null, phone: phone || null, schoolId: req.schoolId },
      select: { id: true, email: true, role: true, name: true, phone: true, createdAt: true, lastLoginAt: true, schoolId: true }
    }));
    res.status(201).json({ user });
  } catch (error) {
    console.error('[users] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT /api/users/:id — update user
router.put('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { role, name, email, phone } = req.body;
    const data = {};
    if (role) data.role = role;
    if (name !== undefined) data.name = name;
    if (email) data.email = email;
    if (phone !== undefined) data.phone = phone;

    const user = await dbCall(() => prisma.user.update({
      where: { id: req.params.id, schoolId: req.schoolId },
      data,
      select: { id: true, email: true, role: true, name: true, phone: true, createdAt: true, lastLoginAt: true, schoolId: true }
    }));
    res.json({ user });
  } catch (error) {
    console.error('[users] PUT error:', error.message);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// PUT /api/users/:id/role — change user role
router.put('/:id/role', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: 'Role is required' });

    const user = await dbCall(() => prisma.user.update({
      where: { id: req.params.id, schoolId: req.schoolId },
      data: { role },
      select: { id: true, email: true, role: true, name: true }
    }));
    res.json({ user });
  } catch (error) {
    console.error('[users] PUT role error:', error.message);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// DELETE /api/users/:id — delete user
router.delete('/:id', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (req.params.id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    await dbCall(() => prisma.user.delete({ where: { id: req.params.id, schoolId: req.schoolId } }));
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('[users] DELETE error:', error.message);
    res.status(500).json({ error: 'Failed to delete user' });
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
      where: { id: req.params.id, schoolId: req.schoolId },
      data: { passwordHash, refreshToken: null }
    }));
    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('[users] reset-password error:', error.message);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router;
