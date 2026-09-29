const router = require('express').Router();
const prisma = require('../prismaClient');
const bcrypt = require('bcryptjs');
const { checkRole } = require('../middleware/authMiddleware');
const { field: f, validate, fail, pagination, errorHandler, audit } = require('../services/adminValidation');
const { catalog, settings, planFields, ticketFields } = require('../services/platformCatalog');
router.use(checkRole(['SuperAdmin']));
const schoolOptions = async () => (await prisma.school.findMany({ orderBy: { name: 'asc' }, select: { id: true, name: true } })).map(s => ({ value: s.id, label: s.name }));
async function listing(req, model, where, options = {}) {
  const { page, take, skip } = pagination(req);
  const [rows, total] = await Promise.all([prisma[model].findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, ...options }), prisma[model].count({ where })]);
  return { rows, total, page, totalPages: Math.ceil(total / take) };
}
router.get('/overview', async (req, res) => {
  const [schools, students, teachers, users, tickets, subscriptions, payments] = await Promise.all([
    prisma.school.findMany({ select: { id: true, name: true, isActive: true, createdAt: true, plan: true, _count: { select: { students: true, teachers: true, users: true, documents: true } } }, orderBy: { createdAt: 'desc' } }),
    prisma.student.count(), prisma.teacher.count(), prisma.user.count(), prisma.supportTicket.count({ where: { status: { in: ['Open', 'In Progress'] } } }),
    prisma.subscription.findMany({ include: { plan: true } }),
    prisma.subscriptionPayment.groupBy({ by: ['currency'], _sum: { amountMinor: true }, _count: true }),
  ]);
  res.json({ schools, students, teachers, users, openTickets: tickets, activeSchools: schools.filter(s => s.isActive).length,
    activeSubscriptions: subscriptions.filter(s => s.status === 'Active' && s.endDate >= new Date()).length,
    revenue: payments.map(p => ({ currency: p.currency, amountMinor: p._sum.amountMinor || 0, payments: p._count })), generatedAt: new Date() });
});
router.get('/records/:kind', async (req, res) => {
  const definition = catalog[req.params.kind];
  if (!definition) fail('Unknown collection', 404);
  const where = { kind: req.params.kind, ...(req.query.search ? { title: { contains: req.query.search } } : {}) };
  const result = await listing(req, 'platformEntry', where);
  res.json({ ...definition, ...result, rows: result.rows.map(row => ({ ...JSON.parse(row.data), id: row.id, version: row.version, createdAt: row.createdAt })) });
});
router.post('/records/:kind', async (req, res) => {
  const definition = catalog[req.params.kind];
  if (!definition) fail('Unknown collection', 404);
  const data = validate(definition.fields, req.body);
  const row = await prisma.$transaction(async db => {
    const record = await db.platformEntry.create({ data: { kind: req.params.kind, title: data.title, data: JSON.stringify(data) } });
    await audit(db, req, 'Created platform record', req.params.kind, record.id);
    return record;
  });
  res.status(201).json({ id: row.id });
});
router.put('/records/:kind/:id', async (req, res) => {
  const definition = catalog[req.params.kind];
  if (!definition) fail('Unknown collection', 404);
  const data = validate(definition.fields, req.body);
  if (!Number.isInteger(req.body.version)) fail('A record version is required');
  await prisma.$transaction(async db => {
    const result = await db.platformEntry.updateMany({ where: { id: req.params.id, kind: req.params.kind, version: req.body.version }, data: { title: data.title, data: JSON.stringify(data), version: { increment: 1 } } });
    if (!result.count) fail('Record changed or was deleted. Refresh before editing.', 409);
    await audit(db, req, 'Updated platform record', req.params.kind, req.params.id);
  });
  res.json({ success: true });
});
router.delete('/records/:kind/:id', async (req, res) => {
  if (!catalog[req.params.kind]) fail('Unknown collection', 404);
  await prisma.$transaction(async db => {
    const result = await db.platformEntry.deleteMany({ where: { kind: req.params.kind, id: req.params.id } });
    if (!result.count) fail('Record not found', 404);
    await audit(db, req, 'Deleted platform record', req.params.kind, req.params.id);
  });
  res.json({ success: true });
});
router.get('/settings/:key', async (req, res) => {
  const definition = settings[req.params.key];
  if (!definition) fail('Unknown settings', 404);
  const row = await prisma.platformSetting.findUnique({ where: { key: req.params.key } });
  res.json({ ...definition, values: row ? JSON.parse(row.data) : Object.fromEntries(definition.fields.map(f => [f.name, f.default ?? ''])) });
});
router.put('/settings/:key', async (req, res) => {
  const definition = settings[req.params.key];
  if (!definition) fail('Unknown settings', 404);
  const data = JSON.stringify(validate(definition.fields, req.body));
  await prisma.$transaction(async db => {
    await db.platformSetting.upsert({ where: { key: req.params.key }, update: { data }, create: { key: req.params.key, data } });
    await audit(db, req, 'Updated platform settings', 'Settings', req.params.key);
  });
  res.json({ success: true });
});
router.get('/plans', async (req, res) => res.json({ title: 'Packages', fields: planFields, ...await listing(req, 'plan', req.query.search ? { name: { contains: req.query.search } } : {}) }));
router.post('/plans', async (req, res) => {
  const data = validate(planFields, req.body);
  const row = await prisma.$transaction(async db => { const p = await db.plan.create({ data }); await audit(db, req, 'Created plan', 'Plan', p.id); return p; });
  res.status(201).json(row);
});
router.put('/plans/:id', async (req, res) => {
  const data = validate(planFields, req.body);
  const row = await prisma.$transaction(async db => { const p = await db.plan.update({ where: { id: req.params.id }, data }); await audit(db, req, 'Updated plan', 'Plan', p.id); return p; });
  res.json(row);
});
router.delete('/plans/:id', async (req, res) => {
  await prisma.$transaction(async db => { await db.plan.delete({ where: { id: req.params.id } }); await audit(db, req, 'Deleted plan', 'Plan', req.params.id); });
  res.json({ success: true });
});
const subscriptionFields = [f('schoolId', 'School', 'select', { required: true }), f('planId', 'Package', 'select', { required: true }), f('status', 'Status', 'select', { options: ['Trial', 'Active', 'Suspended', 'Cancelled'], default: 'Active' }), f('startDate', 'Start date', 'date', { required: true }), f('endDate', 'End date', 'date', { required: true })];
router.get('/subscriptions', async (req, res) => {
  const plans = await prisma.plan.findMany({ select: { id: true, name: true } });
  res.json({ title: 'Subscriptions', description: 'Assign plans and track service periods. This does not charge a payment card.', fields: subscriptionFields, choices: { schoolId: await schoolOptions(), planId: plans.map(p => ({ value: p.id, label: p.name })) }, ...await listing(req, 'subscription', req.query.search ? { school: { name: { contains: req.query.search } } } : {}) });
});
async function saveSubscription(req, res) {
  const data = validate(subscriptionFields, req.body);
  const row = await prisma.$transaction(async db => {
    const plan = await db.plan.findUnique({ where: { id: data.planId } });
    if (!plan || !plan.active) fail('Select an active package');
    const school = await db.school.findUnique({ where: { id: data.schoolId } });
    if (!school) fail('School not found', 404);
    if (req.params.id) {
      const existing = await db.subscription.findUnique({ where: { id: req.params.id } });
      if (!existing || existing.schoolId !== data.schoolId) fail('A subscription cannot be reassigned to another school', 409);
    }
    const record = req.params.id ? await db.subscription.update({ where: { id: req.params.id }, data }) : await db.subscription.create({ data });
    await db.school.update({ where: { id: data.schoolId }, data: { plan: plan.name } });
    await audit(db, req, 'Saved subscription', 'Subscription', record.id, data.schoolId);
    return record;
  });
  res.status(req.params.id ? 200 : 201).json(row);
}
router.post('/subscriptions', saveSubscription);
router.put('/subscriptions/:id', saveSubscription);
const paymentFields = [f('subscriptionId', 'Subscription', 'select', { required: true }), f('amountMinor', 'Amount (minor currency units)', 'number', { required: true, min: 1 }), f('reference', 'Unique payment reference', 'text', { required: true }), f('paidDate', 'Paid date', 'date', { required: true }), f('note', 'Note', 'textarea')];
router.get('/transactions', async (req, res) => {
  const subscriptions = await prisma.subscription.findMany({ include: { school: { select: { name: true } }, plan: { select: { currency: true } } } });
  res.json({ title: 'Transactions', description: 'Record verified offline subscription payments. Entries are immutable; this does not process an online charge.', fields: paymentFields, immutable: true, choices: { subscriptionId: subscriptions.map(s => ({ value: s.id, label: `${s.school.name} (${s.plan.currency.toUpperCase()})` })) }, ...await listing(req, 'subscriptionPayment', req.query.search ? { reference: { contains: req.query.search } } : {}) });
});
router.post('/transactions', async (req, res) => {
  const data = validate(paymentFields, req.body);
  const record = await prisma.$transaction(async db => {
    const sub = await db.subscription.findUnique({ where: { id: data.subscriptionId }, include: { plan: true } });
    if (!sub) fail('Subscription not found', 404);
    const payment = await db.subscriptionPayment.create({ data: { ...data, currency: sub.plan.currency } });
    await audit(db, req, 'Recorded subscription payment', 'SubscriptionPayment', payment.id, sub.schoolId);
    return payment;
  });
  res.status(201).json(record);
});
router.get('/tickets', async (req, res) => res.json({ title: 'Ticket Inbox', fields: ticketFields, choices: { schoolId: await schoolOptions() }, ...await listing(req, 'supportTicket', req.query.search ? { subject: { contains: req.query.search } } : {}) }));
async function saveTicket(req, res) {
  const data = validate(ticketFields, req.body);
  const record = await prisma.$transaction(async db => {
    if (req.params.id) {
      const previous = await db.supportTicket.findUnique({ where: { id: req.params.id } });
      if (!previous || previous.schoolId !== data.schoolId) fail('A ticket cannot be moved to another school', 409);
    }
    const ticket = req.params.id ? await db.supportTicket.update({ where: { id: req.params.id }, data }) : await db.supportTicket.create({ data });
    await audit(db, req, 'Saved support ticket', 'SupportTicket', ticket.id, ticket.schoolId);
    return ticket;
  });
  res.status(req.params.id ? 200 : 201).json(record);
}
router.post('/tickets', saveTicket);
router.put('/tickets/:id', saveTicket);
router.get('/audit', async (req, res) => res.json({ title: 'Audit Logs', readOnly: true, fields: ['createdAt', 'userName', 'action', 'entity', 'schoolId'].map(name => f(name, name)), ...await listing(req, 'auditLog', req.query.search ? { OR: [{ action: { contains: req.query.search } }, { userName: { contains: req.query.search } }] } : {}) }));
router.get('/logins', async (req, res) => res.json({ title: 'Login Activity', description: 'Most recent successful login per account.', readOnly: true, fields: ['email', 'role', 'lastLoginAt', 'schoolId'].map(name => f(name, name)), ...await listing(req, 'user', { lastLoginAt: { not: null }, ...(req.query.search ? { email: { contains: req.query.search } } : {}) }, { select: { id: true, email: true, role: true, lastLoginAt: true, schoolId: true } }) }));
const staffFields = [f('name', 'Name', 'text', { required: true }), f('email', 'Email', 'email', { required: true }), f('password', 'Password (required for new accounts)', 'password')];
router.get('/staff', async (req, res) => res.json({ title: 'Platform Administrators', description: 'These accounts have full platform access.', fields: staffFields, noDelete: true, ...await listing(req, 'user', { role: 'SuperAdmin', ...(req.query.search ? { email: { contains: req.query.search } } : {}) }, { select: { id: true, name: true, email: true, createdAt: true } }) }));
async function saveStaff(req, res) {
  const { password, ...data } = validate(staffFields, req.body);
  if (!req.params.id && !password) fail('Password is required');
  if (password) { data.passwordHash = await bcrypt.hash(password, 12); data.refreshToken = null; }
  await prisma.$transaction(async db => {
    const record = req.params.id ? await db.user.update({ where: { id: req.params.id, role: 'SuperAdmin' }, data }) : await db.user.create({ data: { ...data, role: 'SuperAdmin', schoolId: req.user.schoolId } });
    await audit(db, req, 'Saved platform administrator', 'User', record.id);
  });
  res.status(req.params.id ? 200 : 201).json({ success: true });
}
router.post('/staff', saveStaff);
router.put('/staff/:id', saveStaff);
router.get('/push-history', async (req, res) => res.json({ title: 'Notification History', description: 'In-app notifications created by school workflows. Device delivery is not tracked.', readOnly: true, fields: ['title', 'type', 'schoolId', 'createdAt', 'isRead'].map(name => f(name, name)), ...await listing(req, 'notification', req.query.search ? { title: { contains: req.query.search } } : {}) }));
router.get('/runtime', async (req, res) => {
  await prisma.$queryRaw`SELECT 1`;
  res.json({ database: 'Connected', uptimeSeconds: Math.floor(process.uptime()), nodeVersion: process.version, onlinePaymentsConfigured: Boolean(process.env.STRIPE_SECRET_KEY), emailDeliveryConfigured: false, messagingDeliveryConfigured: false, impersonationEnabled: false, apiAuthentication: 'Bearer access token, refresh-token rotation', timestamp: new Date() });
});
router.get('/export', async (req, res) => {
  // A portable configuration export intentionally excludes credentials and student records.
  const data = await prisma.$transaction(async db => ({ format: 'erpzo-platform-config-v1', exportedAt: new Date(), plans: await db.plan.findMany(), settings: await db.platformSetting.findMany(), records: await db.platformEntry.findMany() }));
  await audit(prisma, req, 'Exported platform configuration', 'Configuration');
  res.attachment(`platform-configuration-${new Date().toISOString().slice(0, 10)}.json`).json(data);
});
router.use(errorHandler);
module.exports = router;
