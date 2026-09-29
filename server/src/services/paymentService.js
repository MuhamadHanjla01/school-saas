const { randomUUID } = require('node:crypto');

class PaymentError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

// Deliberately supported, unambiguous Stripe presentment currencies. Others can
// be added once their minor-unit rules and country availability are verified.
const CURRENCY_DIGITS = Object.freeze({
  usd: 2, eur: 2, gbp: 2, inr: 2, npr: 2, aud: 2, cad: 2, nzd: 2, sgd: 2,
  hkd: 2, aed: 2, chf: 2, myr: 2, thb: 2, php: 2, zar: 2, brl: 2,
  mxn: 2, pln: 2, sek: 2, nok: 2, dkk: 2, jpy: 0, krw: 0, vnd: 0,
});
function currencyCode(value) {
  const code = typeof value === 'string' ? value.toLowerCase() : '';
  if (!Object.hasOwn(CURRENCY_DIGITS, code)) throw new PaymentError(400, 'Unsupported payment currency');
  return code;
}
function toMinorUnits(value, currency) {
  const code = currencyCode(currency);
  if ((typeof value !== 'string' && typeof value !== 'number') || value === '') throw new PaymentError(400, 'Amount must be a positive number');
  const number = Number(value);
  const scaled = number * (10 ** CURRENCY_DIGITS[code]);
  const minor = Math.round(scaled);
  if (!Number.isFinite(number) || minor <= 0 || minor > 99999999 || Math.abs(scaled - minor) > 0.000001) {
    throw new PaymentError(400, `Invalid amount or precision for ${code.toUpperCase()}`);
  }
  return minor;
}
function fromMinorUnits(value, currency) { return value / (10 ** CURRENCY_DIGITS[currencyCode(currency)]); }
function formatMoney(value, currency) { return new Intl.NumberFormat('en', { style: 'currency', currency: currencyCode(currency).toUpperCase() }).format(value); }
function appUrl(pathname) {
  let base;
  try { base = new URL(process.env.APP_URL); } catch { throw new PaymentError(503, 'Payment return URL is not configured'); }
  if (base.username || base.password || (base.protocol !== 'https:' && !(process.env.NODE_ENV !== 'production' && base.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(base.hostname)))) {
    throw new PaymentError(503, 'Payment return URL must use HTTPS');
  }
  return new URL(pathname, base.origin).toString();
}
function stripeId(object) { return typeof object === 'string' ? object : object?.id; }
function displayStatus(payment, fee) {
  if (!payment || ['Pending', 'Overdue'].includes(payment.status)) return new Date(fee.dueDate) < new Date() ? 'Overdue' : 'Pending';
  return payment.status;
}

