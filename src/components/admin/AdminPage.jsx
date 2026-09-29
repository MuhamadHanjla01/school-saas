import '../shared/ClassicAdmin.css';
import SupportView from './SupportView';
import EducationView, { EDUCATION_VIEWS } from './EducationView';
import '../shared/AdminWorkspace.css';
import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AdminDashboard from './AdminDashboard';
import StudentsView from './StudentsView';
import TeachersView from './TeachersView';
import ClassesView from './ClassesView';
import AttendanceView from './AttendanceView';
import FeesView from './FeesView';
import ExamsView from './ExamsView';
import TimetableView from './TimetableView';
import NoticesView from './NoticesView';
import SchoolSettingsView from './SchoolSettingsView';
import SubjectsView from './SubjectsView';
import AssignmentsView from './AssignmentsView';
import CommunicationView from './CommunicationView';
import CalendarView from './CalendarView';
import GradebookView from './GradebookView';
import LibraryView from './LibraryView';
import TransportView from './TransportView';
import HealthRecordsView from './HealthRecordsView';
import CertificatesView from './CertificatesView';
import LaboratoryView from './LaboratoryView';
import StaffView from './StaffView';
import AdmissionsView from './AdmissionsView';
import ParentsView from './ParentsView';
import PaymentGatewayView from './PaymentGatewayView';
import ReportsView from './ReportsView';
import DocumentsView from './DocumentsView';
import AuditLogsView from './AuditLogsView';
import UserRolesView from './UserRolesView';
import MyProfileView from './MyProfileView';
import PlaceholderView from './PlaceholderView';
import { Modal, Toast } from './AdminUI';
import './AdminPage.css';

// ─── Sidebar Items ──────────────────────────────────────────────────────────

const SIDEBAR_ITEMS = [
  { id: 'institution', label: 'Institution & Programs', icon: 'account_balance', type: 'group', children: ['Campuses','Departments','Programs','Academic Terms','Program Courses','Enrollment History'] },
  { id: 'dashboard', label: 'Dashboard', icon: 'dashboard', type: 'link' },
  { id: 'academics', label: 'Academics', icon: 'school', type: 'group',
    children: [
      'Student Management', 'Teacher Management', 'Staff Management', 
      'Classes & Sections', 'Subjects', 'Timetable', 'Attendance', 
      'Assignment Management', 'Gradebook & Report Cards', 'Exam Management'
    ]
  },
  { id: 'admissions', label: 'Admissions', icon: 'how_to_reg', type: 'group',
    children: ['Admission Management', 'Parent Management']
  },
  { id: 'finance', label: 'Finance', icon: 'payments', type: 'group',
    children: ['Fee Management', 'Payment Gateway', 'Individual Invoices', 'Invoice Receipts']
  },
  { id: 'services', label: 'School Services', icon: 'local_library', type: 'group',
    children: ['Library', 'Laboratory', 'Transport', 'Transport Stops', 'Transport Assignments', 'Hostel Rooms', 'Hostel Allocations', 'Health Records', 'Certificates']
  },
  { id: 'communication', label: 'Communication', icon: 'forum', type: 'group',
    children: ['Communication Center', 'Academic Calendar', 'Notifications']
  },
  { id: 'reports', label: 'Reports', icon: 'monitoring', type: 'group',
    children: ['Reports & Analytics', 'Document Management', 'Audit Logs']
  },
  { id: 'admin', label: 'Administration', icon: 'admin_panel_settings', type: 'group',
    children: ['User & Role Management', 'Staff Leave', 'Payroll', 'School Settings', 'My Profile', 'Platform Support']
  },
];

const MAPPED_VIEWS = [...Object.keys(EDUCATION_VIEWS), 'Platform Support',
  'dashboard', 'Student Management', 'Teacher Management', 'Classes & Sections',
  'Subjects', 'Assignment Management', 'Attendance', 'Fee Management', 'Exam Management', 'Timetable', 'Communication Center', 'Academic Calendar', 'Notifications',
  'School Settings', 'Gradebook & Report Cards', 'Library', 'Transport', 'Health Records', 'Certificates', 'Laboratory',
  'Staff Management', 'Admission Management', 'Parent Management', 'Payment Gateway', 'Reports & Analytics', 'Document Management', 'Audit Logs', 'User & Role Management', 'My Profile'
];

