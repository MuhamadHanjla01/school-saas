import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Pricing.css';

const PLANS = [
  {
    name: 'Starter',
    audience: 'Small boutique schools',
    price: '$49',
    period: '/month',
    features: [
      { text: 'Up to 200 students', included: true },
      { text: 'Basic Reporting', included: true },
      { text: 'Core ERP Modules', included: true },
      { text: 'Mobile Parent App', included: false },
    ],
    cta: 'Select Plan',
    variant: 'default',
  },
  {
    name: 'Growth',
    audience: 'Mid-sized institutes',
    price: '$149',
    period: '/month',
    features: [
      { text: 'Up to 1,000 students', included: true },
      { text: 'Advanced Analytics', included: true },
      { text: 'Priority Support', included: true },
      { text: 'Mobile Parent App', included: true },
    ],
    cta: 'Select Plan',
    variant: 'featured',
    badge: 'Most Popular',
  },
  {
    name: 'Pro',
    audience: 'Large campuses',
    price: '$299',
    period: '/month',
    features: [
      { text: 'Unlimited students', included: true },
      { text: 'Custom Integration', included: true },
      { text: 'Dedicated Manager', included: true },
      { text: 'Bio-metric Integration', included: true },
    ],
    cta: 'Select Plan',
    variant: 'default',
  },
];

function PricingCard({ plan }) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  return (
    <div
      className={`pricing-card pricing-card--${plan.variant} ${hovered ? 'pricing-card--hovered' : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      id={`pricing-${plan.name.toLowerCase()}`}
    >
      {plan.badge && <div className="pricing-card__badge">{plan.badge}</div>}

      <h3 className="pricing-card__name">{plan.name}</h3>
      <p className="pricing-card__audience">{plan.audience}</p>

      <div className="pricing-card__price-wrap">
        <span className="pricing-card__price">{plan.price}</span>
        {plan.period && <span className="pricing-card__period">{plan.period}</span>}
      </div>

      <ul className="pricing-card__features">
        {plan.features.map((f, i) => (
          <li
            key={i}
            className={`pricing-card__feature ${!f.included ? 'pricing-card__feature--disabled' : ''}`}
          >
            <span className="material-symbols-outlined pricing-card__check-icon">
              {f.included ? 'check' : 'close'}
            </span>
            {f.text}
          </li>
        ))}
      </ul>

      <button 
        className={`pricing-card__cta pricing-card__cta--${plan.variant}`}
        onClick={() => navigate('/purchase', { state: { selectedPlan: plan.name.toLowerCase() } })}
      >
        {plan.cta}
      </button>
    </div>
  );
}

export default function Pricing() {
  return (
    <section className="pricing" id="pricing">
      <div className="container">
        <div className="pricing__header">
          <h2 className="pricing__title text-display">Simple, Transparent Pricing</h2>
          <p className="pricing__subtitle">Choose the plan that fits your institution's size.</p>
        </div>
        <div className="pricing__grid">
          {PLANS.map((plan) => (
            <PricingCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}
