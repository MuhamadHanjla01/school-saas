const express = require('express');
const prisma = require('../prismaClient');
const { checkRole } = require('../middleware/authMiddleware');
const { createRegionalPaymentService } = require('../services/regionalPayments');
const router = express.Router();
const service = createRegionalPaymentService(prisma);
const route = fn => async (req, res) => {
  try { res.json(await fn(req)); }
  catch (error) {
    const conflict = ['P2002', 'P2034', 'P1008'].includes(error.code);
    res.status(error.status || (conflict ? 409 : 502)).json({ error: error.status ? error.message : conflict ? 'Checkout is busy. Check payment status before retrying.' : 'Payment verification is temporarily unavailable. Do not pay again until its status is checked.' });
  }
};
router.get('/methods', checkRole(['Student', 'SchoolAdmin', 'SuperAdmin']), route(req => service.methods(req.schoolId)));
router.post('/checkout', checkRole(['Student']), route(req => service.checkout(req.user, req.schoolId, req.body)));
router.get('/attempts/:id', route(req => service.reconcile(req.params.id, req.user, req.schoolId)));
router.get('/attempts', checkRole(['SchoolAdmin', 'SuperAdmin']), route(async req => ({ attempts: await prisma.paymentAttempt.findMany({
  where: { schoolId: req.schoolId, provider: { in: ['esewa', 'khalti', 'razorpay'] } },
  select: { id: true, provider: true, status: true, amountMinor: true, currency: true, createdAt: true, payment: { select: { status: true, student: { select: { name: true } }, fee: { select: { name: true } } } } },
  orderBy: { createdAt: 'desc' }, take: 100,
}) })));
module.exports = router;