// ─── Helper Components ───────────────────────────────────────────────────────

// ─── Helper Components removed to AdminUI ───

// ─── Sidebar ─────────────────────────────────────────────────────────────────

function SidebarContent({ expanded, onToggle, activeItem, onItemClick, onSignOut, schoolName }) {
  return (
    <>
      {/* Logo */}
      <div className="mb-6 px-3 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center shadow-md">
          <span className="material-symbols-outlined text-white" style={{ fontSize: '20px' }}>admin_panel_settings</span>
        </div>
        <div className="min-w-0">
          <h1 className="text-[15px] font-bold text-primary tracking-tight leading-none">{schoolName || 'Your School'}</h1>
          <span className="text-[10px] font-medium text-on-surface-variant opacity-70">Admin Portal</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-px admin-scrollbar overflow-y-auto overflow-x-hidden pb-4">
        {SIDEBAR_ITEMS.map((item) => {
          if (item.type === 'link') {
            const isActive = activeItem === item.id || activeItem === item.label;
            return (
              <button
                key={item.id}
                onClick={() => onItemClick(item.id)}
                className={`w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg transition-all duration-200 ${isActive
                  ? 'text-primary font-bold bg-primary/10 border-l-[3px] border-primary'
                  : 'text-on-surface-variant font-medium hover:bg-surface-container-high border-l-[3px] border-transparent'
                  }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
                <span className="text-[12.5px] font-semibold truncate">{item.label}</span>
              </button>
            );
          }

          const isExpanded = expanded.includes(item.id);
          // Auto-expand if the active item is inside this group
          const hasActiveChild = item.children.includes(activeItem);
          const shouldExpand = isExpanded || hasActiveChild;

          return (
            <div key={item.id} className={shouldExpand ? 'admin-menu-expanded' : ''}>
              <button
                onClick={() => onToggle(item.id)}
                className={`w-full flex items-center justify-between py-[7px] px-3 rounded-lg font-medium transition-all ${hasActiveChild ? 'text-primary' : 'text-on-surface-variant hover:bg-surface-container-high'}`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>{item.icon}</span>
                  <span className="text-[12.5px] font-semibold truncate">{item.label}</span>
                </div>
                <span className={`material-symbols-outlined admin-rotate-icon ${hasActiveChild && !isExpanded ? 'rotate-90' : ''}`} style={{ fontSize: '15px' }}>chevron_right</span>
              </button>
              <div className="admin-submenu pl-9 pr-2 space-y-px mt-0.5">
                {item.children.map((child) => (
                  <button
                    key={child}
                    onClick={() => onItemClick(child)}
                    className={`block w-full text-left py-[6px] px-2.5 text-[12px] rounded-md transition-colors ${activeItem === child
                      ? 'text-primary font-bold bg-primary/5 shadow-sm'
                      : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-highest/30'
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
      <div className="mt-auto pt-3 space-y-1 border-t border-outline-variant/40 shrink-0">
        <div className="px-3 py-1">
          <span className="text-[9px] font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-0.5 rounded flex items-center gap-1.5 w-fit">
            <span className="relative w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            School administration
          </span>
        </div>
        <button
          onClick={onSignOut}
          className="w-full flex items-center gap-2.5 py-[7px] px-3 rounded-lg text-error font-medium hover:bg-error-container/40 transition-colors duration-200"
        >
          <span className="material-symbols-outlined" style={{ fontSize: '19px' }}>logout</span>
          <span className="text-[12.5px] font-semibold">Sign Out</span>
        </button>
      </div>
    </>
  );
}

// ─── Main Admin Page ─────────────────────────────────────────────────────────

export default function AdminPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [expanded, setExpanded] = useState([]);
  const [viewParams, setViewParams] = useSearchParams();
  const requestedView = viewParams.get('view') || 'dashboard';
  const activeItem = MAPPED_VIEWS.includes(requestedView) ? requestedView : 'dashboard';
  const setActiveItem = item => setViewParams(item === 'dashboard' ? {} : { view: item });
  const [navSearch, setNavSearch] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('erpzo.theme') === 'dark');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('erpzo.theme', dark ? 'dark' : 'light');
    return () => document.documentElement.classList.remove('dark');
  }, [dark]);

  const toggleSubmenu = useCallback((id) => {
    setExpanded((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }, []);

  const handleSignOut = async () => {
    await logout();
    navigate('/login');
  };

  const sidebarProps = {
    expanded,
    onToggle: toggleSubmenu,
    activeItem,
    onItemClick: (item) => { setActiveItem(item); setMobileOpen(false); },
    onSignOut: handleSignOut,
    schoolName: user?.schoolName,
  };

  return (
    <div className={`school-workspace classic-admin flex h-screen overflow-hidden font-['Inter'] ${dark ? 'bg-[#1a1c1e] text-[#f0f0f3]' : 'bg-surface text-on-background'}`}>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col h-screen py-3 px-2 border-r shrink-0 overflow-y-auto admin-scrollbar w-[260px] lg:w-[280px] ${dark ? 'border-[#3c4a46]/60 bg-gradient-to-b from-[#2f3133] to-[#262829]' : 'border-outline-variant/60 bg-gradient-to-b from-[#f7f7fa] to-[#eeeeef]'
          }`}
      >
        <SidebarContent {...sidebarProps} />
      </aside>

      {/* ── Mobile Drawer ── */}
      {mobileOpen && (
        <>
          <div className="admin-mobile-drawer-overlay" onClick={() => setMobileOpen(false)} />
          <div className={`admin-mobile-drawer flex flex-col py-2 px-3 w-[280px] ${dark ? 'bg-[#2f3133]' : ''}`}>
            <SidebarContent {...sidebarProps} />
          </div>
        </>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col overflow-y-auto admin-scrollbar">
        {/* Top Nav */}
        <header className={`flex justify-between items-center h-16 px-6 sticky top-0 z-50 w-full border-b backdrop-blur-[24px] ${dark ? 'border-[#3c4a46]/60 bg-[#1a1c1e]/90' : 'border-outline-variant/60 bg-surface/90'
          }`}>
          <div className="flex items-center gap-2">
            <button
              className="md:hidden p-1.5 rounded-lg hover:bg-surface-container-high"
              aria-label="Open navigation" onClick={() => setMobileOpen(true)}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>menu</span>
            </button>
            <div className="md:hidden w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-primary-container flex items-center justify-center">
              <span className="material-symbols-outlined text-white" style={{ fontSize: '14px' }}>school</span>
            </div>
            <div className="relative hidden sm:block ml-2">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-outline pointer-events-none" style={{ fontSize: '18px' }}>search</span>
              <input
                type="text"
                className="admin-input pl-10 pr-4 h-10 rounded-xl w-64 md:w-80 lg:w-96"
                aria-label="Find a page" value={navSearch} onChange={e => setNavSearch(e.target.value)} placeholder="     Find a page…"
              />
              {navSearch && <div className="absolute top-full left-0 w-full mt-2 rounded-xl border bg-white dark:bg-[#23332d] shadow-lg max-h-72 overflow-auto z-50">{MAPPED_VIEWS.filter(v => v.toLowerCase().includes(navSearch.toLowerCase())).map(v => <button className="block w-full text-left p-3 hover:bg-primary/10" key={v} onClick={() => {setActiveItem(v);setNavSearch('');}}>{v === 'dashboard' ? 'Dashboard' : v}</button>)}</div>}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden lg:block text-right mr-3"><p className="text-sm font-semibold">{user?.schoolName}</p><p className="text-xs text-outline">{user?.email}</p></div>

            <button
              onClick={() => setDark(!dark)}
              className={`p-1.5 rounded-full transition-colors ${dark ? 'hover:bg-[#3c4a46] text-[#f0f0f3]' : 'hover:bg-surface-container text-on-surface-variant'}`}
              title="Toggle dark mode"
            >
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>{dark ? 'light_mode' : 'dark_mode'}</span>
            </button>

            <button aria-label="Open notifications" onClick={() => setActiveItem('Notifications')} className={`p-1.5 rounded-full relative transition-colors ${dark ? 'hover:bg-[#3c4a46] text-[#f0f0f3]' : 'hover:bg-surface-container text-on-surface-variant'}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>notifications</span>

            </button>

            <div className={`h-8 w-8 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-offset-1 ${dark ? 'ring-primary/50 ring-offset-[#1a1c1e] bg-[#3c4a46]' : 'ring-primary/30 ring-offset-white bg-gradient-to-br from-primary to-[#00897b]'}`}>
              <span className="material-symbols-outlined text-white" style={{ fontSize: '16px' }}>person</span>
            </div>
          </div>
        </header>

        {/* ── Views ── */}
        {activeItem === 'dashboard' && <AdminDashboard dark={dark} onNavigate={setActiveItem} />}
        {EDUCATION_VIEWS[activeItem] && <EducationView view={activeItem} />}
        {activeItem === 'Student Management' && <StudentsView dark={dark} />}
        {activeItem === 'Teacher Management' && <TeachersView dark={dark} />}
        {activeItem === 'Classes & Sections' && <ClassesView dark={dark} />}
        {activeItem === 'Subjects' && <SubjectsView dark={dark} />}
        {activeItem === 'Assignment Management' && <AssignmentsView dark={dark} />}
        {activeItem === 'Attendance' && <AttendanceView dark={dark} />}
        {activeItem === 'Fee Management' && <FeesView dark={dark} />}
        {activeItem === 'Exam Management' && <ExamsView dark={dark} />}
        {activeItem === 'Gradebook & Report Cards' && <GradebookView dark={dark} />}
        {activeItem === 'Timetable' && <TimetableView dark={dark} />}
        {activeItem === 'Communication Center' && <CommunicationView dark={dark} />}
        {activeItem === 'Academic Calendar' && <CalendarView dark={dark} />}
        {activeItem === 'Library' && <LibraryView dark={dark} />}
        {activeItem === 'Transport' && <TransportView dark={dark} />}
        {activeItem === 'Health Records' && <HealthRecordsView dark={dark} />}
        {activeItem === 'Certificates' && <CertificatesView dark={dark} />}
        {activeItem === 'Laboratory' && <LaboratoryView dark={dark} />}
        {activeItem === 'Staff Management' && <StaffView dark={dark} />}
        {activeItem === 'Admission Management' && <AdmissionsView dark={dark} />}
        {activeItem === 'Parent Management' && <ParentsView dark={dark} />}
        {activeItem === 'Payment Gateway' && <PaymentGatewayView dark={dark} />}
        {activeItem === 'Reports & Analytics' && <ReportsView dark={dark} />}
        {activeItem === 'Document Management' && <DocumentsView dark={dark} />}
        {activeItem === 'Audit Logs' && <AuditLogsView dark={dark} />}
        {activeItem === 'User & Role Management' && <UserRolesView dark={dark} />}
        {activeItem === 'Notifications' && <NoticesView dark={dark} />}
        {activeItem === 'School Settings' && <SchoolSettingsView dark={dark} tab="profile" />}
        {activeItem === 'Platform Support' && <SupportView />}
        {activeItem === 'My Profile' && <MyProfileView dark={dark} />}

        {/* Catch-all for theme-matched unimplemented pages */}
        {!MAPPED_VIEWS.includes(activeItem) && <PlaceholderView dark={dark} title={activeItem} />}

      </main>

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}
    </div>
  );
}

export { Modal, Toast };
