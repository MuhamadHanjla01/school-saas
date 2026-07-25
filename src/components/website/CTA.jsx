import { useNavigate } from 'react-router-dom';
import './CTA.css';

export default function CTA() {
  const navigate = useNavigate();
  return (
    <section className="cta" id="cta-section">
      <div className="container cta__inner">
        <h2 className="cta__title">Ready to modernize your institution?</h2>
        <p className="cta__subtitle">
          Join thousands of schools that have simplified their daily operations with ERPZO.
        </p>
        <div className="cta__actions">
          <button className="cta__btn-primary text-headline-md" id="btn-schedule-demo" onClick={() => navigate('/demo')}>
            Schedule a Demo
          </button>
          <button className="cta__btn-secondary text-headline-md" id="btn-talk-experts">
            Talk to Experts
          </button>
        </div>
      </div>
    </section>
  );
}
