import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ManageSchoolsView from './ManageSchoolsView';
import SchoolDetailsView from './SchoolDetailsView';
import SchoolInquiriesView from './SchoolInquiriesView';
import RolePermissionView from './RolePermissionView';
import StaffView from './StaffView';
import PackageView from './PackageView';
import AddonsView from './AddonsView';
import FeaturesView from './FeaturesView';
import SubscriptionView from './SubscriptionView';
import TransactionsView from './TransactionsView';
import CouponsView from './CouponsView';
import EmailSchoolsView from './EmailSchoolsView';
import SmsWhatsappView from './SmsWhatsappView';
import PlatformAnalyticsView from './PlatformAnalyticsView';
import RevenueReportsView from './RevenueReportsView';
import UsageReportsView from './UsageReportsView';
import TicketInboxView from './TicketInboxView';
import KnowledgeBaseView from './KnowledgeBaseView';
import AuditLogsView from './AuditLogsView';
import LoginActivityView from './LoginActivityView';
import ImpersonationLogsView from './ImpersonationLogsView';
import TemplatesView from './TemplatesView';
import PushHistoryView from './PushHistoryView';
import ContactInquiryView from './ContactInquiryView';
import SystemSettingsView from './SystemSettingsView';
import WebSettingsView from './WebSettingsView';
import AcademySetupView from './AcademySetupView';
import DatabaseBackupView from './DatabaseBackupView';
import SystemUpdateView from './SystemUpdateView';
import DocumentationView from './DocumentationView';
import ApiSettingsView from './ApiSettingsView';
import WhiteLabelView from './WhiteLabelView';
import './SuperadminPage.css';

// ─── Data ────────────────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', type: 'link' },
  {
    id: 'schools', label: 'Schools', icon: 'school', type: 'group',
    children: ['Manage Schools', 'School Inquiries'],
  },
  {
    id: 'personnel', label: 'Personnel', icon: 'badge', type: 'group',
    children: ['Role & Permission', 'Staff'],
  },
  {
    id: 'packages', label: 'Packages', icon: 'inventory_2', type: 'group',
    children: ['Package', 'Addons', 'Features', 'Subscription', 'Transactions', 'Coupons & Discounts'],
  },
  {
    id: 'communication', label: 'Communication', icon: 'forum', type: 'group',
    children: ['Email Schools', 'SMS / WhatsApp'],
  },
  {
    id: 'analytics', label: 'Analytics', icon: 'analytics', type: 'group',
    children: ['Platform Analytics', 'Revenue Reports', 'Usage Reports'],
  },
  {
    id: 'support', label: 'Support', icon: 'support_agent', type: 'group',
    children: ['Ticket Inbox', 'Knowledge Base'],
  },
  {
    id: 'security', label: 'Security', icon: 'admin_panel_settings', type: 'group',
    children: ['Audit Logs', 'Login Activity', 'Impersonation Logs'],
  },
  {
    id: 'notifications', label: 'Notifications', icon: 'notifications_active', type: 'group',
    children: ['Templates', 'Push History'],
  },
  { id: 'contact', label: 'Contact Inquiry', icon: 'mail', type: 'link' },
  {
    id: 'settings', label: 'Settings', icon: 'settings', type: 'group',
    children: [
      'System Settings', 'Web Settings', 'Academy Setup',
      'Database Backup', 'System Update', 'Documentation', 'API Settings', 'White-label',
    ],
  },
];

const INITIAL_SCHOOLS = [
  { name: "St. Mary's International", date: 'Oct 24, 2023', status: 'Active' },
  { name: 'Greenwood Academy', date: 'Oct 22, 2023', status: 'Pending' },
  { name: 'Oakwood High', date: 'Oct 20, 2023', status: 'Reviewing' },
];

const INITIAL_INQUIRIES = [
  { id: 1, requester: 'Sarah Jenkins', school: 'Oakridge International', date: 'Oct 24, 2023' },
  { id: 2, requester: 'David Chen', school: 'Maple Leaf Academy', date: 'Oct 23, 2023' },
  { id: 3, requester: "Michael O'Connor", school: "St. Patrick's High", date: 'Oct 22, 2023' },
];

