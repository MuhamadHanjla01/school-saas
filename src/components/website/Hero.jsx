import { useNavigate } from 'react-router-dom';
import './Hero.css';

const AVATAR_IMAGES = [
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDwOYE4uoc3IVKbodHyIL6xObDmTuQHuINdhp56UtMfVvNm_5ZAORBWDRW8C7cVWGeEKHiDaI2PaqnGV1-hED3_sNs5C4CNJ6JKxR4j-IZ_OAN01tYk5zFRocHf6QBCH2ipqjmXYKvP5EcRESLG5xnvvBvYBtAoU9KJZX0TJzvNRImkSygoKRazZCSPTrjRO7wyOf2poWRUVZ9libC24bVnpHisdB-lokZJz3QEJYa7ioj1DXljmjXTXOSnKa8o_7oxf4kUcQExUNKh',
    alt: 'Smiling female principal in a bright office',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD8PhoDTNJPGdce1_E13RLr44_8pU-DlXzS9hbw5P-lgn_V4CPvsHQsUpOk9cbq79Vn96-LzEapfWv9ueLB6oLs1O2b6aOLinzXK5D7xB4BBGvPOM7XKCFxFC_NBzsneImsi5TibqT2JdVh_VnBrFgu_AjpHFB6GnqLnJL_O4bL6-x6rWZXnJms3A3ictKJPbO7J7WiJ34nxvyyXzM7JssHP9lyBSzcNRml7dS6HTUl-moa43xTnrSJrjzZa-BfCtyjWN0pbdtPLHXx',
    alt: 'Young male teacher wearing glasses',
  },
  {
    src: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDkIQ_oKvQrqVvE_tD26WBtSD51STpspr5ZVrjXwE6wbMjqQhi6dTkfP2JVVlQvNu_enGA46RDa3QZOpvhKL5IQ-_sgcyEBIvWYZmuBokQ30S3mHe4QNTKYKPPEnpF8Gz_KE9f0CkCEJiZIIPgWu11FvBiGfRxMGr9uOovVzrprWur4rjqU2GfoHpXAg4KWYETJEgGHTfcBDtO4F4W1MAnsr3po1VdbtobJ-MnmRUzyFRPcbwdCeM41SlRw0Ghtecz1Bcr-z0DqrNkh',
    alt: 'Cheerful female administrative professional',
  },
];

const DASHBOARD_IMAGE = 'https://lh3.googleusercontent.com/aida-public/AB6AXuCS_R_fTs7XLQsTKeVe-La71K5bDVNHnDrwaw_9HuPlzc101hoWUvNSTHwx1UqXa-9k63iivS0cWSAmw35IrIO1VAHCmZtbzinxr88IqF9xGwax1VAFigmj4ytds9e38ock02aGGu-RS-TLD5rcKQ8MhNDPBOT4SjbO69Zh61hp1PwOGHQSdZd0a2Ef1OH8NOY3RoXGKFroEIiql0lKBh9CnVEhm5QIPwEBo4wiVZrUp2yhqgqEyh1-yMkHs21pmRLTCKRCvKYOWYNi';

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero" id="hero-section">
      <div className="hero__inner container">
        {/* Left Content */}
        <div className="hero__content">
          <span className="hero__badge text-label-sm">
            Unified Academic Operations
          </span>

          <h1 className="hero__title">
            Run Every Branch,{' '}
            <span className="hero__title--primary">School</span>, and{' '}
            <span className="hero__title--secondary">College</span> on One Platform.
          </h1>

          <p className="hero__subtitle text-body-lg">
            Admissions, fees, attendance, and parent apps—unified in one modern dashboard.
            Manage 10 students or 10,000 across multiple campuses with enterprise-grade stability.
          </p>

          <div className="hero__actions">
            <button className="hero__cta-primary text-label-lg" id="btn-live-demo" onClick={() => navigate('/demo')}>
              Try Live Demo
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
            <button className="hero__cta-secondary text-label-lg" id="btn-purchase-now" onClick={() => navigate('/purchase')}>
              Purchase Now
            </button>
          </div>

          <div className="hero__social-proof">
            <div className="hero__avatars">
              {AVATAR_IMAGES.map((img, i) => (
                <img
                  key={i}
                  className="hero__avatar"
                  src={img.src}
                  alt={img.alt}
                  loading="lazy"
                />
              ))}
            </div>
            <p className="hero__trust text-label-sm">
              Trusted by <strong>500+ Institutions</strong> worldwide
            </p>
          </div>
        </div>

        {/* Right Mockup */}
        <div className="hero__visual">
          <div className="hero__visual-glow"></div>

          <div className="hero__mockup floating-ui">
            {/* Main Dashboard Card */}
            <div className="hero__dashboard-card">
              <div className="hero__browser-bar">
                <div className="hero__browser-dots">
                  <span className="hero__dot hero__dot--red"></span>
                  <span className="hero__dot hero__dot--yellow"></span>
                  <span className="hero__dot hero__dot--green"></span>
                </div>
                <div className="hero__browser-url"></div>
              </div>
              <img
                className="hero__dashboard-img"
                src={DASHBOARD_IMAGE}
                alt="School management dashboard showing attendance charts, enrollment data, and financial reports"
                loading="eager"
              />
            </div>

            {/* Floating Sidebar Card */}
            <div className="hero__sidebar-card">
              <div className="hero__sidebar-inner">
                <div className="hero__sidebar-icon"></div>
                <div className="hero__sidebar-lines">
                  <div className="hero__line hero__line--full hero__line--dark"></div>
                  <div className="hero__line hero__line--3q hero__line--light"></div>
                  <div className="hero__line hero__line--full hero__line--mid"></div>
                </div>
                <div className="hero__sidebar-indicators">
                  <div className="hero__indicator">
                    <div className="hero__indicator-dot hero__indicator-dot--primary"></div>
                    <div className="hero__indicator-label hero__indicator-label--primary"></div>
                  </div>
                  <div className="hero__indicator">
                    <div className="hero__indicator-dot hero__indicator-dot--secondary"></div>
                    <div className="hero__indicator-label hero__indicator-label--secondary"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
