import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './DemoPage.css';

export default function DemoPage() {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [selectedPopulation, setSelectedPopulation] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const populationOptions = [
    { value: '1-500', label: '1 - 500 Students' },
    { value: '501-2000', label: '501 - 2,000 Students' },
    { value: '2001-5000', label: '2,001 - 5,000 Students' },
    { value: '5000+', label: '5,000+ Students' },
  ];
  return (
    <div className="demo-page bg-background text-on-surface antialiased min-h-screen flex flex-col">
      {/* TopNavBar */}
      <header className="fixed top-0 w-full bg-surface/80 dark:bg-surface-dim/80 backdrop-blur-md shadow-sm z-50">
        <div className="flex justify-between items-center h-20 px-container-padding-desk max-w-7xl mx-auto">
          <Link to="/" className="header__logo" id="logo">
            <div className="header__logo-icon">
              <span className="material-symbols-outlined filled" style={{ fontSize: '24px' }}>account_balance</span>
            </div>
            <span className="header__logo-text text-headline-lg">ERPZO</span>
          </Link>
          <nav className="hidden md:flex gap-8 items-center">
            <Link to="/#features" className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors hover:opacity-90 transition-opacity duration-300 ease-in-out">Features</Link>
            <Link to="/#multi-tenant" className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors hover:opacity-90 transition-opacity duration-300 ease-in-out">Multi-Tenant</Link>
            <Link to="/#pricing" className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors hover:opacity-90 transition-opacity duration-300 ease-in-out">Pricing</Link>
            <Link to="/#about" className="font-label-lg text-label-lg text-on-surface-variant hover:text-primary transition-colors hover:opacity-90 transition-opacity duration-300 ease-in-out">About</Link>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/login" className="hidden md:block font-label-lg text-label-lg text-primary hover:opacity-90 transition-opacity">Login</Link>
            <Link to="/demo" className="font-label-lg text-label-lg bg-primary-container text-on-primary-container px-6 py-2.5 rounded-full hover:opacity-90 transition-opacity shadow-sm">Get a Demo</Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-32 pb-24 px-container-padding-mob md:px-container-padding-desk relative overflow-hidden">
        <div className="absolute inset-0 bg-pattern z-0 pointer-events-none"></div>
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-card-gap relative z-10">
          {/* Left Column: Value Prop */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-8 pr-0 lg:pr-8">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary-container/10 text-primary-container rounded-full font-label-sm text-label-sm mb-6">
                <span className="material-symbols-outlined text-[16px]">visibility</span>
                <span>Live Demonstration</span>
              </div>
              <h1 className="font-display-mobile md:font-display text-display-mobile md:text-display text-on-surface mb-6 leading-tight">
                See the Future of <br />
                <span className="text-primary-container relative inline-block">
                  School Management
                  <svg className="absolute w-full h-3 -bottom-1 left-0 text-primary-container/20" preserveAspectRatio="none" viewBox="0 0 100 10"><path d="M0 5 Q 50 10 100 5" fill="none" stroke="currentColor" strokeWidth="4"></path></svg>
                </span>
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-md mb-8">
                Experience how ERPZO simplifies administration, engages students, and unifies your entire campus ecosystem in one modern platform.
              </p>
            </div>

            {/* Feature List */}
            <div className="space-y-6">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary-container/10 transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors">domain</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Multi-campus control</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Manage multiple locations, curriculums, and staff from a single unified dashboard.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary-container/10 transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors">receipt_long</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Automated billing</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Streamline fee collection with automated invoicing, reminders, and online payment gateways.</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-2xl bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary-container/10 transition-colors">
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors">insert_chart</span>
                </div>
                <div>
                  <h3 className="font-headline-md text-headline-md text-on-surface mb-1">Real-time reporting</h3>
                  <p className="font-body-md text-body-md text-on-surface-variant">Generate instant insights on attendance, academic performance, and financial health.</p>
                </div>
              </div>
            </div>

            {/* Testimonial */}
            <div className="mt-8 p-6 bg-surface-container-lowest rounded-2xl border border-outline-variant/30 shadow-sm relative">
              <span className="material-symbols-outlined absolute top-4 right-4 text-outline-variant/20 text-[48px]" style={{ fontVariationSettings: '"FILL" 1' }}>format_quote</span>
              <p className="font-body-md text-body-md text-on-surface-variant italic mb-4 relative z-10">
                "ERPZO transformed our administrative chaos into a streamlined process. The time we save on reporting alone makes it invaluable. It feels like software built for this decade."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-surface-container-high overflow-hidden">
                  <img className="w-full h-full object-cover" alt="Professional headshot of a middle-aged female school principal smiling warmly in a brightly lit modern office setting. She is wearing a smart casual teal blazer. The background is slightly blurred showing bookshelves and a window. High quality, corporate photography style." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDwOYE4uoc3IVKbodHyIL6xObDmTuQHuINdhp56UtMfVvNm_5ZAORBWDRW8C7cVWGeEKHiDaI2PaqnGV1-hED3_sNs5C4CNJ6JKxR4j-IZ_OAN01tYk5zFRocHf6QBCH2ipqjmXYKvP5EcRESLG5xnvvBvYBtAoU9KJZX0TJzvNRImkSygoKRazZCSPTrjRO7wyOf2poWRUVZ9libC24bVnpHisdB-lokZJz3QEJYa7ioj1DXljmjXTXOSnKa8o_7oxf4kUcQExUNKh" />
                </div>
                <div>
                  <p className="font-label-lg text-label-lg text-on-surface">Dr. Sarah Jenkins</p>
                  <p className="font-label-sm text-label-sm text-on-surface-variant">Principal, Oakridge Academy</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Form & Calendar */}
          <div className="lg:col-span-7 flex flex-col gap-6 mt-12 lg:mt-0">
            {/* Demo Request Form */}
            <div className="glass-card rounded-[24px] p-8 lg:p-10 border border-outline-variant/20">
              <h2 className="font-headline-lg text-headline-lg text-on-surface mb-2">Request your personalized demo</h2>
              <p className="font-body-md text-body-md text-on-surface-variant mb-8">Tell us a bit about your institution so we can tailor the walkthrough to your needs.</p>
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block font-label-lg text-label-lg text-on-surface" htmlFor="fullName">Full Name</label>
                    <input className="w-full h-12 px-4 rounded-xl border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-shadow font-body-md text-body-md placeholder-on-surface-variant/50 border" id="fullName" placeholder="Jane Doe" type="text" />
                  </div>
                  <div className="space-y-2">
                    <label className="block font-label-lg text-label-lg text-on-surface" htmlFor="workEmail">Work Email</label>
                    <input className="w-full h-12 px-4 rounded-xl border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-shadow font-body-md text-body-md placeholder-on-surface-variant/50 border" id="workEmail" placeholder="jane@school.edu" type="email" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block font-label-lg text-label-lg text-on-surface" htmlFor="institutionName">Institution Name</label>
                  <input className="w-full h-12 px-4 rounded-xl border-outline-variant bg-surface-container-lowest text-on-surface focus:border-primary-container focus:ring-1 focus:ring-primary-container transition-shadow font-body-md text-body-md placeholder-on-surface-variant/50 border" id="institutionName" placeholder="Oakridge Academy" type="text" />
                </div>
                <div className="space-y-2">
                  <label className="block font-label-lg text-label-lg text-on-surface" id="population-label">Student Population</label>
                  <div className="relative" ref={dropdownRef}>
                    <div
                      className={`w-full h-12 px-4 rounded-xl border bg-surface-container-lowest flex items-center justify-between cursor-pointer transition-shadow font-body-md text-body-md ${dropdownOpen ? 'border-primary-container ring-1 ring-primary-container' : 'border-outline-variant'} ${!selectedPopulation ? 'text-on-surface-variant/50' : 'text-on-surface'}`}
                      onClick={() => setDropdownOpen(!dropdownOpen)}
                      role="combobox"
                      aria-expanded={dropdownOpen}
                      aria-labelledby="population-label"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setDropdownOpen(!dropdownOpen);
                        }
                      }}
                    >
                      <span>{selectedPopulation ? populationOptions.find(o => o.value === selectedPopulation)?.label : 'Select population size...'}</span>
                      <span className={`material-symbols-outlined text-on-surface-variant transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
                    </div>

                    <div className={`absolute z-20 top-full left-0 w-full mt-2 bg-surface-container-lowest border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden transition-all duration-200 origin-top ${dropdownOpen ? 'opacity-100 scale-y-100' : 'opacity-0 scale-y-0 pointer-events-none'}`}>
                      <ul className="py-2" role="listbox">
                        {populationOptions.map((option) => (
                          <li
                            key={option.value}
                            role="option"
                            aria-selected={selectedPopulation === option.value}
                            className={`px-4 py-3 cursor-pointer font-body-md text-body-md hover:bg-surface-container transition-colors flex items-center justify-between ${selectedPopulation === option.value ? 'bg-primary-container/10 text-primary-container font-medium' : 'text-on-surface'}`}
                            onClick={() => {
                              setSelectedPopulation(option.value);
                              setDropdownOpen(false);
                            }}
                          >
                            {option.label}
                            {selectedPopulation === option.value && <span className="material-symbols-outlined text-[18px]">check</span>}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <input type="hidden" name="studentPopulation" value={selectedPopulation} />
                  </div>
                </div>
                <button className="w-full h-14 mt-4 bg-primary-container hover:opacity-90 text-on-primary-container rounded-full font-label-lg text-label-lg flex items-center justify-center gap-2 transition-opacity shadow-sm" type="button">
                  <span>Continue to Scheduling</span>
                  <span className="material-symbols-outlined">arrow_forward</span>
                </button>
                <p className="text-center font-label-sm text-label-sm text-on-surface-variant mt-4">By continuing, you agree to our <a className="text-primary hover:underline" href="#">Terms of Service</a>.</p>
              </form>
            </div>

            {/* Calendar Widget Preview */}
            <div className="glass-card rounded-[24px] p-6 border border-outline-variant/20 opacity-70 pointer-events-none">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-headline-md text-headline-md text-on-surface flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container">calendar_month</span>
                  Schedule a Live Walkthrough
                </h3>
                <div className="flex gap-2">
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">chevron_left</span></div>
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"><span className="material-symbols-outlined text-[16px]">chevron_right</span></div>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-2 mb-4">
                <div className="text-center font-label-sm text-label-sm text-on-surface-variant">Mon</div>
                <div className="text-center font-label-sm text-label-sm text-on-surface-variant">Tue</div>
                <div className="text-center font-label-sm text-label-sm text-on-surface-variant">Wed</div>
                <div className="text-center font-label-sm text-label-sm text-on-surface-variant">Thu</div>
                <div className="text-center font-label-sm text-label-sm text-on-surface-variant">Fri</div>
                <div className="text-center font-label-sm text-label-sm text-on-surface-variant opacity-50">Sat</div>
                <div className="text-center font-label-sm text-label-sm text-on-surface-variant opacity-50">Sun</div>
                {/* Dummy Calendar Days */}
                <div className="h-10 rounded-xl flex items-center justify-center font-body-md text-body-md text-on-surface-variant/50">28</div>
                <div className="h-10 rounded-xl flex items-center justify-center font-body-md text-body-md text-on-surface-variant/50">29</div>
                <div className="h-10 rounded-xl flex items-center justify-center font-body-md text-body-md text-on-surface-variant/50">30</div>
                <div className="h-10 rounded-xl flex items-center justify-center font-body-md text-body-md text-on-surface bg-primary-container/10 text-primary-container font-medium border border-primary-container/30 cursor-pointer">1</div>
                <div className="h-10 rounded-xl flex items-center justify-center font-body-md text-body-md text-on-surface bg-primary-container/10 text-primary-container font-medium border border-primary-container/30 cursor-pointer">2</div>
                <div className="h-10 rounded-xl flex items-center justify-center font-body-md text-body-md text-on-surface-variant/50 bg-surface-container-low">3</div>
                <div className="h-10 rounded-xl flex items-center justify-center font-body-md text-body-md text-on-surface-variant/50 bg-surface-container-low">4</div>
              </div>
              <div className="text-center pt-2 border-t border-outline-variant/20">
                <p className="font-label-sm text-label-sm text-on-surface-variant flex items-center justify-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">lock</span>
                  Complete form to unlock available times
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-lowest dark:bg-inverse-surface w-full py-12 border-t border-outline-variant">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-card-gap px-container-padding-desk max-w-7xl mx-auto">
          <div className="col-span-2 lg:col-span-2">
            <div className="header__logo" style={{ marginBottom: '16px' }}>
              <div className="header__logo-icon">
                <span className="material-symbols-outlined filled" style={{ fontSize: '24px' }}>account_balance</span>
              </div>
              <span className="header__logo-text text-headline-lg">ERPZO</span>
            </div>
            <p className="font-body-md text-body-md text-on-surface-variant mb-6">
              Empowering educational institutions with modern tools for a smarter tomorrow.
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant opacity-70">
              © 2024 ERPZO Systems. All rights reserved.
            </p>
          </div>
          <div className="flex flex-col gap-3">
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Privacy Policy</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Terms of Service</a>
          </div>
          <div className="flex flex-col gap-3">
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Security</a>
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">Help Center</a>
          </div>
          <div className="flex flex-col gap-3">
            <a className="font-body-md text-body-md text-on-surface-variant hover:text-secondary transition-colors duration-200" href="#">API Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
