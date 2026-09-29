const { randomUUID } = require('node:crypto');
const { createHmac } = require('node:crypto');
const { createPaymentService, PaymentError, toMinorUnits, fromMinorUnits, appUrl } = require('./paymentService');

// Each entry belongs to one school; credentials never come from an HTTP request.
function providerConfig(schoolId) {
  let schools;
  try { schools = JSON.parse(process.env.SCHOOL_PAYMENT_PROVIDERS || '{}'); }
  catch { throw new PaymentError(503, 'School payment configuration is invalid'); }
  if (!schools || Array.isArray(schools) || typeof schools !== 'object') throw new PaymentError(503, 'School payment configuration is invalid');
  const config = schools[schoolId] || {};
  const identities = new Set();
  for (const school of Object.values(schools)) {
    for (const [provider, key] of [['razorpay', 'keyId'], ['esewa', 'productCode'], ['khalti', 'secretKey']]) {
      const settings = school?.[provider];
      if (!settings) continue;
      if (!['test', 'live'].includes(settings.mode)) throw new PaymentError(503, 'Each gateway requires an explicit test or live mode');
      const identity = `${provider}:${settings[key]}`;
      if (!settings[key] || identities.has(identity)) throw new PaymentError(503, 'Every school must have its own merchant credentials');
      identities.add(identity);
    }
  }
  return config;
}

function regionalMethods(config) {
  const methods = [];
  if (config.country === 'IN' && config.currency === 'inr' && config.razorpay?.keyId && config.razorpay?.keySecret) methods.push({ id: 'razorpay', label: 'UPI, cards and bank payments (Razorpay)', country: 'IN', currency: 'inr' });
  if (config.country === 'NP' && config.currency === 'npr') {
    if (config.esewa?.productCode && config.esewa?.secretKey) methods.push({ id: 'esewa', label: 'eSewa', country: 'NP', currency: 'npr' });
    if (config.khalti?.secretKey) methods.push({ id: 'khalti', label: 'Khalti', country: 'NP', currency: 'npr' });
  }
  return methods;
}
function merchantRef(provider, config) {
  const settings = config[provider];
  // Stable fingerprint also binds Khalti attempts to the original merchant key.
  return createHmac('sha256', 'school-payment-merchant').update(`${provider}:${settings.mode}:${settings.keyId || settings.productCode || settings.secretKey}`).digest('hex');
}
async function requestJson(url, options = {}) {
  const response = await fetch(url, { ...options, signal: AbortSignal.timeout(15000), redirect: 'error' });
  if (!response.ok) throw new PaymentError(502, 'The payment provider could not process the request. Try checking payment status.');
  return response.json();
}
function ensureHostedUrl(value, hosts) {
  let url;
  try { url = new URL(value); } catch { throw new PaymentError(502, 'The provider returned an invalid checkout URL'); }
  if (url.protocol !== 'https:' || url.username || url.password || !hosts.includes(url.hostname)) throw new PaymentError(502, 'The provider returned an invalid checkout URL');
  return url.href;
}
function esewaForm(attempt, config) {
  const settings = config.esewa;
  const total = fromMinorUnits(attempt.amountMinor, attempt.currency).toFixed(2);
  const fields = {
    amount: total, tax_amount: '0', total_amount: total, transaction_uuid: attempt.id,
    product_code: settings.productCode, product_service_charge: '0', product_delivery_charge: '0',
    success_url: appUrl(`/student?regional_attempt=${attempt.id}`),
    failure_url: appUrl(`/student?regional_attempt=${attempt.id}`),
    signed_field_names: 'total_amount,transaction_uuid,product_code',
  };
  fields.signature = createHmac('sha256', settings.secretKey).update(`total_amount=${total},transaction_uuid=${attempt.id},product_code=${settings.productCode}`).digest('base64');
  return { action: `https://${settings.mode === 'live' ? 'epay' : 'rc-epay'}.esewa.com.np/api/epay/main/v2/form`, fields };
}

