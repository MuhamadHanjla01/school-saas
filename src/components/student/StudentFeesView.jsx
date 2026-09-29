import { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { checkoutDestination, formatMoney, isConfirmedPayment } from './paymentUtils';

export default function StudentFeesView({ dark, studentId, schoolName }) {
  const location = useLocation();
  const [payments, setPayments] = useState([]);
  const [methods, setMethods] = useState([]);
  const [provider, setProvider] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [checking, setChecking] = useState(false);
  const [paying, setPaying] = useState(null);
  const paymentInFlight = useRef(false);
  const params = new URLSearchParams(location.search);
  const stripeSession = params.get('session_id');
  const regionalAttempt = params.get('regional_attempt');

  const loadFees = useCallback(async () => {
    if (!studentId) return;
    const [fees, available] = await Promise.all([
      axios.get(`/api/fees/student/${encodeURIComponent(studentId)}`),
      axios.get('/api/payments/methods'),
    ]);
    setPayments(fees.data.payments || []);
    const options = available.data.methods || [];
    setMethods(options);
    setProvider(previous => options.some(method => method.id === previous) ? previous : options[0]?.id || '');
  }, [studentId]);

  useEffect(() => {
    if (!studentId) { setLoading(false); return; }
    setLoading(true);
    loadFees().catch(err => setError(err.response?.data?.error || 'Unable to load your fees. Please retry.')).finally(() => setLoading(false));
  }, [studentId, loadFees]);

  const verifyPayment = useCallback(async () => {
    if (!stripeSession && !regionalAttempt) return;
    setChecking(true);
    setError('');
    setNotice('Checking payment with your school’s payment provider...');
    try {
      const endpoint = regionalAttempt
        ? `/api/payments/attempts/${encodeURIComponent(regionalAttempt)}${location.search}`
        : `/api/stripe/checkout-session/${encodeURIComponent(stripeSession)}`;
      const response = await axios.get(endpoint);
      setNotice(isConfirmedPayment(response.data)
        ? 'Payment confirmed. Your school has received the payment record.'
        : 'Payment has not yet been confirmed. If you completed checkout, check again shortly.');
      await loadFees();
    } catch (err) {
      setNotice('');
      setError(err.response?.data?.error || 'Unable to verify payment. Check again before starting another payment.');
    } finally { setChecking(false); }
  }, [stripeSession, regionalAttempt, location.search, loadFees]);

  useEffect(() => {
    if (stripeSession || regionalAttempt) verifyPayment();
    else if (params.get('canceled') || params.get('cancelled') || params.get('payment') === 'cancelled') {
      setNotice('Checkout was cancelled. No payment has been confirmed.');
    }
  }, [verifyPayment, stripeSession, regionalAttempt]);

  const pay = async (feeId) => {
    if (!provider || paymentInFlight.current) return;
    paymentInFlight.current = true;
    setPaying(feeId);
    setError('');
    try {
      const response = provider === 'stripe'
        ? await axios.post('/api/stripe/create-checkout-session', { feeId })
        : await axios.post('/api/payments/checkout', { feeId, provider });
      if (response.data.form) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = checkoutDestination(response.data.form.action);
        for (const [name, value] of Object.entries(response.data.form.fields || {})) {
          const input = document.createElement('input');
          input.type = 'hidden'; input.name = name; input.value = String(value);
          form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
        form.remove();
      } else window.location.assign(checkoutDestination(response.data.url));
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Unable to start checkout. Please try again.');
      setPaying(null);
      paymentInFlight.current = false;
    }
  };

  return <section className="p-5 md:p-6 space-y-4 w-full max-w-[1600px] mx-auto">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold">My Fees</h2><p className="text-sm text-on-surface-variant">Pay fees to {schoolName || 'your school'}.</p></div>
      <button disabled={loading || checking || paying !== null} className="px-4 py-2 rounded-xl border border-outline-variant disabled:opacity-50" onClick={async () => {
        if (stripeSession || regionalAttempt) await verifyPayment();
        else { setLoading(true); setError(''); try { await loadFees(); } catch (err) { setError(err.response?.data?.error || 'Unable to refresh fees.'); } finally { setLoading(false); } }
      }}>{checking ? 'Checking...' : 'Refresh status'}</button>
    </div>
    {error && <p role="alert" className="rounded-xl bg-error/10 text-error p-3">{error}</p>}
    {notice && <p role="status" className="rounded-xl bg-primary/10 p-3">{notice}</p>}
    {loading ? <p role="status">Loading fees...</p> : <>
      {methods.length > 0 ? <label className="flex flex-wrap items-center gap-3 text-sm font-medium">Payment method
        <select value={provider} disabled={paying !== null} onChange={e => setProvider(e.target.value)} className={`rounded-xl border p-3 ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant'}`}>
          {methods.map(method => <option key={method.id} value={method.id}>{method.label} ({method.currency?.toUpperCase()})</option>)}
        </select>
      </label> : <p className="text-sm text-on-surface-variant">Online payments are not available for your school yet. Contact the school office.</p>}
      {payments.length === 0 ? <p className="p-6 text-center">No fee records found.</p> : <div className={`overflow-x-auto rounded-2xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-outline-variant/50'}`}>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b border-outline-variant/30">{['Fee', 'Amount', 'Due date', 'Status', 'Paid date', ''].map((heading, index) => <th className="p-4" key={index}>{heading}</th>)}</tr></thead>
          <tbody>{payments.map(payment => {
            const feeId = payment.feeId || payment.fee?.id;
            const method = methods.find(item => item.id === provider);
            const matchesCurrency = method && method.currency?.toUpperCase() === (payment.currency || payment.fee?.currency || '').toUpperCase();
            return <tr key={payment.id || feeId} className="border-b border-outline-variant/20">
              <td className="p-4 font-semibold">{payment.fee?.name || 'School fee'}</td>
              <td className="p-4">{formatMoney(payment.amount, payment.currency || payment.fee?.currency)}</td>
              <td className="p-4">{payment.fee?.dueDate ? new Date(payment.fee.dueDate).toLocaleDateString() : '—'}</td>
              <td className="p-4">{payment.status}</td>
              <td className="p-4">{payment.paidDate ? new Date(payment.paidDate).toLocaleDateString() : '—'}</td>
              <td className="p-4">{payment.status !== 'Paid' && <button disabled={!feeId || !matchesCurrency || paying !== null || checking || payment.status === 'Processing'} onClick={() => pay(feeId)} className="rounded-xl bg-primary px-4 py-2 text-white disabled:opacity-40">
                {paying === feeId ? 'Opening checkout...' : payment.status === 'Processing' ? 'Processing' : 'Pay now'}
              </button>}</td>
            </tr>;
          })}</tbody>
        </table>
      </div>}
    </>}
  </section>;
}
