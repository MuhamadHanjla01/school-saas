import { useEffect, useRef } from 'react';
import './Features.css';

const FEATURES = [
  {
    icon: 'domain',
    title: 'Multi-Branch Management',
    description: 'Switch between branches with one click. Centralized reporting for the whole group.',
    color: 'primary',
  },
  {
    icon: 'badge',
    title: 'Student 360 Profile',
    description: 'Comprehensive history including grades, attendance, behavior, and medical logs.',
    color: 'secondary',
  },
  {
    icon: 'payments',
    title: 'Fee Collection',
    description: 'Automated invoicing, online payments, and instant fine calculation with reminders.',
    color: 'tertiary',
  },
  {
    icon: 'calendar_month',
    title: 'Attendance & Timetable',
    description: 'Bio-metric integration and visual drag-and-drop timetable generator.',
    color: 'primary',
  },
  {
    icon: 'groups',
    title: 'Staff HR & Payroll',
    description: 'Leave management, salary generation, and teacher appraisal systems.',
    color: 'secondary',
  },
  {
    icon: 'directions_bus',
    title: 'Transport & Hostel',
    description: 'Live route tracking and hostel occupancy management for residential schools.',
    color: 'tertiary',
  },
];

function FeatureCard({ feature, index }) {
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('feature-card--visible');
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="feature-card"
      style={{ animationDelay: `${index * 100}ms` }}
      id={`feature-${feature.icon}`}
    >
      <div className={`feature-card__icon feature-card__icon--${feature.color}`}>
        <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>
          {feature.icon}
        </span>
      </div>
      <h3 className="feature-card__title text-headline-md">{feature.title}</h3>
      <p className="feature-card__desc">{feature.description}</p>
    </div>
  );
}

export default function Features() {
  return (
    <section className="features" id="features">
      <div className="container">
        <div className="features__header">
          <h2 className="features__title text-display">Everything in One Place</h2>
          <p className="features__subtitle">
            Our modular architecture ensures you only use what you need, with all data synced in real-time across devices.
          </p>
        </div>
        <div className="features__grid">
          {FEATURES.map((feature, i) => (
            <FeatureCard key={feature.icon} feature={feature} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
