const express = require('express');
const Stripe = require('stripe');
const prisma = require('../prismaClient');
const { verifyToken, checkRole } = require('../middleware/authMiddleware');
const { resolveTenant } = require('../middleware/tenantMiddleware');
const { createPaymentService, PaymentError, appUrl, CURRENCY_DIGITS } = require('../services/paymentService');

let stripeClient;
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY || !/^sk_(test|live)_/.test(process.env.STRIPE_SECRET_KEY)) throw new PaymentError(503, 'Online payments have not been configured');
  if (!stripeClient) stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2, timeout: 20000 });
  return stripeClient;
}
function errorResponse(res, error) {
  if (!error.status) console.error('[payments]', error.code || error.type || error.name);
  return res.status(error.status || 502).json({ error: error.status ? error.message : 'Payment provider request failed. Please retry or contact the school.' });
}

function createRouter({ db = prisma, stripe = getStripe, authenticate = verifyToken, tenant = resolveTenant } = {}) {
  const router = express.Router();
  const service = createPaymentService(db, stripe);
  const admin = checkRole(['SchoolAdmin', 'SuperAdmin']);

  const webhookHandler = async (req, res) => {
    if (!process.env.STRIPE_WEBHOOK_SECRET) return res.status(503).json({ error: 'Payment webhook is not configured' });
    if (!Buffer.isBuffer(req.body) || typeof req.headers['stripe-signature'] !== 'string') return res.status(400).json({ error: 'A raw signed webhook is required' });
    let event;
    try { event = stripe().webhooks.constructEvent(req.body, req.headers['stripe-signature'], process.env.STRIPE_WEBHOOK_SECRET); }
    catch { return res.status(400).json({ error: 'Invalid webhook signature' }); }
    try { await service.handleEvent(event); return res.json({ received: true }); }
    catch (error) {
      console.error('[payments] Webhook could not be persisted:', error.code || error.message);
      return res.status(500).json({ error: 'Webhook processing failed; retry required' });
    }
  };
  router.webhookHandler = webhookHandler;
  router.post('/webhook', express.raw({ type: 'application/json', limit: '1mb' }), webhookHandler);
  router.use(authenticate, tenant);

  router.post('/create-checkout-session', async (req, res) => {
    try { res.json(await service.checkout(req.user, req.schoolId, req.body || {})); }
    catch (error) { errorResponse(res, error); }
  });

  router.get('/checkout-session/:id', async (req, res) => {
    try {
      const student = await service.studentForUser(req.user, req.schoolId);
      const attempt = await db.paymentAttempt.findFirst({ where: { stripeSessionId: req.params.id, schoolId: req.schoolId, studentId: student.id } });
      if (!attempt) throw new PaymentError(404, 'Checkout session not found');
      const session = await stripe().checkout.sessions.retrieve(attempt.stripeSessionId, {}, { stripeAccount: attempt.stripeAccountId });
      const payment = await service.reconcileSession(session, attempt.stripeAccountId);
      res.json({ status: session.status, paymentStatus: session.payment_status, payment });
    } catch (error) { errorResponse(res, error); }
  });

  router.get('/connect', admin, async (req, res) => {
    try {
      let school = await db.school.findUnique({ where: { id: req.schoolId } });
      if (!school) throw new PaymentError(404, 'School not found');
      let account;
      if (school.stripeAccountId && process.env.STRIPE_SECRET_KEY) {
        account = await stripe().accounts.retrieve(school.stripeAccountId);
        await service.updateAccount(account);
        school = await db.school.findUnique({ where: { id: req.schoolId } });
      }
      res.json({
        configured: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET && process.env.APP_URL),
        accountId: school.stripeAccountId, currency: school.paymentCurrency,
        chargesEnabled: school.stripeChargesEnabled, payoutsEnabled: school.stripePayoutsEnabled, detailsSubmitted: school.stripeDetailsSubmitted,
        country: account?.country || school.paymentCountry || null, requirements: account?.requirements?.currently_due || [],
        currencies: Object.keys(CURRENCY_DIGITS),
      });
    } catch (error) { errorResponse(res, error); }
  });

  router.post('/connect/onboard', admin, async (req, res) => {
    try {
      let school = await db.school.findUnique({ where: { id: req.schoolId } });
      if (!school?.isActive) throw new PaymentError(404, 'Active school not found');
      const client = stripe();
      const returnUrl = appUrl('/admin?payment_setup=returned');
      const refreshUrl = appUrl('/admin?payment_setup=refresh');
      if (!school.stripeAccountId) {
        const country = typeof req.body.country === 'string' ? req.body.country.toUpperCase() : school.paymentCountry || '';
        if (!/^[A-Z]{2}$/.test(country)) throw new PaymentError(400, 'Select the school’s two-letter country code');
        if (school.paymentCountry && school.paymentCountry !== country) throw new PaymentError(409, 'Onboarding country must match the school’s payment settings');
        const account = await client.accounts.create({
          type: 'express', country, ...(school.email ? { email: school.email } : {}),
          business_profile: { name: school.name }, capabilities: { card_payments: { requested: true }, transfers: { requested: true } },
          metadata: { schoolId: school.id },
        }, { idempotencyKey: `school-connect-${school.id}-${country}` });
        school = await db.school.update({ where: { id: school.id }, data: { stripeAccountId: account.id, paymentCountry: country } });
        await service.updateAccount(account);
      }
      const link = await client.accountLinks.create({ account: school.stripeAccountId, type: 'account_onboarding', return_url: returnUrl, refresh_url: refreshUrl });
      res.json({ url: link.url });
    } catch (error) { errorResponse(res, error); }
  });

  router.post('/connect/dashboard', admin, async (req, res) => {
    try {
      const school = await db.school.findUnique({ where: { id: req.schoolId } });
      if (!school?.stripeAccountId) throw new PaymentError(409, 'Connect the school’s Stripe account first');
      const link = await stripe().accounts.createLoginLink(school.stripeAccountId);
      res.json({ url: link.url });
    } catch (error) { errorResponse(res, error); }
  });

  router.post('/payments/:id/refund', admin, async (req, res) => {
    try {
      const payment = await db.feePayment.findFirst({ where: { id: req.params.id, schoolId: req.schoolId }, include: { attempts: true } });
      if (!payment) throw new PaymentError(404, 'Payment not found');
      const attempt = payment.attempts.find(a => a.stripePaymentIntentId === payment.stripePaymentIntentId && a.status === 'Succeeded');
      if (payment.method !== 'Stripe' || !attempt || !payment.stripePaymentIntentId) throw new PaymentError(409, 'Only verified Stripe payments can be refunded online');
      if (payment.status === 'Refunded') return res.json({ payment });
      if (!['Paid', 'RefundPending'].includes(payment.status)) throw new PaymentError(409, 'Manage partial refunds in the school’s Stripe dashboard');
      const client = stripe();
      if (payment.stripeRefundId) {
        const refund = await client.refunds.retrieve(payment.stripeRefundId, {}, { stripeAccount: attempt.stripeAccountId });
        return res.json({ payment, refundStatus: refund.status });
      }
      await db.feePayment.updateMany({ where: { id: payment.id, status: 'Paid' }, data: { status: 'RefundPending' } });
      const refund = await client.refunds.create({ payment_intent: payment.stripePaymentIntentId, reason: 'requested_by_customer' }, { stripeAccount: attempt.stripeAccountId, idempotencyKey: `school-refund-${payment.id}` });
      const updated = await db.feePayment.update({ where: { id: payment.id }, data: {
        stripeRefundId: refund.id,
        ...(refund.status === 'succeeded' ? { status: 'Refunded', refundedAmountMinor: refund.amount } : {}),
        ...(['failed', 'canceled'].includes(refund.status) ? { status: 'Paid' } : {}),
      } });
      res.json({ payment: updated, refundStatus: refund.status });
    } catch (error) { errorResponse(res, error); }
  });
  return router;
}

module.exports = createRouter();
module.exports.createRouter = createRouter;
