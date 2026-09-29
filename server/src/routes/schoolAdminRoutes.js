const router = require('express').Router();
const prisma = require('../prismaClient');
const multer = require('multer');
const { checkRole } = require('../middleware/authMiddleware');
const { field: f, validate, fail, pagination, audit, errorHandler } = require('../services/adminValidation');
router.use(checkRole(['SchoolAdmin', 'SuperAdmin']));
const settingsFields = [f('name', 'School name', 'text', { required: true }), f('email', 'Email', 'email'), f('phone', 'Phone'), f('address', 'Address', 'textarea'), f('registrationNumber', 'Registration number'), f('academicYear', 'Academic year'), f('termName', 'Term name'), f('startDate', 'Term start', 'date'), f('endDate', 'Term end', 'date'), f('passingMarks', 'Passing percentage', 'number', { min: 0, max: 100, default: 40 }), f('gradingScale', 'Grade thresholds (A:90,B:80,…)', 'text', { default: 'A:90,B:80,C:70,D:60,E:40,F:0' })];
settingsFields.push(
  f('institutionType','Institution type','select',{options:['School','College','University'],default:'School'}),
  f('paymentCurrency','Currency for new class fees','select',{options:['npr','inr','usd'],default:'npr'}),
  f('timezone','Timezone','select',{options:['Asia/Kathmandu','Asia/Kolkata','UTC'],default:'Asia/Kathmandu'}),
  f('province','Province'),f('district','District'),f('municipality','Municipality / rural municipality'),f('ward','Ward'),f('fiscalYear','Fiscal year')
);
router.get('/settings', async (req, res) => {
  const school = await prisma.school.findUniqueOrThrow({ where: { id: req.schoolId }, include: { settings: true } });
  res.json({ title: 'Institution Settings', fields: settingsFields, values: { ...Object.fromEntries(settingsFields.map(f => [f.name, f.default ?? ''])), name: school.name, email: school.email || '', phone: school.phone || '', address: school.address || '', institutionType: school.institutionType, paymentCurrency: school.paymentCurrency, ...school.settings } });
});
router.put('/settings', async (req, res) => {
  const { name, email, phone, address, institutionType, paymentCurrency, ...data } = validate(settingsFields, req.body);
  if (!/^[A-Za-z][A-Za-z+-]*:(?:100|\d{1,2})(?:,[A-Za-z][A-Za-z+-]*:(?:100|\d{1,2}))*$/.test(data.gradingScale)) fail('Use comma-separated grade thresholds, for example A:90,B:80,C:70,F:0');
  await prisma.$transaction(async db => {
    await db.school.update({ where: { id: req.schoolId }, data: { name, email, phone, address, institutionType, paymentCurrency } });
    await db.schoolSettings.upsert({ where: { schoolId: req.schoolId }, update: data, create: { ...data, schoolId: req.schoolId } });
    await audit(db, req, 'Updated school settings', 'School', req.schoolId);
  });
  res.json({ success: true });
});
const documentSelect = { id: true, name: true, fileName: true, fileType: true, category: true, sizeBytes: true, uploadedBy: true, createdAt: true };
router.get('/documents', async (req, res) => {
  const { page, skip, take } = pagination(req);
  const where = { schoolId: req.schoolId, ...(req.query.search ? { name: { contains: req.query.search } } : {}) };
  const [documents, total, storage] = await Promise.all([prisma.document.findMany({ where, skip, take, select: documentSelect, orderBy: { createdAt: 'desc' } }), prisma.document.count({ where }), prisma.document.aggregate({ where: { schoolId: req.schoolId }, _sum: { sizeBytes: true } })]);
  res.json({ documents, total, page, totalPages: Math.ceil(total / take), sizeBytes: storage._sum.sizeBytes || 0 });
});
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 3 }, fileFilter(req, file, cb) {
  const allowed = ['application/pdf', 'image/png', 'image/jpeg', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  cb(allowed.includes(file.mimetype) ? null : Object.assign(new Error('Unsupported file type'), { status: 400 }), allowed.includes(file.mimetype));
} });
router.post('/documents', upload.single('file'), async (req, res) => {
  if (!req.file) fail('Select a document to upload');
  const data = validate([f('name', 'Name'), f('category', 'Category', 'select', { options: ['General', 'Policy', 'Student Record', 'Finance', 'HR', 'Compliance'], default: 'General' })], req.body);
  const document = await prisma.$transaction(async db => {
    const doc = await db.document.create({ data: { ...data, name: data.name || req.file.originalname, fileName: req.file.originalname, fileType: req.file.mimetype, fileSize: String(req.file.size), sizeBytes: req.file.size, content: req.file.buffer, uploadedBy: req.user.email, schoolId: req.schoolId }, select: documentSelect });
    await audit(db, req, 'Uploaded document', 'Document', doc.id);
    return doc;
  });
  res.status(201).json({ document });
});
router.get('/documents/:id/download', async (req, res) => {
  const doc = await prisma.document.findFirst({ where: { id: req.params.id, schoolId: req.schoolId } });
  if (!doc?.content) fail('Document file not found', 404);
  res.set('Cache-Control', 'private, no-store').type(doc.fileType || 'application/octet-stream').attachment(doc.fileName).send(Buffer.from(doc.content));
});
router.delete('/documents/:id', async (req, res) => {
  await prisma.$transaction(async db => {
    await db.document.delete({ where: { id: req.params.id, schoolId: req.schoolId } });
    await audit(db, req, 'Deleted document', 'Document', req.params.id);
  });
  res.json({ success: true });
});
router.get('/support', async (req, res) => res.json({ tickets: await prisma.supportTicket.findMany({ where: { schoolId: req.schoolId }, orderBy: { updatedAt: 'desc' }, take: 100 }) }));
router.post('/support', async (req, res) => {
  const data = validate([f('subject', 'Subject', 'text', { required: true }), f('description', 'Description', 'textarea', { required: true }), f('priority', 'Priority', 'select', { options: ['Normal', 'High', 'Urgent'], default: 'Normal' })], req.body);
  const ticket = await prisma.supportTicket.create({ data: { ...data, schoolId: req.schoolId } });
  res.status(201).json({ ticket });
});
router.use((error, req, res, next) => { if (error.code === 'LIMIT_FILE_SIZE') { error.status = 413; error.message = 'File exceeds 10 MB'; } errorHandler(error, req, res, next); });
module.exports = router;
