import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function PurchasePage() {
  const location = useLocation();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [plan, setPlan] = useState(location.state?.selectedPlan || 'growth');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const plans = {
    starter: { name: 'Starter Tier', price: 49, students: 'Up to 200 students' },
    growth: { name: 'Growth Tier', price: 149, students: 'Up to 1,000 students' },
    pro: { name: 'Pro Tier', price: 299, students: 'Unlimited students' },
  };

  const selectedPlan = plans[plan];
  const subtotal = selectedPlan.price * 12;
  const setupFee = 200;
  const taxes = subtotal * 0.05;
  const total = subtotal + setupFee + taxes;

  return (
    <div className="text-on-surface bg-background flex flex-col min-h-screen">
      {/* Top Navigation (Transactional Checkout Page) */}
      <header className="w-full top-0 sticky z-50 shadow-sm bg-surface-container-lowest dark:bg-surface-dim">
        <div className="flex justify-between items-center px-container-padding-mob md:px-container-padding-desk py-4 max-w-[1440px] mx-auto">
          {/* Brand */}
          <Link to="/" className="header__logo" id="logo">
            <div className="header__logo-icon">
              <span className="material-symbols-outlined filled" style={{ fontSize: '24px' }}>account_balance</span>
            </div>
            <span className="header__logo-text text-headline-lg">ERPZO</span>
          </Link>
          {/* Secure Checkout Indicator */}
          <div className="flex items-center gap-2 text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">lock</span>
            <span className="font-label-lg text-label-lg">Secure Checkout</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-[1440px] mx-auto px-container-padding-mob md:px-container-padding-desk py-card-gap md:py-[40px] lg:py-[60px]">
        {/* Header */}
        <div className="mb-card-gap md:mb-[40px]">
          <h1 className="font-display text-display md:text-[40px] md:leading-[48px] text-on-surface mb-2 tracking-tight">Complete your purchase</h1>
          <p className="font-body-lg text-body-lg text-on-surface-variant">Upgrade your institution's digital infrastructure today.</p>
        </div>

        {/* Checkout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-card-gap lg:gap-[40px] items-start">
          {/* Left Column: Forms (8 cols) */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-card-gap">
            {/* Section 1: Institution Details */}
            <section className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-variant p-card-gap md:p-[32px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                  <span className="font-label-lg text-label-lg">1</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Select Your Plan</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Starter Plan */}
                <label className="cursor-pointer group">
                  <input type="radio" name="plan_selection" value="starter" checked={plan === 'starter'} onChange={(e) => setPlan(e.target.value)} className="peer sr-only" />
                  <div className={`h-full p-5 rounded-xl border-2 transition-all flex flex-col ${plan === 'starter' ? 'border-primary bg-[rgba(0,194,168,0.05)]' : 'border-outline-variant hover:border-primary-container'}`}>
                    <div className="mb-4">
                      <h3 className={`font-label-lg text-label-lg ${plan === 'starter' ? 'text-primary' : 'text-on-surface-variant'}`}>Starter</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-headline-lg font-display text-on-surface">$49</span>
                        <span className="text-label-sm text-on-surface-variant">/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4 flex-grow">
                      <li className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>Up to 200 students
                      </li>
                      <li className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>Basic Reporting
                      </li>
                    </ul>
                  </div>
                </label>

                {/* Growth Plan */}
                <label className="cursor-pointer group">
                  <input type="radio" name="plan_selection" value="growth" checked={plan === 'growth'} onChange={(e) => setPlan(e.target.value)} className="peer sr-only" />
                  <div className={`h-full p-5 rounded-xl border-2 transition-all relative flex flex-col ${plan === 'growth' ? 'border-primary bg-[rgba(0,194,168,0.05)]' : 'border-outline-variant hover:border-primary-container'}`}>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-primary text-on-primary text-[10px] font-label-lg rounded-full uppercase tracking-wider">Most Popular</div>
                    <div className="mb-4">
                      <h3 className={`font-label-lg text-label-lg ${plan === 'growth' ? 'text-primary' : 'text-on-surface-variant'}`}>Growth</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-headline-lg font-display text-on-surface">$149</span>
                        <span className="text-label-sm text-on-surface-variant">/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4 flex-grow">
                      <li className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>Up to 1,000 students
                      </li>
                      <li className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>Advanced Analytics
                      </li>
                      <li className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>Priority Support
                      </li>
                    </ul>
                  </div>
                </label>

                {/* Pro Plan */}
                <label className="cursor-pointer group">
                  <input type="radio" name="plan_selection" value="pro" checked={plan === 'pro'} onChange={(e) => setPlan(e.target.value)} className="peer sr-only" />
                  <div className={`h-full p-5 rounded-xl border-2 transition-all flex flex-col ${plan === 'pro' ? 'border-primary bg-[rgba(0,194,168,0.05)]' : 'border-outline-variant hover:border-primary-container'}`}>
                    <div className="mb-4">
                      <h3 className={`font-label-lg text-label-lg ${plan === 'pro' ? 'text-primary' : 'text-on-surface-variant'}`}>Pro</h3>
                      <div className="flex items-baseline gap-1">
                        <span className="text-headline-lg font-display text-on-surface">$299</span>
                        <span className="text-label-sm text-on-surface-variant">/mo</span>
                      </div>
                    </div>
                    <ul className="space-y-2 mb-4 flex-grow">
                      <li className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>Unlimited students
                      </li>
                      <li className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>Custom Integration
                      </li>
                      <li className="flex items-center gap-2 text-label-sm text-on-surface-variant">
                        <span className="material-symbols-outlined text-[16px] text-primary">check_circle</span>Dedicated Manager
                      </li>
                    </ul>
                  </div>
                </label>
              </div>
            </section>

            <section className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-variant p-card-gap md:p-[32px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                  <span className="font-label-lg text-label-lg">2</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Institution Details</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="inst-name">Institution Name</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="inst-name" placeholder="e.g. Springfield High School" type="text" />
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="inst-type">Institution Type</label>
                  <div className="relative">
                    <select className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md appearance-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="inst-type" defaultValue="">
                      <option disabled value="">Select type</option>
                      <option value="k12">K-12 School</option>
                      <option value="college">College</option>
                      <option value="university">University</option>
                      <option value="other">Other Educational Entity</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-on-surface-variant">
                      <span className="material-symbols-outlined">expand_more</span>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="contact-name">Primary Contact Name</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="contact-name" placeholder="Jane Doe" type="text" />
                </div>
                <div className="col-span-1 md:col-span-2">
                  <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="contact-email">Work Email Address</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="contact-email" placeholder="admin@springfield.edu" type="email" />
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="contact-phone">Contact Number</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="contact-phone" placeholder="+1 (555) 000-0000" type="tel" />
                </div>
                <div>
                  <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="inst-location">Location</label>
                  <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="inst-location" placeholder="City, Country" type="text" />
                </div>
              </div>
            </section>

            {/* Section 3: Payment Method */}
            <section className="bg-surface-container-lowest rounded-2xl shadow-[0px_4px_20px_rgba(0,0,0,0.03)] border border-surface-variant p-card-gap md:p-[32px]">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface">
                  <span className="font-label-lg text-label-lg">3</span>
                </div>
                <h2 className="font-headline-md text-headline-md text-on-surface">Payment Method</h2>
              </div>
              {/* Payment Toggles */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8" id="payment-methods">
                {/* Card */}
                <label className="cursor-pointer">
                  <input checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer sr-only" name="payment_method" type="radio" value="card" />
                  <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:bg-surface-container-low ${paymentMethod === 'card' ? 'border-primary bg-[rgba(0,194,168,0.05)]' : 'border-outline-variant'}`}>
                    <span className={`material-symbols-outlined mb-2 ${paymentMethod === 'card' ? 'text-primary' : 'text-on-surface-variant'}`}>credit_card</span>
                    <span className="font-label-lg text-label-lg text-on-surface text-center">Credit/Debit Card</span>
                  </div>
                </label>
                {/* Bank */}
                <label className="cursor-pointer">
                  <input checked={paymentMethod === 'bank'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer sr-only" name="payment_method" type="radio" value="bank" />
                  <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:bg-surface-container-low ${paymentMethod === 'bank' ? 'border-primary bg-[rgba(0,194,168,0.05)]' : 'border-outline-variant'}`}>
                    <span className={`material-symbols-outlined mb-2 ${paymentMethod === 'bank' ? 'text-primary' : 'text-on-surface-variant'}`}>account_balance</span>
                    <span className="font-label-lg text-label-lg text-on-surface text-center">Bank Transfer</span>
                  </div>
                </label>
                {/* Wallet */}
                <label className="cursor-pointer">
                  <input checked={paymentMethod === 'wallet'} onChange={(e) => setPaymentMethod(e.target.value)} className="peer sr-only" name="payment_method" type="radio" value="wallet" />
                  <div className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all hover:bg-surface-container-low ${paymentMethod === 'wallet' ? 'border-primary bg-[rgba(0,194,168,0.05)]' : 'border-outline-variant'}`}>
                    <span className={`material-symbols-outlined mb-2 ${paymentMethod === 'wallet' ? 'text-primary' : 'text-on-surface-variant'}`}>account_balance_wallet</span>
                    <span className="font-label-lg text-label-lg text-on-surface text-center">Online Wallet</span>
                  </div>
                </label>
              </div>

              {/* Card Details Form (Dynamic based on selection) */}
              {paymentMethod === 'card' && (
                <div className="space-y-4" id="card-details-form">
                  <div>
                    <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="card-name">Name on Card</label>
                    <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="card-name" placeholder="Jane Doe" type="text" />
                  </div>
                  <div>
                    <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="card-number">Card Number</label>
                    <div className="relative">
                      <input className="w-full pl-12 pr-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="card-number" placeholder="0000 0000 0000 0000" type="text" />
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <span className="material-symbols-outlined text-on-surface-variant">credit_card</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="card-expiry">Expiry Date</label>
                      <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="card-expiry" placeholder="MM/YY" type="text" />
                    </div>
                    <div>
                      <label className="block font-label-lg text-label-lg text-on-surface mb-2" htmlFor="card-cvv">CVV</label>
                      <div className="relative">
                        <input className="w-full px-4 py-3 rounded-xl border border-outline-variant bg-surface-lowest text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-shadow" id="card-cvv" maxLength="4" placeholder="123" type="password" />
                        <button className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant hover:text-on-surface" type="button">
                          <span className="material-symbols-outlined text-[20px]">help</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Alternative Payment Messages (Hidden by default) */}
              {paymentMethod === 'bank' && (
                <div className="p-6 bg-surface-container rounded-xl text-center" id="bank-message">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">account_balance</span>
                  <p className="font-body-md text-body-md text-on-surface">You will receive an invoice with our bank details upon confirming your order. Your plan will be activated once payment clears.</p>
                </div>
              )}
              {paymentMethod === 'wallet' && (
                <div className="p-6 bg-surface-container rounded-xl text-center" id="wallet-message">
                  <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">open_in_new</span>
                  <p className="font-body-md text-body-md text-on-surface">You will be redirected to our secure payment gateway to complete your transaction via Apple Pay, Google Pay, or PayPal.</p>
                </div>
              )}
            </section>
          </div>

          {/* Right Column: Order Summary (4 cols) */}
          <div className="lg:col-span-5 xl:col-span-4 lg:sticky lg:top-[100px]">
            <div className="bg-surface-container-lowest rounded-2xl shadow-[0px_8px_30px_rgba(0,0,0,0.06)] border border-surface-variant p-card-gap md:p-[32px] flex flex-col h-full">
              <h2 className="font-headline-md text-headline-md text-on-surface mb-6 border-b border-surface-variant pb-4">Order Summary</h2>
              
              {/* Selected Plan Card */}
              <div className="mb-6 bg-surface-container-lowest border-2 border-primary-container rounded-xl p-5 relative overflow-hidden shadow-sm">
                <div className="absolute top-0 right-0 p-2">
                  <span className="material-symbols-outlined text-primary opacity-20 text-4xl">verified</span>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="material-symbols-outlined text-primary text-[20px]">auto_awesome</span>
                    <h3 className="font-headline-md text-headline-md text-on-surface tracking-tight">{selectedPlan.name}</h3>
                  </div>
                  <div className="flex items-baseline gap-1 mb-4">
                    <span className="font-display text-display text-primary">${selectedPlan.price}</span>
                    <span className="font-body-md text-body-md text-on-surface-variant">/month</span>
                  </div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="px-3 py-1 bg-primary-container text-on-primary-container text-label-sm font-label-sm rounded-full flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                      Billed Annually
                    </span>
                    <span className="text-label-sm font-label-sm text-on-surface-variant">
                      {selectedPlan.students}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Line Items */}
              <div className="space-y-4 mb-6 flex-grow">
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-on-surface-variant">Subtotal (Annual)</span>
                  <span className="font-body-md text-body-md text-on-surface">${subtotal.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-on-surface-variant flex items-center gap-1">
                    Setup Fee <span className="material-symbols-outlined text-[14px] cursor-help" title="One-time onboarding fee">info</span>
                  </span>
                  <span className="font-body-md text-body-md text-on-surface">${setupFee.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-body-md text-body-md text-on-surface-variant">Taxes (Est. 5%)</span>
                  <span className="font-body-md text-body-md text-on-surface">${taxes.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
              <div className="border-t border-surface-variant pt-4 mb-8">
                <div className="flex justify-between items-end">
                  <span className="font-headline-md text-headline-md text-on-surface">Total Due</span>
                  <span className="font-display text-display text-on-surface tracking-tight">${total.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                </div>
              </div>
              {/* Pay Action */}
              <button className="w-full py-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container font-label-lg text-label-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-sm hover:shadow-md">
                <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>lock</span>
                Confirm &amp; Pay
              </button>
              <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-4">
                By confirming, you agree to our <a className="underline hover:text-primary" href="#">Terms of Service</a> and <a className="underline hover:text-primary" href="#">Privacy Policy</a>.
              </p>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer (Minimal for checkout) */}
      <footer className="w-full mt-auto bg-surface-container-high dark:bg-inverse-surface py-8 border-t border-surface-variant">
        <div className="max-w-[1440px] mx-auto px-container-padding-mob md:px-container-padding-desk flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
          <p className="font-body-md text-body-md text-on-surface-variant">© 2024 ERPZO. Empowering Academic Excellence.</p>
          <div className="flex gap-4">
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Support</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-primary transition-colors" href="#">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
