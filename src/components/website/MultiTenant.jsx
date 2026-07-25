import './MultiTenant.css';

const BENEFITS = [
  {
    title: 'Data Isolation',
    desc: 'Each institution has its own database silo for maximum security.',
  },
  {
    title: 'Group Reporting',
    desc: 'Aggregate financial and academic performance across all units.',
  },
  {
    title: 'Custom Branding',
    desc: 'Each branch can have its own logo, theme, and sub-domain.',
  },
];

export default function MultiTenant() {
  return (
    <section className="multi-tenant" id="multi-tenant">
      <div className="container">
        <div className="multi-tenant__grid">
          {/* Visual */}
          <div className="multi-tenant__visual">
            <div className="multi-tenant__canvas">
              {/* Hub */}
              <div className="multi-tenant__hub">
                <div className="multi-tenant__hub-icon">
                  <span
                    className="material-symbols-outlined filled"
                    style={{ fontSize: '48px', color: '#fff' }}
                  >
                    shield_person
                  </span>
                </div>
                <div className="multi-tenant__branches">
                  <div className="multi-tenant__branch multi-tenant__branch--primary">
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>school</span>
                  </div>
                  <div className="multi-tenant__branch multi-tenant__branch--secondary">
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>account_balance</span>
                  </div>
                  <div className="multi-tenant__branch multi-tenant__branch--tertiary">
                    <span className="material-symbols-outlined" style={{ fontSize: '28px' }}>menu_book</span>
                  </div>
                </div>
              </div>

              {/* Background Circles */}
              <div className="multi-tenant__circles">
                <div className="multi-tenant__circle multi-tenant__circle--lg"></div>
                <div className="multi-tenant__circle multi-tenant__circle--md"></div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="multi-tenant__content">
            <h2 className="multi-tenant__title">Scale Your Educational Empire</h2>
            <p className="multi-tenant__subtitle text-body-lg">
              Designed for large educational groups. Effortlessly manage multiple schools and colleges
              from a single Super Admin account with complete data isolation and separate domain support.
            </p>
            <ul className="multi-tenant__list">
              {BENEFITS.map((b) => (
                <li className="multi-tenant__item" key={b.title}>
                  <span className="material-symbols-outlined multi-tenant__check">check_circle</span>
                  <div>
                    <h4 className="multi-tenant__item-title">{b.title}</h4>
                    <p className="multi-tenant__item-desc">{b.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