function createPaymentService(prisma, getStripe) {
  async function studentForUser(user, schoolId) {
    if (user?.role !== 'Student') throw new PaymentError(403, 'Only students can start fee checkout');
    const profile = await prisma.user.findFirst({ where: { id: user.userId, schoolId, role: 'Student' }, include: { student: true } });
    if (!profile?.student || profile.student.schoolId !== schoolId || profile.student.status !== 'Active') throw new PaymentError(403, 'An active student profile in this school is required');
    return profile.student;
  }

  async function assertEntitlement(db, studentId, feeId, schoolId) {
    if (typeof studentId !== 'string' || typeof feeId !== 'string') throw new PaymentError(400, 'Student and fee are required');
    const [student, fee] = await Promise.all([
      db.student.findFirst({ where: { id: studentId, schoolId } }),
      db.fee.findFirst({ where: { id: feeId, schoolId } }),
    ]);
    if (!student || !fee) throw new PaymentError(404, 'Student or fee not found in this school');
    if (!student.classId || student.classId !== fee.classId) throw new PaymentError(403, 'This fee does not belong to the student’s class');
    return { student, fee };
  }

  async function reconcileSession(session, accountId, eventType) {
    const metadata = session.metadata || {};
    if (!metadata.attemptId) return null;
    return prisma.$transaction(async (tx) => {
      const attempt = await tx.paymentAttempt.findUnique({ where: { id: metadata.attemptId }, include: { payment: true } });
      if (!attempt) throw new PaymentError(409, 'Unknown payment attempt');
      if (attempt.provider !== 'Stripe') throw new PaymentError(409, 'Payment provider mismatch');
      const [school, fee, student] = await Promise.all([
        tx.school.findUnique({ where: { id: attempt.schoolId } }),
        tx.fee.findUnique({ where: { id: attempt.feeId } }),
        tx.student.findUnique({ where: { id: attempt.studentId } }),
      ]);
      if (!school || !fee || !student || fee.schoolId !== attempt.schoolId || student.schoolId !== attempt.schoolId ||
          attempt.payment.schoolId !== attempt.schoolId || attempt.payment.studentId !== attempt.studentId || attempt.payment.feeId !== attempt.feeId ||
          accountId !== attempt.stripeAccountId || school.stripeAccountId !== accountId ||
          metadata.schoolId !== attempt.schoolId || metadata.studentId !== attempt.studentId || metadata.feeId !== attempt.feeId ||
          (attempt.stripeSessionId && session.id !== attempt.stripeSessionId) || session.mode !== 'payment' ||
          session.amount_total !== attempt.amountMinor || session.currency !== attempt.currency) {
        throw new PaymentError(409, 'Payment account, owner, amount or currency mismatch');
      }
      const intentId = stripeId(session.payment_intent);
      if (attempt.stripePaymentIntentId && intentId && attempt.stripePaymentIntentId !== intentId) throw new PaymentError(409, 'Payment intent mismatch');
      const shared = { stripeSessionId: session.id, ...(intentId ? { stripePaymentIntentId: intentId } : {}) };
      if (session.payment_status === 'paid' && session.status === 'complete') {
        if (!intentId) throw new PaymentError(409, 'Paid session is missing a payment intent');
        if (attempt.status === 'Succeeded') return attempt.payment;
        if (attempt.payment.stripePaymentIntentId && attempt.payment.stripePaymentIntentId !== intentId || attempt.payment.status === 'Paid' && !attempt.payment.stripePaymentIntentId) {
          throw new PaymentError(409, 'Fee is already settled by another payment');
        }
        const payment = await tx.feePayment.update({ where: { id: attempt.paymentId }, data: {
          status: 'Paid', amount: fromMinorUnits(attempt.amountMinor, attempt.currency), currency: attempt.currency,
          paidDate: new Date(), method: 'Stripe', stripePaymentIntentId: intentId,
        } });
        await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { ...shared, status: 'Succeeded', activeKey: null } });
        return payment;
      }
      // A delayed/unpaid checkout completion must never mark an invoice paid.
      if (attempt.status === 'Succeeded') return attempt.payment;
      if (eventType === 'checkout.session.async_payment_failed' || session.status === 'expired') {
        await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { ...shared, status: session.status === 'expired' ? 'Expired' : 'Failed', activeKey: null } });
      } else if (session.status === 'complete') {
        await tx.paymentAttempt.update({ where: { id: attempt.id }, data: { ...shared, status: 'Processing' } });
      }
      return attempt.payment;
    });
  }

  async function checkout(user, schoolId, body) {
    const student = await studentForUser(user, schoolId);
    // Legacy clients may still send their identity; it can never override auth.
    if (body.studentId && body.studentId !== student.id || body.schoolId && body.schoolId !== schoolId) throw new PaymentError(403, 'Payment identity does not match the signed-in student');
    const { fee } = await assertEntitlement(prisma, student.id, body.feeId, schoolId);
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school?.isActive || !school.stripeAccountId) throw new PaymentError(409, 'This school has not connected its payment account');
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new PaymentError(503, 'Payment webhook is not configured');
    const stripe = getStripe();
    const account = await stripe.accounts.retrieve(school.stripeAccountId);
    await updateAccount(account);
    if (!account.charges_enabled || !account.payouts_enabled) throw new PaymentError(409, 'The school must complete payment account verification before accepting payments');
    const amountMinor = toMinorUnits(fee.amount, fee.currency);
    const successUrl = appUrl('/student?payment=success&session_id={CHECKOUT_SESSION_ID}').replace('%7BCHECKOUT_SESSION_ID%7D', '{CHECKOUT_SESSION_ID}');
    const cancelUrl = appUrl('/student?payment=cancelled');

    const reserve = () => prisma.$transaction(async (tx) => {
      let payment = await tx.feePayment.findUnique({ where: { studentId_feeId: { studentId: student.id, feeId: fee.id } } });
      if (payment && (payment.schoolId !== schoolId || payment.currency !== fee.currency)) throw new PaymentError(409, 'Existing invoice does not match this school or currency');
      if (payment && !['Pending', 'Overdue'].includes(payment.status)) throw new PaymentError(409, 'This invoice has already been settled; contact the school for adjustments');
      if (!payment) payment = await tx.feePayment.create({ data: { studentId: student.id, feeId: fee.id, schoolId, amount: fee.amount, currency: fee.currency } });
      let attempt = await tx.paymentAttempt.findUnique({ where: { activeKey: payment.id } });
      if (attempt && attempt.provider !== 'Stripe') throw new PaymentError(409, 'A payment with another provider is in progress. Complete or cancel that payment first.');
      if (!attempt) attempt = await tx.paymentAttempt.create({ data: {
        id: randomUUID(), paymentId: payment.id, activeKey: payment.id, schoolId, studentId: student.id, feeId: fee.id,
        stripeAccountId: school.stripeAccountId, amountMinor, currency: fee.currency, expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      } });
      return attempt;
    });
    let attempt;
    try { attempt = await reserve(); } catch (error) {
      if (['P2002', 'P2034', 'P1008'].includes(error.code)) throw new PaymentError(409, 'Another checkout request is in progress. Please retry.');
      throw error;
    }
    if (attempt.stripeSessionId) {
      const session = await stripe.checkout.sessions.retrieve(attempt.stripeSessionId, {}, { stripeAccount: attempt.stripeAccountId });
      await reconcileSession(session, attempt.stripeAccountId);
      if (session.status === 'open') return { id: session.id, url: session.url };
      if (session.status !== 'expired') throw new PaymentError(409, session.payment_status === 'paid' ? 'This fee is already paid' : 'Payment is processing. Please wait for confirmation.');
      attempt = await reserve();
    }
    // Replaying an unknown request after Stripe's idempotency retention can
    // create a second charge. Preserve the lock and require reconciliation.
    if (new Date(attempt.expiresAt) <= new Date()) throw new PaymentError(409, 'Checkout needs reconciliation. Contact the school before retrying.');
    const metadata = { attemptId: attempt.id, feeId: fee.id, studentId: student.id, schoolId };
    const session = await stripe.checkout.sessions.create({
      mode: 'payment', client_reference_id: attempt.id,
      line_items: [{ price_data: { currency: attempt.currency, product_data: { name: fee.name }, unit_amount: attempt.amountMinor }, quantity: 1 }],
      success_url: successUrl, cancel_url: cancelUrl, expires_at: Math.floor(new Date(attempt.expiresAt).getTime() / 1000),
      metadata, payment_intent_data: { metadata },
      // Checkout dynamically offers methods enabled for the school's account.
    }, { stripeAccount: attempt.stripeAccountId, idempotencyKey: `school-fee-${attempt.id}` });
    await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { stripeSessionId: session.id, checkoutUrl: session.url } });
    return { id: session.id, url: session.url };
  }

  async function updateAccount(account) {
    if (!account?.id) return;
    await prisma.school.updateMany({ where: { stripeAccountId: account.id }, data: {
      stripeChargesEnabled: Boolean(account.charges_enabled), stripePayoutsEnabled: Boolean(account.payouts_enabled), stripeDetailsSubmitted: Boolean(account.details_submitted),
    } });
  }

  async function reconcileRefund(charge, accountId) {
    const intentId = stripeId(charge.payment_intent);
    if (!intentId) return;
    const attempt = await prisma.paymentAttempt.findUnique({ where: { stripePaymentIntentId: intentId } });
    if (!attempt) return;
    if (attempt.stripeAccountId !== accountId || charge.amount !== attempt.amountMinor || charge.currency !== attempt.currency || !Number.isInteger(charge.amount_refunded) || charge.amount_refunded < 0 || charge.amount_refunded > attempt.amountMinor) throw new PaymentError(409, 'Refund account or amount mismatch');
    const amount = charge.amount_refunded;
    if (!amount) return;
    // Compare-and-set prevents older partial-refund events rolling back totals.
    await prisma.feePayment.updateMany({ where: { id: attempt.paymentId, schoolId: attempt.schoolId, stripePaymentIntentId: intentId, refundedAmountMinor: { lte: amount } }, data: {
      refundedAmountMinor: amount, status: amount === attempt.amountMinor ? 'Refunded' : 'PartiallyRefunded',
    } });
  }

  async function handleEvent(event) {
    if (typeof event?.id !== 'string' || !event.data?.object) throw new PaymentError(400, 'Invalid webhook event');
    if (await prisma.stripeEvent.findUnique({ where: { id: event.id } })) return;
    const object = event.data.object;
    if (event.type === 'account.updated') {
      if (event.account && event.account !== object.id) throw new PaymentError(400, 'Connected account mismatch');
      await updateAccount(object);
    } else if (['checkout.session.completed', 'checkout.session.async_payment_succeeded', 'checkout.session.async_payment_failed', 'checkout.session.expired'].includes(event.type)) {
      await reconcileSession(object, event.account, event.type);
    } else if (event.type === 'charge.refunded') {
      await reconcileRefund(object, event.account);
    } else if (event.type === 'refund.updated' || event.type === 'refund.failed') {
      const payment = await prisma.feePayment.findFirst({ where: { stripeRefundId: object.id }, include: { attempts: true } });
      if (payment) {
        const attempt = payment.attempts.find(a => a.stripePaymentIntentId === payment.stripePaymentIntentId);
        if (!attempt || event.account !== attempt.stripeAccountId) throw new PaymentError(409, 'Refund account mismatch');
        if (['failed', 'canceled'].includes(object.status) && payment.status === 'RefundPending') await prisma.feePayment.update({ where: { id: payment.id }, data: { status: 'Paid' } });
        if (object.status === 'succeeded') await prisma.feePayment.updateMany({ where: { id: payment.id, refundedAmountMinor: { lt: object.amount } }, data: { status: object.amount === attempt.amountMinor ? 'Refunded' : 'PartiallyRefunded', refundedAmountMinor: object.amount } });
      }
    }
    // Persist only after successful durable handling; DB failures return non-2xx
    // so Stripe retries. The handlers themselves are safe to replay after a crash.
    try { await prisma.stripeEvent.create({ data: { id: event.id, accountId: event.account || '', type: event.type } }); }
    catch (error) { if (error.code !== 'P2002') throw error; }
  }
  return { checkout, studentForUser, assertEntitlement, reconcileSession, reconcileRefund, handleEvent, updateAccount };
}

module.exports = { createPaymentService, PaymentError, currencyCode, toMinorUnits, fromMinorUnits, formatMoney, displayStatus, appUrl, CURRENCY_DIGITS };
