const express = require('express');
const router = express.Router();
const prisma = require('../prismaClient');
const { dbCall } = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');

// GET /api/fees — list fee structures
router.get('/', async (req, res) => {
  try {
    const fees = await dbCall(() => prisma.fee.findMany({
      where: { schoolId: req.schoolId },
      include: { class: { select: { name: true } } },
      orderBy: { dueDate: 'desc' },
    }));
    res.json({ fees });
  } catch (error) {
    console.error('[fees] GET error:', error.message);
    res.status(500).json({ error: 'Failed to fetch fees' });
  }
});

// POST /api/fees — create fee structure
router.post('/', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { name, amount, dueDate, classId } = req.body;
    if (!name || !amount || !dueDate || !classId) {
      return res.status(400).json({ error: 'All fields required' });
    }
    const fee = await prisma.fee.create({
      data: { name, amount: parseFloat(amount), dueDate: new Date(dueDate), classId, schoolId: req.schoolId },
    });
    res.status(201).json({ fee });
  } catch (error) {
    console.error('[fees] POST error:', error.message);
    res.status(500).json({ error: 'Failed to create fee' });
  }
});

// GET /api/fees/summary — aggregated fee stats
router.get('/summary', async (req, res) => {
  try {
    const payments = await dbCall(() => prisma.feePayment.findMany({
      where: { schoolId: req.schoolId },
      include: {
        student: { select: { name: true, studentId: true, class: { select: { name: true } } } },
        fee: { select: { name: true, amount: true, dueDate: true } },
      },
    }));

    const paid = payments.filter(p => p.status === 'Paid');
    const pending = payments.filter(p => p.status === 'Pending');
    const overdue = payments.filter(p => p.status === 'Overdue');

    const totalCollected = paid.reduce((sum, p) => sum + p.amount, 0);
    const totalPending = pending.reduce((sum, p) => sum + p.amount, 0);
    const totalOverdue = overdue.reduce((sum, p) => sum + p.amount, 0);

    // Format for the table
    const records = payments.map(p => ({
      id: `INV-${p.id.slice(0, 8).toUpperCase()}`,
      student: p.student.name,
      class: p.student.class?.name || 'N/A',
      amount: `$${p.amount.toLocaleString()}`,
      dueDate: p.fee.dueDate,
      status: p.status,
      paidDate: p.paidDate || '-',
    }));

    res.json({
      summary: [
        { label: 'Total Collected', value: `$${totalCollected.toLocaleString()}`, icon: 'account_balance', color: '#006b5c' },
        { label: 'Pending Dues', value: `$${totalPending.toLocaleString()}`, icon: 'pending_actions', color: '#9d4224' },
        { label: 'Overdue', value: `$${totalOverdue.toLocaleString()}`, icon: 'warning', color: '#ba1a1a' },
        { label: 'This Month', value: `$${totalCollected.toLocaleString()}`, icon: 'calendar_month', color: '#0060ac' },
      ],
      records,
    });
  } catch (error) {
    console.error('[fees] summary error:', error.message);
    res.status(500).json({ error: 'Failed to fetch fee summary' });
  }
});

// GET /api/fees/payments — list all payments
router.get('/payments', async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = { schoolId: req.schoolId };
    if (status && status !== 'All') where.status = status;

    const payments = await dbCall(() => prisma.feePayment.findMany({
      where,
      include: {
        student: { select: { name: true, studentId: true, class: { select: { name: true } } } },
        fee: { select: { name: true, amount: true, dueDate: true } },
      },
      orderBy: { createdAt: 'desc' },
    }));

    let filtered = payments;
    if (search) {
      const q = search.toLowerCase();
      filtered = payments.filter(p =>
        p.student.name.toLowerCase().includes(q) || p.student.studentId.toLowerCase().includes(q)
      );
    }

    res.json({ payments: filtered });
  } catch (error) {
    console.error('[fees] payments error:', error.message);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// POST /api/fees/payments — record a payment
router.post('/payments', checkRole(['SchoolAdmin', 'SuperAdmin']), async (req, res) => {
  try {
    const { studentId, feeId, amount, status } = req.body;
    const payment = await prisma.feePayment.upsert({
      where: { studentId_feeId: { studentId, feeId } },
      update: { amount: parseFloat(amount), status, paidDate: status === 'Paid' ? new Date() : null },
      create: { studentId, feeId, amount: parseFloat(amount), status, paidDate: status === 'Paid' ? new Date() : null, schoolId: req.schoolId },
    });
    res.json({ payment });
  } catch (error) {
    console.error('[fees] POST payment error:', error.message);
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// GET /api/fees/student/:id — student fee status
router.get('/student/:id', async (req, res) => {
  try {
    const payments = await dbCall(() => prisma.feePayment.findMany({
      where: { studentId: req.params.id },
      include: { fee: true },
      orderBy: { createdAt: 'desc' },
    }));
    res.json({ payments });
  } catch (error) {
    console.error('[fees] student error:', error.message);
    res.status(500).json({ error: 'Failed to fetch student fees' });
  }
});

module.exports = router;
