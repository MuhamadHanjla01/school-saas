import './Footer.css';

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'Multi-Tenant', href: '#multi-tenant' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Security', href: '#' },
  ],
  Resources: [
    { label: 'Help Center', href: '#' },
    { label: 'API Docs', href: '#' },
    { label: 'Guides', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  Company: [
    { label: 'About Us', href: '#about' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Privacy Policy', href: '#' },
    { label: 'Contact', href: '#' },
  ],
};

export default function Footer() {
  return (
    <footer className="footer" id="about">
      <div className="container">
        <div className="footer__grid">
          {/* Brand Column */}
          <div className="footer__brand">
            <a href="#" className="header__logo" style={{ marginBottom: '24px' }}>
              <div className="header__logo-icon">
                <span className="material-symbols-outlined filled" style={{ fontSize: '24px' }}>
                  account_balance
                </span>
              </div>
              <span className="header__logo-text text-headline-lg">ERPZO</span>
            </a>
            <p className="footer__tagline">
              Empowering education through seamless digital transformation.
            </p>
            <div className="footer__socials">
              <a href="#" className="footer__social-btn" aria-label="Website">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>public</span>
              </a>
              <a href="#" className="footer__social-btn" aria-label="Email">
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>mail</span>
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.entries(FOOTER_LINKS).map(([title, links]) => (
            <div className="footer__column" key={title}>
              <h4 className="footer__column-title">{title}</h4>
              <ul className="footer__links">
                {links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="footer__link">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer__bottom">
          <p className="footer__copyright">© 2024 ERPZO Systems. All rights reserved.</p>
          <div className="footer__bottom-links">
            <a href="#" className="footer__bottom-link">Status</a>
            <a href="#" className="footer__bottom-link">Cookies</a>
            <a href="#" className="footer__bottom-link">Security</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