const CHART_DATA = {
  '12m': {
    path: 'M0,180 Q100,160 200,170 T400,120 T600,80 T800,100 T1000,40',
    fill: 'M0,180 Q100,160 200,170 T400,120 T600,80 T800,100 T1000,40 V240 H0 Z',
    labels: ['JAN', 'MAR', 'MAY', 'JUL', 'SEP', 'NOV', 'DEC'],
  },
  '3y': {
    path: 'M0,210 Q80,200 160,195 T320,170 T480,140 T640,100 T800,70 T1000,30',
    fill: 'M0,210 Q80,200 160,195 T320,170 T480,140 T640,100 T800,70 T1000,30 V240 H0 Z',
    labels: ['2022 Q1', 'Q2', 'Q3', 'Q4', '2023 Q1', 'Q2', 'Q3', 'Q4', '2024 Q1', 'Q2', 'Q3'],
  },
};

// ─── Helper Components ───────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const map = {
    Active: 'bg-[#006b5c]/10 text-[#006b5c]',
    Pending: 'bg-[#0060ac]/10 text-[#0060ac]',
    Reviewing: 'bg-[#9d4224]/10 text-[#9d4224]',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${map[status] || ''}`}>
      {status}
    </span>
  );
}

function Toast({ message, type, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return <div className={`sa-toast sa-toast--${type}`}>{message}</div>;
}

function Modal({ title, onClose, children }) {
  return (
    <div className="sa-modal-overlay" onClick={onClose}>
      <div className="sa-modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-[#1a1c1e] dark:text-[#f0f0f3]">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-[#e8e8ea] dark:hover:bg-[#3c4a46] transition-colors">
            <span className="material-symbols-outlined text-[#6c7a76]">close</span>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Sidebar Navigation ─────────────────────────────────────────────────────

function SidebarContent({ expanded, onToggle, activeItem, onItemClick, onSignOut }) {
  return (
    <>
      {/* Logo */}
      <div className="mb-4 px-3 flex items-center gap-3">
        <img src="/favicon.svg" alt="ERPZO Logo" className="w-8 h-8 rounded-lg shrink-0" style={{ boxShadow: '0 4px 14px rgba(0,107,92,0.25)' }} />
        <div className="min-w-0">
          <h1 className="text-base font-bold text-[#006b5c] tracking-tight leading-none">ERPZO</h1>
          <span className="text-[10px] font-medium text-[#3c4a46] opacity-70">Superadmin Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-px sa-scrollbar overflow-y-auto overflow-x-hidden">
        {SIDEBAR_ITEMS.map((item) => {
          if (item.type === 'link') {
            const isActive = activeItem === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-200 ${isActive
                  ? 'text-[#006b5c] font-bold bg-[#006b5c]/10 border-l-[3px] border-[#006b5c]'
                  : 'text-[#3c4a46] font-medium hover:bg-[#e8e8ea] border-l-[3px] border-transparent'
                  }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
                <span className="text-[12.5px] font-semibold truncate">{item.label}</span>
              </button>
            );
          }

          const isExpanded = expanded.includes(item.id);
          return (
            <div key={item.id} className={isExpanded ? 'sa-menu-expanded' : ''}>
              <button
                onClick={() => onToggle(item.id)}
                className="w-full flex items-center justify-between py-[7px] px-3 rounded-lg text-[#3c4a46] font-medium hover:bg-[#e8e8ea] transition-all"
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
                  <span className="text-[12.5px] font-semibold truncate">{item.label}</span>
                </div>
                <span className="material-symbols-outlined sa-rotate-icon" style={{ fontSize: '15px' }}>chevron_right</span>
              </button>
              <div className="sa-submenu pl-9 pr-2 space-y-px">
                {item.children.map((child) => (
                  <button
                    key={child}
                    onClick={() => onItemClick(child)}
                    className={`block w-full text-left py-[5px] px-2.5 text-[12px] rounded-md transition-colors ${activeItem === child
                      ? 'text-[#006b5c] font-semibold bg-[#006b5c]/5'
                      : 'text-[#3c4a46] hover:text-[#006b5c]'
                      }`}
                  >
                    {child}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="mt-auto pt-2 space-y-1 border-t border-[#e2e2e5]">
        <div className="px-3 py-1">
          <span className="text-[9px] font-bold text-[#006b5c] uppercase tracking-widest bg-[#006b5c]/10 px-2 py-0.5 rounded flex items-center gap-1.5">
            <span className="relative w-1.5 h-1.5 rounded-full bg-[#006b5c] animate-pulse" />
            System: Optimal
          </span>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg text-[#ba1a1a] font-medium hover:bg-[#ffdad6]/40 transition-colors duration-200"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>logout</span>
          <span className="text-[12.5px] font-semibold">Sign Out</span>
        </button>
      </div>
    </>
  );
}

// ─── Main Page Component ────────────────────────────────────────────────────

export default function SuperadminPage() {
  const navigate = useNavigate();

  // State
  const [expanded, setExpanded] = useState([]);
  const [activeItem, setActiveItem] = useState('dashboard');
  const [viewingSchool, setViewingSchool] = useState(null);
  const [search, setSearch] = useState('');
  const [chartRange, setChartRange] = useState('12m');
  const [chartKey, setChartKey] = useState(0);
  
  const [stats, setStats] = useState({
    totalSchools: 0,
    activeSchools: 0,
    recentSchools: []
  });
  const [schools, setSchools] = useState(INITIAL_SCHOOLS);
  const [inquiries, setInquiries] = useState(INITIAL_INQUIRIES);
  
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [showSchoolOnboardModal, setShowSchoolOnboardModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Demo Onboard form
  const [onboardForm, setOnboardForm] = useState({ name: '', email: '', duration: '14 Days' });
  const [onboardErrors, setOnboardErrors] = useState({});

  // School Onboard form
  const [schoolOnboardForm, setSchoolOnboardForm] = useState({ name: '', email: '', plan: 'Starter' });
  const [schoolOnboardErrors, setSchoolOnboardErrors] = useState({});

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/superadmin/tenants/dashboard-stats`, { withCredentials: true });
        setStats(res.data);
        // Also update local mock for schools table to use real recent schools
        if (res.data.recentSchools && res.data.recentSchools.length > 0) {
          setSchools(res.data.recentSchools);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats', error);
      }
    };
    if (activeItem === 'dashboard') {
      fetchStats();
    }
  }, [activeItem]);

  // Dark mode toggle
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);

  // Sidebar toggle
  const toggleSubmenu = useCallback((id) => {
    setExpanded((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  // Chart range change
  const handleChartRange = (val) => {
    setChartRange(val);
    setChartKey((k) => k + 1); // restart animation
  };

  // Filter helper
  const q = search.toLowerCase();
  const filteredSchools = schools.filter(
    (s) => s.name.toLowerCase().includes(q) || s.status.toLowerCase().includes(q)
  );
  const filteredInquiries = inquiries.filter(
    (d) => d.requester.toLowerCase().includes(q) || d.school.toLowerCase().includes(q)
  );

  // Onboard submit
  const handleOnboard = (e) => {
    e.preventDefault();
    const errs = {};
    if (!onboardForm.name.trim()) errs.name = 'School name is required';
    if (!onboardForm.email.trim()) errs.email = 'Admin email is required';
    else if (!/\S+@\S+\.\S+/.test(onboardForm.email)) errs.email = 'Invalid email format';
    if (Object.keys(errs).length) { setOnboardErrors(errs); return; }

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setSchools((prev) => [{ name: onboardForm.name, date: today, status: 'Trial' }, ...prev]);
    setShowOnboardModal(false);
    setOnboardForm({ name: '', email: '', duration: '14 Days' });
    setOnboardErrors({});
    setToast({ message: `${onboardForm.name} demo onboarded successfully!`, type: 'success' });
  };

  // School Onboard submit
  const handleSchoolOnboard = (e) => {
    e.preventDefault();
    const errs = {};
    if (!schoolOnboardForm.name.trim()) errs.name = 'School name is required';
    if (!schoolOnboardForm.email.trim()) errs.email = 'Admin email is required';
    else if (!/\S+@\S+\.\S+/.test(schoolOnboardForm.email)) errs.email = 'Invalid email format';
    if (Object.keys(errs).length) { setSchoolOnboardErrors(errs); return; }

    const today = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    setSchools((prev) => [{ name: schoolOnboardForm.name, date: today, status: 'Active' }, ...prev]);
    setShowSchoolOnboardModal(false);
    setSchoolOnboardForm({ name: '', email: '', plan: 'Starter' });
    setSchoolOnboardErrors({});
    setToast({ message: `${schoolOnboardForm.name} onboarded successfully!`, type: 'success' });
  };

  // Chart data
  const chart = CHART_DATA[chartRange];

  // Sidebar shared props
  const sidebarProps = {
    expanded,
    onToggle: toggleSubmenu,
    activeItem,
    onItemClick: setActiveItem,
    onSignOut: () => navigate('/'),
  };

  return (
    <div className={`flex h-screen overflow-hidden font-['Inter'] ${dark ? 'bg-[#1a1c1e] text-[#f0f0f3]' : 'bg-[#f9f9fc] text-[#1a1c1e]'}`}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col h-screen py-3 px-2 border-r shrink-0 overflow-y-auto sa-scrollbar w-56 lg:w-60 ${dark ? 'border-[#3c4a46]/60 bg-gradient-to-b from-[#2f3133] to-[#262829]' : 'border-[#e2e2e5]/60 bg-gradient-to-b from-[#f7f7fa] to-[#eeeeef]'
          }`}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <div className="sa-mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className={`sa-mobile-drawer flex flex-col py-2 px-3 ${dark ? 'bg-[#2f3133]' : ''}`}>
            <SidebarContent {...sidebarProps} />
          </div>
        </>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-y-auto sa-scrollbar">
        {/* Top Navigation */}
        <header className={`flex justify-between items-center h-16 px-6 sticky top-0 z-50 w-full border-b backdrop-blur-[24px] ${dark ? 'border-[#3c4a46]/60 bg-[#1a1c1e]/90' : 'border-[#e2e2e5]/60 bg-[#f9f9fc]/90'
          }`}>
          <div className="flex items-center gap-2">
            {/* Mobile hamburger */}
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-[#e8e8ea] dark:hover:bg-[#3c4a46]"
              onClick={() => setMobileOpen(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu</span>
            </button>

            {/* Mobile logo */}
            <img src="/favicon.svg" alt="ERPZO" className="md:hidden w-7 h-7 rounded shrink-0" />

            {/* Search */}
            <div className="relative hidden sm:block ml-2">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8b9896] pointer-events-none" style={{ fontSize: '18px' }}>search</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={`sa-input pl-10 pr-4 h-10 rounded-xl border outline-none text-[13px] w-64 md:w-80 lg:w-96 transition-all focus:ring-2 focus:ring-[#006b5c]/20 ${dark ? 'bg-[#2f3133] border-[#6c7a76] text-[#f0f0f3] placeholder-[#8b9896]' : 'bg-[#f3f3f6] border-[#e2e2e5] text-[#1a1c1e] placeholder-[#8b9896]'
                  }`}
                style={{ boxShadow: 'none' }}
                placeholder="     Search..."
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick links */}
            <div className={`hidden md:flex items-center gap-2 mr-2 border-r pr-4 ${dark ? 'border-[#6c7a76]' : 'border-[#e2e2e5]'}`}>
              <button className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                dark ? 'text-[#f0f0f3] hover:bg-[#3c4a46]' : 'text-[#3c4a46] hover:bg-[#eeeef0]'
              }`}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00c49a] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00c49a]"></span>
                </span>
                Platform Status
              </button>
              <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                dark ? 'text-[#f0f0f3] hover:bg-[#3c4a46]' : 'text-[#3c4a46] hover:bg-[#eeeef0]'
              }`}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>manage_search</span>
                Audit Logs
              </button>
            </div>

            {/* Dark mode toggle */}
            <button
              onClick={() => setDark(!dark)}
              className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-[#3c4a46] text-[#f0f0f3]' : 'hover:bg-[#eeeef0] text-[#3c4a46]'}`}
              title="Toggle dark mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>

            {/* Notifications */}
            <button className={`p-1.5 rounded-full relative transition-colors ${dark ? 'hover:bg-[#3c4a46] text-[#f0f0f3]' : 'hover:bg-[#eeeef0] text-[#3c4a46]'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#ba1a1a] rounded-full border border-[#f9f9fc]" />
            </button>

            {/* Apps */}
            <button className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-[#3c4a46] text-[#f0f0f3]' : 'hover:bg-[#eeeef0] text-[#3c4a46]'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>apps</span>
            </button>

            {/* Avatar */}
            <div className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-offset-1 ${dark ? 'ring-[#006b5c]/50 ring-offset-[#1a1c1e] bg-[#3c4a46]' : 'ring-[#006b5c]/30 ring-offset-white bg-gradient-to-br from-[#006b5c] to-[#00897b]'}`}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>person</span>
            </div>
          </div>
        </header>

        {/* ── Dashboard Content ── */}
        {activeItem === 'dashboard' && (
          <div className="p-3 md:p-5 lg:p-6 space-y-4 mx-auto w-full max-w-[1600px]">
          {/* Welcome Section */}
          <section className="flex flex-col md:flex-row md:items-end justify-between gap-3 sa-section-animate">
            <div>
              <h2 className="text-xl lg:text-2xl font-bold tracking-tight">Overview Dashboard</h2>
              <p className={`text-[12px] mt-1 ${dark ? 'text-[#bbcac4]' : 'text-[#6c7a76]'}`}>
                Platform performance and ecosystem health for {new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}.
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <button className={`sa-btn-press flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold transition-all shadow-sm ${dark
                ? 'bg-[#2f3133] border border-[#4a5854] text-[#f0f0f3] hover:bg-[#3c4a46] hover:border-[#6c7a76]'
                : 'bg-white border border-[#e2e2e5] text-[#3c4a46] hover:bg-[#f3f3f6] hover:border-[#d4d4d8] hover:shadow-md'
                }`}>
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>download</span>
                Export Report
              </button>
              <button
                onClick={() => setShowOnboardModal(true)}
                className="sa-btn-press flex items-center gap-1.5 sa-gradient-primary text-white px-4 py-2 rounded-xl text-[12px] font-semibold hover:shadow-lg hover:shadow-[#006b5c]/25 hover:scale-[1.02] transition-all"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>rocket_launch</span>
                Demo Onboarding
              </button>
            </div>
          </section>

          {/* KPI Cards */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sa-section-animate" style={{ animationDelay: '0.05s' }}>
            {[{
              label: 'Total MRR', value: '$248.5k', icon: 'payments', color: '#006b5c',
              badge: <><span className="material-symbols-outlined mr-0.5" style={{ fontSize: '11px' }}>trending_up</span>+12.4%</>,
              badgeExtra: 'vs last month',
            }, {
              label: 'Active Tenants', value: String(stats.activeSchools || 0), icon: 'domain', color: '#0060ac',
              badge: <><span className="material-symbols-outlined mr-0.5" style={{ fontSize: '11px' }}>school</span>{(stats.totalSchools || 0) - (stats.activeSchools || 0)} Suspended/Pending</>,
            }, {
              label: 'New Leads', value: String(inquiries.length), icon: 'person_add', color: '#9d4224',
              badge: <><span className="material-symbols-outlined mr-0.5" style={{ fontSize: '11px' }}>bolt</span>High Intent</>,
            }, {
              label: 'System Health', value: '99.98%', icon: 'monitor_heart', color: '#006b5c', isHealth: true,
            }].map((kpi, idx) => (
              <div key={kpi.label} className={`sa-card p-3.5 lg:p-4 rounded-2xl flex flex-col justify-between border ${dark ? 'bg-[#2f3133] border-[#3c4a46]/60 hover:border-[#006b5c]/40' : 'bg-white border-[#e8e8ea] hover:border-[#006b5c]/25'
                }`} style={{ animationDelay: `${idx * 0.06}s` }}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className={`text-[10px] uppercase tracking-[0.08em] font-semibold ${dark ? 'text-[#8b9896]' : 'text-[#6c7a76]'}`}>{kpi.label}</p>
                    <h3 className={`text-lg lg:text-xl font-bold mt-1 ${kpi.isHealth ? 'text-[#006b5c]' : ''}`}>{kpi.value}</h3>
                  </div>
                  <div className="p-2 rounded-xl" style={{ background: `${kpi.color}12`, color: kpi.color }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{kpi.icon}</span>
                  </div>
                </div>
                <div className="mt-3">
                  {kpi.isHealth ? (
                    <div className={`w-full rounded-full h-1.5 overflow-hidden ${dark ? 'bg-[#3c4a46]' : 'bg-[#eeeef0]'}`}>
                      <div className="bg-gradient-to-r from-[#006b5c] to-[#00c49a] h-full rounded-full transition-all duration-1000" style={{ width: '99%' }} />
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <span className="sa-badge-pill flex items-center font-bold text-[10px] px-2 py-0.5 rounded-md" style={{ background: `${kpi.color}12`, color: kpi.color }}>
                        {kpi.badge}
                      </span>
                      {kpi.badgeExtra && <span className={`text-[10px] ${dark ? 'text-[#8b9896]' : 'text-[#9ca3a1]'}`}>{kpi.badgeExtra}</span>}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </section>

          {/* Revenue Trends */}
          <section className={`sa-card p-4 lg:p-5 rounded-xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]/50'
            }`}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <h4 className="text-[15px] font-semibold">Revenue Trends</h4>
                <p className={`text-[11px] mt-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Annual MRR growth across all school tiers.</p>
              </div>
              <select
                value={chartRange}
                onChange={(e) => handleChartRange(e.target.value)}
                className="sa-select"
              >
                <option value="12m">Last 12 Months</option>
                <option value="3y">Last 3 Years</option>
              </select>
            </div>
            <div className="sa-chart-container flex items-end justify-between gap-1">
              <svg key={chartKey} className="absolute inset-0 w-full h-full" viewBox="0 0 1000 240" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sa-gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#006b5c" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#006b5c" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="sa-revenue-line-path" d={chart.path} fill="none" stroke="#006b5c" strokeWidth="4" strokeLinecap="round" />
                <path d={chart.fill} fill="url(#sa-gradient)" />
              </svg>
              <div className="absolute bottom-0 left-0 w-full flex justify-between px-1">
                {chart.labels.map((lbl) => (
                  <span key={lbl} className={`text-[10px] font-bold ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>{lbl}</span>
                ))}
              </div>
            </div>
          </section>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {/* Recent Onboarding Schools */}
            <section className={`sa-card p-4 lg:p-5 rounded-xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]/50'
              }`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="text-[15px] font-semibold">Recent Onboarding Schools</h4>
                  <p className={`text-[11px] mt-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Latest registrations and current status.</p>
                </div>
                <button className="text-[#006b5c] text-[11px] font-semibold hover:underline">View All</button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
                    <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>
                      <th className="py-2 px-2.5">School Name</th>
                      <th className="py-2 px-2.5">Date</th>
                      <th className="py-2 px-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {filteredSchools.length === 0 ? (
                      <tr>
                        <td colSpan={3} className={`py-8 text-center ${dark ? 'text-[#6c7a76]' : 'text-[#6c7a76]'}`}>
                          No schools match your search.
                        </td>
                      </tr>
                    ) : (
                      filteredSchools.map((school, i) => (
                        <tr
                          key={`${school.name}-${i}`}
                          className={`sa-row-enter border-b transition-colors ${dark
                            ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30'
                            : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'
                            }`}
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          <td className="py-2.5 px-2.5 font-medium">{school.name}</td>
                          <td className={`py-2.5 px-2.5 ${dark ? 'text-[#bbcac4]' : ''}`}>{school.date}</td>
                          <td className="py-2.5 px-2.5"><StatusBadge status={school.status} /></td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* School Inquiries */}
            <section className={`sa-card p-4 lg:p-5 rounded-xl border ${dark ? 'bg-[#2f3133] border-[#3c4a46]' : 'bg-white border-[#e2e2e5]/50'
              }`}>
              <div className="flex justify-between items-center mb-3">
                <div>
                  <h4 className="text-[15px] font-semibold">School Inquiries</h4>
                  <p className={`text-[11px] mt-0.5 ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>Incoming requests from prospective institutions.</p>
                </div>
                <button
                  onClick={() => setActiveItem('School Inquiries')}
                  className="text-[#006b5c] text-[11px] font-semibold hover:underline"
                >
                  View All
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className={`border-b ${dark ? 'border-[#3c4a46]' : 'border-[#e2e2e5]'}`}>
                    <tr className={`text-[10px] uppercase tracking-wider ${dark ? 'text-[#bbcac4]' : 'text-[#3c4a46]'}`}>
                      <th className="py-2 px-2.5">School Name</th>
                      <th className="py-2 px-2.5">Contact Person</th>
                      <th className="py-2 px-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="text-[12px]">
                    {filteredInquiries.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-[#6c7a76]">
                          {inquiries.length === 0 ? 'All inquiries have been processed.' : 'No requests match your search.'}
                        </td>
                      </tr>
                    ) : (
                      filteredInquiries.map((inq, i) => (
                        <tr
                          key={inq.id}
                          className={`sa-row-enter border-b transition-colors ${dark
                            ? 'border-[#3c4a46]/50 hover:bg-[#3c4a46]/30'
                            : 'border-[#e2e2e5]/30 hover:bg-[#f3f3f6]'
                            }`}
                          style={{ animationDelay: `${i * 0.05}s` }}
                        >
                          <td className="py-2.5 px-2.5 font-medium">{inq.school}</td>
                          <td className={`py-2.5 px-2.5 ${dark ? 'text-[#bbcac4]' : ''}`}>{inq.requester}</td>
                          <td className="py-2.5 px-2.5 text-right">
                            <button
                              onClick={() => setActiveItem('School Inquiries')}
                              className="text-[#006b5c] font-semibold text-[11px] hover:underline"
                            >
                              Review
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          </div>
        )}

        {/* ── Manage Schools View ── */}
        {activeItem === 'Manage Schools' && (
          <ManageSchoolsView 
            dark={dark} 
            setShowOnboardModal={setShowSchoolOnboardModal} 
            onViewSchool={(id, name) => {
              setViewingSchool({ id, name });
              setActiveItem('School Details');
            }} 
          />
        )}

        {/* ── School Inquiries View ── */}
        {activeItem === 'School Inquiries' && (
          <SchoolInquiriesView dark={dark} setShowDemoOnboardModal={setShowOnboardModal} />
        )}

        {activeItem === 'School Details' && viewingSchool && (
          <SchoolDetailsView 
            dark={dark}
            schoolId={viewingSchool.id}
            schoolName={viewingSchool.name}
            onBack={() => setActiveItem('Manage Schools')}
          />
        )}

        {/* ── Other Views ── */}
        {activeItem === 'Role & Permission' && <RolePermissionView dark={dark} />}
        {activeItem === 'Staff' && <StaffView dark={dark} />}
        {activeItem === 'Package' && <PackageView dark={dark} />}
        {activeItem === 'Addons' && <AddonsView dark={dark} />}
        {activeItem === 'Features' && <FeaturesView dark={dark} />}
        {activeItem === 'Subscription' && <SubscriptionView dark={dark} />}
        {activeItem === 'Transactions' && <TransactionsView dark={dark} />}
        {activeItem === 'Coupons & Discounts' && <CouponsView dark={dark} />}
        {activeItem === 'Email Schools' && <EmailSchoolsView dark={dark} />}
        {activeItem === 'SMS / WhatsApp' && <SmsWhatsappView dark={dark} />}
        {activeItem === 'Platform Analytics' && <PlatformAnalyticsView dark={dark} />}
        {activeItem === 'Revenue Reports' && <RevenueReportsView dark={dark} />}
        {activeItem === 'Usage Reports' && <UsageReportsView dark={dark} />}
        {activeItem === 'Ticket Inbox' && <TicketInboxView dark={dark} />}
        {activeItem === 'Knowledge Base' && <KnowledgeBaseView dark={dark} />}
        {activeItem === 'Audit Logs' && <AuditLogsView dark={dark} />}
        {activeItem === 'Login Activity' && <LoginActivityView dark={dark} />}
        {activeItem === 'Impersonation Logs' && <ImpersonationLogsView dark={dark} />}
        {activeItem === 'Templates' && <TemplatesView dark={dark} />}
        {activeItem === 'Push History' && <PushHistoryView dark={dark} />}
        {activeItem === 'contact' && <ContactInquiryView dark={dark} />}
        {activeItem === 'System Settings' && <SystemSettingsView dark={dark} />}
        {activeItem === 'Web Settings' && <WebSettingsView dark={dark} />}
        {activeItem === 'Academy Setup' && <AcademySetupView dark={dark} />}
        {activeItem === 'Database Backup' && <DatabaseBackupView dark={dark} />}
        {activeItem === 'System Update' && <SystemUpdateView dark={dark} />}
        {activeItem === 'Documentation' && <DocumentationView dark={dark} />}
        {activeItem === 'API Settings' && <ApiSettingsView dark={dark} />}
        {activeItem === 'White-label' && <WhiteLabelView dark={dark} />}

        {/* Footer */}
        <footer className="p-4 text-center">
          <p className={`text-xs ${dark ? 'text-[#6c7a76]' : 'text-[#3c4a46] opacity-60'}`}>
            © {new Date().getFullYear()} ERPZO SaaS Solutions. All rights reserved. Version 4.1.2-Stable.
          </p>
        </footer>
      </main>

      {/* ── Demo Onboard Modal ── */}
      {showOnboardModal && (
        <Modal title="Demo Onboarding" onClose={() => { setShowOnboardModal(false); setOnboardErrors({}); }}>
          <form onSubmit={handleOnboard} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>School Name</label>
              <input
                className="sa-input"
                placeholder="e.g. Springfield Academy"
                value={onboardForm.name}
                onChange={(e) => setOnboardForm({ ...onboardForm, name: e.target.value })}
              />
              {onboardErrors.name && <p className="text-[#ba1a1a] text-xs mt-1">{onboardErrors.name}</p>}
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>Admin Email</label>
              <input
                type="email"
                className="sa-input"
                placeholder="admin@school.edu"
                value={onboardForm.email}
                onChange={(e) => setOnboardForm({ ...onboardForm, email: e.target.value })}
              />
              {onboardErrors.email && <p className="text-[#ba1a1a] text-xs mt-1">{onboardErrors.email}</p>}
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>Trial Duration</label>
              <select
                className="sa-input"
                value={onboardForm.duration}
                onChange={(e) => setOnboardForm({ ...onboardForm, duration: e.target.value })}
              >
                <option>7 Days</option>
                <option>14 Days</option>
                <option>1 Month</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowOnboardModal(false); setOnboardErrors({}); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${dark ? 'bg-[#3c4a46] text-[#f0f0f3] hover:bg-[#6c7a76]' : 'bg-[#eeeef0] text-[#3c4a46] hover:bg-[#e2e2e5]'
                  }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                Create Demo
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── School Onboard Modal ── */}
      {showSchoolOnboardModal && (
        <Modal title="Onboard New School" onClose={() => { setShowSchoolOnboardModal(false); setSchoolOnboardErrors({}); }}>
          <form onSubmit={handleSchoolOnboard} className="space-y-4">
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>School Name</label>
              <input
                className="sa-input"
                placeholder="e.g. Springfield Academy"
                value={schoolOnboardForm.name}
                onChange={(e) => setSchoolOnboardForm({ ...schoolOnboardForm, name: e.target.value })}
              />
              {schoolOnboardErrors.name && <p className="text-[#ba1a1a] text-xs mt-1">{schoolOnboardErrors.name}</p>}
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>Admin Email</label>
              <input
                type="email"
                className="sa-input"
                placeholder="admin@school.edu"
                value={schoolOnboardForm.email}
                onChange={(e) => setSchoolOnboardForm({ ...schoolOnboardForm, email: e.target.value })}
              />
              {schoolOnboardErrors.email && <p className="text-[#ba1a1a] text-xs mt-1">{schoolOnboardErrors.email}</p>}
            </div>
            <div>
              <label className={`block text-sm font-semibold mb-1.5 ${dark ? 'text-[#f0f0f3]' : 'text-[#1a1c1e]'}`}>Subscription Plan</label>
              <select
                className="sa-input"
                value={schoolOnboardForm.plan}
                onChange={(e) => setSchoolOnboardForm({ ...schoolOnboardForm, plan: e.target.value })}
              >
                <option>Starter</option>
                <option>Growth</option>
                <option>Enterprise</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => { setShowSchoolOnboardModal(false); setSchoolOnboardErrors({}); }}
                className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-colors ${dark ? 'bg-[#3c4a46] text-[#f0f0f3] hover:bg-[#6c7a76]' : 'bg-[#eeeef0] text-[#3c4a46] hover:bg-[#e2e2e5]'
                  }`}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 rounded-xl bg-[#006b5c] text-white text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all"
              >
                Onboard School
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── Toast ── */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}
