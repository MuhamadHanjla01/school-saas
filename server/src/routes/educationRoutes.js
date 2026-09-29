const router = require('express').Router();
const prisma = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');
const { validate, fail, pagination, audit, errorHandler } = require('../services/adminValidation');
const { catalog } = require('../services/educationCatalog');
router.use(checkRole(['SchoolAdmin', 'SuperAdmin']));

const label = (row, model) => model === 'hostelRoom' ? `${row.building} / ${row.name}` : model === 'studentInvoice' ? `${row.number} · ${row.description}` : model === 'academicTerm' ? `${row.academicYear} · ${row.name}` : `${row.name}${row.code ? ` (${row.code})` : ''}`;
async function choicesFor(db, schoolId, fields) {
  const choices = {};
  for (const field of fields.filter(f => f.model)) {
    if (field.model === 'employee') {
      const [teachers, staff] = await Promise.all(['teacher','staff'].map(model => db[model].findMany({ where: { schoolId }, select: { id: true, name: true }, orderBy: { name: 'asc' } })));
      choices[field.name] = [...teachers.map(r => ({ value: r.id, label: `Teacher · ${r.name}` })), ...staff.map(r => ({ value: r.id, label: `Staff · ${r.name}` }))];
    } else {
      const rows = await db[field.model].findMany({ where: { schoolId } });
      choices[field.name] = rows.map(r => ({ value: r.id, label: label(r, field.model) }));
    }
  }
  return choices;
}
function resource(req) { const spec = catalog[req.params.resource]; if (!spec) fail('Unknown resource',404); return spec; }
const publicFields = fields => fields.map(({ model: _model, ...field }) => field);
const overlap = data => ({ startDate: { lte: data.endDate }, endDate: { gte: data.startDate } });
async function validateData(db, req, spec, data, old) {
  for (const field of spec.fields.filter(f => f.model)) {
    const model = field.model === 'employee' ? (data.employeeType === 'Teacher' ? 'teacher' : 'staff') : field.model;
    if (!await db[model].findFirst({ where: { id: data[field.name], schoolId: req.schoolId } })) fail(`${field.label} not found in this institution`,404);
    if (old && old[field.name] !== data[field.name]) fail(`Create a new record to change ${field.label}; history must remain linked`,409);
  }
  const model = spec.model;
  if (old && ['enrollment','programCourse'].includes(model)) {
    const fixed = model === 'enrollment' ? ['batch','curriculumVersion','rollNumber'] : ['code','curriculumVersion','termNumber','credits','elective'];
    if (fixed.some(key => old[key] !== data[key])) fail('Create a new enrollment or curriculum version to preserve academic history',409);
  }
  if (model === 'hostelRoom' && old) {
    if (await db.hostelAllocation.count({ where: { roomId: old.id, status: 'Active', bedNumber: { gt: data.capacity } } })) fail('Capacity would remove an allocated bed',409);
  }
  if (model === 'hostelAllocation' && data.status === 'Active') {
    const room = await db.hostelRoom.findFirstOrThrow({ where: { id: data.roomId, schoolId: req.schoolId } });
    if (data.bedNumber > room.capacity) fail('Bed number exceeds room capacity');
    const conflict = await db.hostelAllocation.findFirst({ where: { schoolId: req.schoolId, id: { not: old?.id || '' }, status: 'Active', ...overlap(data), OR: [{ studentId: data.studentId }, { roomId: data.roomId, bedNumber: data.bedNumber }] } });
    if (conflict) fail('The student or bed already has an overlapping allocation',409);
  }
  if (model === 'transportStop') {
    if (![data.pickupTime,data.dropTime].every(t => /^([01]\d|2[0-3]):[0-5]\d$/.test(t))) fail('Use 24-hour HH:mm stop times');
  }
  if (model === 'transportAssignment') {
    const stop = await db.transportStop.findFirstOrThrow({ where: { id: data.stopId, schoolId: req.schoolId } });
    if (stop.routeId !== data.routeId) fail('The stop must belong to the selected route');
    if (data.status === 'Active') {
      const where = { schoolId: req.schoolId, id: { not: old?.id || '' }, status: 'Active', ...overlap(data) };
      if (await db.transportAssignment.count({ where: { ...where, studentId: data.studentId } })) fail('Student already has overlapping transport',409);
      const route = await db.transportRoute.findFirstOrThrow({ where: { id: data.routeId, schoolId: req.schoolId } });
      const assignments = await db.transportAssignment.findMany({ where: { ...where, routeId: data.routeId } });
      const events = [...assignments, data].flatMap(a => [[+new Date(a.startDate), 1], [+new Date(a.endDate) + 1, -1]]).sort((a,b) => a[0]-b[0] || a[1]-b[1]);
      let count = 0;
      for (const [, delta] of events) { count += delta; if (count > route.capacity) fail('Route capacity is exceeded during these dates',409); }
    }
  }
  if (['leaveRequest','payrollEntry'].includes(model) && old && old.employeeType !== data.employeeType) fail('Employee type cannot change',409);
  if (model === 'leaveRequest') {
    if (!old && data.status !== 'Pending') fail('Create a pending request before recording a decision');
    if (old && old.status !== 'Pending' && (old.status !== data.status || spec.fields.some(f => old[f.name] instanceof Date ? +old[f.name] !== +data[f.name] : old[f.name] !== data[f.name]))) fail('Decided leave requests are retained unchanged',409);
    if (data.status === 'Approved' && await db.leaveRequest.count({ where: { schoolId: req.schoolId, employeeId: data.employeeId, employeeType: data.employeeType, status: 'Approved', id: { not: old?.id || '' }, ...overlap(data) } })) fail('Approved leave already overlaps these dates',409);
  }
  if (model === 'payrollEntry') {
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(data.month)) fail('Use YYYY-MM for the payroll month');
    data.netMinor = data.basicMinor + data.allowancesMinor - data.deductionsMinor;
    if (data.netMinor < 0 || data.netMinor > 2147483647) fail('Invalid net salary');
    if (!old && data.status !== 'Draft') fail('Create payroll as a draft');
    if (old?.status === 'Paid') fail('Paid payroll is immutable',409);
    if (old?.status === 'Draft' && data.status === 'Paid') fail('Approve payroll before recording payment',409);
    if (old?.status === 'Approved' && spec.fields.some(f => !['status','reference'].includes(f.name) && old[f.name] !== data[f.name])) fail('Approved payroll amounts cannot change',409);
    if (old?.status === 'Approved' && data.status === 'Draft') fail('Approved payroll cannot return to draft',409);
    if (data.status === 'Paid' && !data.reference) fail('A payment reference is required');
  }
  if (model === 'studentInvoice') {
    if (data.discountMinor > data.amountMinor) fail('Discount cannot exceed the gross amount');
    if (data.discountMinor && !data.discountReason) fail('Explain the scholarship or discount');
    if (old && await db.invoiceReceipt.count({ where: { invoiceId: old.id } })) fail('Invoices with receipts cannot be changed',409);
  }
  if (model === 'invoiceReceipt') {
    const invoice = await db.studentInvoice.findFirstOrThrow({ where: { id: data.invoiceId, schoolId: req.schoolId }, include: { receipts: true } });
    const balance = invoice.amountMinor - invoice.discountMinor - invoice.receipts.reduce((sum,r) => sum+r.amountMinor,0);
    if (data.amountMinor > balance) fail('Payment exceeds the outstanding invoice balance',409);
  }
}
router.get('/:resource', async (req,res) => {
  const spec = resource(req), { page, skip, take } = pagination(req);
  const searchable = spec.fields.filter(f => f.type === 'text' && !f.model).map(f => ({ [f.name]: { contains: req.query.search } }));
  const where = { schoolId: req.schoolId, ...(req.query.search && searchable.length ? { OR: searchable } : {}) };
  const [rows,total,choices] = await Promise.all([prisma[spec.model].findMany({ where, skip, take, orderBy: { createdAt: 'desc' }, ...(spec.model === 'studentInvoice' ? { include: { receipts: true } } : {}) }),prisma[spec.model].count({ where }),choicesFor(prisma,req.schoolId,spec.fields)]);
  if (spec.model === 'studentInvoice') rows.forEach(row => { row.balanceMinor = row.amountMinor-row.discountMinor-row.receipts.reduce((sum,r) => sum+r.amountMinor,0); row.status = row.balanceMinor === 0 ? 'Paid' : row.receipts.length ? 'Partially paid' : new Date(row.dueDate) < new Date() ? 'Overdue' : 'Unpaid'; delete row.receipts; });
  res.json({ title: spec.title, description: spec.description, fields: publicFields(spec.fields), rows, total, page, totalPages: Math.ceil(total/take), choices, noDelete: spec.noDelete, immutable: spec.immutable, ...(spec.model === 'studentInvoice' ? { extraColumns: [{name:'balanceMinor',label:'Balance',type:'money'},{name:'status',label:'Status'}] } : spec.model === 'payrollEntry' ? { extraColumns: [{name:'netMinor',label:'Net salary',type:'money'},{name:'status',label:'Status'}] } : {}) });
});
async function save(req,res) {
  const spec = resource(req);
  if (req.params.id && spec.immutable) fail('This ledger is append-only',409);
  const data = validate(spec.fields.map(f => f.type === 'money' ? {...f,type:'number'} : f),req.body);
  const row = await prisma.$transaction(async db => {
    const old = req.params.id ? await db[spec.model].findFirst({ where: { id: req.params.id, schoolId: req.schoolId } }) : null;
    if (req.params.id && !old) fail('Record not found',404);
    await validateData(db,req,spec,data,old);
    const row = old ? await db[spec.model].update({ where: { id:old.id,schoolId:req.schoolId },data }) : await db[spec.model].create({ data: { ...data,schoolId:req.schoolId } });
    await audit(db,req,old ? 'Updated record' : 'Created record',spec.model,row.id);
    return row;
  });
  res.status(req.params.id ? 200 : 201).json(row);
}
router.post('/:resource',save);
router.put('/:resource/:id',save);
router.delete('/:resource/:id',async(req,res) => {
  const spec=resource(req); if(spec.noDelete || spec.immutable) fail('This record is retained for history',409);
  await prisma.$transaction(async db => { await db[spec.model].delete({ where:{id:req.params.id,schoolId:req.schoolId} }); await audit(db,req,'Deleted record',spec.model,req.params.id); });
  res.json({success:true});
});
router.use(errorHandler);
module.exports = router;
