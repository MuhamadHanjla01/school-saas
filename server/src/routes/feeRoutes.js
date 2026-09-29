const router = require('express').Router();
const prisma = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');
const { requireRecord, ADMIN_ROLES } = require('../middleware/routeSecurity');
const { fail, audit, errorHandler } = require('../services/adminValidation');
router.use(checkRole([...ADMIN_ROLES, 'Student']));
const money = (amount, currency) => new Intl.NumberFormat('en', { style: 'currency', currency: currency || 'usd' }).format(amount);
router.get('/', async (req, res) => {
  const where = { schoolId: req.schoolId };
  if (req.user.role === 'Student') where.classId = req.user.classId || '__none__';
  res.json({ fees: await prisma.fee.findMany({ where, include: { class: { select: { name: true } } }, orderBy: { dueDate: 'desc' } }) });
});
router.post('/', checkRole(ADMIN_ROLES), async (req, res) => {
  const { name, amount, dueDate, classId } = req.body;
  if (typeof name !== 'string' || !name.trim() || !Number.isFinite(Number(amount)) || Number(amount) <= 0 || Number(amount) > 100000000 || typeof dueDate !== 'string' || Number.isNaN(Date.parse(dueDate))) fail('A name, positive amount, valid due date and class are required');
  await requireRecord(req, 'class', classId);
  const fee = await prisma.$transaction(async db => {
    const school = await db.school.findUniqueOrThrow({ where: { id: req.schoolId } });
    const created = await db.fee.create({ data: { name: name.trim(), amount: Number(amount), dueDate: new Date(dueDate), classId, schoolId: req.schoolId, currency: school.paymentCurrency } });
    const students = await db.student.findMany({ where: { schoolId: req.schoolId, classId, status: 'Active' }, select: { id: true } });
    await db.feePayment.createMany({ data: students.map(s => ({ studentId: s.id, feeId: created.id, amount: created.amount, currency: created.currency, schoolId: req.schoolId })) });
    await audit(db, req, 'Created class fee', 'Fee', created.id);
    return created;
  });
  res.status(201).json({ fee });
});
const include = { student: { select: { name: true, studentId: true, class: { select: { name: true } } } }, fee: { select: { name: true, amount: true, dueDate: true } } };
const effectiveStatus = p => p.status === 'Pending' && p.fee.dueDate < new Date() ? 'Overdue' : p.status;
router.get('/summary', checkRole(ADMIN_ROLES), async (req, res) => {
  const payments = await prisma.feePayment.findMany({ where: { schoolId: req.schoolId }, include });
  const sums = new Map();
  const month = new Date(); month.setDate(1); month.setHours(0,0,0,0);
  for (const p of payments) {
    if (!sums.has(p.currency)) sums.set(p.currency, { paid: 0, pending: 0, overdue: 0, month: 0 });
    const s = sums.get(p.currency), status = effectiveStatus(p);
    if (status === 'Paid') { s.paid += p.amount; if (p.paidDate >= month) s.month += p.amount; }
    if (status === 'Pending') s.pending += p.amount;
    if (status === 'Overdue') s.overdue += p.amount;
  }
  const value = key => [...sums].map(([currency,s]) => money(s[key], currency)).join(' / ') || '0';
  res.json({ summary: [['Total Collected','paid','account_balance','#006b5c'],['Pending Dues','pending','pending_actions','#9d4224'],['Overdue','overdue','warning','#ba1a1a'],['This Month','month','calendar_month','#0060ac']].map(([label,key,icon,color])=>({label,value:value(key),icon,color})), records: payments.map(p=>({ id:p.id, student:p.student.name, class:p.student.class?.name || 'Unassigned', amount:money(p.amount,p.currency), dueDate:p.fee.dueDate, status:effectiveStatus(p), paidDate:p.paidDate || '-' })) });
});
router.get('/payments', async (req, res) => {
  const where = { schoolId:req.schoolId, ...(req.user.role === 'Student' ? { studentId: req.user.studentId || '__none__' } : {}) };
  let payments = await prisma.feePayment.findMany({ where, include, orderBy:{createdAt:'desc'} });
  payments = payments.map(p=>({...p,status:effectiveStatus(p)}));
  if(req.query.status && req.query.status !== 'All') payments=payments.filter(p=>p.status === req.query.status);
  if(typeof req.query.search === 'string') payments=payments.filter(p=>(p.student.name+' '+p.student.studentId).toLowerCase().includes(req.query.search.toLowerCase()));
  res.json({payments});
});
router.post('/payments', checkRole(ADMIN_ROLES), async (req,res)=>{
  const {studentId,feeId,amount,status}=req.body;
  if(!['Paid','Pending','Overdue'].includes(status)) fail('Invalid payment status');
  const student=await requireRecord(req,'student',studentId), fee=await requireRecord(req,'fee',feeId);
  if(student.classId !== fee.classId) fail('Fee is not assigned to this student class');
  if(!Number.isFinite(Number(amount)) || Number(amount) !== fee.amount) fail('Record the full fee amount. Partial settlements are not supported');
  const payment=await prisma.$transaction(async db=>{
    const existing=await db.feePayment.findUnique({where:{studentId_feeId:{studentId,feeId}},include:{attempts:{where:{status:{in:['Creating','Pending','Completed','Paid']}}}}});
    if(existing && (existing.schoolId !== req.schoolId || existing.method !== 'Manual' || existing.attempts.length || existing.status === 'Paid')) fail('This payment is already settled or has an online attempt. Use the payment reconciliation/refund workflow.',409);
    const saved=await db.feePayment.upsert({where:{studentId_feeId:{studentId,feeId}},update:{status,paidDate:status==='Paid'?new Date():null},create:{studentId,feeId,amount:fee.amount,currency:fee.currency,status,paidDate:status==='Paid'?new Date():null,schoolId:req.schoolId}});
    await audit(db,req,'Recorded manual fee payment','FeePayment',saved.id);
    return saved;
  });
  res.json({payment});
});
router.get('/student/:id',async(req,res)=>{
  await requireRecord(req,'student',req.params.id);
  res.json({payments:await prisma.feePayment.findMany({where:{studentId:req.params.id,schoolId:req.schoolId},include:{fee:true},orderBy:{createdAt:'desc'}})});
});
router.use(errorHandler);
module.exports=router;
