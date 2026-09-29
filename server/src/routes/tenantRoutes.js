const router = require('express').Router();
const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const { checkRole } = require('../middleware/authMiddleware');
const { field: f, validate, fail, audit, errorHandler } = require('../services/adminValidation');
router.use(checkRole(['SuperAdmin']));
const schoolFields = [f('name', 'School name', 'text', { required: true }), f('email', 'Administrator email', 'email', { required: true }), f('password', 'Administrator password', 'password', { required: true }), f('adminName', 'Administrator name', 'text', { required: true }), f('plan', 'Plan', 'text', { default: 'Free' })];
router.get('/dashboard-stats', async (req, res) => {
  const [totalSchools, activeSchools, recentSchools] = await Promise.all([prisma.school.count(), prisma.school.count({ where: { isActive: true } }), prisma.school.findMany({ take: 5, orderBy: { createdAt: 'desc' }, select: { id: true, name: true, createdAt: true, isActive: true, plan: true } })]);
  res.json({ totalSchools, activeSchools, recentSchools: recentSchools.map(s => ({ ...s, date: s.createdAt, status: s.isActive ? 'Active' : 'Suspended' })) });
});
router.get('/schools', async (req, res) => {
  const schools = await prisma.school.findMany({ orderBy: { createdAt: 'desc' }, include: { _count: { select: { students: true, teachers: true, users: true } }, subscription: { include: { plan: true } } } });
  res.json(schools.map(s => ({ ...s, joined: s.createdAt, subdomain: s.domain || s.slug, students: s._count.students, status: s.isActive ? 'Active' : 'Suspended' })));
});
router.post('/schools', async (req, res) => {
  const input = validate(schoolFields, req.body);
  const slug = (req.body.slug || input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
  if (typeof slug !== 'string' || !/^[a-z0-9][a-z0-9-]{1,62}$/.test(slug)) fail('School slug must be 2–63 lowercase letters, digits or hyphens');
  const passwordHash = await bcrypt.hash(input.password, 12);
  const school = await prisma.$transaction(async db => {
    const created = await db.school.create({ data: { name: input.name, email: input.email, slug, plan: input.plan } });
    await db.user.create({ data: { name: input.adminName, email: input.email, passwordHash, role: 'SchoolAdmin', schoolId: created.id } });
    await db.schoolSettings.create({ data: { schoolId: created.id } });
    await audit(db, req, 'Onboarded school and administrator', 'School', created.id, created.id);
    return created;
  });
  res.status(201).json({ school, message: 'School and administrator created' });
});
router.get('/schools/:id', async (req, res) => {
  const school = await prisma.school.findUnique({ where: { id: req.params.id }, include: { _count: { select: { students: true, teachers: true, users: true, classes: true } }, settings: true, subscription: { include: { plan: true } } } });
  if (!school) fail('School not found', 404);
  res.json(school);
});
router.get('/schools/:id/users', async (req, res) => {
  res.json(await prisma.user.findMany({ where: { schoolId: req.params.id }, select: { id: true, name: true, email: true, role: true, lastLoginAt: true, student: { select: { class: { select: { name: true } } } } }, orderBy: { createdAt: 'desc' } }));
});
router.post('/schools/:id/users/:userId/reset-password', async (req, res) => {
  const { newPassword } = validate([f('newPassword', 'New password', 'password', { required: true })], req.body);
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.$transaction(async db => {
    await db.user.update({ where: { id: req.params.userId, schoolId: req.params.id, role: { not: 'SuperAdmin' } }, data: { passwordHash, refreshToken: null } });
    await db.passwordResetToken.deleteMany({ where: { userId: req.params.userId } });
    await audit(db, req, 'Reset account password', 'User', req.params.userId, req.params.id);
  });
  res.json({ success: true });
});
router.put('/schools/:id', async (req, res) => {
  const data = validate([f('name', 'School name', 'text', { required: true }), f('email', 'Email', 'email'), f('phone', 'Phone'), f('address', 'Address', 'textarea'), f('plan', 'Plan')], req.body, true);
  if (req.body.status !== undefined) {
    if (!['Active', 'Suspended'].includes(req.body.status)) fail('Invalid school status');
    data.isActive = req.body.status === 'Active';
    if (!data.isActive && req.params.id === req.user.schoolId) fail('Cannot suspend your own platform school');
  }
  if (req.body.subdomain !== undefined) {
    if (typeof req.body.subdomain !== 'string' || (req.body.subdomain && !/^[a-z0-9.-]+$/.test(req.body.subdomain))) fail('Invalid domain');
    data.domain = req.body.subdomain || null;
  }
  const school = await prisma.$transaction(async db => {
    const saved = await db.school.update({ where: { id: req.params.id }, data });
    if (data.isActive === false) await db.user.updateMany({ where: { schoolId: saved.id }, data: { refreshToken: null } });
    await audit(db, req, 'Updated school', 'School', saved.id, saved.id);
    return saved;
  });
  if (data.isActive === false) req.app.get('io')?.in(`school_${school.id}`).disconnectSockets(true);
  res.json({ school });
});
router.delete('/schools/:id', (req, res) => res.status(409).json({ error: 'Schools retain financial and student records. Suspend the school instead.' }));
router.use(errorHandler);
module.exports = router;
