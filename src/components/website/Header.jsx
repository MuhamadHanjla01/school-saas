import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Header.css';

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'Multi-Tenant', href: '#multi-tenant' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'About', href: '/about' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  const getInitialActiveLink = () => {
    if (location.pathname === '/about') return '/about';
    if (location.state?.scrollTo) return location.state.scrollTo;
    if (location.hash) return location.hash;
    return '#features';
  };
  
  const [activeLink, setActiveLink] = useState(getInitialActiveLink());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Update active link if location changes directly
    if (location.pathname === '/about') {
      setActiveLink('/about');
    } else if (location.pathname === '/') {
      if (location.state?.scrollTo) {
        setActiveLink(location.state.scrollTo);
      } else if (!location.hash) {
        setActiveLink('#features');
      }
    }
  }, [location]);

  useEffect(() => {
    if (location.pathname === '/' && location.state?.scrollTo) {
      const section = location.state.scrollTo.substring(1);
      setTimeout(() => {
        const element = document.getElementById(section);
        if (element) {
          const offset = 80;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = element.getBoundingClientRect().top;
          const offsetPosition = (elementRect - bodyRect) - offset;
          window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
        }
      }, 100);
      
      // Clear state so it doesn't scroll again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);

      // Scroll spy logic - only run on home page
      if (window.location.pathname !== '/') return;

      const sections = NAV_LINKS
        .filter(link => link.href.startsWith('#'))
        .map(link => link.href.substring(1));

      // Check from bottom to top
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          // Adjust threshold based on header height
          if (rect.top <= 150) {
            setActiveLink(`#${section}`);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`header glass-nav ${scrolled ? 'header--scrolled' : ''}`} id="site-header">
      <nav className="header__nav container">
        {/* Logo */}
        <a href="#" className="header__logo" id="logo">
          <div className="header__logo-icon">
            <span className="material-symbols-outlined filled" style={{ fontSize: '24px' }}>account_balance</span>
          </div>
          <span className="header__logo-text text-headline-lg">ERPZO</span>
        </a>

        {/* Desktop Navigation */}
        <ul className="header__links">
          {NAV_LINKS.map(link => (
            <li key={link.label}>
              <a
                href={link.href}
                className={`header__link text-label-lg ${activeLink === link.href ? 'header__link--active' : ''}`}
                id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                onClick={(e) => {
                  setActiveLink(link.href);
                  if (link.href.startsWith('#')) {
                    e.preventDefault();
                    
                    // Navigate home first if we're not on the home page
                    if (window.location.pathname !== '/') {
                      navigate('/', { state: { scrollTo: link.href } });
                    } else {
                      const element = document.getElementById(link.href.substring(1));
                      if (element) {
                        const offset = 80;
                        const bodyRect = document.body.getBoundingClientRect().top;
                        const elementRect = element.getBoundingClientRect().top;
                        const offsetPosition = (elementRect - bodyRect) - offset;
                        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                      }
                    }
                  } else {
                    e.preventDefault();
                    navigate(link.href);
                  }
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* CTA Buttons */}
        <div className="header__actions">
          <button className="header__login text-label-lg" id="btn-login" onClick={() => navigate('/login')}>Login</button>
          <button className="header__demo text-label-lg" id="btn-get-demo" onClick={() => navigate('/demo')}>Get a Demo</button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="header__mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
          id="btn-mobile-menu"
        >
          <span className="material-symbols-outlined">
            {mobileMenuOpen ? 'close' : 'menu'}
          </span>
        </button>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="header__mobile-menu fade-in-up">
            <ul className="header__mobile-links">
              {NAV_LINKS.map(link => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className={`header__mobile-link ${activeLink === link.href ? 'header__mobile-link--active' : ''}`}
                    onClick={(e) => {
                      setActiveLink(link.href);
                      setMobileMenuOpen(false);
                      if (link.href.startsWith('#')) {
                        e.preventDefault();
                        
                        if (window.location.pathname !== '/') {
                          navigate('/', { state: { scrollTo: link.href } });
                        } else {
                          const element = document.getElementById(link.href.substring(1));
                          if (element) {
                            const offset = 80;
                            const bodyRect = document.body.getBoundingClientRect().top;
                            const elementRect = element.getBoundingClientRect().top;
                            const offsetPosition = (elementRect - bodyRect) - offset;
                            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
                          }
                        }
                      } else {
                        e.preventDefault();
                        navigate(link.href);
                      }
                    }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="header__mobile-actions">
              <button className="header__login text-label-lg" onClick={() => { navigate('/login'); setMobileMenuOpen(false); }}>Login</button>
              <button className="header__demo text-label-lg" onClick={() => { navigate('/demo'); setMobileMenuOpen(false); }}>Get a Demo</button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
