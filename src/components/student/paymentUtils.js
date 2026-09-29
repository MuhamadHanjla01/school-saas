export function formatMoney(amount, currency = 'USD') {
  const value = Number(amount || 0);
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: currency.toUpperCase() }).format(value); }
  catch { return `${currency.toUpperCase()} ${value.toFixed(2)}`; }
}

export function checkoutDestination(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:') throw new Error('The payment service returned an invalid checkout address.');
  return url.href;
}

export function isConfirmedPayment(result) {
  return result?.payment?.status === 'Paid';
}