function createRegionalPaymentService(prisma, http = requestJson) {
  const entitlement = createPaymentService(prisma, () => { throw new Error('Stripe is not used by this service'); });
  const headersFor = (provider, config) => ({ 'Content-Type': 'application/json', Authorization: provider === 'razorpay'
    ? `Basic ${Buffer.from(`${config.razorpay.keyId}:${config.razorpay.keySecret}`).toString('base64')}`
    : `Key ${config.khalti.secretKey}` });
  const khaltiBase = config => `https://${config.khalti.mode === 'live' ? 'khalti.com' : 'dev.khalti.com'}/api/v2/epayment`;

  async function methods(schoolId) {
    const config = providerConfig(schoolId);
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school?.isActive) throw new PaymentError(403, 'School is not active');
    const available = regionalMethods(config);
    if (school.stripeAccountId && school.stripeChargesEnabled && school.stripePayoutsEnabled && process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) available.push({ id: 'stripe', label: 'Cards and local payment methods (Stripe)', country: school.paymentCountry, currency: school.paymentCurrency });
    return { methods: available, country: config.country || school.paymentCountry, currency: config.currency || school.paymentCurrency };
  }

  async function checkout(user, schoolId, body) {
    if (!body || Object.keys(body).some(key => !['feeId', 'provider'].includes(key))) throw new PaymentError(400, 'Send only feeId and provider');
    const student = await entitlement.studentForUser(user, schoolId);
    const { fee } = await entitlement.assertEntitlement(prisma, student.id, body.feeId, schoolId);
    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school?.isActive) throw new PaymentError(403, 'School is not active');
    const config = providerConfig(schoolId);
    if (!regionalMethods(config).some(method => method.id === body.provider && method.currency === fee.currency)) throw new PaymentError(409, 'This payment method is not configured for the school and fee currency');
    appUrl('/student'); // Validate return destination before reserving or creating anything.
    const amountMinor = toMinorUnits(fee.amount, fee.currency);
    let attempt = await prisma.$transaction(async tx => {
      let payment = await tx.feePayment.findUnique({ where: { studentId_feeId: { studentId: student.id, feeId: fee.id } } });
      if (payment && (payment.schoolId !== schoolId || payment.currency !== fee.currency)) throw new PaymentError(409, 'Invoice school or currency mismatch');
      if (payment && !['Pending', 'Overdue'].includes(payment.status)) throw new PaymentError(409, 'This fee is already settled or being adjusted');
      if (!payment) payment = await tx.feePayment.create({ data: { studentId: student.id, feeId: fee.id, schoolId, amount: fee.amount, currency: fee.currency } });
      let reserved = await tx.paymentAttempt.findUnique({ where: { activeKey: payment.id } });
      if (!reserved) reserved = await tx.paymentAttempt.create({ data: {
        id: randomUUID(), paymentId: payment.id, activeKey: payment.id, schoolId, studentId: student.id, feeId: fee.id,
        provider: body.provider, merchantRef: merchantRef(body.provider, config), amountMinor, currency: fee.currency,
        status: 'Created', expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      } });
      return reserved;
    });
    if (attempt.provider !== body.provider) throw new PaymentError(409, 'A checkout with another provider is still active. Check its status before retrying.');
    if (attempt.merchantRef !== merchantRef(attempt.provider, config) || attempt.amountMinor !== amountMinor || attempt.currency !== fee.currency) throw new PaymentError(409, 'Payment configuration or fee changed; reconcile the existing attempt first');
    if (attempt.providerSessionId || attempt.checkoutPayload) {
      await reconcile(attempt.id, user, schoolId);
      attempt = await prisma.paymentAttempt.findUnique({ where: { id: attempt.id } });
      if (['Succeeded', 'Failed', 'Expired', 'Refunded'].includes(attempt.status)) throw new PaymentError(409, 'This checkout has finished. Refresh your fees.');
      return { attemptId: attempt.id, url: attempt.checkoutUrl, ...(attempt.checkoutPayload ? { form: JSON.parse(attempt.checkoutPayload) } : {}) };
    }
    const claimed = await prisma.paymentAttempt.updateMany({ where: { id: attempt.id, status: 'Created' }, data: { status: 'Initializing' } });
    if (!claimed.count) throw new PaymentError(409, 'Checkout is being created or awaiting provider reconciliation. Do not pay again.');
    try {
      let sessionId, url, form;
      const returnUrl = appUrl(`/student?regional_attempt=${attempt.id}`);
      if (attempt.provider === 'esewa') {
        form = esewaForm(attempt, config);
        sessionId = attempt.id;
      } else if (attempt.provider === 'khalti') {
        const session = await http(`${khaltiBase(config)}/initiate/`, { method: 'POST', headers: headersFor('khalti', config), body: JSON.stringify({
          return_url: returnUrl, website_url: appUrl('/'), amount: attempt.amountMinor,
          purchase_order_id: attempt.id, purchase_order_name: fee.name,
        }) });
        if (typeof session.pidx !== 'string') throw new PaymentError(502, 'Invalid Khalti payment identifier');
        sessionId = session.pidx;
        url = ensureHostedUrl(session.payment_url, ['pay.khalti.com', 'test-pay.khalti.com']);
      } else {
        const session = await http('https://api.razorpay.com/v1/payment_links/', { method: 'POST', headers: headersFor('razorpay', config), body: JSON.stringify({
          amount: attempt.amountMinor, currency: attempt.currency.toUpperCase(), accept_partial: false,
          reference_id: attempt.id, description: fee.name, expire_by: Math.floor(attempt.expiresAt.getTime() / 1000),
          notify: { sms: false, email: false }, reminder_enable: false, callback_url: returnUrl, callback_method: 'get',
        }) });
        if (typeof session.id !== 'string') throw new PaymentError(502, 'Invalid Razorpay payment identifier');
        sessionId = session.id;
        url = ensureHostedUrl(session.short_url, ['rzp.io', 'rzp.to', 'razorpay.com']);
      }
      await prisma.paymentAttempt.update({ where: { id: attempt.id }, data: { status: 'Open', providerSessionId: sessionId, checkoutUrl: url || null, checkoutPayload: form ? JSON.stringify(form) : null } });
      return { attemptId: attempt.id, ...(url ? { url } : {}), ...(form ? { form } : {}) };
    } catch (error) {
      // A timeout can follow a successful remote creation. Never release this lock
      // and blindly create a second bill. Reconciliation must resolve it first.
      await prisma.paymentAttempt.updateMany({ where: { id: attempt.id, status: 'Initializing' }, data: { status: 'Indeterminate' } });
      throw error;
    }
  }

  async function reconcile(id, user, schoolId) {
    const where = { id, schoolId };
    if (user.role === 'Student') where.studentId = (await entitlement.studentForUser(user, schoolId)).id;
    else if (!['SchoolAdmin', 'SuperAdmin'].includes(user.role)) throw new PaymentError(403, 'Access denied');
    const attempt = await prisma.paymentAttempt.findFirst({ where, include: { payment: true } });
    if (!attempt || !['razorpay', 'esewa', 'khalti'].includes(attempt.provider)) throw new PaymentError(404, 'Payment attempt not found');
    const config = providerConfig(schoolId);
    if (!regionalMethods(config).some(method => method.id === attempt.provider) || merchantRef(attempt.provider, config) !== attempt.merchantRef) throw new PaymentError(409, 'Original merchant configuration is required to reconcile this payment');
    if (!attempt.providerSessionId) {
      // Razorpay enforces unique reference_id; recover unknown creation results.
      if (attempt.provider === 'razorpay' && attempt.status === 'Indeterminate') {
        const found = await http(`https://api.razorpay.com/v1/payment_links/?reference_id=${encodeURIComponent(attempt.id)}`, { headers: headersFor('razorpay', config) });
        const matching = (found.payment_links || []).filter(link => link.reference_id === attempt.id);
        if (matching.length === 1) {
          await prisma.paymentAttempt.update({ where: { id }, data: { providerSessionId: matching[0].id, checkoutUrl: ensureHostedUrl(matching[0].short_url, ['rzp.io', 'rzp.to', 'razorpay.com']) } });
          return reconcile(id, user, schoolId);
        }
      }
      return { attemptId: id, status: attempt.status, paymentStatus: attempt.payment.status, requiresReview: true };
    }
    let paid = false, terminal = false, refunded = false;
    if (attempt.provider === 'khalti') {
      const result = await http(`${khaltiBase(config)}/lookup/`, { method: 'POST', headers: headersFor('khalti', config), body: JSON.stringify({ pidx: attempt.providerSessionId }) });
      if (result.pidx !== attempt.providerSessionId || Number(result.total_amount) !== attempt.amountMinor) throw new PaymentError(409, 'Khalti reference or amount mismatch');
      paid = result.status === 'Completed' && !!result.transaction_id && !result.refunded;
      refunded = result.status === 'Refunded';
      terminal = ['Expired', 'User canceled'].includes(result.status);
    } else if (attempt.provider === 'esewa') {
      const query = new URLSearchParams({ product_code: config.esewa.productCode, total_amount: fromMinorUnits(attempt.amountMinor, attempt.currency).toFixed(2), transaction_uuid: attempt.id });
      const result = await http(`https://${config.esewa.mode === 'live' ? 'epay' : 'uat'}.esewa.com.np/api/epay/transaction/status/?${query}`);
      if (result.pid !== attempt.id || result.scd !== config.esewa.productCode || toMinorUnits(result.totalAmount, attempt.currency) !== attempt.amountMinor) throw new PaymentError(409, 'eSewa reference, merchant or amount mismatch');
      paid = result.status === 'COMPLETE' && !!result.refId;
      refunded = result.status === 'FULL_REFUND';
      // NOT_FOUND is not terminal: the browser may not have submitted the form yet.
      terminal = result.status === 'CANCELED';
    } else {
      const result = await http(`https://api.razorpay.com/v1/payment_links/${encodeURIComponent(attempt.providerSessionId)}`, { headers: headersFor('razorpay', config) });
      if (result.id !== attempt.providerSessionId || result.reference_id !== attempt.id || result.amount !== attempt.amountMinor || result.currency?.toLowerCase() !== attempt.currency) throw new PaymentError(409, 'Razorpay reference, amount or currency mismatch');
      const captured = (result.payments || []).filter(payment => payment.status === 'captured');
      paid = result.status === 'paid' && result.amount_paid === attempt.amountMinor && captured.reduce((sum, payment) => sum + payment.amount, 0) === attempt.amountMinor;
      if (paid) {
        let refunds = 0;
        for (const payment of captured) {
          const details = await http(`https://api.razorpay.com/v1/payments/${encodeURIComponent(payment.payment_id)}`, { headers: headersFor('razorpay', config) });
          if (details.id !== payment.payment_id || details.amount !== payment.amount || details.currency?.toLowerCase() !== attempt.currency || !['captured', 'refunded'].includes(details.status)) throw new PaymentError(409, 'Razorpay payment details mismatch');
          refunds += Number(details.amount_refunded || 0);
        }
        refunded = refunds === attempt.amountMinor;
        // Partial refunds must be reviewed; never claim the full amount is retained.
        if (refunds > 0 && !refunded) {
          await prisma.feePayment.update({ where: { id: attempt.paymentId }, data: { status: 'PartiallyRefunded', refundedAmountMinor: refunds } });
          return { attemptId: id, status: 'PartiallyRefunded', paymentStatus: 'PartiallyRefunded' };
        }
      }
      terminal = ['expired', 'cancelled'].includes(result.status);
    }
    return prisma.$transaction(async tx => {
      const current = await tx.paymentAttempt.findUnique({ where: { id }, include: { payment: true } });
      if (current.payment.schoolId !== schoolId || current.payment.studentId !== current.studentId || current.payment.feeId !== current.feeId) throw new PaymentError(409, 'Invoice ownership mismatch');
      if (refunded) {
        await tx.feePayment.update({ where: { id: current.paymentId }, data: { status: 'Refunded', refundedAmountMinor: current.amountMinor } });
        await tx.paymentAttempt.update({ where: { id }, data: { status: 'Refunded', activeKey: null } });
        return { attemptId: id, status: 'Refunded', paymentStatus: 'Refunded' };
      }
      if (paid) {
        if (['Refunded', 'PartiallyRefunded'].includes(current.payment.status)) return { attemptId: id, status: current.status, paymentStatus: current.payment.status };
        if (current.payment.status === 'Paid' && current.status !== 'Succeeded') throw new PaymentError(409, 'This invoice was settled by another transaction');
        await tx.feePayment.update({ where: { id: current.paymentId }, data: { status: 'Paid', paidDate: current.payment.paidDate || new Date(), method: current.provider, amount: fromMinorUnits(current.amountMinor, current.currency), currency: current.currency } });
        await tx.paymentAttempt.update({ where: { id }, data: { status: 'Succeeded', activeKey: null } });
        return { attemptId: id, status: 'Succeeded', paymentStatus: 'Paid' };
      }
      if (terminal && !['Succeeded', 'Refunded'].includes(current.status)) await tx.paymentAttempt.update({ where: { id }, data: { status: 'Expired', activeKey: null } });
      return { attemptId: id, status: terminal ? 'Expired' : current.status, paymentStatus: current.payment.status };
    });
  }
  return { checkout, reconcile, methods };
}
module.exports = { createRegionalPaymentService, providerConfig, regionalMethods, esewaForm, ensureHostedUrl };
